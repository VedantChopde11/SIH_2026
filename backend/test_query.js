const { Client } = require('pg'); 
const client = new Client({ connectionString: 'postgresql://postgres:constructiq123@localhost:5433/constructiq' }); 
client.connect().then(() => client.query("SELECT e.id FROM events e LEFT JOIN reports r ON e.report_id = r.id WHERE e.project_id = 1 AND e.id NOT IN (SELECT event_id FROM reviews WHERE status = 'Approved' OR (status = 'Rejected' AND proposed_activity_id IS NULL))")).then(res => { 
  console.log('Query result: ', res.rows); 
  client.end(); 
});
