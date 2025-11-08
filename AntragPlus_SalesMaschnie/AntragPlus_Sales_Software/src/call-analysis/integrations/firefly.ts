/**
 * Firefly.ai Integration for Call Recordings
 * 
 * Receives webhooks from Firefly.ai when meetings are recorded
 * Fetches transcripts and recordings for analysis
 */

import axios from 'axios';
import type { FireflyWebhookPayload } from '../../types/call-recording-types';

export class FireflyIntegration {
  private apiKey: string;
  private baseUrl: string = 'https://api.fireflies.ai/graphql';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  /**
   * Process Firefly webhook payload
   */
  processWebhook(payload: any): FireflyWebhookPayload {
    return {
      event_type: payload.event_type || payload.eventType,
      meeting_id: payload.meeting_id || payload.meetingId,
      meeting_title: payload.meeting_title || payload.title,
      meeting_date: payload.meeting_date || payload.date,
      duration_seconds: payload.duration_seconds || payload.duration,
      participants: payload.participants || [],
      transcript_url: payload.transcript_url || payload.transcriptUrl,
      audio_url: payload.audio_url || payload.audioUrl,
      video_url: payload.video_url || payload.videoUrl,
      summary: payload.summary,
    };
  }
  
  /**
   * Fetch transcript from Firefly using GraphQL
   */
  async getTranscript(meetingId: string): Promise<{
    transcript: string;
    sentences: Array<{
      text: string;
      speaker_name: string;
      start_time: number;
      end_time: number;
    }>;
  }> {
    const query = `
      query Transcript($transcriptId: String!) {
        transcript(id: $transcriptId) {
          id
          title
          date
          duration
          sentences {
            text
            speaker_name
            start_time
            end_time
          }
        }
      }
    `;
    
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          query,
          variables: { transcriptId: meetingId },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = response.data.data.transcript;
      
      // Compile full transcript
      const fullTranscript = data.sentences
        .map((s: any) => `${s.speaker_name}: ${s.text}`)
        .join('\n');
      
      return {
        transcript: fullTranscript,
        sentences: data.sentences,
      };
    } catch (error) {
      console.error('Error fetching Firefly transcript:', error);
      throw error;
    }
  }
  
  /**
   * Get meeting metadata
   */
  async getMeetingMetadata(meetingId: string): Promise<{
    id: string;
    title: string;
    date: string;
    duration: number;
    participants: string[];
    organizer: string;
  }> {
    const query = `
      query Meeting($transcriptId: String!) {
        transcript(id: $transcriptId) {
          id
          title
          date
          duration
          participants
          organizer_email
        }
      }
    `;
    
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          query,
          variables: { transcriptId: meetingId },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = response.data.data.transcript;
      
      return {
        id: data.id,
        title: data.title,
        date: data.date,
        duration: data.duration,
        participants: data.participants || [],
        organizer: data.organizer_email,
      };
    } catch (error) {
      console.error('Error fetching Firefly meeting metadata:', error);
      throw error;
    }
  }
  
  /**
   * List recent meetings
   */
  async listRecentMeetings(limit: number = 10): Promise<Array<{
    id: string;
    title: string;
    date: string;
    duration: number;
  }>> {
    const query = `
      query Transcripts($limit: Int!) {
        transcripts(limit: $limit) {
          id
          title
          date
          duration
        }
      }
    `;
    
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          query,
          variables: { limit },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data.data.transcripts || [];
    } catch (error) {
      console.error('Error fetching Firefly meetings:', error);
      throw error;
    }
  }
  
  /**
   * Search meetings by keyword
   */
  async searchMeetings(keyword: string, limit: number = 10): Promise<Array<{
    id: string;
    title: string;
    date: string;
    duration: number;
  }>> {
    const query = `
      query SearchTranscripts($keyword: String!, $limit: Int!) {
        transcripts(search: $keyword, limit: $limit) {
          id
          title
          date
          duration
        }
      }
    `;
    
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          query,
          variables: { keyword, limit },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.data.data.transcripts || [];
    } catch (error) {
      console.error('Error searching Firefly meetings:', error);
      throw error;
    }
  }
  
  /**
   * Download recording audio/video
   */
  async getRecordingUrl(meetingId: string): Promise<{
    audioUrl?: string;
    videoUrl?: string;
  }> {
    const query = `
      query Recording($transcriptId: String!) {
        transcript(id: $transcriptId) {
          audio_url
          video_url
        }
      }
    `;
    
    try {
      const response = await axios.post(
        this.baseUrl,
        {
          query,
          variables: { transcriptId: meetingId },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const data = response.data.data.transcript;
      
      return {
        audioUrl: data.audio_url,
        videoUrl: data.video_url,
      };
    } catch (error) {
      console.error('Error fetching Firefly recording URLs:', error);
      throw error;
    }
  }
}

/**
 * Webhook handler for Firefly events
 */
export async function handleFireflyWebhook(
  payload: any,
  onTranscriptReady: (data: FireflyWebhookPayload) => Promise<void>
): Promise<void> {
  const integration = new FireflyIntegration(process.env.FIREFLY_API_KEY || '');
  const webhookData = integration.processWebhook(payload);
  
  console.log(`Received Firefly webhook: ${webhookData.event_type} for meeting ${webhookData.meeting_id}`);
  
  if (webhookData.event_type === 'transcript_ready') {
    await onTranscriptReady(webhookData);
  }
}

