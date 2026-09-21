const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/connection');

// GET /api/projects/:projectId/analytics/metrics
router.get('/metrics', async (req, res) => {
  const { projectId } = req.params;
  try {
    // 1. Pending Reviews
    const pendingReviewsRes = await db.query(
      `SELECT count(*) FROM events e
       WHERE e.project_id = $1 
         AND NOT EXISTS (
           SELECT 1 FROM reviews rv 
           WHERE rv.event_id = e.id 
             AND (rv.status = 'Approved' OR (rv.status = 'Rejected' AND rv.proposed_activity_id IS NULL))
         )`,
      [projectId]
    );

    // 2. Extracted Events
    const eventsRes = await db.query(
      `SELECT count(*) FROM events WHERE project_id = $1`,
      [projectId]
    );

    // 3. Reports Processed
    const reportsRes = await db.query(
      `SELECT count(*) FROM reports WHERE project_id = $1 AND status = 'Processed'`,
      [projectId]
    );

    // 4. Schedule Health (Started Activities)
    const delayedRes = await db.query(
      `SELECT count(*) FROM activities 
       WHERE project_id = $1 AND actual_start IS NOT NULL AND actual_start > planned_start`,
      [projectId]
    );
    
    const onTimeRes = await db.query(
      `SELECT count(*) FROM activities 
       WHERE project_id = $1 AND actual_start IS NOT NULL AND actual_start <= planned_start`,
      [projectId]
    );

    const notStartedRes = await db.query(
      `SELECT count(*) FROM activities 
       WHERE project_id = $1 AND actual_start IS NULL`,
      [projectId]
    );
    
    const payload = {
      pendingReviews: parseInt(pendingReviewsRes.rows[0].count),
      extractedEvents: parseInt(eventsRes.rows[0].count),
      reportsProcessed: parseInt(reportsRes.rows[0].count),
      scheduleHealth: {
        delayed: parseInt(delayedRes.rows[0].count),
        onTime: parseInt(onTimeRes.rows[0].count),
        notStarted: parseInt(notStartedRes.rows[0].count)
      }
    };
    
    console.log(`[Metrics Debug] projectId:`, projectId, 'Payload:', payload);

    res.json(payload);
  } catch (err) {
    console.error('Metrics Error:', err);
    res.status(500).json({ error: 'Failed to fetch metrics' });
  }
});

// GET /api/projects/:projectId/analytics/progress
router.get('/progress', async (req, res) => {
  const { projectId } = req.params;
  try {
    const activitiesRes = await db.query(
      `SELECT 
          a.id, 
          a.activity_id_original, 
          a.activity_name, 
          a.planned_start, 
          a.planned_finish, 
          a.duration, 
          a.status, 
          a.actual_start,
          a.wbs_id
       FROM activities a
       WHERE a.project_id = $1
       ORDER BY a.planned_start ASC NULLS LAST`,
      [projectId]
    );

    // Fetch latest progress events for these activities
    const progressRes = await db.query(
      `SELECT 
          pe.activity_id,
          pe.created_at as reported_date,
          pe.status as progress_status,
          e.source_text as notes,
          r.file_name as source_report
       FROM progress_events pe
       JOIN events e ON pe.event_id = e.id
       LEFT JOIN reports r ON e.report_id = r.id
       WHERE e.project_id = $1
       ORDER BY pe.created_at DESC`,
      [projectId]
    );

    // Map progress events to activities
    const activities = activitiesRes.rows.map(act => {
      // Find latest progress event for this activity
      const latestProgress = progressRes.rows.find(p => p.activity_id === act.id);
      
      // Calculate variance (in days) if actual_start exists
      let varianceDays = null;
      if (act.actual_start && act.planned_start) {
        const actual = new Date(act.actual_start);
        const planned = new Date(act.planned_start);
        const diffTime = actual.getTime() - planned.getTime();
        varianceDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      return {
        ...act,
        varianceDays,
        latestProgress: latestProgress || null
      };
    });

    // Also get WBS nodes for hierarchical rendering if needed
    const wbsRes = await db.query(
      `SELECT * FROM wbs_nodes WHERE project_id = $1 ORDER BY id ASC`,
      [projectId]
    );

    res.json({
      activities,
      wbsNodes: wbsRes.rows
    });
  } catch (err) {
    console.error('Progress Error:', err);
    res.status(500).json({ error: 'Failed to fetch progress: ' + err.message });
  }
});

// GET /api/projects/:projectId/analytics/advanced
router.get('/advanced', async (req, res) => {
  const { projectId } = req.params;
  try {
    // 1. Earned Value (Simplified): Planned vs Actual progress over time
    // For simplicity, we aggregate progress_events by week or month.
    const progressTrendRes = await db.query(
      `SELECT 
         DATE_TRUNC('day', created_at) as date,
         COUNT(*)::int as events_count,
         0::float as avg_progress
       FROM events
       WHERE project_id = $1
       GROUP BY date
       ORDER BY date ASC`,
      [projectId]
    );

    // 2. Activity status breakdown
    const activityStatusRes = await db.query(
      `SELECT COALESCE(status, 'Not Started') as status, COUNT(*)::int as count 
       FROM activities 
       WHERE project_id = $1 
       GROUP BY COALESCE(status, 'Not Started')`,
      [projectId]
    );

    // 3. Top delayed activities
    const topDelayedRes = await db.query(
      `SELECT activity_name, actual_start, planned_start, 
        DATE_PART('day', actual_start::timestamp - planned_start::timestamp) as delay_days
       FROM activities
       WHERE project_id = $1 AND actual_start > planned_start
       ORDER BY delay_days DESC
       LIMIT 5`,
      [projectId]
    );

    // 4. Not started activities
    const notStartedRes = await db.query(
      `SELECT activity_name, planned_start, duration 
       FROM activities
       WHERE project_id = $1 AND actual_start IS NULL
       ORDER BY planned_start ASC
       LIMIT 10`,
      [projectId]
    );

    res.json({
      progressTrend: progressTrendRes.rows,
      activityStatus: activityStatusRes.rows,
      topDelayed: topDelayedRes.rows,
      notStarted: notStartedRes.rows
    });
  } catch (err) {
    console.error('Advanced Analytics Error:', err);
    res.status(500).json({ error: 'Failed to fetch advanced analytics' });
  }
});

module.exports = router;
