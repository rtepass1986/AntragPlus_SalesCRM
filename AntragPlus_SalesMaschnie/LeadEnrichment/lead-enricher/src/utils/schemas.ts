// Data schemas for German nonprofit organizations

/**
 * German nonprofit leadership structure
 * Maps to common roles in e.V., gGmbH, Stiftung, etc.
 */

export interface LeadershipRole {
  name: string;
  role: GermanNonprofitRole;
  role_display: string; // "Vorstandsvorsitzende" or "1. Vorsitzende"
  email: string | null;
  phone: string | null;
  linkedin: string | null;
  
  // Authority level (1 = highest)
  authority_level: 1 | 2 | 3;
  can_sign_contracts: boolean;
  budget_authority: boolean;
  
  // Additional context
  tenure_start: string | null; // "2020" or "seit 2020"
  additional_roles: string[]; // e.g., ["Schatzmeister"]
  department: string | null; // "Geschäftsführung", "Vorstand"
  
  source_url: string; // Where we found this info
  confidence: number; // 0.0-1.0
}

export type GermanNonprofitRole =
  // HIGHEST AUTHORITY (e.V. structure)
  | "vorstandsvorsitzende" // 1. Vorsitzende/r - TOP decision maker
  | "stellv_vorsitzende" // 2. Vorsitzende/r - Deputy
  | "vorstand" // Board member
  | "schatzmeister" // Treasurer - controls budget
  | "schriftfuehrer" // Secretary
  
  // HIGHEST AUTHORITY (GmbH/gGmbH structure)
  | "geschaeftsfuehrer" // CEO/Managing Director - TOP decision maker
  | "kaufmaennische_geschaeftsfuehrung" // CFO
  | "technische_geschaeftsfuehrung" // CTO
  
  // OPERATIONAL LEADERSHIP
  | "geschaeftsleitung" // Management team
  | "bereichsleitung" // Department head
  | "abteilungsleitung" // Division head
  | "projektleitung" // Project manager
  
  // SPECIFIC FUNCTIONS (HIGH PRIORITY for software sales)
  | "it_leitung" // IT Director - SOFTWARE BUYER
  | "digitalisierung" // Digital transformation lead - SOFTWARE BUYER
  | "verwaltungsleitung" // Administration head - PROCESS OWNER
  | "finanzleitung" // Finance director - BUDGET HOLDER
  
  // GOVERNANCE
  | "aufsichtsrat" // Supervisory board
  | "kuratorium" // Board of trustees
  | "beirat" // Advisory council
  | "stiftungsrat" // Foundation council
  
  // OTHER
  | "fachberatung" // Specialist advisor
  | "koordination" // Coordinator
  | "other";

export interface OrganizationStructure {
  org_id: number;
  org_name: string;
  legal_form: LegalForm;
  
  // Leadership team
  leadership: LeadershipRole[];
  
  // Organizational metadata
  structure_type: "hierarchical" | "flat" | "matrix";
  decision_making_style: "consensus" | "top_down" | "democratic";
  
  // Contact strategy
  primary_decision_maker: LeadershipRole | null; // Who to contact FIRST
  budget_approvers: LeadershipRole[]; // Who approves purchases
  technical_evaluators: LeadershipRole[]; // Who evaluates software
  
  // Data quality
  last_verified: string;
  completeness_score: number; // 0-100
  source_urls: string[];
}

export type LegalForm =
  | "eingetragener_verein" // e.V. - most common
  | "ggmbh" // gGmbH - common for larger orgs
  | "gug" // gUG - small orgs
  | "stiftung" // Foundation
  | "ggmbh_co_kg" // Complex structure
  | "koerperschaft" // Public body
  | "gemeinnuetzige_ag" // AG (rare)
  | "other";

export interface ContactIntelligence {
  person: LeadershipRole;
  
  // Enrichment data
  reachability: {
    has_direct_email: boolean;
    has_direct_phone: boolean;
    has_linkedin: boolean;
    linkedin_activity: "active" | "passive" | "inactive";
  };
  
  // Sales intelligence
  buying_influence: "decision_maker" | "influencer" | "gatekeeper" | "user";
  priority_score: number; // 0-100
  
  // Engagement strategy
  recommended_channel: "email" | "phone" | "linkedin" | "event" | "referral";
  message_angle: string; // Personalized hook
  
  // Timing
  best_contact_time: string | null; // "Q1 2026" or "after grant approval"
  trigger_events: string[]; // "new_in_role", "budget_approved", etc.
}

// AI extraction result
export interface LeadershipExtractionResult {
  success: boolean;
  leadership: LeadershipRole[];
  org_structure: {
    legal_form: LegalForm | null;
    total_staff: number | null;
    has_professional_management: boolean; // gGmbH vs volunteer e.V.
  };
  confidence: number;
  extraction_method: "impressum" | "team_page" | "annual_report" | "ai_research";
  raw_data: string; // Original text extracted
}

// Prompt response schema
export interface AILeadershipResponse {
  legal_form: LegalForm | null;
  leadership_team: Array<{
    name: string;
    role: string; // Raw text from website
    role_normalized: GermanNonprofitRole;
    email: string | null;
    phone: string | null;
    department: string | null;
    authority_level: 1 | 2 | 3;
    can_sign_contracts: boolean;
  }>;
  organizational_notes: string; // Additional context
  confidence: number;
  gaps: string[]; // What info is missing
}
