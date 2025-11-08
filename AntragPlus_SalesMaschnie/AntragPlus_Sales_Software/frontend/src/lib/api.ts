/**
 * API Client for AntragPlus Sales Software
 * Connects frontend to backend Lambda functions and local development server
 */

import axios, { AxiosInstance } from 'axios'

// API Base URL - Next.js API routes (same origin)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor for adding auth tokens
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ===================================
// LEAD ENRICHMENT API
// ===================================

export interface Lead {
  id: number
  company_name: string
  website?: string | null
  enrichment_status: 'pending' | 'processing' | 'completed' | 'failed'
  confidence_score?: number
  tatigkeitsfeld?: string
  description?: string
  leadership?: any[]
  created_at: string
  updated_at: string
}

export interface EnrichmentStats {
  total_leads: number
  enriched: number
  pending: number
  failed: number
  avg_confidence: number
  monthly_cost: number
}

export const leadApi = {
  // Get all leads
  getLeads: async (params?: { status?: string; limit?: number; offset?: number }) => {
    const response = await apiClient.get<Lead[]>('/api/leads', { params })
    return response.data
  },

  // Get single lead
  getLead: async (id: number) => {
    const response = await apiClient.get<Lead>(`/api/leads/${id}`)
    return response.data
  },

  // Trigger enrichment for a lead
  enrichLead: async (id: number) => {
    const response = await apiClient.post(`/api/leads/${id}/enrich`)
    return response.data
  },

  // Get enrichment statistics
  getStats: async () => {
    const response = await apiClient.get<EnrichmentStats>('/api/leads/stats')
    return response.data
  },

  // Upload CSV of leads
  uploadLeads: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post('/api/leads/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },
}

// ===================================
// SYNC API
// ===================================

export interface SyncStatus {
  last_sync: string | null
  status: 'idle' | 'syncing' | 'error'
  pipedrive_deals: number
  asana_tasks: number
  synced_items: number
  errors: number
}

export interface SyncLog {
  id: string
  timestamp: string
  action: string
  deal_id?: number
  task_id?: string
  status: 'success' | 'error'
  message?: string
}

export const syncApi = {
  // Get sync status
  getStatus: async () => {
    const response = await apiClient.get<SyncStatus>('/api/sync/status')
    return response.data
  },

  // Trigger manual sync
  triggerSync: async () => {
    const response = await apiClient.post('/api/sync/trigger')
    return response.data
  },

  // Get sync logs
  getLogs: async (limit = 50) => {
    const response = await apiClient.get<SyncLog[]>('/api/sync/logs', { params: { limit } })
    return response.data
  },

  // Run backfill
  runBackfill: async () => {
    const response = await apiClient.post('/api/sync/backfill')
    return response.data
  },
}

// ===================================
// ANALYTICS API
// ===================================

export interface AnalyticsData {
  leads_by_stage: { stage: string; count: number }[]
  enrichment_quality: { date: string; avg_confidence: number }[]
  conversion_funnel: { stage: string; count: number; conversion_rate: number }[]
  time_tracking: { stage: string; avg_time: number }[]
}

export const analyticsApi = {
  // Get analytics dashboard data
  getDashboard: async (timeRange?: string) => {
    const response = await apiClient.get<AnalyticsData>('/api/analytics/dashboard', {
      params: { timeRange },
    })
    return response.data
  },

  // Get stage gap analysis
  getStageGaps: async () => {
    const response = await apiClient.get('/api/analytics/stage-gaps')
    return response.data
  },

  // Get enrichment reports
  getReports: async () => {
    const response = await apiClient.get('/api/analytics/reports')
    return response.data
  },
}

// ===================================
// SETTINGS API
// ===================================

export interface Config {
  lead_config: {
    batch_size: number
    monthly_limit: number
    cost_cap: number
    confidence_threshold: number
  }
  sync_config: {
    interval: string
    enabled: boolean
    auto_sync: boolean
  }
  automation_config: {
    timer_auto_start: boolean
    auto_assignment: boolean
    email_generation: boolean
  }
}

export const settingsApi = {
  // Get configuration
  getConfig: async () => {
    const response = await apiClient.get<Config>('/api/settings/config')
    return response.data
  },

  // Update configuration
  updateConfig: async (config: Partial<Config>) => {
    const response = await apiClient.put('/api/settings/config', config)
    return response.data
  },
}

// Export the client for custom requests
export default apiClient

