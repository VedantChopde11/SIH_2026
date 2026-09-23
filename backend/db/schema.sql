-- Vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Users (handled via Clerk, but we store references for app-specific data if needed)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY, -- Clerk User ID
  email VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  clerk_user_id VARCHAR(255) NOT NULL,
  project_code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  client VARCHAR(255),
  location VARCHAR(255),
  description TEXT,
  planned_start DATE,
  planned_finish DATE,
  status VARCHAR(50) DEFAULT 'Planning',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- WBS Nodes
CREATE TABLE IF NOT EXISTS wbs_nodes (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES wbs_nodes(id) ON DELETE CASCADE,
  wbs_code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  level INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  wbs_id INTEGER REFERENCES wbs_nodes(id) ON DELETE SET NULL,
  activity_id_original VARCHAR(100) NOT NULL,
  activity_name VARCHAR(255) NOT NULL,
  activity_level VARCHAR(50),
  discipline VARCHAR(100),
  location VARCHAR(255),
  planned_start DATE,
  planned_finish DATE,
  duration INTEGER,
  status VARCHAR(50) DEFAULT 'Not Started',
  progress_percent NUMERIC(5, 2) DEFAULT 0.00,
  actual_start DATE,
  actual_finish DATE,
  identifiers TEXT, -- stored as JSON or comma-separated
  embedding vector(768),
  search_text TEXT,
  embedding_model VARCHAR(100),
  embedding_version VARCHAR(50),
  embedding_source_hash VARCHAR(64),
  embedded_at TIMESTAMP,
  embedding_bge vector(1024),
  embedding_bge_small vector(384),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, activity_id_original)
);

-- Activity Relationships
CREATE TABLE IF NOT EXISTS activity_relationships (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  predecessor_activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  successor_activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  relationship_type VARCHAR(10), -- FS, SS, FF, SF
  lag INTEGER DEFAULT 0
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  report_date DATE,
  status VARCHAR(50) DEFAULT 'Uploaded',
  file_hash VARCHAR(64),
  import_batch_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extracted Content
CREATE TABLE IF NOT EXISTS extracted_content (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
  source_type VARCHAR(50),
  page_number INTEGER,
  row_number INTEGER,
  cell_reference VARCHAR(50),
  paragraph_number INTEGER,
  original_text TEXT NOT NULL,
  extracted_text TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  report_id INTEGER REFERENCES reports(id) ON DELETE CASCADE,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  action VARCHAR(255),
  object VARCHAR(255),
  identifier VARCHAR(255),
  location VARCHAR(255),
  discipline VARCHAR(100),
  status VARCHAR(50),
  actual_start DATE,
  actual_finish DATE,
  quantity NUMERIC(10, 2),
  unit VARCHAR(50),
  source_text TEXT,
  extraction_confidence VARCHAR(50),
  embedding vector(768),
  search_text TEXT,
  embedding_model VARCHAR(100),
  embedding_version VARCHAR(50),
  embedding_source_hash VARCHAR(64),
  embedded_at TIMESTAMP,
  embedding_bge vector(1024),
  embedding_bge_small vector(384),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activity Matches
CREATE TABLE IF NOT EXISTS activity_matches (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  semantic_score NUMERIC(5, 4),
  identifier_score NUMERIC(5, 4),
  location_score NUMERIC(5, 4),
  discipline_score NUMERIC(5, 4),
  wbs_score NUMERIC(5, 4),
  date_score NUMERIC(5, 4),
  relationship_score NUMERIC(5, 4),
  total_score NUMERIC(5, 4),
  validation_status VARCHAR(50),
  validation_reasons TEXT,
  rank INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  proposed_activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
  final_activity_id INTEGER REFERENCES activities(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'Pending',
  confidence VARCHAR(50),
  planner_user_id VARCHAR(255),
  comment TEXT,
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Progress Events
CREATE TABLE IF NOT EXISTS progress_events (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
  quantity NUMERIC(10, 2),
  unit VARCHAR(50),
  progress_percent NUMERIC(5, 2),
  actual_start DATE,
  actual_finish DATE,
  status VARCHAR(50),
  source VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  user_id VARCHAR(255),
  entity_type VARCHAR(100),
  entity_id INTEGER,
  action VARCHAR(100),
  old_value JSONB,
  new_value JSONB,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(50),
  title VARCHAR(255),
  message TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents (Knowledge Base)
CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by VARCHAR(255) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  category VARCHAR(100) DEFAULT 'General',
  file_hash VARCHAR(64),
  import_batch_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
