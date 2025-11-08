/**
 * Lead Repository
 * Database operations for leads
 */

import { db } from '../db'
import type { PoolClient } from 'pg'

export interface LeadRow {
  id: number
  company_name: string
  legal_form: string | null
  website: string | null
  email: string | null
  phone: string | null
  address: string | null
  linkedin_url: string | null
  industry: string | null
  tätigkeitsfeld: string | null
  founded_year: number | null
  employees_estimate: string | null
  revenue_estimate: string | null
  status: 'pending' | 'enriched' | 'failed'
  confidence: number
  enrichment_date: Date | null
  last_enrichment_attempt: Date | null
  enrichment_attempts: number
  source: string
  source_reference: string | null
  pipedrive_org_id: number | null
  pipedrive_deal_id: number | null
  synced_to_pipedrive: boolean
  pipedrive_sync_date: Date | null
  description: string | null
  tags: string[] | null
  flagship_projects: string[] | null
  arbeitsbereiche: string[] | null
  leadership: any
  notes: string | null
  custom_fields: any
  completeness_score: number
  data_quality_flags: string[] | null
  created_at: Date
  updated_at: Date
  created_by: string | null
  updated_by: string | null
  deleted_at: Date | null
  is_deleted: boolean
}

export interface LeadFilters {
  status?: 'pending' | 'enriched' | 'failed'
  search?: string
  industry?: string
  source?: string
  minConfidence?: number
  page?: number
  limit?: number
}

export interface LeadStats {
  total: number
  enriched: number
  pending: number
  failed: number
  avgConfidence: number
  costEstimate: number
}

export class LeadRepository {
  /**
   * Get all leads with filters and pagination
   */
  async findAll(filters: LeadFilters = {}): Promise<{ leads: LeadRow[]; total: number }> {
    const {
      status,
      search,
      industry,
      source,
      minConfidence,
      page = 1,
      limit = 20,
    } = filters

    const offset = (page - 1) * limit
    const conditions: string[] = ['is_deleted = FALSE']
    const params: any[] = []
    let paramCount = 1

    if (status) {
      conditions.push(`status = $${paramCount}`)
      params.push(status)
      paramCount++
    }

    if (industry) {
      conditions.push(`industry = $${paramCount}`)
      params.push(industry)
      paramCount++
    }

    if (source) {
      conditions.push(`source = $${paramCount}`)
      params.push(source)
      paramCount++
    }

    if (minConfidence !== undefined) {
      conditions.push(`confidence >= $${paramCount}`)
      params.push(minConfidence)
      paramCount++
    }

    if (search) {
      conditions.push(`(
        company_name ILIKE $${paramCount} OR
        industry ILIKE $${paramCount} OR
        tätigkeitsfeld ILIKE $${paramCount}
      )`)
      params.push(`%${search}%`)
      paramCount++
    }

    const whereClause = conditions.join(' AND ')

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM leads WHERE ${whereClause}`
    const countResult = await db.query(countQuery, params)
    const total = parseInt(countResult.rows[0].count)

    // Get paginated results
    const query = `
      SELECT * FROM leads
      WHERE ${whereClause}
      ORDER BY updated_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `
    params.push(limit, offset)

    const result = await db.query(query, params)

    return {
      leads: result.rows,
      total,
    }
  }

  /**
   * Get a single lead by ID
   */
  async findById(id: number): Promise<LeadRow | null> {
    const query = `
      SELECT * FROM leads
      WHERE id = $1 AND is_deleted = FALSE
    `
    const result = await db.query(query, [id])
    return result.rows[0] || null
  }

  /**
   * Get lead by Pipedrive org ID
   */
  async findByPipedriveOrgId(orgId: number): Promise<LeadRow | null> {
    const query = `
      SELECT * FROM leads
      WHERE pipedrive_org_id = $1 AND is_deleted = FALSE
    `
    const result = await db.query(query, [orgId])
    return result.rows[0] || null
  }

  /**
   * Create a new lead
   */
  async create(data: Partial<LeadRow>): Promise<LeadRow> {
    const fields: string[] = []
    const values: any[] = []
    const placeholders: string[] = []
    let paramCount = 1

    // Map input data to database columns
    const fieldMap: Record<string, string> = {
      company_name: 'company_name',
      legal_form: 'legal_form',
      website: 'website',
      email: 'email',
      phone: 'phone',
      address: 'address',
      linkedin_url: 'linkedin_url',
      industry: 'industry',
      tätigkeitsfeld: 'tätigkeitsfeld',
      founded_year: 'founded_year',
      employees_estimate: 'employees_estimate',
      revenue_estimate: 'revenue_estimate',
      status: 'status',
      confidence: 'confidence',
      source: 'source',
      source_reference: 'source_reference',
      pipedrive_org_id: 'pipedrive_org_id',
      pipedrive_deal_id: 'pipedrive_deal_id',
      description: 'description',
      tags: 'tags',
      leadership: 'leadership',
      notes: 'notes',
      custom_fields: 'custom_fields',
      created_by: 'created_by',
    }

    // Handle custom fields (geber, fördererfahrung, etc.) separately
    const customFieldData: any = {}
    
    if ('geber' in data) customFieldData.geber = data.geber
    if ('fördererfahrung' in data) customFieldData.fördererfahrung = data.fördererfahrung
    if ('jahr' in data) customFieldData.jahr = data.jahr
    if ('förderzweck' in data) customFieldData.förderzweck = data.förderzweck
    if ('betrag' in data) customFieldData.betrag = data.betrag
    if ('empfaengerid' in data) customFieldData.empfaengerid = data.empfaengerid

    // Merge custom fields
    if (Object.keys(customFieldData).length > 0) {
      fields.push('custom_fields')
      values.push(JSON.stringify(customFieldData))
      placeholders.push(`$${paramCount}`)
      paramCount++
    }

    for (const [key, dbColumn] of Object.entries(fieldMap)) {
      if (key in data && data[key as keyof LeadRow] !== undefined) {
        fields.push(dbColumn)
        values.push(data[key as keyof LeadRow])
        placeholders.push(`$${paramCount}`)
        paramCount++
      }
    }

    const query = `
      INSERT INTO leads (${fields.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `

    const result = await db.query(query, values)
    return result.rows[0]
  }

  /**
   * Update an existing lead
   */
  async update(id: number, data: Partial<LeadRow>): Promise<LeadRow | null> {
    const setFields: string[] = []
    const values: any[] = []
    let paramCount = 1

    const fieldMap: Record<string, string> = {
      company_name: 'company_name',
      legal_form: 'legal_form',
      website: 'website',
      email: 'email',
      phone: 'phone',
      address: 'address',
      linkedin_url: 'linkedin_url',
      industry: 'industry',
      tätigkeitsfeld: 'tätigkeitsfeld',
      founded_year: 'founded_year',
      employees_estimate: 'employees_estimate',
      revenue_estimate: 'revenue_estimate',
      status: 'status',
      confidence: 'confidence',
      enrichment_date: 'enrichment_date',
      description: 'description',
      tags: 'tags',
      leadership: 'leadership',
      notes: 'notes',
      custom_fields: 'custom_fields',
      completeness_score: 'completeness_score',
      updated_by: 'updated_by',
    }

    for (const [key, dbColumn] of Object.entries(fieldMap)) {
      if (key in data && data[key as keyof LeadRow] !== undefined) {
        setFields.push(`${dbColumn} = $${paramCount}`)
        values.push(data[key as keyof LeadRow])
        paramCount++
      }
    }

    if (setFields.length === 0) {
      return this.findById(id)
    }

    values.push(id)

    const query = `
      UPDATE leads
      SET ${setFields.join(', ')}
      WHERE id = $${paramCount} AND is_deleted = FALSE
      RETURNING *
    `

    const result = await db.query(query, values)
    return result.rows[0] || null
  }

  /**
   * Soft delete a lead
   */
  async delete(id: number): Promise<boolean> {
    const query = `
      UPDATE leads
      SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND is_deleted = FALSE
    `
    const result = await db.query(query, [id])
    return result.rowCount > 0
  }

  /**
   * Get lead statistics
   */
  async getStats(): Promise<LeadStats> {
    const query = `
      SELECT
        COUNT(*)::integer as total,
        COUNT(*) FILTER (WHERE status = 'enriched')::integer as enriched,
        COUNT(*) FILTER (WHERE status = 'pending')::integer as pending,
        COUNT(*) FILTER (WHERE status = 'failed')::integer as failed,
        COALESCE(AVG(confidence) FILTER (WHERE status = 'enriched'), 0) as avg_confidence
      FROM leads
      WHERE is_deleted = FALSE
    `
    const result = await db.query(query)
    const row = result.rows[0]

    return {
      total: row.total,
      enriched: row.enriched,
      pending: row.pending,
      failed: row.failed,
      avgConfidence: parseFloat(row.avg_confidence),
      costEstimate: row.total * 0.05, // €0.05 per lead estimate
    }
  }

  /**
   * Add enrichment history record
   */
  async addEnrichmentHistory(data: {
    lead_id: number
    status: string
    confidence?: number
    fields_updated?: string[]
    sources_used?: string[]
    api_calls_made?: number
    estimated_cost?: number
    duration_ms?: number
    errors?: string[]
    triggered_by?: string
  }): Promise<void> {
    const query = `
      INSERT INTO lead_enrichment_history (
        lead_id, status, confidence, fields_updated,
        sources_used, api_calls_made, estimated_cost,
        duration_ms, errors, triggered_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `

    await db.query(query, [
      data.lead_id,
      data.status,
      data.confidence || null,
      data.fields_updated || [],
      data.sources_used || [],
      data.api_calls_made || 0,
      data.estimated_cost || 0,
      data.duration_ms || null,
      data.errors || [],
      data.triggered_by || 'system',
    ])
  }

  /**
   * Bulk insert leads (for CSV import)
   */
  async bulkInsert(leads: Partial<LeadRow>[], client?: PoolClient): Promise<number> {
    if (leads.length === 0) return 0

    const dbClient = client || await db.getClient()

    try {
      let inserted = 0

      for (const lead of leads) {
        try {
          await this.create(lead)
          inserted++
        } catch (error) {
          console.error('Error inserting lead:', lead.company_name, error)
        }
      }

      return inserted
    } finally {
      if (!client) {
        dbClient.release()
      }
    }
  }
}

// Export singleton instance
export const leadRepository = new LeadRepository()

