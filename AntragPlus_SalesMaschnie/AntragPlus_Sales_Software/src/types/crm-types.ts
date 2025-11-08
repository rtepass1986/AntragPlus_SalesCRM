/**
 * CRM Types for Backend
 * Shared types between frontend and backend
 */

export type PipelineStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type DealStatus = 'open' | 'won' | 'lost'
export type ActivityType = 'call' | 'meeting' | 'task' | 'email' | 'note'

export interface Deal {
  id: string
  title: string
  value: number
  currency: string
  stage: PipelineStage
  status: DealStatus
  probability: number
  organizationId: string | null
  organizationName?: string
  contactId: string | null
  contactName?: string
  expectedCloseDate: string | null
  actualCloseDate: string | null
  createdAt: string
  updatedAt: string
  ownerId: string
  ownerName?: string
  description: string | null
  source: string | null
  lostReason: string | null
  tags: string[]
  customFields: Record<string, any>
  activitiesCount: number
  emailsCount: number
  filesCount: number
  color?: string
}

export interface Contact {
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string | null
  phone: string | null
  mobile: string | null
  title: string | null
  organizationId: string | null
  organizationName?: string
  linkedinUrl: string | null
  twitterHandle: string | null
  photoUrl: string | null
  tags: string[]
  customFields: Record<string, any>
  ownerId: string
  ownerName?: string
  createdAt: string
  updatedAt: string
  lastContactedAt: string | null
}

export interface Organization {
  id: string
  name: string
  website: string | null
  industry: string | null
  size: string | null
  revenue: number | null
  email: string | null
  phone: string | null
  address: {
    street: string | null
    city: string | null
    state: string | null
    postalCode: string | null
    country: string | null
  }
  parentOrganizationId: string | null
  contactCount: number
  dealCount: number
  tags: string[]
  customFields: Record<string, any>
  ownerId: string
  ownerName?: string
  createdAt: string
  updatedAt: string
}

