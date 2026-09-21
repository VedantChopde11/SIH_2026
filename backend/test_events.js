const db = require('./db/connection');

async function checkEvents() {
  const res1 = await db.query(`SELECT count(*) as count FROM events`);
  const res2 = await db.query(`SELECT count(*) as count FROM activity_matches`);
  const res3 = await db.query(`SELECT count(*) as count FROM reviews`);
  const res4 = await db.query(`
    SELECT e.id, e.action, e.object,
      (SELECT count(*) FROM activity_matches m WHERE m.event_id = e.id) as candidates_count
    FROM events e
  `);
  console.log('Events:', res1.rows[0].count);
  console.log('Matches:', res2.rows[0].count);
  console.log('Reviews:', res3.rows[0].count);
  console.log('Event Details:', res4.rows);
  process.exit(0);
}

checkEvents();
