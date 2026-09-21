const express = require('express');
const router = express.Router({ mergeParams: true });
const multer = require('multer');
const xlsx = require('xlsx');
const db = require('../db/connection');
const { calculateBufferHash, calculateTextHash } = require('../services/hashService');
const { buildActivityCanonicalText } = require('../services/canonicalService');
const { generateEmbeddings } = require('../services/embeddingService');

const upload = multer({ storage: multer.memoryStorage() });

// Helper to construct WBS hierarchy
const processWBS = async (client, projectId, uniqueWbsCodes) => {
  const sortedCodes = Array.from(uniqueWbsCodes.keys()).sort((a, b) => a.length - b.length);
  const wbsMap = new Map();
  
  for (const code of sortedCodes) {
    if (!code) continue;
    
    let parentId = null;
    let level = 1;
    const parts = code.split('.');
    if (parts.length > 1) {
      const parentCode = parts.slice(0, -1).join('.');
      parentId = wbsMap.get(parentCode) || null;
      level = parts.length;
    }
    
    const name = uniqueWbsCodes.get(code) || `WBS ${code}`;
    
    const check = await client.query('SELECT id FROM wbs_nodes WHERE project_id = $1 AND wbs_code = $2', [projectId, code]);
    if (check.rows.length > 0) {
      wbsMap.set(code, check.rows[0].id);
    } else {
      const insert = await client.query(
        'INSERT INTO wbs_nodes (project_id, parent_id, wbs_code, name, level) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [projectId, parentId, code, name, level]
      );
      wbsMap.set(code, insert.rows[0].id);
    }
  }
  
  return wbsMap;
};

// Upload and Parse Schedule
router.post('/upload', upload.single('file'), async (req, res) => {
  const { projectId } = req.params;
  
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const fileHash = calculateBufferHash(req.file.buffer);
    
    // Import checking
    const existingImport = await db.query(
      `SELECT id FROM documents WHERE project_id = $1 AND file_hash = $2 LIMIT 1`,
      [projectId, fileHash]
    );

    if (existingImport.rows.length > 0) {
      console.log(`[SCHEDULE] fileHash=${fileHash} already imported. Skipping processing.`);
      return res.json({ message: 'Schedule already imported (cached)', activitiesInserted: 0, wbsNodesCount: 0 });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    if (data.length === 0) {
      return res.status(400).json({ error: 'File is empty or could not be parsed' });
    }

    const uniqueWbsCodes = new Map();
    data.forEach(row => {
      const code = row['WBS Code'] || row['WBS'] || row['Parent WBS'] || row['L5 Activity ID'] || '';
      const name = row['WBS Name'] || row['L5 Activity Name'] || `WBS Node ${code}`;
      if (code && !uniqueWbsCodes.has(code)) {
        uniqueWbsCodes.set(code, name);
      }
    });

    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const wbsMap = await processWBS(client, projectId, uniqueWbsCodes);
      
      // Fetch all existing activities to check embedding provenance
      const existingQuery = await client.query(
        `SELECT activity_id_original, embedding_source_hash, embedding_model, embedding_version 
         FROM activities WHERE project_id = $1`,
        [projectId]
      );
      const existingActivities = new Map(existingQuery.rows.map(r => [r.activity_id_original, r]));
      
      const parseExcelDate = (excelDate) => {
        if (!excelDate) return null;
        if (typeof excelDate === 'number') {
          return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
        }
        return new Date(excelDate);
      };

      const activitiesToProcess = [];
      
      for (const row of data) {
        const activityIdOriginal = row['L6 Activity ID'] || row['Activity ID'] || row['ID'];
        const name = row['L6 Activity Name'] || row['Activity Name'] || row['Name'] || 'Unnamed Activity';
        if (!activityIdOriginal) continue;
        
        const wbsCode = row['Parent WBS'] || row['WBS Code'] || row['WBS'] || row['L5 Activity ID'];
        const wbsName = row['WBS Name'] || row['L5 Activity Name'];
        const wbsId = wbsMap.get(wbsCode) || null;
        const location = row['Location'] || '';
        const discipline = row['Discipline'] || '';

        const canonicalText = buildActivityCanonicalText({
          activity_id_original: activityIdOriginal,
          activity_name: name,
          discipline,
          location,
          wbs_code: wbsCode,
          wbs_name: wbsName
        });

        const sourceHash = calculateTextHash(canonicalText);

        activitiesToProcess.push({
          activityIdOriginal,
          name,
          plannedStart: parseExcelDate(row['Planned Start'] || row['Start']),
          plannedFinish: parseExcelDate(row['Planned Finish'] || row['Finish']),
          duration: parseInt(row['Planned Duration (days)'] || row['Duration']) || 0,
          location,
          discipline,
          wbsId,
          canonicalText,
          sourceHash
        });
      }

      // Determine which embeddings we actually need to generate
      const currentProvider = (process.env.EMBEDDING_PROVIDER || 'gemini').toLowerCase();
      const currentModel = currentProvider === 'bge-m3' ? 'BAAI/bge-m3' : 'gemini-embedding-2';
      const currentVersion = '1';

      const toEmbed = [];
      for (const act of activitiesToProcess) {
        const existing = existingActivities.get(String(act.activityIdOriginal));
        if (existing && 
            existing.embedding_source_hash === act.sourceHash &&
            existing.embedding_model === currentModel &&
            existing.embedding_version === currentVersion) {
          act.needsEmbedding = false;
        } else {
          act.needsEmbedding = true;
          toEmbed.push(act);
        }
      }

      console.log(`[SCHEDULE] Need to generate embeddings for ${toEmbed.length}/${activitiesToProcess.length} activities`);
      
      if (toEmbed.length > 0) {
        const textsToEmbed = toEmbed.map(a => a.canonicalText);
        try {
          const { vectors, modelName, modelVersion, vectorColumn } = await generateEmbeddings(textsToEmbed);
          
          for (let i = 0; i < toEmbed.length; i++) {
            toEmbed[i].embeddingVector = vectors[i];
            toEmbed[i].modelName = modelName;
            toEmbed[i].modelVersion = modelVersion;
            toEmbed[i].vectorColumn = vectorColumn;
          }
        } catch (embedError) {
          console.error("Embedding generation failed in batch:", embedError);
          // If embeddings fail, we still want to save the activities but without embeddings
        }
      }

      // Upsert activities
      let activitiesInserted = 0;
      for (const act of activitiesToProcess) {
        
        let queryStr = `
          INSERT INTO activities (
            project_id, wbs_id, activity_id_original, activity_name, 
            planned_start, planned_finish, duration, location, discipline, 
            search_text, embedding_source_hash, embedding_model, embedding_version, embedded_at
            ${act.vectorColumn ? ', ' + act.vectorColumn : ''}
          ) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW() ${act.embeddingVector ? ', $14' : ''})
          ON CONFLICT (project_id, activity_id_original) 
          DO UPDATE SET 
            wbs_id = EXCLUDED.wbs_id,
            activity_name = EXCLUDED.activity_name,
            planned_start = EXCLUDED.planned_start,
            planned_finish = EXCLUDED.planned_finish,
            duration = EXCLUDED.duration,
            location = EXCLUDED.location,
            discipline = EXCLUDED.discipline,
            search_text = COALESCE(EXCLUDED.search_text, activities.search_text),
            embedding_source_hash = COALESCE(EXCLUDED.embedding_source_hash, activities.embedding_source_hash),
            embedding_model = COALESCE(EXCLUDED.embedding_model, activities.embedding_model),
            embedding_version = COALESCE(EXCLUDED.embedding_version, activities.embedding_version)
            ${act.vectorColumn ? ', ' + act.vectorColumn + ' = COALESCE(EXCLUDED.' + act.vectorColumn + ', activities.' + act.vectorColumn + ')' : ''}
        `;
        
        const params = [
          projectId, act.wbsId, String(act.activityIdOriginal), String(act.name), 
          act.plannedStart, act.plannedFinish, act.duration, act.location, act.discipline,
          act.canonicalText, act.sourceHash, act.modelName || null, act.modelVersion || null
        ];

        if (act.embeddingVector) {
          params.push(act.embeddingVector);
        }

        await client.query(queryStr, params);
        activitiesInserted++;
      }
      
      // Save import tracking
      await client.query(
        `INSERT INTO documents (project_id, uploaded_by, file_name, file_type, file_path, category, file_hash, import_batch_id) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [projectId, req.auth?.userId || 'system', req.file.originalname, 'schedule', 'memory', 'Schedule', fileHash, `batch_${Date.now()}`]
      );

      await client.query('COMMIT');
      res.json({ message: 'Schedule imported successfully', activitiesInserted, wbsNodesCount: wbsMap.size });
      
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    
  } catch (err) {
    console.error('Import Error:', err);
    res.status(500).json({ error: err.message || 'Error processing schedule file' });
  }
});

// Get Schedule (WBS and Activities)
router.get('/', async (req, res) => {
  const { projectId } = req.params;
  try {
    const wbsResult = await db.query('SELECT * FROM wbs_nodes WHERE project_id = $1 ORDER BY level, wbs_code', [projectId]);
    const activitiesResult = await db.query('SELECT * FROM activities WHERE project_id = $1 ORDER BY activity_id_original', [projectId]);
    
    res.json({
      wbsNodes: wbsResult.rows,
      activities: activitiesResult.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
