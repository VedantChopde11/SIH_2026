const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Make sure it loads the .env correctly if run from db folder

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('Running migration: Add embedding_bge_small columns...');
    await pool.query('ALTER TABLE activities ADD COLUMN IF NOT EXISTS embedding_bge_small vector(384);');
    await pool.query('ALTER TABLE events ADD COLUMN IF NOT EXISTS embedding_bge_small vector(384);');
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Error running migration:', err);
  } finally {
    await pool.end();
  }
}

migrate();
