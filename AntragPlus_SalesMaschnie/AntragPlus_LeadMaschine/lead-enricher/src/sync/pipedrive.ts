import axios, { AxiosInstance } from 'axios';
import { logger } from '../utils/logger';

interface PipedriveConfig {
  apiToken: string;
  baseUrl: string;
}

export class PipedriveClient {
  private client: AxiosInstance;
  private config: PipedriveConfig;

  constructor(apiToken: string, domain: string = 'api.pipedrive.com') {
    this.config = {
      apiToken,
      baseUrl: `https://${domain}/v1`,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      params: { api_token: this.config.apiToken },
      timeout: 30000,
    });
  }

  /**
   * Fetch all deals with pagination
   */
  async getAllDeals(): Promise<any[]> {
    const deals: any[] = [];
    let start = 0;
    const limit = 500;
    let hasMore = true;

    logger.info('Fetching all deals from Pipedrive...');

    while (hasMore) {
      try {
        const response = await this.client.get('/deals', {
          params: { start, limit },
        });

        if (response.data.success && response.data.data) {
          deals.push(...response.data.data);
          logger.info(`Fetched ${response.data.data.length} deals (total: ${deals.length})`);

          hasMore = response.data.additional_data?.pagination?.more_items_in_collection || false;
          start += limit;
        } else {
          hasMore = false;
        }
      } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch deals');
        throw error;
      }
    }

    logger.info(`Total deals fetched: ${deals.length}`);
    return deals;
  }

  /**
   * Get all stages (for finding stage by name)
   */
  async getStages(): Promise<any[]> {
    try {
      const response = await this.client.get('/stages');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch stages');
      throw error;
    }
  }

  /**
   * Fetch all organizations with pagination
   */
  async getAllOrganizations(): Promise<any[]> {
    const orgs: any[] = [];
    let start = 0;
    const limit = 500;
    let hasMore = true;

    logger.info('Fetching all organizations from Pipedrive...');

    while (hasMore) {
      try {
        const response = await this.client.get('/organizations', {
          params: { start, limit },
        });

        if (response.data.success && response.data.data) {
          orgs.push(...response.data.data);
          logger.info(`Fetched ${response.data.data.length} organizations (total: ${orgs.length})`);

          hasMore = response.data.additional_data?.pagination?.more_items_in_collection || false;
          start += limit;
        } else {
          hasMore = false;
        }
      } catch (error: any) {
        logger.error({ error: error.message }, 'Failed to fetch organizations');
        throw error;
      }
    }

    logger.info(`Total organizations fetched: ${orgs.length}`);
    return orgs;
  }

  /**
   * Get deal fields metadata (including custom fields)
   */
  async getDealFields(): Promise<any[]> {
    try {
      const response = await this.client.get('/dealFields');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch deal fields');
      throw error;
    }
  }

  /**
   * Get organization fields metadata (including custom fields)
   */
  async getOrganizationFields(): Promise<any[]> {
    try {
      const response = await this.client.get('/organizationFields');
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      logger.error({ error: error.message }, 'Failed to fetch organization fields');
      throw error;
    }
  }

  /**
   * Update a deal
   */
  async updateDeal(dealId: number, data: any): Promise<any> {
    try {
      const response = await this.client.put(`/deals/${dealId}`, data);
      if (response.data.success) {
        logger.info({ dealId }, 'Deal updated successfully');
        return response.data.data;
      }
      throw new Error('Update failed');
    } catch (error: any) {
      logger.error({ error: error.message, dealId }, 'Failed to update deal');
      throw error;
    }
  }

  /**
   * Update an organization
   */
  async updateOrganization(orgId: number, data: any): Promise<any> {
    try {
      const response = await this.client.put(`/organizations/${orgId}`, data);
      if (response.data.success) {
        logger.info({ orgId }, 'Organization updated successfully');
        return response.data.data;
      }
      throw new Error('Update failed');
    } catch (error: any) {
      logger.error({ error: error.message, orgId }, 'Failed to update organization');
      throw error;
    }
  }

  /**
   * Add a note to a deal
   */
  async addNoteToDeal(dealId: number, content: string): Promise<any> {
    try {
      const response = await this.client.post('/notes', {
        deal_id: dealId,
        content,
      });
      if (response.data.success) {
        logger.info({ dealId }, 'Note added to deal');
        return response.data.data;
      }
      throw new Error('Failed to add note');
    } catch (error: any) {
      logger.error({ error: error.message, dealId }, 'Failed to add note to deal');
      throw error;
    }
  }

  /**
   * Add a note to an organization
   */
  async addNoteToOrganization(orgId: number, content: string): Promise<any> {
    try {
      const response = await this.client.post('/notes', {
        org_id: orgId,
        content,
      });
      if (response.data.success) {
        logger.info({ orgId }, 'Note added to organization');
        return response.data.data;
      }
      throw new Error('Failed to add note');
    } catch (error: any) {
      logger.error({ error: error.message, orgId }, 'Failed to add note to organization');
      throw error;
    }
  }

  /**
   * Get organization by ID
   */
  async getOrganization(orgId: number): Promise<any> {
    try {
      const response = await this.client.get(`/organizations/${orgId}`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return null;
    } catch (error: any) {
      logger.error({ error: error.message, orgId }, 'Failed to fetch organization');
      throw error;
    }
  }

  /**
   * Get persons (contacts) for an organization
   */
  async getPersonsByOrganization(orgId: number): Promise<any[]> {
    try {
      const response = await this.client.get(`/organizations/${orgId}/persons`);
      if (response.data.success && response.data.data) {
        return response.data.data;
      }
      return [];
    } catch (error: any) {
      logger.error({ error: error.message, orgId }, 'Failed to fetch persons');
      return [];
    }
  }

  /**
   * Create a person (contact)
   */
  async createPerson(data: {
    name: string;
    org_id: number;
    email?: string[];
    phone?: string[];
  }): Promise<any> {
    try {
      const response = await this.client.post('/persons', data);
      if (response.data.success) {
        logger.info({ name: data.name, orgId: data.org_id }, 'Person created');
        return response.data.data;
      }
      throw new Error('Failed to create person');
    } catch (error: any) {
      logger.error({ error: error.message, data }, 'Failed to create person');
      throw error;
    }
  }

  /**
   * Update a person (contact)
   */
  async updatePerson(personId: number, data: {
    email?: string[];
    phone?: string[];
  }): Promise<any> {
    try {
      const response = await this.client.put(`/persons/${personId}`, data);
      if (response.data.success) {
        logger.info({ personId }, 'Person updated');
        return response.data.data;
      }
      throw new Error('Failed to update person');
    } catch (error: any) {
      logger.error({ error: error.message, personId }, 'Failed to update person');
      throw error;
    }
  }
}

