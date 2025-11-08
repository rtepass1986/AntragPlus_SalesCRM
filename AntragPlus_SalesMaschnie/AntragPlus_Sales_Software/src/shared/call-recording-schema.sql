-- Call Recording Analysis System Database Schema
-- Based on Jordan Belfort's Straight Line Persuasion System

-- Call Recordings Table
CREATE TABLE IF NOT EXISTS call_recordings (
  id SERIAL PRIMARY KEY,
  recording_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Source
  source VARCHAR(50) NOT NULL, -- 'firefly', 'google_drive', 'manual_upload'
  source_url TEXT,
  google_drive_id VARCHAR(255),
  firefly_meeting_id VARCHAR(255),
  
  -- Call Details
  call_date TIMESTAMP NOT NULL,
  duration_seconds INTEGER,
  call_type VARCHAR(50), -- 'discovery', 'demo', 'closing', 'follow_up', 'objection_handling'
  
  -- Participants
  sales_rep_id INTEGER,
  sales_rep_name VARCHAR(255),
  prospect_name VARCHAR(255),
  prospect_company VARCHAR(255),
  
  -- CRM Integration
  pipedrive_deal_id INTEGER,
  pipedrive_person_id INTEGER,
  pipedrive_org_id INTEGER,
  
  -- Recording Files
  audio_url TEXT,
  video_url TEXT,
  transcript_url TEXT,
  
  -- Processing Status
  processing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'transcribing', 'analyzing', 'completed', 'error'
  transcript_generated BOOLEAN DEFAULT FALSE,
  analysis_completed BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  analyzed_at TIMESTAMP
);

-- Call Transcripts Table
CREATE TABLE IF NOT EXISTS call_transcripts (
  id SERIAL PRIMARY KEY,
  recording_id INTEGER REFERENCES call_recordings(id) ON DELETE CASCADE,
  
  -- Transcript Data
  full_transcript TEXT NOT NULL,
  transcript_json JSONB, -- Detailed transcript with timestamps and speaker labels
  
  -- Speaker Segmentation
  speaker_segments JSONB, -- Array of {speaker, start_time, end_time, text}
  
  -- Key Moments
  opening_timestamp INTEGER, -- seconds
  discovery_timestamp INTEGER,
  presentation_timestamp INTEGER,
  objection_timestamps INTEGER[], -- array of seconds
  closing_timestamp INTEGER,
  
  -- Statistics
  word_count INTEGER,
  sales_rep_talk_time_seconds INTEGER,
  prospect_talk_time_seconds INTEGER,
  talk_ratio DECIMAL(5,2), -- sales_rep / prospect ratio
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Straight Line Analysis Table (Jordan Belfort Framework)
CREATE TABLE IF NOT EXISTS straight_line_analysis (
  id SERIAL PRIMARY KEY,
  recording_id INTEGER REFERENCES call_recordings(id) ON DELETE CASCADE,
  
  -- THE THREE TENS (Core of Straight Line System)
  -- Scale of 1-10 for each
  certainty_product DECIMAL(3,1), -- Certainty about the product/service
  certainty_salesperson DECIMAL(3,1), -- Trust in the salesperson
  certainty_company DECIMAL(3,1), -- Trust in the company
  
  -- TONALITY ANALYSIS
  tonality_score DECIMAL(3,1), -- Overall tonality effectiveness (1-10)
  tonality_confidence DECIMAL(3,1), -- Confidence in voice
  tonality_enthusiasm DECIMAL(3,1), -- Enthusiasm level
  tonality_authenticity DECIMAL(3,1), -- Authenticity/genuineness
  
  -- SCRIPT ADHERENCE
  script_adherence_score DECIMAL(3,1), -- How well script was followed (1-10)
  script_type VARCHAR(100), -- Which script was used
  script_sections_completed JSONB, -- {opening: true, discovery: true, presentation: true, close: true}
  
  -- RAPPORT BUILDING
  rapport_score DECIMAL(3,1), -- Quality of rapport building (1-10)
  mirroring_detected BOOLEAN,
  active_listening_score DECIMAL(3,1),
  
  -- DISCOVERY PHASE
  discovery_questions_asked INTEGER,
  discovery_quality_score DECIMAL(3,1),
  pain_points_identified JSONB, -- Array of identified pain points
  
  -- PRESENTATION PHASE
  presentation_clarity_score DECIMAL(3,1),
  benefits_vs_features_ratio DECIMAL(5,2),
  value_proposition_strength DECIMAL(3,1),
  
  -- OBJECTION HANDLING
  objections_encountered JSONB, -- Array of {objection, response, effectiveness}
  objections_handled_count INTEGER,
  objection_handling_score DECIMAL(3,1),
  
  -- CLOSING
  closing_attempts INTEGER,
  closing_technique VARCHAR(100), -- 'alternative_choice', 'assumptive', 'urgency', etc.
  closing_success BOOLEAN,
  
  -- OVERALL SCORES
  overall_straight_line_score DECIMAL(3,1), -- Overall performance (1-10)
  conversion_likelihood DECIMAL(3,1), -- Likelihood of conversion (1-10)
  
  -- AI ANALYSIS
  ai_summary TEXT,
  strengths JSONB, -- Array of strengths identified
  areas_for_improvement JSONB, -- Array of improvement areas
  key_quotes JSONB, -- Notable quotes from the call
  
  -- COACHING RECOMMENDATIONS
  coaching_points JSONB, -- Specific coaching recommendations
  recommended_training JSONB, -- Training modules to recommend
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  analyzed_by VARCHAR(50) DEFAULT 'ai', -- 'ai' or user_id for manual review
  ai_model_version VARCHAR(50)
);

-- Call Scripts Table
CREATE TABLE IF NOT EXISTS call_scripts (
  id SERIAL PRIMARY KEY,
  script_name VARCHAR(255) NOT NULL,
  script_type VARCHAR(50) NOT NULL, -- 'discovery', 'demo', 'closing', 'objection_handling'
  
  -- Script Content
  script_content TEXT NOT NULL,
  script_structure JSONB, -- Structured sections of the script
  
  -- Script Metadata
  industry VARCHAR(100),
  product_type VARCHAR(100),
  target_deal_size VARCHAR(50), -- 'small', 'medium', 'large', 'enterprise'
  
  -- Performance Tracking
  times_used INTEGER DEFAULT 0,
  average_score DECIMAL(3,1),
  conversion_rate DECIMAL(5,2),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  version VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

-- Call Script Sections (for detailed script breakdown)
CREATE TABLE IF NOT EXISTS call_script_sections (
  id SERIAL PRIMARY KEY,
  script_id INTEGER REFERENCES call_scripts(id) ON DELETE CASCADE,
  
  section_order INTEGER NOT NULL,
  section_name VARCHAR(100) NOT NULL, -- 'opening', 'rapport', 'discovery', 'presentation', 'objections', 'close'
  section_content TEXT NOT NULL,
  
  -- Expected Outcomes
  expected_duration_seconds INTEGER,
  key_points JSONB, -- Array of key points to cover
  
  -- Evaluation Criteria
  evaluation_criteria JSONB, -- How to evaluate this section
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Objections Library
CREATE TABLE IF NOT EXISTS objections_library (
  id SERIAL PRIMARY KEY,
  objection_type VARCHAR(100) NOT NULL,
  objection_text TEXT NOT NULL,
  
  -- Recommended Responses
  recommended_responses JSONB, -- Array of response strategies
  straight_line_response TEXT, -- Jordan Belfort's recommended approach
  
  -- Frequency & Success
  times_encountered INTEGER DEFAULT 0,
  times_successfully_handled INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2),
  
  -- Categorization
  objection_category VARCHAR(50), -- 'price', 'timing', 'authority', 'need', 'trust'
  difficulty_level VARCHAR(20), -- 'easy', 'medium', 'hard'
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Call Analytics Summary (for dashboard)
CREATE TABLE IF NOT EXISTS call_analytics (
  id SERIAL PRIMARY KEY,
  sales_rep_id INTEGER,
  
  -- Time Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Call Metrics
  total_calls INTEGER DEFAULT 0,
  total_call_duration_seconds INTEGER DEFAULT 0,
  average_call_duration_seconds INTEGER,
  
  -- Straight Line Scores (Averages)
  avg_certainty_product DECIMAL(3,1),
  avg_certainty_salesperson DECIMAL(3,1),
  avg_certainty_company DECIMAL(3,1),
  avg_tonality_score DECIMAL(3,1),
  avg_script_adherence DECIMAL(3,1),
  avg_overall_score DECIMAL(3,1),
  
  -- Performance
  conversion_rate DECIMAL(5,2),
  calls_to_close_ratio DECIMAL(5,2),
  
  -- Top Strengths & Weaknesses
  top_strengths JSONB,
  top_weaknesses JSONB,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coaching Sessions
CREATE TABLE IF NOT EXISTS coaching_sessions (
  id SERIAL PRIMARY KEY,
  sales_rep_id INTEGER NOT NULL,
  coach_id INTEGER,
  
  -- Session Details
  session_date TIMESTAMP NOT NULL,
  session_duration_minutes INTEGER,
  
  -- Recordings Reviewed
  recordings_reviewed INTEGER[] REFERENCES call_recordings(id),
  
  -- Focus Areas
  focus_areas JSONB, -- Areas discussed in coaching
  action_items JSONB, -- Specific action items
  
  -- Progress Tracking
  previous_scores JSONB,
  target_scores JSONB,
  
  -- Notes
  coach_notes TEXT,
  rep_notes TEXT,
  
  -- Follow-up
  next_session_date TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_call_recordings_date ON call_recordings(call_date);
CREATE INDEX IF NOT EXISTS idx_call_recordings_rep ON call_recordings(sales_rep_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_deal ON call_recordings(pipedrive_deal_id);
CREATE INDEX IF NOT EXISTS idx_call_recordings_status ON call_recordings(processing_status);
CREATE INDEX IF NOT EXISTS idx_straight_line_recording ON straight_line_analysis(recording_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_recording ON call_transcripts(recording_id);
CREATE INDEX IF NOT EXISTS idx_analytics_rep_period ON call_analytics(sales_rep_id, period_start, period_end);

