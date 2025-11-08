/**
 * CRM API Client
 * All API calls for the CRM module
 * Uses native fetch() for Next.js API routes
 */

import type {
  Deal,
  DealFormData,
  Contact,
  ContactFormData,
  Organization,
  Activity,
  ActivityFormData,
  Pipeline,
  PipelineStats,
  DealMetrics,
  DealFilters,
  ContactFilters,
  ActivityFilters,
  PaginatedResponse,
} from './crm-types'

// Helper function for API calls
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `API Error: ${response.status}`)
  }

  return response.json()
}

// ===================================
// DEALS API
// ===================================

export const dealsApi = {
  // Get all deals
  getAll: async (filters?: DealFilters) => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }
    return fetchAPI<Deal[]>(`/api/crm/deals?${queryParams}`)
  },

  // Get pipeline stages from Pipedrive
  getStages: async () => {
    return fetchAPI('/api/crm/deals/stages')
  },

  // Get deals by stage (for pipeline view) - returns array of stage objects with deals
  getByStage: async () => {
    return fetchAPI('/api/crm/deals/by-stage')
  },

  // Get single deal
  getById: async (id: string) => {
    return fetchAPI<Deal>(`/api/crm/deals/${id}`)
  },

  // Create deal
  create: async (data: DealFormData) => {
    return fetchAPI<Deal>('/api/crm/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update deal
  update: async (id: string, data: Partial<DealFormData>) => {
    return fetchAPI<Deal>(`/api/crm/deals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Update deal stage (for drag-drop)
  updateStage: async (id: string, stage: string) => {
    return fetchAPI<Deal>(`/api/crm/deals/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage }),
    })
  },

  // Delete deal
  delete: async (id: string) => {
    return fetchAPI(`/api/crm/deals/${id}`, {
      method: 'DELETE',
    })
  },

  // Mark deal as won
  markWon: async (id: string) => {
    return fetchAPI<Deal>(`/api/crm/deals/${id}/won`, {
      method: 'POST',
    })
  },

  // Mark deal as lost
  markLost: async (id: string, reason?: string) => {
    return fetchAPI<Deal>(`/api/crm/deals/${id}/lost`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  },

  // Get deal activities
  getActivities: async (id: string) => {
    return fetchAPI<Activity[]>(`/api/crm/deals/${id}/activities`)
  },

  // Get deal stats
  getStats: async () => {
    return fetchAPI<DealMetrics>('/api/crm/deals/stats')
  },
}

// ===================================
// CONTACTS API
// ===================================

export const contactsApi = {
  // Get all contacts
  getAll: async (filters?: ContactFilters) => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }
    return fetchAPI<Contact[]>(`/api/crm/contacts?${queryParams}`)
  },

  // Get paginated contacts
  getPaginated: async (page = 1, pageSize = 25, filters?: ContactFilters) => {
    const queryParams = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    })
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }
    return fetchAPI<PaginatedResponse<Contact>>(`/api/crm/contacts/paginated?${queryParams}`)
  },

  // Get single contact
  getById: async (id: string) => {
    return fetchAPI<Contact>(`/api/crm/contacts/${id}`)
  },

  // Create contact
  create: async (data: ContactFormData) => {
    return fetchAPI<Contact>('/api/crm/contacts', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update contact
  update: async (id: string, data: Partial<ContactFormData>) => {
    return fetchAPI<Contact>(`/api/crm/contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Delete contact
  delete: async (id: string) => {
    return fetchAPI(`/api/crm/contacts/${id}`, {
      method: 'DELETE',
    })
  },

  // Get contact's deals
  getDeals: async (id: string) => {
    return fetchAPI<Deal[]>(`/api/crm/contacts/${id}/deals`)
  },

  // Get contact's activities
  getActivities: async (id: string) => {
    return fetchAPI<Activity[]>(`/api/crm/contacts/${id}/activities`)
  },

  // Search contacts
  search: async (query: string) => {
    return fetchAPI<Contact[]>(`/api/crm/contacts/search?q=${encodeURIComponent(query)}`)
  },
}

// ===================================
// ORGANIZATIONS API
// ===================================

export const organizationsApi = {
  // Get all organizations
  getAll: async () => {
    return fetchAPI<Organization[]>('/api/crm/organizations')
  },

  // Get single organization
  getById: async (id: string) => {
    return fetchAPI<Organization>(`/api/crm/organizations/${id}`)
  },

  // Create organization
  create: async (data: Partial<Organization>) => {
    return fetchAPI<Organization>('/api/crm/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update organization
  update: async (id: string, data: Partial<Organization>) => {
    return fetchAPI<Organization>(`/api/crm/organizations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Delete organization
  delete: async (id: string) => {
    return fetchAPI(`/api/crm/organizations/${id}`, {
      method: 'DELETE',
    })
  },

  // Get organization's contacts
  getContacts: async (id: string) => {
    return fetchAPI<Contact[]>(`/api/crm/organizations/${id}/contacts`)
  },

  // Get organization's deals
  getDeals: async (id: string) => {
    return fetchAPI<Deal[]>(`/api/crm/organizations/${id}/deals`)
  },

  // Search organizations
  search: async (query: string) => {
    return fetchAPI<Organization[]>(`/api/crm/organizations/search?q=${encodeURIComponent(query)}`)
  },
}

// ===================================
// ACTIVITIES API
// ===================================

export const activitiesApi = {
  // Get all activities
  getAll: async (filters?: ActivityFilters) => {
    const queryParams = new URLSearchParams()
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value))
      })
    }
    return fetchAPI<Activity[]>(`/api/crm/activities?${queryParams}`)
  },

  // Get single activity
  getById: async (id: string) => {
    return fetchAPI<Activity>(`/api/crm/activities/${id}`)
  },

  // Create activity
  create: async (data: ActivityFormData) => {
    return fetchAPI<Activity>('/api/crm/activities', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  // Update activity
  update: async (id: string, data: Partial<ActivityFormData>) => {
    return fetchAPI<Activity>(`/api/crm/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  // Mark activity as complete
  markComplete: async (id: string, outcome?: string) => {
    return fetchAPI<Activity>(`/api/crm/activities/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ outcome }),
    })
  },

  // Delete activity
  delete: async (id: string) => {
    return fetchAPI(`/api/crm/activities/${id}`, {
      method: 'DELETE',
    })
  },

  // Get upcoming activities
  getUpcoming: async (days = 7) => {
    return fetchAPI<Activity[]>(`/api/crm/activities/upcoming?days=${days}`)
  },

  // Get overdue activities
  getOverdue: async () => {
    return fetchAPI<Activity[]>('/api/crm/activities/overdue')
  },
}

// ===================================
// PIPELINE API
// ===================================

export const pipelineApi = {
  // Get default pipeline
  getDefault: async () => {
    return fetchAPI<Pipeline>('/api/crm/pipeline/default')
  },

  // Get pipeline stats
  getStats: async () => {
    return fetchAPI<PipelineStats>('/api/crm/pipeline/stats')
  },

  // Get all pipelines
  getAll: async () => {
    return fetchAPI<Pipeline[]>('/api/crm/pipelines')
  },
}

// Export all CRM APIs
export const crmApi = {
  deals: dealsApi,
  contacts: contactsApi,
  organizations: organizationsApi,
  activities: activitiesApi,
  pipeline: pipelineApi,
}

export default crmApi

