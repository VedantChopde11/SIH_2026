const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db/connection');

// GET /api/projects/:projectId/audit
router.get('/', async (req, res) => {
  const { projectId } = req.params;
  try {
    const result = await db.query(
      `SELECT 
         a.id, 
         a.created_at, 
         a.user_id, 
         a.action, 
         a.entity_type, 
         a.metadata
       FROM audit_logs a
       WHERE a.project_id = $1
       ORDER BY a.created_at DESC
       LIMIT 100`,
      [projectId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Audit Trail Error:', err);
    res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

module.exports = router;
