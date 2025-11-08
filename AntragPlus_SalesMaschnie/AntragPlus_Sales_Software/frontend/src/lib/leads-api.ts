/**
 * Leads API Client
 * Frontend API client for lead management
 */

export interface Lead {
  id: string
  companyName: string
  website: string | null
  industry: string | null
  tätigkeitsfeld: string | null
  status: 'pending' | 'enriched' | 'failed'
  confidence: number
  email: string | null
  phone: string | null
  address: string | null
  linkedIn: string | null
  enrichmentDate: string | null
  updatedAt: string
  pipedriveOrgId: number | null
  notes: string | null
}

export interface LeadStats {
  total: number
  enriched: number
  pending: number
  failed: number
  avgConfidence: number
  costEstimate: number
}

export interface LeadsResponse {
  leads: Lead[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  stats: LeadStats
}

export interface LeadDetail extends Lead {
  legalForm?: string
  foundedYear?: number
  employees?: string
  revenue?: string | null
  leadership?: Array<{
    name: string
    role: string
    email: string | null
    phone: string | null
  }>
  tags?: string[]
  enrichmentHistory?: Array<{
    date: string
    fields: string[]
    confidence: number
  }>
}

class LeadsAPI {
  private baseUrl = '/api/leads'

  async getLeads(params?: {
    status?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<LeadsResponse> {
    const queryParams = new URLSearchParams()
    if (params?.status) queryParams.append('status', params.status)
    if (params?.search) queryParams.append('search', params.search)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const response = await fetch(`${this.baseUrl}?${queryParams}`)
    if (!response.ok) {
      throw new Error('Failed to fetch leads')
    }
    return response.json()
  }

  async getLead(id: string): Promise<{ lead: LeadDetail }> {
    const response = await fetch(`${this.baseUrl}/${id}`)
    if (!response.ok) {
      throw new Error('Failed to fetch lead')
    }
    return response.json()
  }

  async createLead(data: { companyName: string; website?: string }): Promise<{ success: boolean; lead: Lead }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create lead')
    }
    return response.json()
  }

  async updateLead(id: string, data: Partial<Lead>): Promise<{ success: boolean; lead: Lead }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to update lead')
    }
    return response.json()
  }

  async deleteLead(id: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error('Failed to delete lead')
    }
    return response.json()
  }

  async uploadCSV(file: File): Promise<{ success: boolean; imported: number; leads: Lead[]; message: string }> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${this.baseUrl}/upload`, {
      method: 'POST',
      body: formData,
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload CSV')
    }
    return response.json()
  }

  async enrichLeads(leadIds: string[]): Promise<{ success: boolean; message: string; jobId: string }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'enrich', leadIds }),
    })
    if (!response.ok) {
      throw new Error('Failed to start enrichment')
    }
    return response.json()
  }

  async exportLeads(status?: string): Promise<Blob> {
    const queryParams = new URLSearchParams()
    if (status) queryParams.append('status', status)

    const response = await fetch(`${this.baseUrl}/export?${queryParams}`)
    if (!response.ok) {
      throw new Error('Failed to export leads')
    }
    return response.blob()
  }

  async approveLead(leadId: string, editedFields?: any, notes?: string): Promise<{ success: boolean; contactId?: number; dealId?: number; message: string }> {
    const response = await fetch(`${this.baseUrl}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: parseInt(leadId), editedFields, notes }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to approve lead')
    }
    return response.json()
  }

  async batchApproveLead(leadIds: string[]): Promise<{ success: boolean; successful: number; failed: number; message: string }> {
    const response = await fetch(`${this.baseUrl}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds: leadIds.map(id => parseInt(id)) }),
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to batch approve leads')
    }
    return response.json()
  }

  async rejectLead(leadId: string, reason?: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/${leadId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    if (!response.ok) {
      throw new Error('Failed to reject lead')
    }
    return response.json()
  }
}

export const leadsApi = new LeadsAPI()

