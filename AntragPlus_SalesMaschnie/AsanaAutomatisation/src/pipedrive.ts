import { request } from 'undici';
import { config } from './env';
import { PipedriveDeal } from './mapping';

export class PipedriveClient {
  private baseURL: string = 'https://api.pipedrive.com/v1';
  private apiToken: string;

  constructor() {
    this.apiToken = config.PIPEDRIVE_API_TOKEN;
  }

  async makeRequest(method: string, path: string, body?: any, params?: Record<string, any>): Promise<any> {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `${this.baseURL}${cleanPath}`;
    const url = new URL(fullUrl);
    
    // Always add API token
    url.searchParams.append('api_token', this.apiToken);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    console.log(`Making request to: ${url.toString()}`);

    const options: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await request(url.toString(), options);
    const data: any = await response.body.json();
    
    if (response.statusCode >= 400) {
      throw new Error(`Pipedrive API error: ${response.statusCode} - ${JSON.stringify(data)}`);
    }

    return data;
  }

  async getDeals(limit: number = 100, start: number = 0): Promise<PipedriveDeal[]> {
    try {
      const data = await this.makeRequest('GET', '/deals', undefined, {
        limit,
        start,
        status: 'all_not_deleted'
      });

      // Pipedrive API returns data directly in data array, not data.items
      return data.data || [];
    } catch (error) {
      console.error('Error fetching Pipedrive deals:', error);
      throw error;
    }
  }

  async getDeal(dealId: number): Promise<PipedriveDeal> {
    try {
      const data = await this.makeRequest('GET', `/deals/${dealId}`);
      return data.data;
    } catch (error) {
      console.error('Error fetching Pipedrive deal:', error);
      throw error;
    }
  }

  async createDeal(dealData: Partial<PipedriveDeal>): Promise<PipedriveDeal> {
    try {
      const data = await this.makeRequest('POST', '/deals', dealData);
      return data.data;
    } catch (error) {
      console.error('Error creating Pipedrive deal:', error);
      throw error;
    }
  }

  async updateDeal(dealId: number, updates: Partial<PipedriveDeal>): Promise<PipedriveDeal> {
    try {
      const data = await this.makeRequest('PUT', `/deals/${dealId}`, updates);
      return data.data;
    } catch (error) {
      console.error('Error updating Pipedrive deal:', error);
      throw error;
    }
  }

  async getDealFields(): Promise<Array<{ key: string; name: string; field_type: string }>> {
    try {
      const data = await this.makeRequest('GET', '/dealFields');
      return data.data;
    } catch (error) {
      console.error('Error fetching Pipedrive deal fields:', error);
      throw error;
    }
  }

  async getStages(): Promise<Array<{ id: number; name: string; pipeline_id: number }>> {
    try {
      const data = await this.makeRequest('GET', '/stages');
      return data.data;
    } catch (error) {
      console.error('Error fetching Pipedrive stages:', error);
      throw error;
    }
  }

  async getUsers(): Promise<Array<{ id: number; name: string; email: string }>> {
    try {
      const data = await this.makeRequest('GET', '/users');
      return data.data;
    } catch (error) {
      console.error('Error fetching Pipedrive users:', error);
      throw error;
    }
  }

  async getPipelines(): Promise<Array<{ id: number; name: string }>> {
    try {
      const data = await this.makeRequest('GET', '/pipelines');
      return data.data;
    } catch (error) {
      console.error('Error fetching Pipedrive pipelines:', error);
      throw error;
    }
  }

  async addNote(dealId: number, content: string): Promise<void> {
    try {
      await this.makeRequest('POST', '/notes', {
        deal_id: dealId,
        content
      });
    } catch (error) {
      console.error('Error adding note to Pipedrive deal:', error);
      throw error;
    }
  }

  async getActivities(dealId: number): Promise<Array<{ id: number; subject: string; done: boolean }>> {
    try {
      const data = await this.makeRequest('GET', '/activities', undefined, {
        deal_id: dealId
      });

      return data.data || [];
    } catch (error) {
      console.error('Error fetching Pipedrive activities:', error);
      throw error;
    }
  }

  async createActivity(dealId: number, subject: string, type: string = 'task'): Promise<void> {
    try {
      await this.makeRequest('POST', '/activities', {
        deal_id: dealId,
        subject,
        type
      });
    } catch (error) {
      console.error('Error creating Pipedrive activity:', error);
      throw error;
    }
  }

  async getPerson(personId: number): Promise<any> {
    try {
      const data = await this.makeRequest('GET', `/persons/${personId}`);
      return data.data;
    } catch (error) {
      console.error(`Error fetching person ${personId}:`, error);
      return null;
    }
  }

  async getOrganization(orgId: number): Promise<any> {
    try {
      const data = await this.makeRequest('GET', `/organizations/${orgId}`);
      return data.data;
    } catch (error) {
      console.error(`Error fetching organization ${orgId}:`, error);
      return null;
    }
  }

  async getDealEmails(dealId: number): Promise<any[]> {
    try {
      const data = await this.makeRequest('GET', `/deals/${dealId}/mailMessages`);
      return data.data || [];
    } catch (error) {
      console.error(`Error fetching emails for deal ${dealId}:`, error);
      return [];
    }
  }
}
