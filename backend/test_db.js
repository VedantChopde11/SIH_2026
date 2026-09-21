const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:constructiq123@localhost:5433/constructiq' });
client.connect().then(() => client.query(SELECT e.id, e.action, e.object, e.embedding IS NOT NULL as has_embedding, r.file_name FROM events e JOIN reports r ON e.report_id = r.id WHERE r.file_name LIKE '%test%')).then(res => { console.log(res.rows); process.exit(0); });
