require('dotenv').config();
const db = require('./db/connection');

async function migrate() {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    
    console.log('Adding provenance columns to activities...');
    await client.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS search_text TEXT`);
    await client.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100)`);
    await client.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS embedding_version VARCHAR(50)`);
    await client.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS embedding_source_hash VARCHAR(64)`);
    await client.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMP`);
    await client.query(`ALTER TABLE activities ADD COLUMN IF NOT EXISTS embedding_bge vector(1024)`);

    console.log('Adding provenance columns to events...');
    await client.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS search_text TEXT`);
    await client.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100)`);
    await client.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS embedding_version VARCHAR(50)`);
    await client.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS embedding_source_hash VARCHAR(64)`);
    await client.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS embedded_at TIMESTAMP`);
    await client.query(`ALTER TABLE events ADD COLUMN IF NOT EXISTS embedding_bge vector(1024)`);

    console.log('Adding hash and batch tracking to reports and documents...');
    await client.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64)`);
    await client.query(`ALTER TABLE reports ADD COLUMN IF NOT EXISTS import_batch_id VARCHAR(100)`);
    
    await client.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64)`);
    await client.query(`ALTER TABLE documents ADD COLUMN IF NOT EXISTS import_batch_id VARCHAR(100)`);

    // Update schema.sql as well for documentation
    // I will do that via tools, but the DB is now updated.
    
    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

migrate();
