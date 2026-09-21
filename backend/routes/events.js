const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/connection');

// Get all AI extracted events for a project
router.get('/', async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await db.query(
      `SELECT e.*, r.file_name as source_report 
       FROM events e
       LEFT JOIN reports r ON e.report_id = r.id
       WHERE e.project_id = $1 
       ORDER BY e.created_at DESC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update event status/review
router.put('/:eventId', async (req, res) => {
  const { eventId } = req.params;
  const { status, actual_start, quantity } = req.body;
  try {
    const result = await db.query(
      `UPDATE events 
       SET status = COALESCE($1, status),
           actual_start = COALESCE($2, actual_start),
           quantity = COALESCE($3, quantity)
       WHERE id = $4 RETURNING *`,
      [status, actual_start, quantity, eventId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Run semantic matching engine for all unmatched events in a project
router.post('/match-all', async (req, res) => {
  const { projectId } = req.params;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    const provider = (process.env.EMBEDDING_PROVIDER || 'gemini').toLowerCase();
    const vectorCol = provider === 'bge-m3' ? 'embedding_bge' : 'embedding';

    // 1. Fetch events that haven't been matched yet
    const eventsQuery = await client.query(
      `SELECT id, action, object, location, discipline, actual_start, ${vectorCol} AS vector_data 
       FROM events 
       WHERE project_id = $1 
         AND id NOT IN (SELECT event_id FROM activity_matches)
         AND ${vectorCol} IS NOT NULL`,
      [projectId]
    );

    const events = eventsQuery.rows;
    let totalMatchesCreated = 0;

    // 2. For each event, find top matching activities using pgvector cosine distance (<=>)
    for (const event of events) {
      // Find top 5 activities by semantic similarity
      // Note: <=> is cosine distance (0 is identical, 2 is opposite). Cosine similarity = 1 - distance
      const matchesQuery = await client.query(
        `SELECT id, activity_id_original, activity_name, location, discipline, planned_start,
                1 - (${vectorCol} <=> $1::vector) as semantic_score
         FROM activities
         WHERE project_id = $2 AND ${vectorCol} IS NOT NULL
         ORDER BY ${vectorCol} <=> $1::vector ASC
         LIMIT 5`,
        [event.vector_data, projectId]
      );

      const candidates = matchesQuery.rows;

      // 3. Composite scoring
      const scoredCandidates = candidates.map(candidate => {
        let locScore = 0;
        let hasLoc = false;
        if (event.location && candidate.location) {
          hasLoc = true;
          if (candidate.location.toLowerCase().includes(event.location.toLowerCase()) || event.location.toLowerCase().includes(candidate.location.toLowerCase())) {
            locScore = 1;
          }
        }
        
        let discScore = 0;
        let hasDisc = false;
        if (event.discipline && candidate.discipline) {
          hasDisc = true;
          if (candidate.discipline.toLowerCase() === event.discipline.toLowerCase()) {
            discScore = 1;
          }
        }
        
        let dateScore = 0;
        let hasDate = false;
        if (event.actual_start && candidate.planned_start) {
          hasDate = true;
          const daysDiff = Math.abs(new Date(event.actual_start) - new Date(candidate.planned_start)) / (1000 * 60 * 60 * 24);
          if (daysDiff <= 7) dateScore = 1;
          else if (daysDiff <= 30) dateScore = 0.5;
        }

        // Dynamic Weighting
        let semanticWeight = 0.5;
        let locWeight = hasLoc ? 0.2 : 0;
        let discWeight = hasDisc ? 0.15 : 0;
        let dateWeight = hasDate ? 0.15 : 0;

        // Redistribute missing weights proportionally to semantic score
        let totalWeight = semanticWeight + locWeight + discWeight + dateWeight;
        if (totalWeight < 1.0) {
          const missing = 1.0 - totalWeight;
          semanticWeight += missing; // Dump all missing weight into semantic match
        }

        const totalScore = (candidate.semantic_score * semanticWeight) + (locScore * locWeight) + (discScore * discWeight) + (dateScore * dateWeight);
        
        return {
          activity_id: candidate.id,
          semantic_score: candidate.semantic_score,
          location_score: locScore,
          discipline_score: discScore,
          date_score: dateScore,
          total_score: totalScore
        };
      });

      // Sort by total score
      scoredCandidates.sort((a, b) => b.total_score - a.total_score);

      // 4. Insert top 3 into activity_matches
      const top3 = scoredCandidates.slice(0, 3);
      let rank = 1;
      for (const match of top3) {
        await client.query(
          `INSERT INTO activity_matches 
            (event_id, activity_id, semantic_score, location_score, discipline_score, date_score, total_score, rank, validation_status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pending')`,
          [event.id, match.activity_id, match.semantic_score, match.location_score, match.discipline_score, match.date_score, match.total_score, rank]
        );
        rank++;
        totalMatchesCreated++;
      }
    }
    
    await client.query('COMMIT');
    res.json({ message: 'Matching engine completed successfully', eventsProcessed: events.length, totalMatchesCreated });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Matching Engine Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Get matches for a specific event
router.get('/:eventId/matches', async (req, res) => {
  const { eventId } = req.params;
  try {
    const result = await db.query(
      `SELECT m.*, a.activity_id_original, a.activity_name, a.planned_start, a.planned_finish, a.location, a.discipline, a.status as activity_status
       FROM activity_matches m
       JOIN activities a ON m.activity_id = a.id
       WHERE m.event_id = $1
       ORDER BY m.rank ASC`,
      [eventId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all events with their matches (for Review Center)
router.get('/review', async (req, res) => {
  const { projectId } = req.params;
  try {
    // We get events that have pending matches or no review yet
    const result = await db.query(
      `SELECT e.*, r.file_name as source_report,
       (
         SELECT json_agg(
           json_build_object(
             'match_id', m.id,
             'activity_id', a.id,
             'activity_id_original', a.activity_id_original,
             'activity_name', a.activity_name,
             'total_score', m.total_score,
             'rank', m.rank
           ) ORDER BY m.rank ASC
         ) 
         FROM activity_matches m
         JOIN activities a ON m.activity_id = a.id
         WHERE m.event_id = e.id AND (m.validation_status IS NULL OR m.validation_status != 'Rejected')
       ) as candidates
       FROM events e
       LEFT JOIN reports r ON e.report_id = r.id
       WHERE e.project_id = $1 
         AND NOT EXISTS (
           SELECT 1 FROM reviews rv 
           WHERE rv.event_id = e.id 
             AND (rv.status = 'Approved' OR (rv.status = 'Rejected' AND rv.proposed_activity_id IS NULL))
         )
       ORDER BY e.created_at DESC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve/Reject a match
router.post('/:eventId/review', async (req, res) => {
  const { projectId, eventId } = req.params;
  const { matchId, activityId, status, comment } = req.body; // status: 'Approved', 'Rejected'
  const userId = req.auth.userId || 'system';

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    // 1. Create review record (Only for Approval or Global Rejection)
    if (status === 'Approved' || !matchId) {
      await client.query(
        `INSERT INTO reviews (event_id, proposed_activity_id, final_activity_id, status, planner_user_id, comment, reviewed_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
        [eventId, activityId, status === 'Approved' ? activityId : null, status, userId, comment]
      );
    }

    // 2. Update matches validation status
    if (matchId) {
      await client.query(`UPDATE activity_matches SET validation_status = $1 WHERE id = $2`, [status, matchId]);
    }
    
    // 3. If approved, update progress_events and activities
    if (status === 'Approved') {
      const eventQuery = await client.query('SELECT actual_start, quantity, unit FROM events WHERE id = $1', [eventId]);
      const event = eventQuery.rows[0];
      
      // We assume this proves the activity is In Progress.
      await client.query(
        `INSERT INTO progress_events (project_id, activity_id, event_id, actual_start, quantity, unit, status, source)
         VALUES ($1, $2, $3, $4, $5, $6, 'In Progress', 'AI Extracted')`,
        [projectId, activityId, eventId, event.actual_start, event.quantity, event.unit]
      );
      
      await client.query(
        `UPDATE activities 
         SET status = 'In Progress', actual_start = COALESCE(actual_start, $1) 
         WHERE id = $2`,
        [event.actual_start, activityId]
      );
    }
    // 4. Log to Audit Trail
    await client.query(
      `INSERT INTO audit_logs (project_id, user_id, entity_type, entity_id, action, metadata)
       VALUES ($1, $2, 'EventReview', $3, $4, $5)`,
      [
        projectId, 
        userId, 
        eventId, 
        status === 'Approved' ? 'Approved Match' : 'Rejected Match', 
        JSON.stringify({ matchId, activityId, comment })
      ]
    );
    
    await client.query('COMMIT');
    res.json({ message: 'Review recorded successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Bulk Approve All Top Candidates
router.post('/approve-all', async (req, res) => {
  const { projectId } = req.params;
  const userId = req.auth.userId || 'system';
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // 1. Find all pending events and their top candidate (rank = 1)
    const pendingEventsRes = await client.query(
      `SELECT e.id as event_id, e.actual_start, e.quantity, e.unit,
              m.id as match_id, m.activity_id
       FROM events e
       JOIN activity_matches m ON e.id = m.event_id
       WHERE e.project_id = $1
         AND m.rank = 1
         AND (m.validation_status IS NULL OR m.validation_status = 'Pending')
         AND NOT EXISTS (
           SELECT 1 FROM reviews rv 
           WHERE rv.event_id = e.id 
             AND (rv.status = 'Approved' OR (rv.status = 'Rejected' AND rv.proposed_activity_id IS NULL))
         )`,
      [projectId]
    );

    let approvedCount = 0;
    
    for (const row of pendingEventsRes.rows) {
      const { event_id, actual_start, quantity, unit, match_id, activity_id } = row;
      
      // Insert review
      await client.query(
        `INSERT INTO reviews (event_id, proposed_activity_id, final_activity_id, status, planner_user_id, comment, reviewed_at)
         VALUES ($1, $2, $3, 'Approved', $4, 'Bulk Approved', CURRENT_TIMESTAMP)`,
        [event_id, activity_id, activity_id, userId]
      );
      
      // Update match
      await client.query(`UPDATE activity_matches SET validation_status = 'Approved' WHERE id = $1`, [match_id]);
      
      // Insert progress
      await client.query(
        `INSERT INTO progress_events (project_id, activity_id, event_id, actual_start, quantity, unit, status, source)
         VALUES ($1, $2, $3, $4, $5, $6, 'In Progress', 'AI Extracted - Bulk Approved')`,
        [projectId, activity_id, event_id, actual_start, quantity, unit]
      );
      
      // Update activity
      await client.query(
        `UPDATE activities 
         SET status = 'In Progress', actual_start = COALESCE(actual_start, $1) 
         WHERE id = $2`,
        [actual_start, activity_id]
      );
      
      // Audit
      await client.query(
        `INSERT INTO audit_logs (project_id, user_id, entity_type, entity_id, action, metadata)
         VALUES ($1, $2, 'EventReview', $3, 'Approved Match (Bulk)', $4)`,
        [projectId, userId, event_id, JSON.stringify({ matchId: match_id, activityId: activity_id })]
      );
      
      approvedCount++;
    }
    
    await client.query('COMMIT');
    res.json({ message: `Successfully bulk-approved ${approvedCount} events.`, count: approvedCount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Bulk Approve Error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
