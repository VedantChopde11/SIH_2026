const db = require('./db/connection');

async function resetDB() {
  try {
    console.log("Dropping old test data to sync vector spaces...");
    
    // Delete all events, activities, and reports
    await db.query('DELETE FROM activity_matches');
    await db.query('DELETE FROM events');
    await db.query('DELETE FROM activities');
    await db.query('DELETE FROM reports');
    
    console.log("Database reset complete! You can now re-upload the sample_schedule.csv and test_field_report.txt");
  } catch (err) {
    console.error("Error resetting DB:", err);
  } finally {
    process.exit();
  }
}

resetDB();
