/**
 * Lead to CRM Conversion Service
 * Converts approved leads to internal contacts and deals
 */

import { db } from '../db'

export interface LeadApprovalRequest {
  leadId: number
  editedFields?: {
    company_name?: string
    email?: string
    phone?: string
    website?: string
    industry?: string
    tätigkeitsfeld?: string
  }
  approvedBy: string
  notes?: string
}

export interface ConversionResult {
  success: boolean
  contactId?: number
  dealId?: number
  message: string
  errors?: string[]
}

export class LeadToCRMService {
  /**
   * Approve lead and convert to Contact + Deal
   */
  async approveLead(request: LeadApprovalRequest): Promise<ConversionResult> {
    try {
      // 1. Get Lead
      const leadResult = await db.query(
        'SELECT * FROM leads WHERE id = $1 AND is_deleted = FALSE',
        [request.leadId]
      )

      if (leadResult.rows.length === 0) {
        return {
          success: false,
          message: 'Lead nicht gefunden',
        }
      }

      const lead = leadResult.rows[0]

      // 2. Apply any edits
      if (request.editedFields) {
        const updates: string[] = []
        const values: any[] = []
        let paramCount = 1

        Object.entries(request.editedFields).forEach(([key, value]) => {
          if (value !== undefined) {
            updates.push(`${key} = $${paramCount}`)
            values.push(value)
            paramCount++
          }
        })

        if (updates.length > 0) {
          values.push(request.leadId)
          await db.query(
            `UPDATE leads SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $${paramCount}`,
            values
          )

          // Refresh lead data
          const refreshed = await db.query('SELECT * FROM leads WHERE id = $1', [request.leadId])
          Object.assign(lead, refreshed.rows[0])
        }
      }

      // 3. Create Internal Contact
      const contactId = await this.createContactFromLead(lead, request.approvedBy)

      // 4. Create Deal in "Start" Stage
      const dealId = await this.createDealForContact(contactId, lead, request.approvedBy)

      // 5. Add Enrichment Note to Deal
      await this.addEnrichmentNote(dealId, lead)

      // 6. Update Lead Status
      await db.query(
        `UPDATE leads 
         SET status = 'approved', 
             synced_to_pipedrive = FALSE,
             updated_at = CURRENT_TIMESTAMP,
             custom_fields = jsonb_set(
               COALESCE(custom_fields, '{}'::jsonb),
               '{internal_contact_id}',
               to_jsonb($1::int)
             )
         WHERE id = $2`,
        [contactId, request.leadId]
      )

      // 7. Log Approval
      await db.query(
        `INSERT INTO lead_approval_history 
         (lead_id, action, approved_by, contact_created_id, deal_created_id, approval_notes, changes_made)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          request.leadId,
          'approved',
          request.approvedBy,
          contactId,
          dealId,
          request.notes || null,
          request.editedFields ? JSON.stringify(request.editedFields) : null,
        ]
      )

      return {
        success: true,
        contactId,
        dealId,
        message: 'Lead erfolgreich genehmigt und zu Pipeline hinzugefügt',
      }
    } catch (error: any) {
      console.error('Error approving lead:', error)
      return {
        success: false,
        message: 'Fehler bei der Genehmigung',
        errors: [error.message],
      }
    }
  }

  /**
   * Create Contact from Lead (uses primary leadership or generic)
   */
  private async createContactFromLead(lead: any, createdBy: string): Promise<number> {
    // Try to get primary leadership person
    let contactData: any = {}

    if (lead.leadership && Array.isArray(lead.leadership) && lead.leadership.length > 0) {
      // Use primary leadership (first in array, usually highest authority)
      const primary = lead.leadership[0]
      contactData = {
        full_name: primary.name,
        first_name: primary.name.split(' ')[0],
        last_name: primary.name.split(' ').slice(1).join(' ') || primary.name.split(' ')[0],
        email: primary.email || lead.email,
        phone: primary.phone || lead.phone,
        job_title: primary.role_display || primary.role,
        department: primary.department || 'Geschäftsführung',
        is_decision_maker: true,
        authority_level: primary.authority_level || 1,
        can_sign_contracts: primary.can_sign_contracts || false,
        linkedin_url: primary.linkedin || null,
      }
    } else {
      // Fallback: Create generic contact
      contactData = {
        full_name: `Kontakt bei ${lead.company_name}`,
        first_name: 'Kontakt',
        last_name: lead.company_name,
        email: lead.email,
        phone: lead.phone,
        job_title: null,
        department: null,
        is_decision_maker: false,
        authority_level: null,
        can_sign_contracts: false,
        linkedin_url: null,
      }
    }

    const result = await db.query(
      `INSERT INTO internal_contacts (
        source_lead_id, full_name, first_name, last_name,
        email, phone, organization_name, organization_website,
        job_title, department, is_decision_maker, authority_level,
        can_sign_contracts, linkedin_url, confidence_score,
        enrichment_date, data_source, tags, notes, owner_name,
        created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      ) RETURNING id`,
      [
        lead.id,
        contactData.full_name,
        contactData.first_name,
        contactData.last_name,
        contactData.email,
        contactData.phone,
        lead.company_name,
        lead.website,
        contactData.job_title,
        contactData.department,
        contactData.is_decision_maker,
        contactData.authority_level,
        contactData.can_sign_contracts,
        contactData.linkedin_url,
        lead.confidence,
        lead.enrichment_date || new Date(),
        'lead_enrichment',
        lead.tags || [],
        lead.notes,
        'Sales Team', // Default owner
        createdBy,
      ]
    )

    return result.rows[0].id
  }

  /**
   * Create Deal for Contact in "Start" stage
   */
  private async createDealForContact(contactId: number, lead: any, createdBy: string): Promise<number> {
    // Calculate deal value: 10% of betrag from CSV, or estimate from org size
    const estimatedValue = this.calculateDealValue(lead)

    const result = await db.query(
      `INSERT INTO internal_deals (
        contact_id, title, organization_name, value, currency,
        stage, stage_order, probability, status,
        description, source, tätigkeitsfeld, industry,
        arbeitsbereiche, lead_confidence_score, leadership_team,
        expected_close_date, owner_name, created_by, stage_changed_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP
      ) RETURNING id`,
      [
        contactId,
        `${lead.company_name} - Qualified Lead`,
        lead.company_name,
        estimatedValue,
        'EUR',
        'Start', // Your first stage!
        1, // stage_order
        10, // Default probability for "Start"
        'open',
        lead.description || `Lead aus Enrichment: ${lead.company_name}`,
        'lead_enrichment',
        lead.tätigkeitsfeld,
        lead.industry,
        lead.arbeitsbereiche || [],
        lead.confidence,
        lead.leadership || [],
        this.calculateExpectedCloseDate(),
        'Sales Team',
        createdBy,
      ]
    )

    return result.rows[0].id
  }

  /**
   * Add enrichment summary as note
   */
  private async addEnrichmentNote(dealId: number, lead: any): Promise<void> {
    const noteContent = this.generateEnrichmentNote(lead)

    await db.query(
      `INSERT INTO internal_deal_notes (deal_id, content, note_type, created_by)
       VALUES ($1, $2, $3, $4)`,
      [dealId, noteContent, 'enrichment', 'system']
    )
  }

  /**
   * Generate enrichment summary note
   */
  private generateEnrichmentNote(lead: any): string {
    const parts: string[] = []

    parts.push(`🤖 LEAD ENRICHMENT SUMMARY`)
    parts.push(``)
    parts.push(`Confidence Score: ${Math.round((lead.confidence || 0) * 100)}%`)
    parts.push(`Enrichment Date: ${lead.enrichment_date ? new Date(lead.enrichment_date).toLocaleDateString('de-DE') : 'N/A'}`)
    parts.push(``)

    if (lead.description) {
      parts.push(`📄 Beschreibung:`)
      parts.push(lead.description)
      parts.push(``)
    }

    if (lead.tätigkeitsfeld) {
      parts.push(`🏢 Tätigkeitsfeld: ${lead.tätigkeitsfeld}`)
    }

    if (lead.industry) {
      parts.push(`📊 Branche: ${lead.industry}`)
    }

    if (lead.arbeitsbereiche && lead.arbeitsbereiche.length > 0) {
      parts.push(``)
      parts.push(`🎯 Arbeitsbereiche:`)
      lead.arbeitsbereiche.forEach((bereich: string) => {
        parts.push(`  • ${bereich}`)
      })
    }

    if (lead.leadership && lead.leadership.length > 0) {
      parts.push(``)
      parts.push(`👥 LEADERSHIP TEAM:`)
      lead.leadership.forEach((person: any) => {
        parts.push(`  • ${person.name} - ${person.role_display || person.role}`)
        if (person.email) parts.push(`    📧 ${person.email}`)
        if (person.phone) parts.push(`    📞 ${person.phone}`)
      })
    }

    if (lead.flagship_projects && lead.flagship_projects.length > 0) {
      parts.push(``)
      parts.push(`⭐ Key Projects:`)
      lead.flagship_projects.forEach((project: string) => {
        parts.push(`  • ${project}`)
      })
    }

    return parts.join('\n')
  }

  /**
   * Calculate deal value: 10% of betrag OR estimate from org size
   */
  private calculateDealValue(lead: any): number {
    // Priority 1: Use 10% of betrag from CSV
    if (lead.custom_fields?.betrag) {
      const betrag = parseFloat(lead.custom_fields.betrag.toString().replace(/[^\d.-]/g, ''))
      if (!isNaN(betrag) && betrag > 0) {
        return Math.round(betrag * 0.10) // 10% vom Betrag
      }
    }

    // Priority 2: Estimate based on org size
    return this.estimateDealValue(lead)
  }

  /**
   * Estimate deal value based on organization size (fallback)
   */
  private estimateDealValue(lead: any): number {
    const employeeStr = lead.employees_estimate?.toLowerCase() || ''

    // Small org
    if (employeeStr.includes('<50') || employeeStr.includes('klein')) {
      return 500
    }

    // Medium org
    if (employeeStr.includes('50-200') || employeeStr.includes('mittel')) {
      return 2000
    }

    // Large org
    if (employeeStr.includes('>200') || employeeStr.includes('groß') || employeeStr.includes('1000')) {
      return 5000
    }

    // Default
    return 1000
  }

  /**
   * Calculate expected close date (default: 3 months from now)
   */
  private calculateExpectedCloseDate(): string {
    const date = new Date()
    date.setMonth(date.getMonth() + 3)
    return date.toISOString().split('T')[0]
  }

  /**
   * Batch approve multiple leads
   */
  async batchApproveLead(leadIds: number[], approvedBy: string): Promise<{
    successful: number
    failed: number
    results: ConversionResult[]
  }> {
    const results: ConversionResult[] = []
    let successful = 0
    let failed = 0

    for (const leadId of leadIds) {
      const result = await this.approveLead({ leadId, approvedBy })
      results.push(result)

      if (result.success) {
        successful++
      } else {
        failed++
      }
    }

    return {
      successful,
      failed,
      results,
    }
  }

  /**
   * Reject lead
   */
  async rejectLead(leadId: number, rejectedBy: string, reason?: string): Promise<boolean> {
    try {
      await db.query(
        `UPDATE leads 
         SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [leadId]
      )

      await db.query(
        `INSERT INTO lead_approval_history (lead_id, action, approved_by, approval_notes)
         VALUES ($1, $2, $3, $4)`,
        [leadId, 'rejected', rejectedBy, reason || null]
      )

      return true
    } catch (error) {
      console.error('Error rejecting lead:', error)
      return false
    }
  }

  /**
   * Get leads needing review (confidence < 80%)
   */
  async getLeadsForReview(): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM leads 
       WHERE status = 'enriched' 
       AND confidence < 0.80
       AND is_deleted = FALSE
       ORDER BY confidence ASC, updated_at DESC`
    )

    return result.rows
  }

  /**
   * Get auto-approved leads (confidence >= 80%)
   */
  async getAutoApprovedLeads(): Promise<any[]> {
    const result = await db.query(
      `SELECT * FROM leads 
       WHERE status = 'enriched' 
       AND confidence >= 0.80
       AND is_deleted = FALSE
       ORDER BY confidence DESC, updated_at DESC`
    )

    return result.rows
  }
}

export const leadToCRMService = new LeadToCRMService()

