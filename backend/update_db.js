const { Client } = require('pg');

async function updateDb() {
  const client = new Client({ connectionString: 'postgresql://postgres:constructiq123@localhost:5433/constructiq' });
  await client.connect();
  
  await client.query("UPDATE activities SET location = 'Zone A', discipline = 'Civil' WHERE activity_name = 'Foundation Pour'");
  await client.query("UPDATE activities SET location = 'Zone B', discipline = 'Structural' WHERE activity_name = 'Steel Erection'");
  await client.query("UPDATE activities SET location = 'Zone C', discipline = 'Civil' WHERE activity_name = 'Excavation'");
  
  console.log('Database updated');
  process.exit(0);
}

updateDb();