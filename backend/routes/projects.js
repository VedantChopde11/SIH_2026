const express = require('express');
const router = express.Router();
const db = require('../db/connection');

// Get all projects
router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new project
router.post('/', async (req, res) => {
  const clerk_user_id = req.auth.userId;
  const { project_code, name, client, location, description, planned_start, planned_finish } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO projects (clerk_user_id, project_code, name, client, location, description, planned_start, planned_finish) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [clerk_user_id, project_code, name, client, location, description, planned_start, planned_finish]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a specific project
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a project
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { project_code, name, client, location, description, planned_start, planned_finish, status } = req.body;
  try {
    const result = await db.query(
      'UPDATE projects SET project_code = $1, name = $2, client = $3, location = $4, description = $5, planned_start = $6, planned_finish = $7, status = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9 RETURNING *',
      [project_code, name, client, location, description, planned_start, planned_finish, status, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a project
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM projects WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
