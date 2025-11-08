/**
 * Google Drive Integration for Call Recordings
 * 
 * Fetches call recordings from a specified Google Drive folder
 * Supports audio and video files
 */

import { google } from 'googleapis';
import type { GoogleDriveFile } from '../../types/call-recording-types';
import * as fs from 'fs';
import * as path from 'path';

export class GoogleDriveIntegration {
  private drive: any;
  private auth: any;
  
  constructor(credentials: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    refreshToken: string;
  }) {
    const { clientId, clientSecret, redirectUri, refreshToken } = credentials;
    
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    
    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
    
    this.auth = oauth2Client;
    this.drive = google.drive({ version: 'v3', auth: oauth2Client });
  }
  
  /**
   * List all recordings in a specific folder
   */
  async listRecordingsInFolder(folderId: string): Promise<GoogleDriveFile[]> {
    try {
      // Supported audio/video mime types
      const supportedMimeTypes = [
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'audio/x-wav',
        'audio/mp4',
        'audio/m4a',
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
      ];
      
      const query = [
        `'${folderId}' in parents`,
        'trashed = false',
        `(${supportedMimeTypes.map((type) => `mimeType='${type}'`).join(' or ')})`,
      ].join(' and ');
      
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, owners)',
        orderBy: 'modifiedTime desc',
        pageSize: 100,
      });
      
      return response.data.files || [];
    } catch (error) {
      console.error('Error listing Google Drive recordings:', error);
      throw error;
    }
  }
  
  /**
   * Download a recording file
   */
  async downloadRecording(
    fileId: string,
    destinationPath: string
  ): Promise<string> {
    try {
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );
      
      // Ensure directory exists
      const dir = path.dirname(destinationPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Download file
      return new Promise((resolve, reject) => {
        const dest = fs.createWriteStream(destinationPath);
        response.data
          .on('end', () => {
            console.log(`Downloaded file to ${destinationPath}`);
            resolve(destinationPath);
          })
          .on('error', (err: Error) => {
            console.error('Error downloading file:', err);
            reject(err);
          })
          .pipe(dest);
      });
    } catch (error) {
      console.error('Error downloading recording:', error);
      throw error;
    }
  }
  
  /**
   * Get file metadata
   */
  async getFileMetadata(fileId: string): Promise<GoogleDriveFile> {
    try {
      const response = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, webContentLink, owners',
      });
      
      return response.data;
    } catch (error) {
      console.error('Error getting file metadata:', error);
      throw error;
    }
  }
  
  /**
   * Watch a folder for new recordings
   * Sets up a webhook to receive notifications when files are added
   */
  async watchFolder(folderId: string, webhookUrl: string): Promise<{
    channelId: string;
    resourceId: string;
    expiration: string;
  }> {
    try {
      const response = await this.drive.files.watch({
        fileId: folderId,
        requestBody: {
          id: `channel-${Date.now()}`,
          type: 'web_hook',
          address: webhookUrl,
        },
      });
      
      return {
        channelId: response.data.id,
        resourceId: response.data.resourceId,
        expiration: response.data.expiration,
      };
    } catch (error) {
      console.error('Error setting up folder watch:', error);
      throw error;
    }
  }
  
  /**
   * Stop watching a folder
   */
  async stopWatch(channelId: string, resourceId: string): Promise<void> {
    try {
      await this.drive.channels.stop({
        requestBody: {
          id: channelId,
          resourceId,
        },
      });
      
      console.log('Stopped watching folder');
    } catch (error) {
      console.error('Error stopping folder watch:', error);
      throw error;
    }
  }
  
  /**
   * Get OAuth authorization URL
   */
  static getAuthUrl(clientId: string, clientSecret: string, redirectUri: string): string {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    
    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
    ];
    
    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
    });
  }
  
  /**
   * Exchange authorization code for tokens
   */
  static async getTokensFromCode(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiryDate: number;
  }> {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );
    
    const { tokens } = await oauth2Client.getToken(code);
    
    return {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token!,
      expiryDate: tokens.expiry_date!,
    };
  }
}

