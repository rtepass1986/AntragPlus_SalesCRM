/**
 * CRM Type Definitions
 * Complete TypeScript types for the CRM system
 */

// ===================================
// ENUMS & CONSTANTS
// ===================================

export const PIPELINE_STAGES = [
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const

export type PipelineStage = typeof PIPELINE_STAGES[number]

export const DEAL_STATUS = ['open', 'won', 'lost'] as const
export type DealStatus = typeof DEAL_STATUS[number]

export const ACTIVITY_TYPES = ['call', 'meeting', 'task', 'email', 'note'] as const
export type ActivityType = typeof ACTIVITY_TYPES[number]

export const ACTIVITY_STATUS = ['pending', 'completed', 'cancelled'] as const
export type ActivityStatus = typeof ACTIVITY_STATUS[number]

export const PRIORITY_LEVELS = ['low', 'medium', 'high', 'urgent'] as const
export type PriorityLevel = typeof PRIORITY_LEVELS[number]

// ===================================
// CONTACT TYPES
// ===================================

export interface Contact {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string | null
  phone: string | null
  mobile: string | null
  title: string | null // Job title
  organizationId: string | null
  organizationName?: string
  
  // Social
  linkedinUrl: string | null
  twitterHandle: string | null
  
  // Additional
  photoUrl: string | null
  tags: string[]
  customFields: Record<string, any>
  
  // Ownership
  ownerId: string
  ownerName?: string
  
  // Metadata
  createdAt: string
  updatedAt: string
  lastContactedAt: string | null
}

export interface ContactFormData {
  firstName: string
  lastName: string
  email?: string
  phone?: string
  mobile?: string
  title?: string
  organizationId?: string
  linkedinUrl?: string
  twitterHandle?: string
  tags?: string[]
}

// ===================================
// ORGANIZATION TYPES
// ===================================

export interface Organization {
  id: string
  name: string
  website: string | null
  industry: string | null
  size: string | null // 'small' | 'medium' | 'large'
  revenue: number | null
  
  // Contact Info
  email: string | null
  phone: string | null
  
  // Address
  address: {
    street: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    country: string | null
  }
  
  // Relationships
  parentOrganizationId: string | null
  contactCount: number
  dealCount: number
  
  // Additional
  tags: string[]
  customFields: Record<string, any>
  
  // Ownership
  ownerId: string
  ownerName?: string
  
  // Metadata
  createdAt: string
  updatedAt: string
}

// ===================================
// DEAL TYPES
// ===================================

export interface Deal {
  id: string
  title: string
  value: number
  currency: string
  
  // Stage & Status
  stage: PipelineStage
  status: DealStatus
  probability: number // 0-100
  
  // Associations
  organizationId: string | null
  organizationName?: string
  contactId: string | null
  contactName?: string
  
  // Timeline
  expectedCloseDate: string | null
  actualCloseDate: string | null
  createdAt: string
  updatedAt: string
  
  // Ownership
  ownerId: string
  ownerName?: string
  
  // Additional Details
  description: string | null
  source: string | null // 'website' | 'referral' | 'cold_call' etc.
  lostReason: string | null
  tags: string[]
  customFields: Record<string, any>
  
  // Metrics
  activitiesCount: number
  emailsCount: number
  filesCount: number
  
  // Visual
  color?: string
}

export interface DealFormData {
  title: string
  value: number
  currency?: string
  stage?: PipelineStage
  probability?: number
  organizationId?: string
  contactId?: string
  expectedCloseDate?: string
  description?: string
  source?: string
  tags?: string[]
}

// ===================================
// ACTIVITY TYPES
// ===================================

export interface Activity {
  id: string
  type: ActivityType
  subject: string
  description: string | null
  
  // Status & Priority
  status: ActivityStatus
  priority: PriorityLevel
  
  // Timeline
  dueDate: string | null
  dueTime: string | null
  completedAt: string | null
  duration: number | null // in minutes
  
  // Associations
  dealId: string | null
  dealTitle?: string
  contactId: string | null
  contactName?: string
  organizationId: string | null
  organizationName?: string
  
  // Ownership
  ownerId: string
  ownerName?: string
  assignedToId: string | null
  assignedToName?: string
  
  // Additional
  location: string | null
  attendees: string[]
  outcome: string | null
  
  // Metadata
  createdAt: string
  updatedAt: string
}

export interface ActivityFormData {
  type: ActivityType
  subject: string
  description?: string
  status?: ActivityStatus
  priority?: PriorityLevel
  dueDate?: string
  dueTime?: string
  duration?: number
  dealId?: string
  contactId?: string
  organizationId?: string
  assignedToId?: string
  location?: string
  outcome?: string
}

// ===================================
// PIPELINE TYPES
// ===================================

export interface Pipeline {
  id: string
  name: string
  stages: PipelineStageConfig[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

export interface PipelineStageConfig {
  id: string
  name: string
  key: PipelineStage
  probability: number
  color: string
  order: number
  rottenDays: number | null // Days before deal is considered "rotten"
}

// ===================================
// FILTER & SEARCH TYPES
// ===================================

export interface DealFilters {
  stage?: PipelineStage[]
  status?: DealStatus[]
  ownerId?: string[]
  organizationId?: string
  minValue?: number
  maxValue?: number
  dateRange?: {
    from: string
    to: string
  }
  search?: string
}

export interface ContactFilters {
  organizationId?: string
  ownerId?: string[]
  tags?: string[]
  search?: string
}

export interface ActivityFilters {
  type?: ActivityType[]
  status?: ActivityStatus[]
  priority?: PriorityLevel[]
  assignedToId?: string[]
  dealId?: string
  contactId?: string
  dateRange?: {
    from: string
    to: string
  }
  overdue?: boolean
}

// ===================================
// STATS & ANALYTICS TYPES
// ===================================

export interface PipelineStats {
  totalDeals: number
  totalValue: number
  averageDealValue: number
  averageProbability: number
  dealsByStage: Record<PipelineStage, number>
  valueByStage: Record<PipelineStage, number>
  conversionRates: Record<PipelineStage, number>
}

export interface DealMetrics {
  wonDeals: number
  lostDeals: number
  openDeals: number
  totalRevenue: number
  averageSalesCycle: number // days
  winRate: number // percentage
}

// ===================================
// UI STATE TYPES
// ===================================

export interface KanbanColumn {
  stage: PipelineStage
  name: string
  deals: Deal[]
  totalValue: number
  count: number
  color: string
}

// ===================================
// API RESPONSE TYPES
// ===================================

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    totalPages: number
    totalItems: number
  }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
  details?: any
}

