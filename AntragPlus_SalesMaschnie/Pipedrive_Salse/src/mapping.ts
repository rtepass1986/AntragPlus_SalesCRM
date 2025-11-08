export interface PipedriveDeal {
  id: number;
  title: string;
  value: number;
  currency: string;
  status: string;
  stage_id: number;
  person_id: number | any;
  person_name?: string;
  org_id: number | any;
  org_name?: string;
  owner_id: number;
  owner_name?: string;
  user_id?: any;
  notes?: string;
  add_time: string;
  update_time: string;
  close_time?: string;
  won_time?: string;
  lost_time?: string;
  probability?: number;
  custom_fields?: Record<string, any>;
}

export interface AsanaTask {
  gid: string;
  name: string;
  notes?: string;
  due_on?: string;
  start_on?: string;
  created_at?: string;
  completed: boolean;
  assignee?: {
    gid: string;
    name: string;
  };
  projects: Array<{
    gid: string;
    name: string;
  }>;
  memberships?: Array<{
    project: {
      gid: string;
      name?: string;
    };
    section: {
      gid: string;
      name?: string;
    };
  }>;
  custom_fields?: Array<{
    gid: string;
    name: string;
    value: string | number;
  }>;
}

export interface SyncMapping {
  pipedriveDealId: number;
  asanaTaskId: string;
  lastSyncTime: Date;
  syncDirection: 'pipedrive_to_asana' | 'asana_to_pipedrive' | 'bidirectional';
}

export interface FieldMapping {
  pipedriveField: string;
  asanaField: string;
  transform?: (value: any) => any;
}

export const FIELD_MAPPINGS: FieldMapping[] = [
  {
    pipedriveField: 'title',
    asanaField: 'name'
  },
  {
    pipedriveField: 'value',
    asanaField: 'custom_fields',
    transform: (value: number) => ({ value, field_type: 'number' })
  },
  {
    pipedriveField: 'status',
    asanaField: 'completed',
    transform: (status: string) => status === 'won'
  },
  {
    pipedriveField: 'close_time',
    asanaField: 'due_on',
    transform: (closeTime: string) => closeTime ? new Date(closeTime).toISOString().split('T')[0] : undefined
  }
];

// Your specific Asana project
export const ASANA_SALES_PROJECT_GID = '1211755205817009';

// Asana sections (columns) - matched by name to Pipedrive stages
export const ASANA_SECTIONS = {
  FOLLOW_UP_CALL: '1211768109183595',        // 1.Follow Up Call
  FOLLOW_UP_2: '1211755208914016',           // 2.Follow Up
  KONTAKT_HERGESTELLT: '1211767390872479',   // Kontakt hergestellt
  LINK_CALL: '1211755208914017',             // Link für Call geschickt
  ERSTBERATUNG: '1211755208914018',          // Erstberatung terminiert
  VERTRAGS_DRAFT: '1211767390872480',        // Vertrags Draft erhalten
  PROJEKTIDEEN: '1211755208914120',          // Projektideen sammeln & Skizze
  NUTZUNGSVERTRAG: '1211767390872475',       // Nutzungsvertrag geschickt
  BEAUFTRAGUNG: '1211767390872476',          // Beauftragung bestätigt
  PROJEKT_EINGEREICHT: '1211767390872477',   // Projekt eingereicht
  FOERDERANTRAG_GEWONNEN: '1211767390872478' // Förderantrag gewonnen
};

// Custom field GIDs for your Sales Pipeline project
export const ASANA_CUSTOM_FIELDS = {
  ESTIMATED_VALUE: '1211755208914023',
  LEAD_STATUS: '1211755208914025',
  PRIORITY: '1211755208914032',
  ACCOUNT_NAME: '1211755208914037',
  NEXT_STEPS: '1211755208914039',
  PIPEDRIVE_DEAL_ID: '1211767390872494',
  TIME_TO_COMPLETE: '1211847487904119'
};

// Lead status options
export const ASANA_LEAD_STATUS = {
  CONTACTED: '1211755208914026',
  QUALIFICATION: '1211755208914027',
  MEETING: '1211755208914028',
  PROPOSAL: '1211755208914029',
  CLOSED: '1211755208914030'
};

// Stages to sync (only these will be synced to Asana)
export const STAGES_TO_SYNC = [16]; // Only 1.Follow Up Call

// Map Pipedrive stage ID to Asana section GID (matching by stage name)
// Using direct GIDs from the actual Asana board sections
export const PIPEDRIVE_TO_ASANA_SECTION: Record<number, string> = {
  16: '1211768109183595',  // 1.Follow Up Call
  18: '1211755208914016',  // 2.Follow Up
  9: '1211768350635002',   // Kontakt hergestellt
  22: '1211755208914017',  // Link für Call geschickt
  10: '1211768350635003',  // Erstberatung terminiert
  13: '1211768350635004',  // Projektideen sammeln & Skizze
  15: '1211768350635005',  // Nutzungsvertrag geschickt
  11: '1211768350635008',  // Beauftragung bestätigt
  12: '1211768351158072'   // Projekt eingereicht
};

// Map Pipedrive stages to Asana lead status (for custom field)
export const PIPEDRIVE_STAGE_MAPPING: Record<string, string> = {
  // Stage 16: 1.Follow Up Call -> Contacted
  '16': ASANA_LEAD_STATUS.CONTACTED,
  
  // Stage 18: 2.Follow Up -> Contacted
  '18': ASANA_LEAD_STATUS.CONTACTED,
  
  // Stage 9: Kontakt hergestellt -> Qualification
  '9': ASANA_LEAD_STATUS.QUALIFICATION,
  
  // Stage 22: Link für Call geschickt -> Qualification
  '22': ASANA_LEAD_STATUS.QUALIFICATION,
  
  // Stage 10: Erstberatung terminiert -> Meeting
  '10': ASANA_LEAD_STATUS.MEETING,
  
  // Stage 13: Projektideen sammeln & Skizze -> Meeting
  '13': ASANA_LEAD_STATUS.MEETING,
  
  // Stage 15: Nutzungsvertrag geschickt -> Proposal
  '15': ASANA_LEAD_STATUS.PROPOSAL,
  
  // Stage 11: Beauftragung bestätigt -> Proposal
  '11': ASANA_LEAD_STATUS.PROPOSAL,
  
  // Stage 12: Projekt eingereicht -> Closed
  '12': ASANA_LEAD_STATUS.CLOSED
};

// All deals go to the same Sales Pipeline project
export const ASANA_PROJECT_MAPPING: Record<string, string> = {
  'Lead': 'Sales Pipeline ',
  'Qualified': 'Sales Pipeline ',
  'Proposal': 'Sales Pipeline ',
  'Negotiation': 'Sales Pipeline ',
  'Closed Won': 'Sales Pipeline ',
  'Closed Lost': 'Sales Pipeline '
};
