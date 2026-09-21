const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:constructiq123@localhost:5433/constructiq' });

client.connect().then(async () => {
  try {
    const res = await client.query("SELECT e.id FROM events e WHERE e.project_id = 2 AND e.id NOT IN (SELECT event_id FROM reviews WHERE status = 'Approved' OR (status = 'Rejected' AND proposed_activity_id IS NULL))");
    console.log('Events to review:', res.rows.length);
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    client.end();
  }
});
