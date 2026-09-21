const db = require('./db/connection');
async function run() {
  const pId = 1;
  const progressTrendRes = await db.query(
    `SELECT 
       DATE_TRUNC('week', created_at) as week,
       COUNT(*)::int as events_count,
       0::float as avg_progress
     FROM events
     WHERE project_id = $1
     GROUP BY week
     ORDER BY week ASC`, [pId]
  );
  console.log('progressTrend:', progressTrendRes.rows);

  const activityStatusRes = await db.query(
    `SELECT COALESCE(status, 'Not Started') as status, COUNT(*)::int as count 
     FROM activities 
     WHERE project_id = $1 
     GROUP BY COALESCE(status, 'Not Started')`, [pId]
  );
  console.log('activityStatus:', activityStatusRes.rows);
  process.exit(0);
}
run();
