/**
 * Lead Service
 * Business logic layer for lead management
 */

import { leadRepository, type LeadRow, type LeadFilters, type LeadStats } from '../repositories/lead-repository'
import type { Lead, LeadDetail } from '../leads-api'

export class LeadService {
  /**
   * Map database row to API Lead type
   */
  private mapToLead(row: LeadRow): Lead {
    return {
      id: row.id.toString(),
      companyName: row.company_name,
      website: row.website,
      industry: row.industry,
      tätigkeitsfeld: row.tätigkeitsfeld,
      status: row.status,
      confidence: row.confidence,
      email: row.email,
      phone: row.phone,
      address: row.address,
      linkedIn: row.linkedin_url,
      enrichmentDate: row.enrichment_date?.toISOString() || null,
      updatedAt: row.updated_at.toISOString(),
      pipedriveOrgId: row.pipedrive_org_id,
      notes: row.notes,
    }
  }

  /**
   * Map database row to detailed Lead type
   */
  private mapToLeadDetail(row: LeadRow): LeadDetail {
    return {
      ...this.mapToLead(row),
      legalForm: row.legal_form || undefined,
      foundedYear: row.founded_year || undefined,
      employees: row.employees_estimate || undefined,
      revenue: row.revenue_estimate || undefined,
      leadership: row.leadership || [],
      tags: row.tags || [],
      enrichmentHistory: [], // TODO: Fetch from enrichment history table
    }
  }

  /**
   * Get leads with filtering and pagination
   */
  async getLeads(filters: LeadFilters = {}): Promise<{
    leads: Lead[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
    }
    stats: LeadStats
  }> {
    const { page = 1, limit = 20 } = filters

    // Get leads
    const { leads: leadRows, total } = await leadRepository.findAll(filters)

    // Get stats
    const stats = await leadRepository.getStats()

    return {
      leads: leadRows.map(row => this.mapToLead(row)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats,
    }
  }

  /**
   * Get a single lead by ID
   */
  async getLead(id: string): Promise<LeadDetail | null> {
    const leadRow = await leadRepository.findById(parseInt(id))
    
    if (!leadRow) {
      return null
    }

    return this.mapToLeadDetail(leadRow)
  }

  /**
   * Create a new lead
   */
  async createLead(data: {
    companyName: string
    website?: string
    email?: string
    phone?: string
    source?: string
    createdBy?: string
  }): Promise<Lead> {
    const leadRow = await leadRepository.create({
      company_name: data.companyName,
      website: data.website || null,
      email: data.email || null,
      phone: data.phone || null,
      source: data.source || 'manual',
      status: 'pending',
      confidence: 0,
      enrichment_attempts: 0,
      is_deleted: false,
      created_by: data.createdBy || 'system',
    } as Partial<LeadRow>)

    return this.mapToLead(leadRow)
  }

  /**
   * Update a lead
   */
  async updateLead(id: string, data: Partial<Lead>): Promise<Lead | null> {
    const updateData: Partial<LeadRow> = {}

    if (data.companyName) updateData.company_name = data.companyName
    if (data.website !== undefined) updateData.website = data.website
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.address !== undefined) updateData.address = data.address
    if (data.linkedIn !== undefined) updateData.linkedin_url = data.linkedIn
    if (data.industry !== undefined) updateData.industry = data.industry
    if (data.tätigkeitsfeld !== undefined) updateData.tätigkeitsfeld = data.tätigkeitsfeld
    if (data.status) updateData.status = data.status
    if (data.confidence !== undefined) updateData.confidence = data.confidence
    if (data.notes !== undefined) updateData.notes = data.notes

    const leadRow = await leadRepository.update(parseInt(id), updateData)

    if (!leadRow) {
      return null
    }

    return this.mapToLead(leadRow)
  }

  /**
   * Delete a lead (soft delete)
   */
  async deleteLead(id: string): Promise<boolean> {
    return leadRepository.delete(parseInt(id))
  }

  /**
   * Bulk import leads from CSV
   */
  async bulkImportLeads(leads: Array<{
    companyName: string
    website?: string
    email?: string
    phone?: string
    address?: string
    industry?: string
    tätigkeitsfeld?: string
    geber?: string
    fördererfahrung?: string
    jahr?: string
    förderzweck?: string
    betrag?: string
    empfaengerid?: string
    [key: string]: any
  }>): Promise<{ imported: number; failed: number }> {
    const leadsToInsert: Partial<LeadRow>[] = leads.map(lead => {
      // Extract custom fields
      const customFields: any = {}
      if (lead.geber) customFields.geber = lead.geber
      if (lead.fördererfahrung) customFields.fördererfahrung = lead.fördererfahrung
      if (lead.jahr) customFields.jahr = lead.jahr
      if (lead.förderzweck) customFields.förderzweck = lead.förderzweck
      if (lead.betrag) customFields.betrag = lead.betrag
      if (lead.empfaengerid) customFields.empfaengerid = lead.empfaengerid

      return {
        company_name: lead.companyName,
        website: lead.website || null,
        email: lead.email || null,
        phone: lead.phone || null,
        address: lead.address || null,
        industry: lead.industry || null,
        tätigkeitsfeld: lead.tätigkeitsfeld || null,
        custom_fields: customFields,
        source: 'csv',
        status: 'pending',
        confidence: 0,
        enrichment_attempts: 0,
        is_deleted: false,
        created_by: 'csv_import',
      }
    })

    const imported = await leadRepository.bulkInsert(leadsToInsert)
    const failed = leads.length - imported

    return { imported, failed }
  }

  /**
   * Trigger enrichment for leads
   */
  async enrichLeads(leadIds: string[]): Promise<{
    queued: number
    message: string
  }> {
    // TODO: Integrate with enrichment queue system
    // For now, just mark them as pending if they're not already being enriched
    
    const queued = leadIds.length

    // In production, this would:
    // 1. Add leads to enrichment queue (Bull/BullMQ)
    // 2. Background workers would process them
    // 3. Update status as they're processed

    return {
      queued,
      message: `${queued} Leads wurden zur Anreicherung hinzugefügt`,
    }
  }

  /**
   * Get enrichment statistics
   */
  async getEnrichmentStats(): Promise<{
    totalProcessed: number
    successRate: number
    avgConfidence: number
    avgProcessingTime: number
    totalCost: number
  }> {
    // TODO: Query enrichment history table
    // For now return placeholder stats
    const stats = await leadRepository.getStats()

    return {
      totalProcessed: stats.enriched,
      successRate: stats.total > 0 ? (stats.enriched / stats.total) * 100 : 0,
      avgConfidence: stats.avgConfidence,
      avgProcessingTime: 0, // TODO: Calculate from history
      totalCost: stats.costEstimate,
    }
  }

  /**
   * Check if database is connected
   */
  async checkConnection(): Promise<boolean> {
    try {
      const stats = await leadRepository.getStats()
      return true
    } catch (error) {
      console.error('Database connection check failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const leadService = new LeadService()

