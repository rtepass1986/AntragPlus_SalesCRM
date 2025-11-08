/**
 * Call Recording Analysis Types
 * Based on Jordan Belfort's Straight Line Persuasion System
 */

export type CallRecordingSource = 'firefly' | 'google_drive' | 'manual_upload';

export type CallType = 
  | 'discovery'
  | 'demo'
  | 'closing'
  | 'follow_up'
  | 'objection_handling'
  | 'qualification';

export type ProcessingStatus = 
  | 'pending'
  | 'transcribing'
  | 'analyzing'
  | 'completed'
  | 'error';

export type ObjectionCategory = 
  | 'price'
  | 'timing'
  | 'authority'
  | 'need'
  | 'trust'
  | 'competition';

export type ClosingTechnique =
  | 'alternative_choice'
  | 'assumptive'
  | 'urgency'
  | 'takeaway'
  | 'summary'
  | 'direct_ask';

export type ScriptSection =
  | 'opening'
  | 'rapport'
  | 'discovery'
  | 'presentation'
  | 'objections'
  | 'close';

export interface CallRecording {
  id: number;
  recordingId: string;
  
  // Source
  source: CallRecordingSource;
  sourceUrl?: string;
  googleDriveId?: string;
  fireflyMeetingId?: string;
  
  // Call Details
  callDate: Date;
  durationSeconds?: number;
  callType?: CallType;
  
  // Participants
  salesRepId?: number;
  salesRepName?: string;
  prospectName?: string;
  prospectCompany?: string;
  
  // CRM Integration
  pipedriveDealId?: number;
  pipedrivePersonId?: number;
  pipedriveOrgId?: number;
  
  // Recording Files
  audioUrl?: string;
  videoUrl?: string;
  transcriptUrl?: string;
  
  // Processing Status
  processingStatus: ProcessingStatus;
  transcriptGenerated: boolean;
  analysisCompleted: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  analyzedAt?: Date;
}

export interface SpeakerSegment {
  speaker: string; // 'sales_rep' | 'prospect' | 'unknown'
  startTime: number; // seconds
  endTime: number; // seconds
  duration: number; // seconds
  text: string;
  sentiment?: number; // -1 to 1
  confidence?: number; // 0 to 1
}

export interface CallTranscript {
  id: number;
  recordingId: number;
  
  // Transcript Data
  fullTranscript: string;
  transcriptJson?: {
    segments: SpeakerSegment[];
    metadata?: Record<string, any>;
  };
  
  // Speaker Segmentation
  speakerSegments?: SpeakerSegment[];
  
  // Key Moments (timestamps in seconds)
  openingTimestamp?: number;
  discoveryTimestamp?: number;
  presentationTimestamp?: number;
  objectionTimestamps?: number[];
  closingTimestamp?: number;
  
  // Statistics
  wordCount?: number;
  salesRepTalkTimeSeconds?: number;
  prospectTalkTimeSeconds?: number;
  talkRatio?: number; // sales_rep / prospect
  
  createdAt: Date;
}

export interface ObjectionEncountered {
  timestamp: number; // seconds into call
  objectionType: ObjectionCategory;
  objectionText: string;
  response?: string;
  responseQuality?: number; // 1-10
  wasResolved: boolean;
}

/**
 * Jordan Belfort's Straight Line Analysis
 * Core framework for sales call evaluation
 */
export interface StraightLineAnalysis {
  id: number;
  recordingId: number;
  
  // THE THREE TENS - Core of Straight Line System
  // Buyer needs all three at 10 to buy
  certaintyProduct: number; // 1-10: Certainty about the product/service
  certaintyS alesperson: number; // 1-10: Trust in the salesperson
  certaintyCompany: number; // 1-10: Trust in the company
  
  // TONALITY ANALYSIS
  // "It's not what you say, it's how you say it"
  tonalityScore: number; // 1-10: Overall tonality effectiveness
  tonalityConfidence: number; // 1-10: Confidence in voice
  tonalityEnthusiasm: number; // 1-10: Enthusiasm level
  tonalityAuthenticity: number; // 1-10: Authenticity/genuineness
  
  // SCRIPT ADHERENCE
  scriptAdherenceScore: number; // 1-10: How well script was followed
  scriptType?: string; // Which script was used
  scriptSectionsCompleted: {
    opening: boolean;
    rapport: boolean;
    discovery: boolean;
    presentation: boolean;
    objections: boolean;
    close: boolean;
  };
  
  // RAPPORT BUILDING
  rapportScore: number; // 1-10: Quality of rapport building
  mirroringDetected: boolean; // Did rep mirror prospect's language/style
  activeListeningScore: number; // 1-10: Quality of active listening
  
  // DISCOVERY PHASE
  discoveryQuestionsAsked: number;
  discoveryQualityScore: number; // 1-10
  painPointsIdentified: string[]; // Identified pain points
  
  // PRESENTATION PHASE
  presentationClarityScore: number; // 1-10
  benefitsVsFeaturesRatio: number; // Should be > 1 (more benefits than features)
  valuePropositionStrength: number; // 1-10
  
  // OBJECTION HANDLING
  objectionsEncountered: ObjectionEncountered[];
  objectionsHandledCount: number;
  objectionHandlingScore: number; // 1-10
  
  // CLOSING
  closingAttempts: number;
  closingTechnique?: ClosingTechnique;
  closingSuccess: boolean;
  
  // OVERALL SCORES
  overallStraightLineScore: number; // 1-10: Overall performance
  conversionLikelihood: number; // 1-10: Likelihood of conversion
  
  // AI ANALYSIS
  aiSummary: string;
  strengths: string[]; // Strengths identified
  areasForImprovement: string[]; // Areas to improve
  keyQuotes: {
    timestamp: number;
    speaker: string;
    quote: string;
    significance: string;
  }[];
  
  // COACHING RECOMMENDATIONS
  coachingPoints: {
    area: string;
    observation: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  recommendedTraining: string[];
  
  createdAt: Date;
  analyzedBy: string; // 'ai' or user ID
  aiModelVersion?: string;
}

export interface CallScript {
  id: number;
  scriptName: string;
  scriptType: CallType;
  
  // Script Content
  scriptContent: string;
  scriptStructure: {
    sections: CallScriptSection[];
  };
  
  // Script Metadata
  industry?: string;
  productType?: string;
  targetDealSize?: 'small' | 'medium' | 'large' | 'enterprise';
  
  // Performance Tracking
  timesUsed: number;
  averageScore?: number;
  conversionRate?: number;
  
  // Status
  isActive: boolean;
  version?: string;
  
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
}

export interface CallScriptSection {
  id: number;
  scriptId: number;
  
  sectionOrder: number;
  sectionName: ScriptSection;
  sectionContent: string;
  
  // Expected Outcomes
  expectedDurationSeconds?: number;
  keyPoints: string[];
  
  // Evaluation Criteria
  evaluationCriteria: {
    criterion: string;
    weight: number; // 0-1
  }[];
  
  createdAt: Date;
}

export interface ObjectionLibraryItem {
  id: number;
  objectionType: ObjectionCategory;
  objectionText: string;
  
  // Recommended Responses
  recommendedResponses: {
    response: string;
    technique: string;
    effectiveness: number; // 1-10
  }[];
  straightLineResponse: string; // Jordan Belfort's recommended approach
  
  // Frequency & Success
  timesEncountered: number;
  timesSuccessfullyHandled: number;
  successRate: number; // 0-100
  
  // Categorization
  objectionCategory: ObjectionCategory;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  
  createdAt: Date;
  updatedAt: Date;
}

export interface CallAnalytics {
  id: number;
  salesRepId: number;
  
  // Time Period
  periodStart: Date;
  periodEnd: Date;
  
  // Call Metrics
  totalCalls: number;
  totalCallDurationSeconds: number;
  averageCallDurationSeconds: number;
  
  // Straight Line Scores (Averages)
  avgCertaintyProduct: number;
  avgCertaintySalesperson: number;
  avgCertaintyCompany: number;
  avgTonalityScore: number;
  avgScriptAdherence: number;
  avgOverallScore: number;
  
  // Performance
  conversionRate: number;
  callsToCloseRatio: number;
  
  // Top Strengths & Weaknesses
  topStrengths: string[];
  topWeaknesses: string[];
  
  createdAt: Date;
}

export interface CoachingSession {
  id: number;
  salesRepId: number;
  coachId?: number;
  
  // Session Details
  sessionDate: Date;
  sessionDurationMinutes?: number;
  
  // Recordings Reviewed
  recordingsReviewed: number[]; // Recording IDs
  
  // Focus Areas
  focusAreas: {
    area: string;
    currentScore: number;
    targetScore: number;
    progress: string;
  }[];
  
  actionItems: {
    item: string;
    dueDate?: Date;
    completed: boolean;
  }[];
  
  // Progress Tracking
  previousScores: Record<string, number>;
  targetScores: Record<string, number>;
  
  // Notes
  coachNotes?: string;
  repNotes?: string;
  
  // Follow-up
  nextSessionDate?: Date;
  
  createdAt: Date;
}

/**
 * Jordan Belfort's Straight Line Evaluation Criteria
 */
export interface StraightLineEvaluationCriteria {
  // The Three Tens
  threeT ens: {
    certaintyProduct: {
      weight: number;
      indicators: string[];
      keywords: string[];
    };
    certaintySalesperson: {
      weight: number;
      indicators: string[];
      keywords: string[];
    };
    certaintyCompany: {
      weight: number;
      indicators: string[];
      keywords: string[];
    };
  };
  
  // Tonality Markers
  tonality: {
    confidence: {
      indicators: string[];
      negativeIndicators: string[];
    };
    enthusiasm: {
      indicators: string[];
      negativeIndicators: string[];
    };
    authenticity: {
      indicators: string[];
      negativeIndicators: string[];
    };
  };
  
  // Script Structure
  scriptFlow: {
    opening: {
      duration: number; // seconds
      keyElements: string[];
    };
    rapport: {
      duration: number;
      keyElements: string[];
    };
    discovery: {
      duration: number;
      keyElements: string[];
      minQuestions: number;
    };
    presentation: {
      duration: number;
      keyElements: string[];
    };
    objections: {
      techniques: string[];
    };
    close: {
      techniques: ClosingTechnique[];
      minAttempts: number;
    };
  };
}

/**
 * Firefly.ai Integration Types
 */
export interface FireflyWebhookPayload {
  event_type: 'transcript_ready' | 'meeting_ended';
  meeting_id: string;
  meeting_title: string;
  meeting_date: string;
  duration_seconds: number;
  participants: {
    name: string;
    email?: string;
    type: 'host' | 'participant';
  }[];
  transcript_url?: string;
  audio_url?: string;
  video_url?: string;
  summary?: string;
}

/**
 * Google Drive Integration Types
 */
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  webViewLink: string;
  webContentLink: string;
  owners: {
    emailAddress: string;
    displayName: string;
  }[];
}

