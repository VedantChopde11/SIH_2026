const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const db = require('../db/connection');
const { GoogleGenAI, Type, Schema } = require('@google/genai');
const { calculateBufferHash, calculateTextHash } = require('../services/hashService');
const { buildEventCanonicalText } = require('../services/canonicalService');
const { generateEmbeddings } = require('../services/embeddingService');

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });

const upload = multer({ storage: multer.memoryStorage() });

// Helper to run Gemini extraction and embedding for a report
async function processReportWithAI(projectId, reportId, originalname, extractedText) {
  const prompt = `You are a construction project manager assistant. Extract all physical construction activities, events, and progress updates from the following field report.
IMPORTANT: Extract EACH distinct activity as a SEPARATE item in the JSON array. Do not combine multiple activities into a single event.
If you find a date, use YYYY-MM-DD format. If no date is found, use null.
If you find quantities, extract the number and unit.
Focus ONLY on physical construction events (e.g. pouring concrete, laying bricks, installing pipes).

Report Text:
${extractedText.substring(0, 10000)}
`;

  let response = null;
  let retries = 3;

  console.log(`[GEMINI] report=${originalname} extraction request started`);
  while (retries > 0) {
    try {
      response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            description: "A list of construction events extracted from the field report.",
            items: {
              type: Type.OBJECT,
              properties: {
                action: { type: Type.STRING, description: "The action being performed (e.g., 'Pouring', 'Installing')" },
                object: { type: Type.STRING, description: "The object of the action (e.g., 'Concrete Foundation', 'Piping')" },
                location: { type: Type.STRING, description: "The specific location mentioned (e.g., 'Level 1', 'Zone B')" },
                discipline: { type: Type.STRING, description: "The engineering discipline (e.g., 'Civil', 'Mechanical', 'Electrical')" },
                status: { type: Type.STRING, description: "Current status (e.g., 'In Progress', 'Completed')" },
                date: { type: Type.STRING, description: "The date of the event in YYYY-MM-DD format" },
                quantity: { type: Type.NUMBER, description: "The numerical quantity mentioned" },
                unit: { type: Type.STRING, description: "The unit of measurement (e.g., 'm3', 'sqm')" },
                source_text: { type: Type.STRING, description: "The exact short sentence or phrase from the report that proves this event" },
              },
              required: ["action", "object", "source_text"]
            }
          }
        }
      });
      console.log(`[GEMINI] report=${originalname} extraction request completed`);
      break; // Success!
    } catch (genErr) {
      if (genErr.status === 429) {
        console.log(`[GEMINI] report=${originalname} quota exhausted on extraction`);
        throw { isQuotaError: true, message: "AI processing is temporarily unavailable because the Gemini API quota has been reached. Your report has been saved and can be processed later." };
      }
      if (genErr.status === 503 && retries > 1) {
        retries--;
        console.log(`Gemini API 503 error, retrying in 2 seconds... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        throw genErr;
      }
    }
  }

  let events = [];
  if (response.text) {
    try {
      events = JSON.parse(response.text);
    } catch (e) {
      console.error("Failed to parse Gemini output:", e);
    }
  }

  // 4. Generate Canonical Text and Source Hashes
  if (events.length > 0) {
    for (const event of events) {
      event.canonicalText = buildEventCanonicalText(event);
      event.sourceHash = calculateTextHash(event.canonicalText);
    }
  }

  // 5. Generate Embeddings via new service
  let extractedCount = 0;

  if (events.length > 0) {
    console.log(`[EMBEDDING] report=${originalname} batch embedding request started for ${events.length} events`);
    try {
      const textsToEmbed = events.map(e => e.canonicalText);
      const { vectors, modelName, modelVersion, vectorColumn } = await generateEmbeddings(textsToEmbed);

      for (let i = 0; i < events.length; i++) {
        events[i].embeddingVector = vectors[i];
        events[i].modelName = modelName;
        events[i].modelVersion = modelVersion;
        events[i].vectorColumn = vectorColumn;
      }
      console.log(`[EMBEDDING] report=${originalname} batch embedding request completed`);
    } catch (embedError) {
      console.error("Batch embedding generation failed:", embedError);
      if (embedError.isQuotaError || embedError.status === 429) {
        console.log(`[EMBEDDING] report=${originalname} quota exhausted on embeddings`);
        throw { isQuotaError: true, message: "AI processing is temporarily unavailable because the Gemini API quota has been reached. Your report has been saved and can be processed later." };
      }
    }
  }

  // Save to DB
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < events.length; i++) {
      const event = events[i];

      let parsedDate = null;
      if (event.date) {
        const d = new Date(event.date);
        if (!isNaN(d.getTime())) {
          parsedDate = d.toISOString().split('T')[0];
        }
      }

      let queryStr = `
        INSERT INTO events (
          report_id, project_id, action, object, location, discipline, status, 
          actual_start, quantity, unit, source_text, search_text, 
          embedding_source_hash, embedding_model, embedding_version, embedded_at
          ${event.vectorColumn ? ', ' + event.vectorColumn : ''}
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW() ${event.embeddingVector ? ', $16' : ''})
      `;

      const params = [
        reportId, projectId, event.action, event.object, event.location,
        event.discipline, event.status, parsedDate, event.quantity,
        event.unit, event.source_text, event.canonicalText,
        event.sourceHash, event.modelName, event.modelVersion
      ];

      if (event.embeddingVector) {
        params.push(event.embeddingVector);
      }

      await client.query(queryStr, params);
      extractedCount++;
    }

    await client.query(
      `UPDATE reports SET status = 'Processed' WHERE id = $1`,
      [reportId]
    );
    await client.query('COMMIT');
    console.log(`[REPORT] processing completed for ${originalname}. Total Gemini calls=2`);
    return { extractedCount, events };
  } catch (dbError) {
    await client.query('ROLLBACK');
    throw dbError;
  } finally {
    client.release();
  }
}

router.post('/upload', upload.single('file'), async (req, res) => {
  const { projectId } = req.params;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { originalname, buffer, mimetype } = req.file;
  // Use frontend provided name, fallback to Clerk user ID, or 'system'
  const uploadedBy = req.body.uploaderName || req.auth.userId || 'system';

  try {
    let extractedText = '';

    // 1. Parse File Content
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else if (
      mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      originalname.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (mimetype === 'text/plain' || mimetype === 'text/csv') {
      extractedText = buffer.toString('utf8');
    } else {
      return res.status(400).json({ error: 'Unsupported file type. Use PDF, DOCX, TXT, or CSV.' });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'Could not extract any text from the file.' });
    }

    // 1.5 Idempotency Check
    const fileHash = calculateBufferHash(buffer);
    const existingReport = await db.query(
      `SELECT id FROM reports WHERE project_id = $1 AND file_hash = $2 AND status = 'Processed' LIMIT 1`,
      [projectId, fileHash]
    );

    if (existingReport.rows.length > 0) {
      console.log(`[REPORT] id=${existingReport.rows[0].id} returning cached result for ${originalname} (hash match)`);
      const existingEvents = await db.query(`SELECT * FROM events WHERE report_id = $1`, [existingReport.rows[0].id]);
      return res.json({
        message: 'Report already processed (cached result)',
        extractedCount: existingEvents.rowCount,
        events: existingEvents.rows
      });
    }

    // 2. Save report to DB safely before calling AI
    const client = await db.pool.connect();
    let reportId;
    try {
      await client.query('BEGIN');

      const reportInsert = await client.query(
        'INSERT INTO reports (project_id, uploaded_by, file_name, file_type, file_path, status, file_hash, import_batch_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [projectId, uploadedBy, originalname, mimetype, 'memory', 'Processing', fileHash, `batch_${Date.now()}`]
      );
      reportId = reportInsert.rows[0].id;

      await client.query(
        'INSERT INTO extracted_content (report_id, original_text, extracted_text) VALUES ($1, $2, $3)',
        [reportId, extractedText.substring(0, 1000), extractedText]
      );

      await client.query('COMMIT');
    } catch (dbError) {
      await client.query('ROLLBACK');
      client.release();
      throw dbError;
    }
    client.release();

    // 3. Process with AI and update DB inside the helper
    try {
      const { extractedCount, events } = await processReportWithAI(projectId, reportId, originalname, extractedText);
      res.json({ message: 'Report processed successfully', extractedCount, events, reportId });
    } catch (aiError) {
      console.error('Report AI Processing Error:', aiError);

      // Update status to Quota Reached or Failed
      const status = aiError.isQuotaError ? 'Quota Reached' : 'Failed AI';
      await db.query(`UPDATE reports SET status = $1 WHERE id = $2`, [status, reportId]);

      if (aiError.isQuotaError) {
        return res.status(429).json({ error: aiError.message, reportId });
      }
      return res.status(500).json({ error: aiError.message || 'Error processing report with AI', reportId });
    }

  } catch (err) {
    console.error('Report Upload Error:', err);
    res.status(500).json({ error: err.message || 'Error uploading report' });
  }
});

// Retry AI extraction for a saved report
router.post('/:reportId/retry', async (req, res) => {
  const { projectId, reportId } = req.params;

  try {
    const reportCheck = await db.query(
      `SELECT id, file_name, status FROM reports WHERE id = $1 AND project_id = $2`,
      [reportId, projectId]
    );

    if (reportCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    if (reportCheck.rows[0].status === 'Processed') {
      return res.status(400).json({ error: 'Report is already processed' });
    }

    // Set status to Processing
    await db.query(`UPDATE reports SET status = 'Processing' WHERE id = $1`, [reportId]);

    const contentResult = await db.query(
      `SELECT extracted_text FROM extracted_content WHERE report_id = $1`,
      [reportId]
    );

    if (contentResult.rows.length === 0) {
      await db.query(`UPDATE reports SET status = 'Failed AI' WHERE id = $1`, [reportId]);
      return res.status(404).json({ error: 'Extracted text not found for this report.' });
    }

    const extractedText = contentResult.rows[0].extracted_text;
    const originalname = reportCheck.rows[0].file_name;

    try {
      const { extractedCount, events } = await processReportWithAI(projectId, reportId, originalname, extractedText);
      res.json({ message: 'Report retried and processed successfully', extractedCount, events, reportId });
    } catch (aiError) {
      console.error('Report AI Retry Error:', aiError);
      const status = aiError.isQuotaError ? 'Quota Reached' : 'Failed AI';
      await db.query(`UPDATE reports SET status = $1 WHERE id = $2`, [status, reportId]);

      if (aiError.isQuotaError) {
        return res.status(429).json({ error: aiError.message, reportId });
      }
      return res.status(500).json({ error: aiError.message || 'Error processing report with AI', reportId });
    }
  } catch (err) {
    console.error('Report Retry Error:', err);
    res.status(500).json({ error: err.message || 'Error retrying report' });
  }
});

// Get all reports for a project
router.get('/', async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await db.query(
      `SELECT 
         id, project_id, uploaded_by, file_name, file_type, file_path, status, 
         created_at AT TIME ZONE 'UTC' as created_at 
       FROM reports 
       WHERE project_id = $1 
       ORDER BY created_at DESC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/projects/:projectId/reports/:reportId/download
// Return the extracted text as a viewable text file
router.get('/:reportId/download', async (req, res) => {
  const { reportId } = req.params;
  try {
    const reportRes = await db.query('SELECT file_name FROM reports WHERE id = $1', [reportId]);
    if (reportRes.rows.length === 0) return res.status(404).send('Report not found');

    const contentRes = await db.query('SELECT extracted_text FROM extracted_content WHERE report_id = $1', [reportId]);
    if (contentRes.rows.length === 0) return res.status(404).send('Report content not found');

    const fileName = reportRes.rows[0].file_name;
    const text = contentRes.rows[0].extracted_text;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}.txt"`);
    res.send(text);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).send('Error downloading report');
  }
});

module.exports = router;
