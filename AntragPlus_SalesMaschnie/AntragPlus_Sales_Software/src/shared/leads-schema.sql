-- Leads Database Schema
-- Stores enriched lead data from various sources

-- Leads Table
CREATE TABLE IF NOT EXISTS leads (
  id SERIAL PRIMARY KEY,
  
  -- Basic Information
  company_name VARCHAR(255) NOT NULL,
  legal_form VARCHAR(50), -- e.V., gGmbH, Stiftung, etc.
  
  -- Contact Information
  website VARCHAR(500),
  email VARCHAR(255),
  phone VARCHAR(100),
  address TEXT,
  linkedin_url VARCHAR(500),
  
  -- Organization Details
  industry VARCHAR(255),
  tätigkeitsfeld VARCHAR(255), -- Field of activity
  founded_year INTEGER,
  employees_estimate VARCHAR(100), -- "50-200", "1000+", etc.
  revenue_estimate VARCHAR(100),
  
  -- Enrichment Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'enriched', 'failed'
  confidence DECIMAL(3, 2) DEFAULT 0, -- 0.00 to 1.00
  enrichment_date TIMESTAMP,
  last_enrichment_attempt TIMESTAMP,
  enrichment_attempts INTEGER DEFAULT 0,
  
  -- Data Source
  source VARCHAR(50) NOT NULL DEFAULT 'manual', -- 'csv', 'manual', 'pipedrive', 'api'
  source_reference VARCHAR(255), -- Original ID from source system
  
  -- Pipedrive Integration
  pipedrive_org_id INTEGER,
  pipedrive_deal_id INTEGER,
  synced_to_pipedrive BOOLEAN DEFAULT FALSE,
  pipedrive_sync_date TIMESTAMP,
  
  -- AI Generated Content
  description TEXT, -- 2-3 sentence German description
  tags TEXT[], -- Array of tags
  flagship_projects TEXT[], -- Key projects/initiatives
  arbeitsbereiche TEXT[], -- Work areas
  
  -- Leadership Information (stored as JSONB)
  leadership JSONB DEFAULT '[]'::jsonb,
  -- Structure: [{ name, role, role_display, email, phone, linkedin, authority_level, can_sign_contracts }]
  
  -- Notes and Custom Fields
  notes TEXT,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  
  -- Quality Metrics
  completeness_score INTEGER DEFAULT 0, -- 0-100
  data_quality_flags TEXT[], -- Issues found during enrichment
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_by VARCHAR(100),
  
  -- Soft Delete
  deleted_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Enrichment History Table
CREATE TABLE IF NOT EXISTS lead_enrichment_history (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Enrichment Details
  enrichment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) NOT NULL, -- 'success', 'partial', 'failed'
  confidence DECIMAL(3, 2),
  
  -- Fields Updated
  fields_updated TEXT[], -- List of field names that were updated
  fields_added INTEGER DEFAULT 0,
  
  -- Data Sources Used
  sources_used TEXT[], -- 'tavily', 'openai', 'manual', etc.
  
  -- Costs
  api_calls_made INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10, 4) DEFAULT 0, -- In EUR
  
  -- Results
  changes JSONB, -- Before/after values
  errors TEXT[], -- Any errors encountered
  
  -- Performance
  duration_ms INTEGER, -- How long enrichment took
  
  -- Metadata
  triggered_by VARCHAR(100), -- User or system that triggered
  notes TEXT
);

-- Lead Tags Table (for better querying)
CREATE TABLE IF NOT EXISTS lead_tags (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tag VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(lead_id, tag)
);

-- Lead Notes Table
CREATE TABLE IF NOT EXISTS lead_notes (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Note Content
  content TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'general', -- 'general', 'call', 'meeting', 'email', 'enrichment'
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(100),
  
  -- Attachments
  attachments JSONB DEFAULT '[]'::jsonb
);

-- CSV Import Batches (track bulk imports)
CREATE TABLE IF NOT EXISTS csv_import_batches (
  id SERIAL PRIMARY KEY,
  
  -- Import Details
  filename VARCHAR(255) NOT NULL,
  total_rows INTEGER NOT NULL,
  successful_imports INTEGER DEFAULT 0,
  failed_imports INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  
  -- Errors
  errors JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  imported_by VARCHAR(100),
  processing_time_ms INTEGER
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_leads_company_name ON leads(company_name) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_leads_tätigkeitsfeld ON leads(tätigkeitsfeld) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_leads_pipedrive_org_id ON leads(pipedrive_org_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_leads_enrichment_date ON leads(enrichment_date) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(source) WHERE is_deleted = FALSE;

-- Indexes for search
CREATE INDEX IF NOT EXISTS idx_leads_search_company ON leads USING gin(to_tsvector('german', company_name));
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING gin(tags);

-- Indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_enrichment_history_lead_id ON lead_enrichment_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_lead_id ON lead_tags(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_tag ON lead_tags(tag);
CREATE INDEX IF NOT EXISTS idx_lead_notes_lead_id ON lead_notes(lead_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at_trigger
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- View for easy querying of leads with enrichment stats
CREATE OR REPLACE VIEW leads_with_stats AS
SELECT 
  l.*,
  COUNT(DISTINCT leh.id) as enrichment_count,
  MAX(leh.enrichment_date) as last_enrichment,
  AVG(leh.confidence) as avg_confidence,
  SUM(leh.estimated_cost) as total_cost,
  COUNT(DISTINCT ln.id) as notes_count,
  ARRAY_AGG(DISTINCT lt.tag) FILTER (WHERE lt.tag IS NOT NULL) as all_tags
FROM leads l
LEFT JOIN lead_enrichment_history leh ON l.id = leh.lead_id
LEFT JOIN lead_notes ln ON l.id = ln.lead_id
LEFT JOIN lead_tags lt ON l.id = lt.lead_id
WHERE l.is_deleted = FALSE
GROUP BY l.id;

-- Function to calculate completeness score
CREATE OR REPLACE FUNCTION calculate_lead_completeness(lead_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  lead_record RECORD;
BEGIN
  SELECT * INTO lead_record FROM leads WHERE id = lead_id;
  
  IF lead_record IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Basic fields (10 points each)
  IF lead_record.company_name IS NOT NULL THEN score := score + 10; END IF;
  IF lead_record.website IS NOT NULL THEN score := score + 10; END IF;
  IF lead_record.email IS NOT NULL THEN score := score + 10; END IF;
  IF lead_record.phone IS NOT NULL THEN score := score + 10; END IF;
  IF lead_record.address IS NOT NULL THEN score := score + 10; END IF;
  
  -- Organization details (8 points each)
  IF lead_record.industry IS NOT NULL THEN score := score + 8; END IF;
  IF lead_record.tätigkeitsfeld IS NOT NULL THEN score := score + 8; END IF;
  IF lead_record.legal_form IS NOT NULL THEN score := score + 8; END IF;
  
  -- Additional info (6 points each)
  IF lead_record.linkedin_url IS NOT NULL THEN score := score + 6; END IF;
  IF lead_record.description IS NOT NULL THEN score := score + 6; END IF;
  IF lead_record.leadership IS NOT NULL AND jsonb_array_length(lead_record.leadership) > 0 THEN 
    score := score + 10; 
  END IF;
  
  RETURN LEAST(score, 100);
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE leads IS 'Main table storing enriched lead/organization data';
COMMENT ON TABLE lead_enrichment_history IS 'Tracks all enrichment attempts and changes over time';
COMMENT ON TABLE lead_tags IS 'Normalized tag storage for better querying';
COMMENT ON TABLE lead_notes IS 'Notes and annotations for leads';
COMMENT ON TABLE csv_import_batches IS 'Tracks bulk CSV import operations';
COMMENT ON COLUMN leads.confidence IS 'AI confidence score from 0.00 to 1.00';
COMMENT ON COLUMN leads.completeness_score IS 'Data completeness percentage 0-100';
COMMENT ON COLUMN leads.leadership IS 'JSONB array of leadership team members';

