const db = require('./db/connection');
const xlsx = require('xlsx');
const fs = require('fs');

async function test() {
  const buf = fs.readFileSync('../sample_schedule.csv');
  const wb = xlsx.read(buf, {type: 'buffer'});
  const data = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  
  const activitiesToProcess = [];
  for (const row of data) {
    const activityIdOriginal = row['L6 Activity ID'] || row['Activity ID'] || row['ID'];
    if (!activityIdOriginal) continue;
    activitiesToProcess.push({ activityIdOriginal, name: row['Activity Name'] });
  }
  
  console.log('activitiesToProcess length:', activitiesToProcess.length);
  
  const client = await db.pool.connect();
  
  let inserted = 0;
  for (const act of activitiesToProcess) {
    let queryStr = `
      INSERT INTO activities (
        project_id, wbs_id, activity_id_original, activity_name, 
        planned_start, planned_finish, duration, location, discipline, 
        search_text, embedding_source_hash, embedding_model, embedding_version, embedded_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW() )
      ON CONFLICT (project_id, activity_id_original) DO UPDATE SET activity_name = EXCLUDED.activity_name
      RETURNING id
    `;
    const params = [1, null, act.activityIdOriginal, act.name, null, null, 0, '', '', '', '', null, null];
    try {
      const res = await client.query(queryStr, params);
      console.log('Inserted row count:', res.rowCount);
      inserted++;
    } catch (e) {
      console.error('SQL Error for', act.activityIdOriginal, e.message);
    }
  }
  
  client.release();
  process.exit();
}
test();
