import { request } from 'undici';
import { config } from './env';
import { AsanaTask } from './mapping';

export interface AsanaOAuthToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
}

export class AsanaClient {
  private baseURL: string = 'https://app.asana.com/api/1.0';
  private accessToken: string;

  constructor(accessToken?: string) {
    this.accessToken = accessToken || config.ASANA_ACCESS_TOKEN;
  }

  async makeRequest(method: string, path: string, body?: any, params?: Record<string, any>): Promise<any> {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const fullUrl = `${this.baseURL}${cleanPath}`;
    const url = new URL(fullUrl);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    console.log(`Making Asana request to: ${url.toString()}`);

    const options: any = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await request(url.toString(), options);
    
    // Check if response has content before parsing
    const contentLength = response.headers['content-length'];
    if (contentLength === '0' || response.statusCode === 204) {
      return {};
    }
    
    const data: any = await response.body.json();
    
    if (response.statusCode >= 400) {
      throw new Error(`Asana API error: ${response.statusCode} - ${JSON.stringify(data)}`);
    }

    return data;
  }

  static async getOAuthUrl(redirectUri: string): Promise<string> {
    const params = new URLSearchParams({
      client_id: config.ASANA_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: 'pipedrive-sync'
    });

    return `https://app.asana.com/-/oauth_authorize?${params.toString()}`;
  }

  static async exchangeCodeForToken(code: string, redirectUri: string): Promise<AsanaOAuthToken> {
    try {
      const body = {
        grant_type: 'authorization_code',
        client_id: config.ASANA_CLIENT_ID,
        client_secret: config.ASANA_CLIENT_SECRET,
        redirect_uri: redirectUri,
        code
      };

      const response = await request('https://app.asana.com/-/oauth_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      return await response.body.json() as AsanaOAuthToken;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  static async refreshAccessToken(refreshToken: string): Promise<AsanaOAuthToken> {
    try {
      const body = {
        grant_type: 'refresh_token',
        client_id: config.ASANA_CLIENT_ID,
        client_secret: config.ASANA_CLIENT_SECRET,
        refresh_token: refreshToken
      };

      const response = await request('https://app.asana.com/-/oauth_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      return await response.body.json() as AsanaOAuthToken;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  async getTasks(projectGid: string, limit: number = 100): Promise<AsanaTask[]> {
    try {
      const data = await this.makeRequest('GET', '/tasks', undefined, {
        project: projectGid,
        limit,
        opt_fields: 'gid,name,notes,due_on,completed,assignee.name,projects.name,custom_fields'
      });

      return data.data;
    } catch (error) {
      console.error('Error fetching Asana tasks:', error);
      throw error;
    }
  }

  async getTask(taskGid: string): Promise<AsanaTask> {
    try {
      const data = await this.makeRequest('GET', `/tasks/${taskGid}`, undefined, {
        opt_fields: 'gid,name,notes,due_on,start_on,completed,assignee.name,projects.name,custom_fields,memberships.section.name,memberships.section.gid,created_at'
      });

      return data.data;
    } catch (error) {
      console.error('Error fetching Asana task:', error);
      throw error;
    }
  }

  async createTask(taskData: Partial<AsanaTask>, projectGid: string, sectionGid?: string): Promise<AsanaTask> {
    try {
      // Create task with memberships to place it directly in the section
      const taskPayload: any = {
        ...taskData,
        projects: [projectGid]
      };
      
      // If section is specified, add it to memberships for direct placement
      if (sectionGid) {
        taskPayload.memberships = [{
          project: projectGid,
          section: sectionGid
        }];
      }
      
      const data = await this.makeRequest('POST', '/tasks', {
        data: taskPayload
      });

      const task = data.data;
      console.log(`Created task ${task.gid} in section ${sectionGid || 'default'}`);

      return task;
    } catch (error) {
      console.error('Error creating Asana task:', error);
      throw error;
    }
  }

  async addTaskToSection(taskGid: string, sectionGid: string): Promise<void> {
    try {
      await this.makeRequest('POST', `/sections/${sectionGid}/addTask`, {
        data: {
          task: taskGid
        }
      });
      console.log(`Added task ${taskGid} to section ${sectionGid}`);
    } catch (error) {
      console.error('Error adding task to section:', error);
      throw error;
    }
  }

  async updateTask(taskGid: string, updates: Partial<AsanaTask>): Promise<AsanaTask> {
    try {
      const data = await this.makeRequest('PUT', `/tasks/${taskGid}`, {
        data: updates
      });

      return data.data;
    } catch (error) {
      console.error('Error updating Asana task:', error);
      throw error;
    }
  }

  async getProjects(): Promise<Array<{ gid: string; name: string }>> {
    try {
      const data = await this.makeRequest('GET', '/projects', undefined, {
        workspace: config.ASANA_WORKSPACE_ID,
        opt_fields: 'gid,name'
      });

      return data.data;
    } catch (error) {
      console.error('Error fetching Asana projects:', error);
      throw error;
    }
  }

  async createProject(name: string): Promise<{ gid: string; name: string }> {
    try {
      const data = await this.makeRequest('POST', '/projects', {
        data: {
          name,
          workspace: config.ASANA_WORKSPACE_ID
        }
      });

      return data.data;
    } catch (error) {
      console.error('Error creating Asana project:', error);
      throw error;
    }
  }

  async getUsers(): Promise<Array<{ gid: string; name: string; email: string }>> {
    try {
      const data = await this.makeRequest('GET', '/users', undefined, {
        workspace: config.ASANA_WORKSPACE_ID,
        opt_fields: 'gid,name,email'
      });

      return data.data;
    } catch (error) {
      console.error('Error fetching Asana users:', error);
      throw error;
    }
  }

  async addComment(taskGid: string, text: string): Promise<void> {
    try {
      await this.makeRequest('POST', `/tasks/${taskGid}/stories`, {
        data: {
          text,
          type: 'comment'
        }
      });
    } catch (error) {
      console.error('Error adding comment to Asana task:', error);
      throw error;
    }
  }
}
