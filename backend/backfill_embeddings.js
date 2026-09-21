require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const db = require('./db/connection');

const ai = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });

async function run() {
  const client = await db.pool.connect();
  try {
    const res = await client.query('SELECT id, activity_name, location, discipline FROM activities WHERE embedding IS NULL');
    const activities = res.rows;
    
    console.log(`Found ${activities.length} activities missing embeddings. Backfilling...`);

    for (let i = 0; i < activities.length; i++) {
      const act = activities[i];
      const semanticString = `Activity: ${act.activity_name}. Location: ${act.location || ''}. Discipline: ${act.discipline || ''}.`;
      
      console.log(`[${i+1}/${activities.length}] Generating embedding for activity ${act.id}: "${semanticString}"`);
      
      try {
        const embedRes = await ai.models.embedContent({
          model: 'gemini-embedding-2',
          contents: semanticString,
        });

        if (embedRes.embeddings && embedRes.embeddings.length > 0) {
          const values = embedRes.embeddings[0].values.slice(0, 768);
          const embeddingVector = '[' + values.join(',') + ']';
          
          await client.query('UPDATE activities SET embedding = $1 WHERE id = $2', [embeddingVector, act.id]);
        }
      } catch (err) {
        console.error(`   -> Failed for activity ${act.id}:`, err.message);
      }
      
      // Delay to avoid hitting rate limits too quickly
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('Finished backfilling activities.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
