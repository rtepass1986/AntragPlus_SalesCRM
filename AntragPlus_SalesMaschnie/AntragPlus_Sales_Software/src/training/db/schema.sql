-- ===================================
-- ANTRAGPLUS SALES TRAINING MODULE
-- Database Schema for PostgreSQL
-- ===================================

-- ===================================
-- 1. CUSTOMER JOURNEY TABLES
-- ===================================

CREATE TABLE IF NOT EXISTS customer_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journey_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES customer_journeys(id) ON DELETE CASCADE,
  stage_number INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  ziel TEXT NOT NULL,
  owner VARCHAR(255) NOT NULL,
  schwachpunkt TEXT,
  prioritat TEXT,
  color VARCHAR(50) DEFAULT 'bg-blue-500',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(journey_id, stage_number)
);

CREATE TABLE IF NOT EXISTS journey_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID REFERENCES journey_stages(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'call', 'meeting', 'demo', 'proposal', 'other')),
  description TEXT,
  duration VARCHAR(50),
  owner VARCHAR(255),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journey_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID REFERENCES journey_stages(id) ON DELETE CASCADE,
  asset_name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_journey_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journey_id UUID REFERENCES customer_journeys(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES journey_stages(id),
  suggestion_type VARCHAR(50) NOT NULL,
  suggestion TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  impact VARCHAR(20) CHECK (impact IN ('low', 'medium', 'high')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===================================
-- 2. SCRIPTS & TEMPLATES TABLES
-- ===================================

CREATE TABLE IF NOT EXISTS call_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('discovery', 'demo', 'objection_handling', 'closing', 'follow_up')),
  stage VARCHAR(100),
  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  updated_by VARCHAR(20) DEFAULT 'manual' CHECK (updated_by IN ('manual', 'ai')),
  ai_confidence DECIMAL(3,2),
  usage_count INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) DEFAULT 0,
  avg_call_duration INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('cold_outreach', 'follow_up', 'proposal', 'closing', 'nurture')),
  stage VARCHAR(100),
  content TEXT NOT NULL,
  variables TEXT[],
  version INTEGER DEFAULT 1,
  updated_by VARCHAR(20) DEFAULT 'manual' CHECK (updated_by IN ('manual', 'ai')),
  ai_confidence DECIMAL(3,2),
  usage_count INTEGER DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS script_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID REFERENCES call_scripts(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  changed_by VARCHAR(255),
  change_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===================================
-- 3. FIREFLY RECORDINGS TABLES
-- ===================================

CREATE TABLE IF NOT EXISTS firefly_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firefly_id VARCHAR(255),
  title VARCHAR(500) NOT NULL,
  recording_date TIMESTAMP NOT NULL,
  duration INTEGER NOT NULL, -- seconds
  participants TEXT[],
  deal_id VARCHAR(100),
  deal_name VARCHAR(255),
  file_url TEXT,
  transcript TEXT,
  summary TEXT,
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'analyzed', 'applied')),
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recording_key_moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id UUID REFERENCES firefly_recordings(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL,
  moment_type VARCHAR(50) NOT NULL CHECK (moment_type IN ('objection', 'question', 'win', 'next_step', 'insight')),
  description TEXT NOT NULL,
  quote TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_script_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID REFERENCES call_scripts(id),
  template_id UUID REFERENCES email_templates(id),
  update_type VARCHAR(20) NOT NULL CHECK (update_type IN ('call_script', 'email_template')),
  source_type VARCHAR(50) NOT NULL,
  source_id VARCHAR(255),
  source_name VARCHAR(255),
  original_content TEXT NOT NULL,
  suggested_content TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  based_on_calls INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_update_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  update_id UUID REFERENCES ai_script_updates(id) ON DELETE CASCADE,
  change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('addition', 'modification', 'removal')),
  section VARCHAR(100) NOT NULL,
  before_text TEXT,
  after_text TEXT,
  reason TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===================================
-- 4. TRAINING MATERIALS TABLES (LMS)
-- ===================================

CREATE TABLE IF NOT EXISTS training_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  material_type VARCHAR(50) NOT NULL CHECK (material_type IN ('video', 'pdf', 'article', 'interactive', 'quiz')),
  category VARCHAR(100) NOT NULL CHECK (category IN ('product', 'sales_process', 'objection_handling', 'tools', 'compliance')),
  description TEXT,
  file_url TEXT,
  video_url TEXT,
  content TEXT,
  estimated_duration INTEGER NOT NULL, -- minutes
  is_mandatory BOOLEAN DEFAULT false,
  prerequisite_ids UUID[],
  assigned_to TEXT[] DEFAULT ARRAY['all'],
  version INTEGER DEFAULT 1,
  tags TEXT[],
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  material_id UUID REFERENCES training_materials(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  last_accessed_at TIMESTAMP,
  test_score INTEGER,
  test_attempts INTEGER DEFAULT 0,
  passed BOOLEAN DEFAULT false,
  UNIQUE(user_id, material_id)
);

-- ===================================
-- 5. TESTS & ASSESSMENTS TABLES
-- ===================================

CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  material_id UUID REFERENCES training_materials(id),
  time_limit INTEGER, -- minutes
  passing_score INTEGER NOT NULL DEFAULT 80,
  max_attempts INTEGER DEFAULT 3,
  randomize_questions BOOLEAN DEFAULT false,
  show_correct_answers BOOLEAN DEFAULT true,
  is_mandatory BOOLEAN DEFAULT false,
  frequency VARCHAR(20) CHECK (frequency IN ('once', 'monthly', 'quarterly', 'yearly')),
  next_due TIMESTAMP,
  tags TEXT[],
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'open_ended', 'scenario')),
  question TEXT NOT NULL,
  options TEXT[], -- for multiple choice
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  points INTEGER DEFAULT 10,
  category VARCHAR(100),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID REFERENCES tests(id) ON DELETE CASCADE,
  user_id VARCHAR(100) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration INTEGER, -- seconds
  score INTEGER,
  passed BOOLEAN DEFAULT false,
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS test_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES test_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES test_questions(id) ON DELETE CASCADE,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===================================
-- 6. AI AUTOMATION RULES
-- ===================================

CREATE TABLE IF NOT EXISTS ai_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_conditions JSONB,
  min_call_samples INTEGER DEFAULT 5,
  min_confidence DECIMAL(3,2) DEFAULT 0.85,
  requires_review BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  last_run TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_rule_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES ai_automation_rules(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  target VARCHAR(255) NOT NULL,
  parameters JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_rule_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES ai_automation_rules(id) ON DELETE CASCADE,
  executed_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'partial')),
  items_processed INTEGER DEFAULT 0,
  suggestions_created INTEGER DEFAULT 0,
  error_message TEXT
);

-- ===================================
-- INDEXES FOR PERFORMANCE
-- ===================================

CREATE INDEX idx_journey_stages_journey ON journey_stages(journey_id);
CREATE INDEX idx_touchpoints_stage ON journey_touchpoints(stage_id);
CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_material ON user_progress(material_id);
CREATE INDEX idx_test_attempts_user ON test_attempts(user_id);
CREATE INDEX idx_test_attempts_test ON test_attempts(test_id);
CREATE INDEX idx_firefly_status ON firefly_recordings(status);
CREATE INDEX idx_ai_updates_status ON ai_script_updates(status);
CREATE INDEX idx_materials_category ON training_materials(category);
CREATE INDEX idx_materials_mandatory ON training_materials(is_mandatory);

-- ===================================
-- INITIAL DATA - German Customer Journey
-- ===================================

INSERT INTO customer_journeys (name, version, description, created_by) VALUES
('AntragPlus Customer Journey', '2.0', 'Vollständige deutsche Sales-Journey von Aufmerksamkeit bis Kundenbindung', 'System')
ON CONFLICT DO NOTHING;

-- Get the journey ID for inserting stages
DO $$
DECLARE
  journey_uuid UUID;
BEGIN
  SELECT id INTO journey_uuid FROM customer_journeys WHERE name = 'AntragPlus Customer Journey' LIMIT 1;
  
  IF journey_uuid IS NOT NULL THEN
    -- Insert 7 stages
    INSERT INTO journey_stages (journey_id, stage_number, name, ziel, owner, schwachpunkt, prioritat, color, progress) VALUES
    (journey_uuid, 1, 'Aufmerksamkeit & Interesse', 
     'Gemeinnützige Organisationen verstehen den Nutzen von AntragPlus und zeigen konkretes Interesse',
     'Marketing / Growth',
     'Förderlandschaft wird nicht verstanden, Nutzen bleibt abstrakt',
     'Mehr Bildung statt Werbung – Case Studies, interaktive Förderfinder-Tools, klare Nutzenkommunikation',
     'bg-blue-500', 85),
     
    (journey_uuid, 2, 'Erstkontakt & Qualifizierung',
     'Persönliche Verbindung aufbauen, Vertrauen gewinnen, Termin sichern',
     'Sales-Team',
     'Nach Demo fehlt strukturierter Follow-Up-Prozess',
     'Automatisierte E-Mail-Sequenzen, Reminder im CRM, Demo-Storyline mit konkretem Mehrwert',
     'bg-indigo-500', 72),
     
    (journey_uuid, 3, 'Onboarding & Vorbereitung',
     'Kunde startet Antrag, alle Unterlagen vollständig',
     'Customer Success / Projektbegleitung',
     'Unklare Anforderungen, viele Rückfragen',
     'Interaktive Schritt-für-Schritt-Guides, Standard-Checklisten, Vorbefüllung von Feldern durch KI',
     'bg-purple-500', 68),
     
    (journey_uuid, 4, 'Antragseinreichung & Review',
     'Antrag fehlerfrei eingereicht und bestätigt',
     'Account Manager',
     'Unsicherheit über Erfolgschancen',
     'Sichtbare Erfolgsindikatoren, Gamification-Elemente, Fortschritts-Leiste',
     'bg-pink-500', 90),
     
    (journey_uuid, 5, 'Förderzusage & Kommunikation',
     'Bewilligung erreicht, klare Kommunikation zu nächsten Schritten',
     'Account Manager',
     'Erwartungsmanagement, Unsicherheit bei Nachweispflichten',
     'Post-Win-Check-in-Call, automatische Projekt-Kick-Off-E-Mail, Übersicht "Was jetzt?"',
     'bg-green-500', 82),
     
    (journey_uuid, 6, 'Projektmanagement & Nachweisführung',
     'Projekt erfolgreich umsetzen, Fristen und Pflichten einhalten',
     'Projektleitung (intern/extern)',
     'Fehlendes Verständnis der Förderlogik und Fristen',
     'Mini-Tutorials in der Plattform, automatische Erinnerungen, Templates für Verwendungsnachweise',
     'bg-teal-500', 65),
     
    (journey_uuid, 7, 'Bindung & Ausbau',
     'Kund:innen behalten und neue Förderprojekte gemeinsam anstoßen',
     'Key Account Manager',
     'Nach Projektende kein Kontakt, kein Storytelling über Erfolge',
     'Kundenstories sichtbar machen, Empfehlungsprogramme, Veranstaltungen für Bestandskunden',
     'bg-cyan-500', 58)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ===================================
-- INITIAL AI RULES
-- ===================================

INSERT INTO ai_automation_rules (name, description, enabled, trigger_type, trigger_conditions, min_call_samples, min_confidence, requires_review) VALUES
('Auto-Update Scripts from Top Performing Calls', 
 'Analyze winning calls and update scripts with successful techniques',
 true, 'weekly_analysis', 
 '{"minWinRate": 70, "dealStages": ["won"]}',
 5, 0.85, true),
 
('Email Template Optimization',
 'Update email templates based on high-performing emails',
 true, 'performance_drop',
 '{"minOpenRate": 30, "minResponseRate": 15}',
 10, 0.80, true),
 
('Firefly Call Analysis',
 'Automatically process new Firefly recordings for insights',
 true, 'new_firefly_call',
 '{"dealStages": ["proposal", "negotiation", "won"]}',
 1, 0.75, true)
ON CONFLICT DO NOTHING;

