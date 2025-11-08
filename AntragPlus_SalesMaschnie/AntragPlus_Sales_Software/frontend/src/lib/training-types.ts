/**
 * Sales Training Module Types
 */

// ===================================
// CUSTOMER JOURNEY TYPES
// ===================================

export interface JourneyStage {
  id: string
  name: string
  description: string
  order: number
  touchpoints: Touchpoint[]
  goals: string[]
  kpis: KPI[]
  color: string
}

export interface Touchpoint {
  id: string
  name: string
  channel: 'email' | 'call' | 'meeting' | 'demo' | 'proposal' | 'other'
  description: string
  duration: string // e.g., "30 min"
  owner: string
  templates: string[] // IDs of related templates
  scripts: string[] // IDs of related scripts
}

export interface KPI {
  id: string
  metric: string
  target: number
  actual: number
  unit: string // '%', '€', 'days', etc.
}

export interface CustomerJourney {
  id: string
  name: string
  version: string
  stages: JourneyStage[]
  createdAt: string
  updatedAt: string
  updatedBy: string
  aiSuggestions?: AISuggestion[]
}

export interface AISuggestion {
  id: string
  type: 'optimize' | 'add_touchpoint' | 'remove_stage' | 'improve_messaging'
  stage: string
  suggestion: string
  reasoning: string
  confidence: number
  createdAt: string
  status: 'pending' | 'accepted' | 'rejected'
}

// ===================================
// SCRIPTS & TEMPLATES TYPES
// ===================================

export interface CallScript {
  id: string
  name: string
  category: 'discovery' | 'demo' | 'objection_handling' | 'closing' | 'follow_up'
  stage: string // Journey stage
  content: string // Markdown or structured format
  version: number
  
  // AI Updates from Firefly
  lastUpdated: string
  updatedBy: 'manual' | 'ai'
  fireflyCallIds: string[] // Calls this was based on
  aiConfidence: number
  
  // Metadata
  usage: number // Times used
  successRate: number // Win rate when this script was used
  avgCallDuration: number // Average duration
  
  tags: string[]
  createdAt: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  category: 'cold_outreach' | 'follow_up' | 'proposal' | 'closing' | 'nurture'
  stage: string
  content: string // HTML or markdown
  variables: string[] // e.g., ['{firstName}', '{companyName}']
  version: number
  
  // AI Updates
  lastUpdated: string
  updatedBy: 'manual' | 'ai'
  basedOnCalls: string[]
  aiConfidence: number
  
  // Performance
  usage: number
  openRate: number
  responseRate: number
  conversionRate: number
  
  tags: string[]
  createdAt: string
}

export interface FireflyRecording {
  id: string
  title: string
  date: string
  duration: number
  participants: string[]
  dealId?: string
  dealName?: string
  
  // Analysis
  transcript: string
  summary: string
  keyMoments: KeyMoment[]
  actionItems: string[]
  
  // Script Generation
  extractedScript?: string
  usedForTemplates: string[] // Template IDs updated from this call
  
  status: 'processing' | 'analyzed' | 'applied'
}

export interface KeyMoment {
  timestamp: number // seconds
  type: 'objection' | 'question' | 'win' | 'next_step' | 'insight'
  description: string
  quote: string
}

// ===================================
// TRAINING MATERIALS TYPES
// ===================================

export interface TrainingMaterial {
  id: string
  title: string
  type: 'video' | 'pdf' | 'article' | 'interactive' | 'quiz'
  category: 'product' | 'sales_process' | 'objection_handling' | 'tools' | 'compliance'
  description: string
  
  // Content
  fileUrl?: string
  content?: string
  videoUrl?: string
  estimatedDuration: number // minutes
  
  // Requirements
  mandatory: boolean
  prerequisite: string[] // Material IDs that must be completed first
  assignedTo: string[] // User IDs or 'all'
  
  // Tracking
  views: number
  completions: number
  avgScore?: number
  
  // Metadata
  createdBy: string
  createdAt: string
  updatedAt: string
  version: number
  tags: string[]
}

export interface UserProgress {
  userId: string
  userName: string
  materialId: string
  
  status: 'not_started' | 'in_progress' | 'completed'
  progress: number // 0-100
  
  startedAt: string | null
  completedAt: string | null
  lastAccessedAt: string | null
  
  // Quiz/Test
  testScore?: number
  testAttempts: number
  passed: boolean
}

// ===================================
// TESTS & ASSESSMENTS TYPES
// ===================================

export interface Test {
  id: string
  title: string
  description: string
  materialId?: string // Optional: linked to training material
  
  questions: TestQuestion[]
  
  // Settings
  timeLimit?: number // minutes
  passingScore: number // percentage
  maxAttempts: number
  randomizeQuestions: boolean
  showCorrectAnswers: boolean
  
  // Scheduling
  mandatory: boolean
  frequency?: 'once' | 'monthly' | 'quarterly' | 'yearly'
  nextDue?: string
  
  // Metadata
  createdBy: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

export interface TestQuestion {
  id: string
  type: 'multiple_choice' | 'true_false' | 'open_ended' | 'scenario'
  question: string
  options?: string[] // For multiple choice
  correctAnswer: string | string[]
  explanation?: string
  points: number
  category: string
}

export interface TestAttempt {
  id: string
  testId: string
  userId: string
  userName: string
  
  startedAt: string
  completedAt: string | null
  duration: number // seconds
  
  answers: Record<string, string> // questionId -> answer
  score: number
  passed: boolean
  
  feedback?: string
}

// ===================================
// AI PROCESSING TYPES
// ===================================

export interface AIScriptUpdate {
  id: string
  scriptId: string
  type: 'call_script' | 'email_template'
  
  // Source
  sourceType: 'firefly_recording' | 'mpr_file' | 'manual_upload'
  sourceId: string
  sourceName: string
  
  // Changes
  originalContent: string
  suggestedContent: string
  changes: Change[]
  
  // AI Analysis
  reasoning: string
  confidence: number
  basedOnCalls: number
  
  // Review
  status: 'pending_review' | 'approved' | 'rejected'
  reviewedBy?: string
  reviewedAt?: string
  
  createdAt: string
}

export interface Change {
  type: 'addition' | 'modification' | 'removal'
  section: string
  before: string
  after: string
  reason: string
}

export interface AIRule {
  id: string
  name: string
  description: string
  enabled: boolean
  
  // Trigger
  triggerType: 'new_firefly_call' | 'weekly_analysis' | 'manual' | 'performance_drop'
  triggerConditions: Record<string, any>
  
  // Actions
  actions: AIRuleAction[]
  
  // Settings
  minCallSamples: number
  minConfidence: number
  requiresReview: boolean
  
  createdAt: string
  lastRun?: string
}

export interface AIRuleAction {
  type: 'update_script' | 'update_template' | 'create_suggestion' | 'notify_manager'
  target: string
  parameters: Record<string, any>
}

