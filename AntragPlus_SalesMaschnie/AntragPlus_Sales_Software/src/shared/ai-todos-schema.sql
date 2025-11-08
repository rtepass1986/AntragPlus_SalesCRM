-- AI-Generated TODOs Table for Sales Dashboard
-- Automatically creates tasks based on call analysis, calendar, and sales flow

CREATE TABLE IF NOT EXISTS ai_todos (
  id SERIAL PRIMARY KEY,
  sales_rep_id INTEGER NOT NULL,
  
  -- TODO Details
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL CHECK (priority IN ('URGENT', 'HIGH', 'MEDIUM', 'LOW')),
  deadline TIMESTAMP,
  
  -- Source & Context
  source VARCHAR(50) NOT NULL, -- 'ai_call_analysis', 'calendar', 'sales_flow', 'manual'
  related_deal_id INTEGER,
  related_call_recording_id INTEGER,
  related_prospect_name VARCHAR(255),
  
  -- Action Details
  goal TEXT,
  strategy TEXT,
  recommended_script VARCHAR(255),
  
  -- Checklist (JSONB array of {item: string, completed: boolean})
  checklist JSONB,
  
  -- Resources (JSONB {script, training, template, aiDraft})
  resources JSONB,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'snoozed')),
  completed_at TIMESTAMP,
  snoozed_until TIMESTAMP,
  
  -- AI Metadata
  ai_reason TEXT,  -- Why this was created
  ai_confidence DECIMAL(3,2),  -- 0.00-1.00
  ai_priority_score INTEGER,  -- Internal scoring for prioritization
  
  -- Tracking
  viewed_at TIMESTAMP,
  started_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_todos_rep_status ON ai_todos(sales_rep_id, status);
CREATE INDEX IF NOT EXISTS idx_todos_priority_deadline ON ai_todos(priority, deadline);
CREATE INDEX IF NOT EXISTS idx_todos_source ON ai_todos(source);
CREATE INDEX IF NOT EXISTS idx_todos_deal ON ai_todos(related_deal_id);
CREATE INDEX IF NOT EXISTS idx_todos_call ON ai_todos(related_call_recording_id);

-- Daily dashboard stats view
CREATE TABLE IF NOT EXISTS dashboard_stats (
  id SERIAL PRIMARY KEY,
  sales_rep_id INTEGER NOT NULL,
  stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Activity
  calls_scheduled INTEGER DEFAULT 0,
  calls_completed INTEGER DEFAULT 0,
  todos_completed INTEGER DEFAULT 0,
  
  -- Performance
  avg_call_score DECIMAL(3,1),
  avg_certainty_product DECIMAL(3,1),
  avg_certainty_salesperson DECIMAL(3,1),
  avg_certainty_company DECIMAL(3,1),
  
  -- Progress
  quota_progress DECIMAL(5,2), -- Percentage
  revenue_today DECIMAL(12,2),
  
  -- Streaks
  consecutive_days_active INTEGER DEFAULT 0,
  
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(sales_rep_id, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_stats_rep_date ON dashboard_stats(sales_rep_id, stat_date);

-- Call schedule (integration with calendar/CRM)
CREATE TABLE IF NOT EXISTS call_schedule (
  id SERIAL PRIMARY KEY,
  sales_rep_id INTEGER NOT NULL,
  
  -- Call Details
  prospect_name VARCHAR(255) NOT NULL,
  prospect_company VARCHAR(255),
  call_type VARCHAR(50), -- 'discovery', 'demo', 'closing', 'follow_up'
  
  -- Schedule
  scheduled_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  timezone VARCHAR(50) DEFAULT 'Europe/Berlin',
  
  -- Context
  pipedrive_deal_id INTEGER,
  pipedrive_person_id INTEGER,
  last_call_recording_id INTEGER,
  last_call_score DECIMAL(3,1),
  
  -- Prep
  pain_points JSONB,
  objections_expected JSONB,
  recommended_script VARCHAR(255),
  prep_notes TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  completed_at TIMESTAMP,
  
  -- Meeting links
  meeting_url TEXT,
  recording_url TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_call_schedule_rep_time ON call_schedule(sales_rep_id, scheduled_time);
CREATE INDEX IF NOT EXISTS idx_call_schedule_status ON call_schedule(status);
CREATE INDEX IF NOT EXISTS idx_call_schedule_deal ON call_schedule(pipedrive_deal_id);

-- Comments for clarity
COMMENT ON TABLE ai_todos IS 'AI-generated tasks based on call analysis and sales flow';
COMMENT ON TABLE dashboard_stats IS 'Daily aggregated statistics for dashboard';
COMMENT ON TABLE call_schedule IS 'Scheduled calls with context and prep materials';


