const { Client } = require('pg');

async function seedMockData() {
  const client = new Client({ connectionString: 'postgresql://postgres:constructiq123@localhost:5433/constructiq' });
  await client.connect();

  try {
    const projectId = 2; // Project 2: Nagpur Commercial Tower
    const userId = 'user_3JSK5l20IXZAoDEfYBk2hSq7dCy';
    
    // 1. Seed Documents (Knowledge Base)
    console.log('Seeding documents...');
    await client.query(`
      INSERT INTO documents (project_id, uploaded_by, file_name, file_type, file_path, category)
      VALUES 
      ($1, 'System Admin', 'Concrete_Pouring_SOP_v2.pdf', 'application/pdf', '/uploads/mock/Concrete_Pouring_SOP_v2.pdf', 'Standard Operating Procedure'),
      ($1, 'System Admin', 'Foundation_Structural_Drawings_Rev3.pdf', 'application/pdf', '/uploads/mock/Foundation_Structural_Drawings_Rev3.pdf', 'Design Drawing'),
      ($1, 'System Admin', 'Site_Safety_Guidelines_2026.pdf', 'application/pdf', '/uploads/mock/Site_Safety_Guidelines_2026.pdf', 'Safety Guidelines'),
      ($1, 'System Admin', 'HVAC_Technical_Specs.pdf', 'application/pdf', '/uploads/mock/HVAC_Technical_Specs.pdf', 'Technical Specification')
    `, [projectId]);

    // 2. Seed Audit Logs
    console.log('Seeding audit logs...');
    await client.query(`
      INSERT INTO audit_logs (project_id, user_id, entity_type, entity_id, action, metadata, created_at)
      VALUES 
      ($1, 'System Admin', 'Document', 1, 'Uploaded Document', '{"fileName":"Concrete_Pouring_SOP_v2.pdf","category":"Standard Operating Procedure"}', NOW() - INTERVAL '2 days'),
      ($1, 'System Admin', 'Document', 2, 'Uploaded Document', '{"fileName":"Foundation_Structural_Drawings_Rev3.pdf","category":"Design Drawing"}', NOW() - INTERVAL '1 day'),
      ($1, $2, 'EventReview', 12, 'Approved Match', '{"matchId":45,"activityId":8,"comment":"Looks good"}', NOW() - INTERVAL '5 hours'),
      ($1, $2, 'EventReview', 15, 'Rejected Match', '{"matchId":null,"activityId":null,"comment":"Incorrect extraction"}', NOW() - INTERVAL '2 hours')
    `, [projectId, userId]);

    // 3. Seed Progress Events (Analytics)
    // First, let's find some valid activity IDs for project 1
    const activitiesRes = await client.query('SELECT id FROM activities WHERE project_id = $1 LIMIT 5', [projectId]);
    const activities = activitiesRes.rows;

    if (activities.length > 0) {
      console.log('Seeding progress events...');
      const eventRes = await client.query('SELECT id FROM events WHERE project_id = $1 LIMIT 5', [projectId]);
      const events = eventRes.rows;
      
      // Update activities to 'In Progress' or 'Completed'
      await client.query(`UPDATE activities SET status = 'In Progress', actual_start = NOW() - INTERVAL '10 days' WHERE id = $1`, [activities[0].id]);
      if(activities[1]) await client.query(`UPDATE activities SET status = 'Completed', actual_start = NOW() - INTERVAL '15 days', actual_finish = NOW() - INTERVAL '2 days' WHERE id = $1`, [activities[1].id]);
      if(activities[2]) await client.query(`UPDATE activities SET status = 'Delayed', actual_start = NOW() - INTERVAL '20 days' WHERE id = $1`, [activities[2].id]);

      // Insert progress events mapping to these activities
      await client.query(`
        INSERT INTO progress_events (project_id, activity_id, event_id, actual_start, quantity, unit, status, source, created_at)
        VALUES 
        ($1, $2, $3, NOW() - INTERVAL '10 days', 50, '%', 'In Progress', 'AI Extracted', NOW() - INTERVAL '9 days'),
        ($1, $2, $3, NOW() - INTERVAL '5 days', 75, '%', 'In Progress', 'AI Extracted', NOW() - INTERVAL '4 days'),
        ($1, $4, $5, NOW() - INTERVAL '15 days', 100, '%', 'Completed', 'AI Extracted', NOW() - INTERVAL '2 days'),
        ($1, $6, $7, NOW() - INTERVAL '20 days', 30, '%', 'Delayed', 'Manual Entry', NOW() - INTERVAL '18 days')
      `, [
        projectId, 
        activities[0].id, events[0]?.id || null, 
        activities[1]?.id || activities[0].id, events[1]?.id || null,
        activities[2]?.id || activities[0].id, events[2]?.id || null
      ]);
    } else {
      console.log('No activities found for project 1. Skipping progress events seeding.');
    }

    console.log('Mock data seeded successfully!');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await client.end();
  }
}

seedMockData();
