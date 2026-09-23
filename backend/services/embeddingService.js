const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });

// Lazy loaded for BGE-M3
let pipeline = null;

async function getTransformersPipeline() {
  if (!pipeline) {
    console.log("Loading BGE-Small model via @xenova/transformers...");
    // Dynamic import because @xenova/transformers is CommonJS/ESM
    const transformers = await import('@xenova/transformers');
    // Using BGE-Small to fit within 512MB RAM constraints
    pipeline = await transformers.pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5', {
      quantized: true, // Use quantized model to save memory
    });
    console.log("BGE-Small model loaded successfully.");
  }
  return pipeline;
}

/**
 * Generates embeddings for an array of strings using the configured provider.
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<{vectors: string[], modelName: string, modelVersion: string, vectorColumn: string}>}
 */
async function generateEmbeddings(texts) {
  if (!texts || texts.length === 0) return { vectors: [], modelName: '', modelVersion: '', vectorColumn: '' };

  const provider = (process.env.EMBEDDING_PROVIDER || 'gemini').toLowerCase();

  if (provider === 'bge-m3') {
    const pipe = await getTransformersPipeline();
    const vectors = [];
    
    for (const text of texts) {
      const output = await pipe(text, { pooling: 'mean', normalize: true });
      // Convert Float32Array to pgvector string format
      const arr = Array.from(output.data);
      vectors.push(`[${arr.join(',')}]`);
    }

    return {
      vectors,
      modelName: 'BAAI/bge-small-en-v1.5',
      modelVersion: '1',
      vectorColumn: 'embedding_bge_small'
    };
  } else {
    // Default to Gemini
    const reqBody = {
      requests: texts.map(content => ({
        model: 'models/gemini-embedding-2',
        content: { parts: [{ text: content }] }
      }))
    };

    let vectors = [];
    
    // Use REST API for batch
    const fetchRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key=${process.env.LLM_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reqBody)
    });
    
    const json = await fetchRes.json();
    if (json.error) {
      throw new Error(json.error.message);
    }
    
    vectors = json.embeddings.map(e => `[${e.values.slice(0, 768).join(',')}]`);

    return {
      vectors,
      modelName: 'gemini-embedding-2',
      modelVersion: '1',
      vectorColumn: 'embedding' // using the existing column for backwards compatibility
    };
  }
}

module.exports = {
  generateEmbeddings
};
