const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const db = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      status: 'ok',
      database: 'connected',
      time: result.rows[0].now
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: err.message
    });
  }
});

// Import route modules
const projectsRouter = require('./routes/projects');
const scheduleRouter = require('./routes/schedule');
const reportsRouter = require('./routes/reports');
const eventsRouter = require('./routes/events');
const analyticsRouter = require('./routes/analytics');
const auditRouter = require('./routes/audit');
const documentsRouter = require('./routes/documents');
const usersRouter = require('./routes/users');

// Apply Clerk authentication middleware to all API routes
const authMiddleware = ClerkExpressRequireAuth();

app.use('/api', (req, res, next) => {
  console.log(`[AUTH DEBUG] Path: ${req.path}`);
  console.log(`[AUTH DEBUG] Headers:`, req.headers.authorization ? 'Bearer [HIDDEN]' : 'No Auth Header');
  next();
});

// Use routes
app.use('/api/projects', authMiddleware, projectsRouter);
app.use('/api/projects/:projectId/schedule', authMiddleware, scheduleRouter);
app.use('/api/projects/:projectId/reports', authMiddleware, reportsRouter);
app.use('/api/projects/:projectId/events', authMiddleware, eventsRouter);
app.use('/api/projects/:projectId/analytics', authMiddleware, analyticsRouter);
app.use('/api/projects/:projectId/audit', authMiddleware, auditRouter);
app.use('/api/projects/:projectId/documents', authMiddleware, documentsRouter);
app.use('/api/users', authMiddleware, usersRouter);

app.use((err, req, res, next) => {
  console.error('[Global Error]', err.message);
  res.status(err.statusCode || 401).json({ error: err.message || 'Unauthorized or Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
