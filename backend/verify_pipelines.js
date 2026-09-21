require('dotenv').config();
const { buildActivityCanonicalText, buildEventCanonicalText } = require('./services/canonicalService');
const { generateEmbeddings } = require('./services/embeddingService');

async function verify() {
  console.log('--- Canonicalization Test ---');
  const mockActivity = {
    activity_id_original: 'ACT-001',
    activity_name: 'Pour concrete for slab',
    discipline: 'Civil',
    location: 'Zone A',
    wbs_code: '1.2.3',
    wbs_name: 'Foundation'
  };

  const canonical = buildActivityCanonicalText(mockActivity);
  console.log('Activity Canonical:', canonical);

  const mockEvent = {
    action: 'Poured',
    object: 'concrete',
    location: 'Zone A',
    discipline: 'Civil',
    status: 'In Progress',
    quantity: 50,
    unit: 'm3'
  };

  const canonicalEvent = buildEventCanonicalText(mockEvent);
  console.log('Event Canonical:', canonicalEvent);

  console.log('\n--- Embedding Test ---');
  console.log('Current Provider:', process.env.EMBEDDING_PROVIDER || 'gemini (default)');
  
  try {
    const result = await generateEmbeddings([canonical, canonicalEvent]);
    console.log('Model Name:', result.modelName);
    console.log('Model Version:', result.modelVersion);
    console.log('Target Column:', result.vectorColumn);
    console.log('Vectors generated:', result.vectors.length);
    console.log('First vector dimension estimate (based on commas):', result.vectors[0].split(',').length);
  } catch (err) {
    console.error('Embedding failed:', err);
  }

  process.exit(0);
}

verify();
