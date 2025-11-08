/**
 * CRM API Handler
 * Express-like handlers for CRM endpoints
 */

import { PipedriveService } from './pipedrive-service'

export class CRMApiHandler {
  private pipedriveService: PipedriveService

  constructor(pipedriveToken: string) {
    this.pipedriveService = new PipedriveService(pipedriveToken)
  }

  /**
   * GET /api/crm/deals
   */
  async getDeals(params?: any) {
    try {
      const deals = await this.pipedriveService.getDeals({
        status: params?.status || 'open',
        limit: params?.limit || 500,
      })

      return {
        success: true,
        data: deals,
      }
    } catch (error: any) {
      console.error('Error fetching deals:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * GET /api/crm/deals/by-stage
   */
  async getDealsByStage() {
    try {
      const dealsByStage = await this.pipedriveService.getDealsByStage()

      return {
        success: true,
        data: dealsByStage,
      }
    } catch (error: any) {
      console.error('Error fetching deals by stage:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * GET /api/crm/deals/:id
   */
  async getDeal(id: string) {
    try {
      const deal = await this.pipedriveService.getDeal(parseInt(id))

      return {
        success: true,
        data: deal,
      }
    } catch (error: any) {
      console.error('Error fetching deal:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * PATCH /api/crm/deals/:id/stage
   */
  async updateDealStage(id: string, body: { stage: string; stageId?: number }) {
    try {
      // Map stage keys to Pipedrive stage IDs
      const stageIdMapping: Record<string, number> = {
        lead: 16,          // 1.Follow Up Call
        qualified: 18,     // 2.Follow Up
        proposal: 9,       // 3.Send Proposal / Quote
        negotiation: 22,   // 4.Contract Signing Process
        won: 10,           // Won
        lost: 13,          // Lost
      }

      const stageId = body.stageId || stageIdMapping[body.stage] || 16

      const updatedDeal = await this.pipedriveService.updateDealStage(
        parseInt(id),
        stageId
      )

      return {
        success: true,
        data: updatedDeal,
      }
    } catch (error: any) {
      console.error('Error updating deal stage:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * GET /api/crm/contacts
   */
  async getContacts(params?: any) {
    try {
      const contacts = await this.pipedriveService.getContacts(params?.limit || 500)

      return {
        success: true,
        data: contacts,
      }
    } catch (error: any) {
      console.error('Error fetching contacts:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * GET /api/crm/organizations
   */
  async getOrganizations(params?: any) {
    try {
      const organizations = await this.pipedriveService.getOrganizations(params?.limit || 500)

      return {
        success: true,
        data: organizations,
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }
}

/**
 * Export singleton instance
 */
export function createCRMHandler(pipedriveToken: string) {
  return new CRMApiHandler(pipedriveToken)
}

