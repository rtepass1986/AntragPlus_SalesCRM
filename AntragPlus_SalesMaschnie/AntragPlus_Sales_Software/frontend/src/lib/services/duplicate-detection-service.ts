/**
 * Duplicate Detection Service
 * Finds and merges duplicate company entries
 */

import { db } from '../db'

export interface DuplicateMatch {
  leadId1: number
  leadId2: number
  companyName1: string
  companyName2: string
  similarity: number
  matchReason: string[]
  suggestedMaster: number // Which one to keep
}

export interface MergeResult {
  success: boolean
  masterId: number
  mergedIds: number[]
  message: string
}

export class DuplicateDetectionService {
  /**
   * Find duplicate leads based on multiple criteria
   */
  async findDuplicates(): Promise<DuplicateMatch[]> {
    try {
      // Get all active leads
      const result = await db.query(`
        SELECT id, company_name, website, email, phone, confidence, created_at
        FROM leads
        WHERE is_deleted = FALSE
        ORDER BY id
      `)

      const leads = result.rows
      const duplicates: DuplicateMatch[] = []

      // Compare each lead with others
      for (let i = 0; i < leads.length; i++) {
        for (let j = i + 1; j < leads.length; j++) {
          const lead1 = leads[i]
          const lead2 = leads[j]

          const matchResult = this.checkMatch(lead1, lead2)

          if (matchResult.isMatch) {
            duplicates.push({
              leadId1: lead1.id,
              leadId2: lead2.id,
              companyName1: lead1.company_name,
              companyName2: lead2.company_name,
              similarity: matchResult.score,
              matchReason: matchResult.reasons,
              suggestedMaster: this.decideMaster(lead1, lead2),
            })
          }
        }
      }

      return duplicates
    } catch (error) {
      console.error('Error finding duplicates:', error)
      return []
    }
  }

  /**
   * Check if two leads match (are duplicates)
   */
  private checkMatch(lead1: any, lead2: any): { isMatch: boolean; score: number; reasons: string[] } {
    const reasons: string[] = []
    let score = 0

    // 1. Exact company name match
    if (this.normalizeCompanyName(lead1.company_name) === this.normalizeCompanyName(lead2.company_name)) {
      score += 100
      reasons.push('Identischer Firmenname')
      return { isMatch: true, score, reasons }
    }

    // 2. Similar company name (fuzzy match)
    const nameSimilarity = this.calculateStringSimilarity(
      this.normalizeCompanyName(lead1.company_name),
      this.normalizeCompanyName(lead2.company_name)
    )
    if (nameSimilarity > 0.85) {
      score += 80
      reasons.push(`Ähnlicher Name (${Math.round(nameSimilarity * 100)}%)`)
    }

    // 3. Same website
    if (lead1.website && lead2.website) {
      const domain1 = this.extractDomain(lead1.website)
      const domain2 = this.extractDomain(lead2.website)
      
      if (domain1 === domain2) {
        score += 90
        reasons.push('Gleiche Website-Domain')
      }
    }

    // 4. Same email domain
    if (lead1.email && lead2.email) {
      const domain1 = lead1.email.split('@')[1]?.toLowerCase()
      const domain2 = lead2.email.split('@')[1]?.toLowerCase()
      
      if (domain1 === domain2 && domain1 !== 'gmail.com' && domain1 !== 'web.de') {
        score += 70
        reasons.push('Gleiche Email-Domain')
      }
    }

    // 5. Same phone (normalized)
    if (lead1.phone && lead2.phone) {
      const phone1 = this.normalizePhone(lead1.phone)
      const phone2 = this.normalizePhone(lead2.phone)
      
      if (phone1 === phone2) {
        score += 60
        reasons.push('Gleiche Telefonnummer')
      }
    }

    // Consider duplicate if score >= 80
    return {
      isMatch: score >= 80,
      score,
      reasons,
    }
  }

  /**
   * Normalize company name for comparison
   */
  private normalizeCompanyName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/gmbh|e\.?v\.?|ag|kg|ohg|gbr|ug|stiftung/gi, '')
      .replace(/[^a-z0-9äöüß\s]/g, '')
      .trim()
  }

  /**
   * Calculate string similarity (Levenshtein-based)
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1

    if (longer.length === 0) return 1.0

    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = []

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }

    return matrix[str2.length][str1.length]
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.hostname.replace('www.', '').toLowerCase()
    } catch {
      return url.replace('www.', '').toLowerCase()
    }
  }

  /**
   * Normalize phone number
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/[\s\-\(\)]/g, '').replace(/^\+49/, '0')
  }

  /**
   * Decide which lead should be the master (better data quality)
   */
  private decideMaster(lead1: any, lead2: any): number {
    let score1 = 0
    let score2 = 0

    // Higher confidence wins
    score1 += (lead1.confidence || 0) * 100
    score2 += (lead2.confidence || 0) * 100

    // More fields filled wins
    const fields = ['website', 'email', 'phone', 'address', 'industry', 'tätigkeitsfeld', 'linkedin_url']
    fields.forEach(field => {
      if (lead1[field]) score1 += 10
      if (lead2[field]) score2 += 10
    })

    // Leadership data wins
    if (lead1.leadership && lead1.leadership.length > 0) score1 += 20
    if (lead2.leadership && lead2.leadership.length > 0) score2 += 20

    // Older lead wins (tie-breaker)
    if (new Date(lead1.created_at) < new Date(lead2.created_at)) score1 += 5

    return score1 >= score2 ? lead1.id : lead2.id
  }

  /**
   * Merge duplicate leads
   */
  async mergeDuplicates(masterId: number, duplicateIds: number[]): Promise<MergeResult> {
    try {
      // Get master lead
      const masterResult = await db.query(
        'SELECT * FROM leads WHERE id = $1',
        [masterId]
      )

      if (masterResult.rows.length === 0) {
        return {
          success: false,
          masterId,
          mergedIds: [],
          message: 'Master Lead nicht gefunden',
        }
      }

      const master = masterResult.rows[0]

      // Get all duplicate leads
      const duplicatesResult = await db.query(
        `SELECT * FROM leads WHERE id = ANY($1)`,
        [duplicateIds]
      )

      const duplicates = duplicatesResult.rows

      // Merge data: Take best value for each field
      const mergedData: any = { ...master }

      duplicates.forEach(dup => {
        // Merge fields: take non-null value, prefer higher confidence source
        Object.keys(dup).forEach(key => {
          if (!mergedData[key] && dup[key]) {
            mergedData[key] = dup[key]
          }
        })

        // Merge arrays (tags, leadership, etc.)
        if (dup.tags && Array.isArray(dup.tags)) {
          mergedData.tags = [...new Set([...(mergedData.tags || []), ...dup.tags])]
        }

        if (dup.leadership && Array.isArray(dup.leadership)) {
          mergedData.leadership = this.mergeLeadership(mergedData.leadership || [], dup.leadership)
        }
      })

      // Update master with merged data
      await db.query(
        `UPDATE leads 
         SET 
           website = COALESCE(website, $1),
           email = COALESCE(email, $2),
           phone = COALESCE(phone, $3),
           address = COALESCE(address, $4),
           linkedin_url = COALESCE(linkedin_url, $5),
           industry = COALESCE(industry, $6),
           tätigkeitsfeld = COALESCE(tätigkeitsfeld, $7),
           tags = $8,
           leadership = $9,
           notes = COALESCE(notes || E'\\n\\n', '') || $10,
           updated_at = CURRENT_TIMESTAMP
         WHERE id = $11`,
        [
          mergedData.website,
          mergedData.email,
          mergedData.phone,
          mergedData.address,
          mergedData.linkedin_url,
          mergedData.industry,
          mergedData.tätigkeitsfeld,
          mergedData.tags,
          JSON.stringify(mergedData.leadership),
          `Merged from ${duplicateIds.length} duplicate(s)`,
          masterId,
        ]
      )

      // Soft delete duplicates
      await db.query(
        `UPDATE leads 
         SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP,
             notes = COALESCE(notes || E'\\n', '') || 'Merged into lead #' || $1
         WHERE id = ANY($2)`,
        [masterId, duplicateIds]
      )

      return {
        success: true,
        masterId,
        mergedIds: duplicateIds,
        message: `${duplicateIds.length} Duplikate erfolgreich zusammengeführt`,
      }
    } catch (error: any) {
      console.error('Error merging duplicates:', error)
      return {
        success: false,
        masterId,
        mergedIds: [],
        message: 'Fehler beim Zusammenführen',
      }
    }
  }

  /**
   * Merge leadership arrays (remove duplicates by name)
   */
  private mergeLeadership(arr1: any[], arr2: any[]): any[] {
    const merged = [...arr1]
    const names = new Set(arr1.map(p => p.name?.toLowerCase()))

    arr2.forEach(person => {
      if (!names.has(person.name?.toLowerCase())) {
        merged.push(person)
      }
    })

    return merged
  }

  /**
   * Auto-detect duplicates before import (preventive)
   */
  async checkForDuplicatesBeforeImport(companyNames: string[]): Promise<{
    [key: string]: { existingLeadId: number; similarity: number }[]
  }> {
    const result = await db.query(`
      SELECT id, company_name, website
      FROM leads
      WHERE is_deleted = FALSE
    `)

    const existingLeads = result.rows
    const potentialDuplicates: any = {}

    companyNames.forEach(newName => {
      const matches: any[] = []

      existingLeads.forEach(existing => {
        const similarity = this.calculateStringSimilarity(
          this.normalizeCompanyName(newName),
          this.normalizeCompanyName(existing.company_name)
        )

        if (similarity > 0.8) {
          matches.push({
            existingLeadId: existing.id,
            similarity,
          })
        }
      })

      if (matches.length > 0) {
        potentialDuplicates[newName] = matches
      }
    })

    return potentialDuplicates
  }
}

export const duplicateDetectionService = new DuplicateDetectionService()

