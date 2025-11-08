-- Deals Database Schema
-- Stores all deals imported from Pipedrive with full details

-- Pipeline Stages Table
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id SERIAL PRIMARY KEY,
  pipedrive_stage_id INTEGER UNIQUE NOT NULL,
  stage_name VARCHAR(255) NOT NULL,
  stage_order INTEGER NOT NULL,
  pipeline_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deals Table
CREATE TABLE IF NOT EXISTS deals (
  id SERIAL PRIMARY KEY,
  pipedrive_deal_id INTEGER UNIQUE NOT NULL,
  
  -- Basic Information
  title VARCHAR(500) NOT NULL,
  value DECIMAL(12, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'EUR',
  status VARCHAR(50) NOT NULL DEFAULT 'open', -- 'open', 'won', 'lost', 'deleted'
  
  -- Stage Information
  stage_id INTEGER REFERENCES pipeline_stages(pipedrive_stage_id),
  stage_name VARCHAR(255),
  pipeline_id INTEGER,
  
  -- Person/Contact Information
  person_id INTEGER,
  person_name VARCHAR(255),
  person_email VARCHAR(255),
  person_phone VARCHAR(100),
  
  -- Organization Information
  org_id INTEGER,
  org_name VARCHAR(255),
  org_address VARCHAR(500),
  org_website VARCHAR(255),
  
  -- Owner Information
  owner_id INTEGER,
  owner_name VARCHAR(255),
  user_id INTEGER,
  
  -- Dates
  add_time TIMESTAMP,
  update_time TIMESTAMP,
  close_time TIMESTAMP,
  won_time TIMESTAMP,
  lost_time TIMESTAMP,
  expected_close_date DATE,
  
  -- Additional Details
  probability INTEGER,
  lost_reason VARCHAR(500),
  visible_to VARCHAR(50),
  notes TEXT,
  
  -- Custom Fields (JSON for flexibility)
  custom_fields JSONB DEFAULT '{}',
  
  -- Counts and Metrics
  activities_count INTEGER DEFAULT 0,
  done_activities_count INTEGER DEFAULT 0,
  undone_activities_count INTEGER DEFAULT 0,
  email_messages_count INTEGER DEFAULT 0,
  files_count INTEGER DEFAULT 0,
  notes_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  participants_count INTEGER DEFAULT 0,
  
  -- Tracking
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  CONSTRAINT deals_pipedrive_deal_id_key UNIQUE (pipedrive_deal_id)
);

-- Deals Activities Table
CREATE TABLE IF NOT EXISTS deal_activities (
  id SERIAL PRIMARY KEY,
  pipedrive_activity_id INTEGER UNIQUE NOT NULL,
  deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
  pipedrive_deal_id INTEGER,
  
  -- Activity Details
  subject VARCHAR(500),
  type VARCHAR(100), -- 'call', 'meeting', 'task', 'deadline', 'email', 'lunch'
  due_date DATE,
  due_time TIME,
  duration VARCHAR(50),
  
  -- Participant Information
  user_id INTEGER,
  person_id INTEGER,
  org_id INTEGER,
  
  -- Status
  done BOOLEAN DEFAULT FALSE,
  marked_as_done_time TIMESTAMP,
  
  -- Content
  note TEXT,
  
  -- Metadata
  add_time TIMESTAMP,
  update_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deal Notes Table
CREATE TABLE IF NOT EXISTS deal_notes (
  id SERIAL PRIMARY KEY,
  pipedrive_note_id INTEGER UNIQUE NOT NULL,
  deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
  pipedrive_deal_id INTEGER,
  
  -- Note Content
  content TEXT NOT NULL,
  
  -- Metadata
  user_id INTEGER,
  add_time TIMESTAMP,
  update_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Deal Files Table
CREATE TABLE IF NOT EXISTS deal_files (
  id SERIAL PRIMARY KEY,
  pipedrive_file_id INTEGER UNIQUE NOT NULL,
  deal_id INTEGER REFERENCES deals(id) ON DELETE CASCADE,
  pipedrive_deal_id INTEGER,
  
  -- File Information
  file_name VARCHAR(500),
  file_type VARCHAR(100),
  file_size INTEGER,
  remote_location VARCHAR(50), -- 'pipedrive', 'dropbox', 'google_drive'
  url TEXT,
  
  -- Metadata
  add_time TIMESTAMP,
  update_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Organizations Table (synced from Pipedrive)
CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY,
  pipedrive_org_id INTEGER UNIQUE NOT NULL,
  
  -- Basic Information
  name VARCHAR(500) NOT NULL,
  owner_id INTEGER,
  owner_name VARCHAR(255),
  
  -- Contact Information
  address VARCHAR(500),
  address_street_number VARCHAR(100),
  address_route VARCHAR(255),
  address_locality VARCHAR(255),
  address_postal_code VARCHAR(50),
  address_country VARCHAR(100),
  
  -- Additional Details
  website VARCHAR(255),
  phone VARCHAR(100),
  email VARCHAR(255),
  
  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',
  
  -- Counts
  people_count INTEGER DEFAULT 0,
  open_deals_count INTEGER DEFAULT 0,
  closed_deals_count INTEGER DEFAULT 0,
  won_deals_count INTEGER DEFAULT 0,
  lost_deals_count INTEGER DEFAULT 0,
  
  -- Metadata
  add_time TIMESTAMP,
  update_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Persons/Contacts Table (synced from Pipedrive)
CREATE TABLE IF NOT EXISTS persons (
  id SERIAL PRIMARY KEY,
  pipedrive_person_id INTEGER UNIQUE NOT NULL,
  
  -- Basic Information
  name VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  owner_id INTEGER,
  owner_name VARCHAR(255),
  
  -- Contact Information
  email VARCHAR(255)[],
  phone VARCHAR(100)[],
  
  -- Organization Link
  org_id INTEGER,
  org_name VARCHAR(255),
  
  -- Custom Fields
  custom_fields JSONB DEFAULT '{}',
  
  -- Counts
  open_deals_count INTEGER DEFAULT 0,
  closed_deals_count INTEGER DEFAULT 0,
  activities_count INTEGER DEFAULT 0,
  
  -- Metadata
  add_time TIMESTAMP,
  update_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_deals_stage_id ON deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_deals_status ON deals(status);
CREATE INDEX IF NOT EXISTS idx_deals_org_id ON deals(org_id);
CREATE INDEX IF NOT EXISTS idx_deals_person_id ON deals(person_id);
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_update_time ON deals(update_time);
CREATE INDEX IF NOT EXISTS idx_deals_expected_close_date ON deals(expected_close_date);

CREATE INDEX IF NOT EXISTS idx_deal_activities_deal_id ON deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_activities_due_date ON deal_activities(due_date);
CREATE INDEX IF NOT EXISTS idx_deal_activities_done ON deal_activities(done);

CREATE INDEX IF NOT EXISTS idx_deal_notes_deal_id ON deal_notes(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_files_deal_id ON deal_files(deal_id);

CREATE INDEX IF NOT EXISTS idx_organizations_pipedrive_org_id ON organizations(pipedrive_org_id);
CREATE INDEX IF NOT EXISTS idx_persons_pipedrive_person_id ON persons(pipedrive_person_id);
CREATE INDEX IF NOT EXISTS idx_persons_org_id ON persons(org_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

