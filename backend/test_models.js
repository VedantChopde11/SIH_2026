require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
async function test() {
  const models = await ai.models.listModels();
  for (const m of models) {
    if (m.name.includes('embed')) console.log(m.name, m.supportedGenerationMethods);
  }
}
test();
