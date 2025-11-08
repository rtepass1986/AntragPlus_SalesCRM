/**
 * Pipedrive Service for CRM
 * Transforms Pipedrive data to CRM format
 */

import type { Deal, Contact, Organization } from '../types/crm-types'
import type { PipedriveDeal } from '../sync/mapping'

export class PipedriveService {
  private baseURL = 'https://api.pipedrive.com/v1'
  private apiToken: string

  constructor(apiToken: string) {
    this.apiToken = apiToken
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const url = new URL(`${this.baseURL}${endpoint}`)
    url.searchParams.append('api_token', this.apiToken)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value))
      }
    })

    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Pipedrive API error: ${response.status}`)
    }

    const data = await response.json()
    return data
  }

  /**
   * Get all deals from Pipedrive
   */
  async getDeals(filters?: {
    stage_id?: number
    status?: 'open' | 'won' | 'lost' | 'all_not_deleted'
    limit?: number
  }): Promise<Deal[]> {
    const params = {
      status: filters?.status || 'all_not_deleted',
      limit: filters?.limit || 500,
      ...(filters?.stage_id && { stage_id: filters.stage_id }),
    }

    const response = await this.makeRequest('/deals', params)
    const pipedriveDeals = response.data || []

    return pipedriveDeals.map((pd: any) => this.transformDeal(pd))
  }

  /**
   * Get deals grouped by stage
   */
  async getDealsByStage(): Promise<Record<string, Deal[]>> {
    const deals = await this.getDeals({ status: 'open' })
    
    const grouped: Record<string, Deal[]> = {
      lead: [],
      qualified: [],
      proposal: [],
      negotiation: [],
      won: [],
      lost: [],
    }

    // Map Pipedrive stage IDs to our stage keys
    const stageMapping: Record<number, string> = {
      16: 'lead',          // 1.Follow Up Call
      18: 'qualified',     // 2.Follow Up
      9: 'proposal',       // 3.Send Proposal / Quote
      22: 'negotiation',   // 4.Contract Signing Process
      // Add more mappings based on your Pipedrive setup
    }

    deals.forEach(deal => {
      const stage = deal.stage || 'lead'
      if (grouped[stage]) {
        grouped[stage].push(deal)
      }
    })

    return grouped
  }

  /**
   * Get single deal
   */
  async getDeal(id: number): Promise<Deal> {
    const response = await this.makeRequest(`/deals/${id}`)
    return this.transformDeal(response.data)
  }

  /**
   * Update deal stage
   */
  async updateDealStage(id: number, stageId: number): Promise<Deal> {
    const url = new URL(`${this.baseURL}/deals/${id}`)
    url.searchParams.append('api_token', this.apiToken)

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId }),
    })

    if (!response.ok) {
      throw new Error(`Failed to update deal: ${response.status}`)
    }

    const data = await response.json() as any
    return this.transformDeal(data.data)
  }

  /**
   * Get all persons (contacts)
   */
  async getContacts(limit = 500): Promise<Contact[]> {
    const response = await this.makeRequest('/persons', { limit })
    const pipedrivePersons = response.data || []

    return pipedrivePersons.map((pp: any) => this.transformContact(pp))
  }

  /**
   * Get all organizations
   */
  async getOrganizations(limit = 500): Promise<Organization[]> {
    const response = await this.makeRequest('/organizations', { limit })
    const pipedriveOrgs = response.data || []

    return pipedriveOrgs.map((po: any) => this.transformOrganization(po))
  }

  /**
   * Transform Pipedrive deal to CRM Deal format
   */
  private transformDeal(pd: any): Deal {
    // Map Pipedrive stage IDs to our stage keys
    const stageMapping: Record<number, string> = {
      16: 'lead',
      18: 'qualified',
      9: 'proposal',
      22: 'negotiation',
      10: 'won',
      13: 'lost',
    }

    const stage = pd.stage_id ? (stageMapping[pd.stage_id] || 'lead') : 'lead'
    
    return {
      id: String(pd.id),
      title: pd.title || 'Untitled Deal',
      value: pd.value || 0,
      currency: pd.currency || 'EUR',
      
      stage: stage as any,
      status: pd.status === 'won' ? 'won' : pd.status === 'lost' ? 'lost' : 'open',
      probability: pd.probability || this.getDefaultProbability(stage),
      
      organizationId: pd.org_id ? String(pd.org_id) : null,
      organizationName: pd.org_name || null,
      contactId: pd.person_id ? String(pd.person_id) : null,
      contactName: pd.person_name || null,
      
      expectedCloseDate: pd.expected_close_date || null,
      actualCloseDate: pd.won_time || pd.lost_time || null,
      createdAt: pd.add_time || new Date().toISOString(),
      updatedAt: pd.update_time || new Date().toISOString(),
      
      ownerId: pd.user_id ? String(pd.user_id) : 'unknown',
      ownerName: pd.owner_name || null,
      
      description: pd.notes || null,
      source: null, // Not in default Pipedrive
      lostReason: pd.lost_reason || null,
      tags: [],
      customFields: {},
      
      activitiesCount: pd.activities_count || 0,
      emailsCount: pd.email_messages_count || 0,
      filesCount: pd.files_count || 0,
    }
  }

  /**
   * Transform Pipedrive person to CRM Contact
   */
  private transformContact(pp: any): Contact {
    return {
      id: String(pp.id),
      firstName: pp.first_name || '',
      lastName: pp.last_name || '',
      fullName: pp.name || '',
      email: pp.email?.[0]?.value || null,
      phone: pp.phone?.[0]?.value || null,
      mobile: null,
      title: null,
      organizationId: pp.org_id ? String(pp.org_id) : null,
      organizationName: pp.org_name || undefined,
      linkedinUrl: null,
      twitterHandle: null,
      photoUrl: pp.picture_url || null,
      tags: [],
      customFields: {},
      ownerId: pp.owner_id ? String(pp.owner_id) : 'unknown',
      ownerName: undefined,
      createdAt: pp.add_time || new Date().toISOString(),
      updatedAt: pp.update_time || new Date().toISOString(),
      lastContactedAt: pp.last_activity_date || null,
    }
  }

  /**
   * Transform Pipedrive organization to CRM Organization
   */
  private transformOrganization(po: any): Organization {
    return {
      id: String(po.id),
      name: po.name || 'Unnamed Organization',
      website: po.website || null,
      industry: null,
      size: null,
      revenue: null,
      email: null,
      phone: null,
      address: {
        street: po.address || null,
        city: null,
        state: null,
        postalCode: null,
        country: po.address_country || null,
      },
      parentOrganizationId: null,
      contactCount: po.people_count || 0,
      dealCount: po.open_deals_count || 0,
      tags: [],
      customFields: {},
      ownerId: po.owner_id ? String(po.owner_id) : 'unknown',
      ownerName: undefined,
      createdAt: po.add_time || new Date().toISOString(),
      updatedAt: po.update_time || new Date().toISOString(),
    }
  }

  /**
   * Get default probability based on stage
   */
  private getDefaultProbability(stage: string): number {
    const probabilities: Record<string, number> = {
      lead: 10,
      qualified: 30,
      proposal: 50,
      negotiation: 70,
      won: 100,
      lost: 0,
    }
    return probabilities[stage] || 20
  }
}

