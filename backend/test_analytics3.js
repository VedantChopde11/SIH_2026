const db = require('./db/connection');
async function run() {
  const res = await db.query('SELECT project_id, created_at FROM events');
  console.log('events:', res.rows);
  if (res.rows.length === 0) return process.exit(0);
  const pId = res.rows[0].project_id;
  
  const ptRes = await db.query(`SELECT DATE_TRUNC('week', created_at) as week, COUNT(*)::int as events_count, 0::float as avg_progress FROM events WHERE project_id = $1 GROUP BY week ORDER BY week ASC`, [pId]);
  console.log('progressTrend for project', pId, ':', ptRes.rows);
  
  const asRes = await db.query(`SELECT COALESCE(status, 'Not Started') as status, COUNT(*)::int as count FROM activities WHERE project_id = $1 GROUP BY COALESCE(status, 'Not Started')`, [pId]);
  console.log('activityStatus:', asRes.rows);
  process.exit(0);
}
run();
