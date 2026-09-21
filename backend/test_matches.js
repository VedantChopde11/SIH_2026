const db = require('./db/connection');

async function checkMatches() {
  const matches = await db.query(`SELECT id, event_id, validation_status FROM activity_matches`);
  const reviews = await db.query(`SELECT id, event_id, status FROM reviews`);
  console.log('Matches:', matches.rows);
  console.log('Reviews:', reviews.rows);
  process.exit(0);
}

checkMatches();
