const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/connection');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'documents');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// GET /api/projects/:projectId/documents
router.get('/', async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await db.query(
      `SELECT * FROM documents WHERE project_id = $1 ORDER BY created_at DESC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Documents Fetch Error:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// POST /api/projects/:projectId/documents (ACTUAL UPLOAD)
router.post('/', upload.single('file'), async (req, res) => {
  const { projectId } = req.params;
  const { category } = req.body;
  const file = req.file;
  const userId = req.auth?.userId || 'system';

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  try {
    const filePath = `/uploads/documents/${file.filename}`;
    const result = await db.query(
      `INSERT INTO documents (project_id, uploaded_by, file_name, file_type, file_path, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [projectId, userId, file.originalname, file.mimetype, filePath, category || 'General']
    );

    // Log to audit
    await db.query(
      `INSERT INTO audit_logs (project_id, user_id, entity_type, entity_id, action, metadata)
       VALUES ($1, $2, 'Document', $3, 'Uploaded Document', $4)`,
      [projectId, userId, result.rows[0].id, JSON.stringify({ fileName: file.originalname, category })]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Document Upload Error:', err);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

module.exports = router;
