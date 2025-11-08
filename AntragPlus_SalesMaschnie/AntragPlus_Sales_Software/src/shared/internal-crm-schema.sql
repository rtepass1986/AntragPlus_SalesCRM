-- Internal CRM Schema
-- Separate from Pipedrive data - this is YOUR internal CRM
-- Pipedrive is READ-ONLY, this is where enriched leads become contacts/deals

-- Internal Contacts Table (from approved Leads)
CREATE TABLE IF NOT EXISTS internal_contacts (
  id SERIAL PRIMARY KEY,
  
  -- Source Lead (where this came from)
  source_lead_id INTEGER REFERENCES leads(id),
  
  -- Contact Information
  full_name VARCHAR(255) NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(100),
  mobile VARCHAR(100),
  
  -- Organization
  organization_name VARCHAR(255) NOT NULL,
  organization_website VARCHAR(500),
  job_title VARCHAR(255), -- e.g. "Vorstandsvorsitzende"
  department VARCHAR(255), -- e.g. "Geschäftsführung"
  
  -- Leadership Info (from enrichment)
  is_decision_maker BOOLEAN DEFAULT FALSE,
  authority_level INTEGER, -- 1 = highest
  can_sign_contracts BOOLEAN DEFAULT FALSE,
  
  -- Social/Additional
  linkedin_url VARCHAR(500),
  
  -- Enrichment Metadata
  confidence_score DECIMAL(3,2),
  enrichment_date TIMESTAMP,
  data_source VARCHAR(50) DEFAULT 'lead_enrichment',
  
  -- Contact Tracking
  last_contacted_at TIMESTAMP,
  contact_frequency VARCHAR(50), -- 'weekly', 'monthly', 'quarterly'
  contact_status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'lost'
  
  -- Tags & Notes
  tags TEXT[],
  notes TEXT,
  
  -- Ownership
  owner_id INTEGER,
  owner_name VARCHAR(255),
  assigned_to VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100),
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP
);

-- Internal Deals/Pipeline Table
CREATE TABLE IF NOT EXISTS internal_deals (
  id SERIAL PRIMARY KEY,
  
  -- Link to Contact
  contact_id INTEGER REFERENCES internal_contacts(id),
  
  -- Deal Information
  title VARCHAR(500) NOT NULL,
  organization_name VARCHAR(255) NOT NULL,
  value DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'EUR',
  
  -- Pipeline Stage
  stage VARCHAR(100) NOT NULL DEFAULT 'Start',
  stage_order INTEGER DEFAULT 1,
  previous_stage VARCHAR(100),
  stage_changed_at TIMESTAMP,
  
  -- Status
  status VARCHAR(50) DEFAULT 'open', -- 'open', 'won', 'lost'
  probability INTEGER DEFAULT 10, -- 0-100
  
  -- Dates
  expected_close_date DATE,
  actual_close_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  won_at TIMESTAMP,
  lost_at TIMESTAMP,
  
  -- Additional Details
  description TEXT,
  source VARCHAR(50) DEFAULT 'lead_enrichment',
  lost_reason TEXT,
  
  -- From Lead Enrichment
  tätigkeitsfeld VARCHAR(255),
  industry VARCHAR(255),
  arbeitsbereiche TEXT[],
  lead_confidence_score DECIMAL(3,2),
  
  -- Leadership Team (for reference)
  leadership_team JSONB,
  
  -- Activities & Engagement
  activities_count INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP,
  next_activity_at TIMESTAMP,
  
  -- Ownership
  owner_id INTEGER,
  owner_name VARCHAR(255),
  
  -- Metadata
  created_by VARCHAR(100),
  
  -- Soft Delete
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP
);

-- Pipeline Stages Configuration (Internal)
CREATE TABLE IF NOT EXISTS internal_pipeline_stages (
  id SERIAL PRIMARY KEY,
  
  stage_name VARCHAR(100) UNIQUE NOT NULL,
  stage_order INTEGER NOT NULL,
  stage_color VARCHAR(50),
  
  -- Stage Configuration
  probability_default INTEGER DEFAULT 10, -- Default probability for this stage
  is_won_stage BOOLEAN DEFAULT FALSE,
  is_lost_stage BOOLEAN DEFAULT FALSE,
  
  -- Automation
  auto_create_activities BOOLEAN DEFAULT FALSE,
  default_activities JSONB, -- [{type: 'call', subject: 'Follow-up', ...}]
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- Insert default stages
INSERT INTO internal_pipeline_stages (stage_name, stage_order, stage_color, probability_default) VALUES
  ('Start', 1, 'bg-blue-100', 10),
  ('Kontaktiert', 2, 'bg-cyan-100', 20),
  ('Qualifiziert', 3, 'bg-purple-100', 40),
  ('Demo', 4, 'bg-orange-100', 60),
  ('Verhandlung', 5, 'bg-yellow-100', 75),
  ('Gewonnen', 6, 'bg-green-200', 100),
  ('Verloren', 7, 'bg-red-100', 0)
ON CONFLICT (stage_name) DO NOTHING;

-- Update won/lost flags
UPDATE internal_pipeline_stages SET is_won_stage = TRUE WHERE stage_name = 'Gewonnen';
UPDATE internal_pipeline_stages SET is_lost_stage = TRUE WHERE stage_name = 'Verloren';

-- Deal Activities (for internal deals)
CREATE TABLE IF NOT EXISTS internal_deal_activities (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER REFERENCES internal_deals(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES internal_contacts(id),
  
  -- Activity Details
  type VARCHAR(50) NOT NULL, -- 'call', 'meeting', 'email', 'task', 'note'
  subject VARCHAR(500) NOT NULL,
  description TEXT,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
  priority VARCHAR(50) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  
  -- Timing
  due_date DATE,
  due_time TIME,
  duration_minutes INTEGER,
  completed_at TIMESTAMP,
  
  -- Ownership
  assigned_to_id INTEGER,
  assigned_to_name VARCHAR(255),
  
  -- Additional
  location VARCHAR(255),
  outcome TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100)
);

-- Deal Notes
CREATE TABLE IF NOT EXISTS internal_deal_notes (
  id SERIAL PRIMARY KEY,
  deal_id INTEGER REFERENCES internal_deals(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  note_type VARCHAR(50) DEFAULT 'general', -- 'general', 'enrichment', 'call', 'meeting'
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100)
);

-- Lead Approval History
CREATE TABLE IF NOT EXISTS lead_approval_history (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  
  -- Approval Details
  action VARCHAR(50) NOT NULL, -- 'approved', 'rejected', 'sent_back'
  approved_by VARCHAR(100),
  approval_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Results
  contact_created_id INTEGER REFERENCES internal_contacts(id),
  deal_created_id INTEGER REFERENCES internal_deals(id),
  
  -- Notes
  approval_notes TEXT,
  changes_made JSONB -- What was edited before approval
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_internal_contacts_org ON internal_contacts(organization_name);
CREATE INDEX IF NOT EXISTS idx_internal_contacts_lead ON internal_contacts(source_lead_id);
CREATE INDEX IF NOT EXISTS idx_internal_contacts_email ON internal_contacts(email);
CREATE INDEX IF NOT EXISTS idx_internal_contacts_deleted ON internal_contacts(is_deleted);

CREATE INDEX IF NOT EXISTS idx_internal_deals_contact ON internal_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_internal_deals_stage ON internal_deals(stage);
CREATE INDEX IF NOT EXISTS idx_internal_deals_status ON internal_deals(status);
CREATE INDEX IF NOT EXISTS idx_internal_deals_org ON internal_deals(organization_name);
CREATE INDEX IF NOT EXISTS idx_internal_deals_expected_close ON internal_deals(expected_close_date);
CREATE INDEX IF NOT EXISTS idx_internal_deals_deleted ON internal_deals(is_deleted);

CREATE INDEX IF NOT EXISTS idx_internal_activities_deal ON internal_deal_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_internal_activities_contact ON internal_deal_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_internal_activities_due ON internal_deal_activities(due_date);
CREATE INDEX IF NOT EXISTS idx_internal_activities_status ON internal_deal_activities(status);

-- Triggers
CREATE OR REPLACE FUNCTION update_internal_contacts_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER internal_contacts_updated_at
  BEFORE UPDATE ON internal_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_internal_contacts_timestamp();

CREATE TRIGGER internal_deals_updated_at
  BEFORE UPDATE ON internal_deals
  FOR EACH ROW
  EXECUTE FUNCTION update_internal_contacts_timestamp();

-- View: Pipeline Overview
CREATE OR REPLACE VIEW internal_pipeline_overview AS
SELECT 
  s.stage_name,
  s.stage_order,
  s.stage_color,
  COUNT(d.id) as deal_count,
  SUM(d.value) as total_value,
  AVG(d.probability) as avg_probability
FROM internal_pipeline_stages s
LEFT JOIN internal_deals d ON d.stage = s.stage_name AND d.is_deleted = FALSE AND d.status = 'open'
WHERE s.is_active = TRUE
GROUP BY s.id, s.stage_name, s.stage_order, s.stage_color
ORDER BY s.stage_order;

-- Comments
COMMENT ON TABLE internal_contacts IS 'Internal CRM contacts created from approved leads';
COMMENT ON TABLE internal_deals IS 'Internal pipeline deals, separate from Pipedrive';
COMMENT ON TABLE internal_pipeline_stages IS 'Custom pipeline stages configuration';
COMMENT ON COLUMN internal_contacts.source_lead_id IS 'Link back to the enriched lead';
COMMENT ON COLUMN internal_deals.contact_id IS 'Primary contact for this deal';

