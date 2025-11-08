/**
 * Call Recording Processor
 * Main orchestrator for processing call recordings through the Straight Line analysis
 */

import 'dotenv/config';
import { Pool } from 'pg';
import { OpenAI } from 'openai';
import { StraightLineAnalyzer } from './straight-line-analyzer';
import { FireflyIntegration } from './integrations/firefly';
import { GoogleDriveIntegration } from './integrations/google-drive';
import type {
  CallRecording,
  CallTranscript,
  StraightLineAnalysis,
  CallRecordingSource,
  CallType,
  SpeakerSegment,
} from '../types/call-recording-types';

export class CallRecordingProcessor {
  private db: Pool;
  private openai: OpenAI;
  private analyzer: StraightLineAnalyzer;
  private firefly?: FireflyIntegration;
  private googleDrive?: GoogleDriveIntegration;
  
  constructor(config: {
    databaseUrl: string;
    openaiApiKey: string;
    fireflyApiKey?: string;
    googleDriveCredentials?: any;
  }) {
    this.db = new Pool({ connectionString: config.databaseUrl });
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    this.analyzer = new StraightLineAnalyzer(config.openaiApiKey);
    
    if (config.fireflyApiKey) {
      this.firefly = new FireflyIntegration(config.fireflyApiKey);
    }
    
    if (config.googleDriveCredentials) {
      this.googleDrive = new GoogleDriveIntegration(config.googleDriveCredentials);
    }
  }
  
  /**
   * Process a new recording from Firefly
   */
  async processFireflyRecording(meetingId: string): Promise<number> {
    if (!this.firefly) {
      throw new Error('Firefly integration not configured');
    }
    
    console.log(`Processing Firefly recording: ${meetingId}`);
    
    // Get meeting metadata
    const metadata = await this.firefly.getMeetingMetadata(meetingId);
    
    // Get transcript
    const transcriptData = await this.firefly.getTranscript(meetingId);
    
    // Get recording URLs
    const urls = await this.firefly.getRecordingUrl(meetingId);
    
    // Create recording entry
    const recordingId = await this.createRecording({
      recordingId: `firefly-${meetingId}`,
      source: 'firefly',
      fireflyMeetingId: meetingId,
      callDate: new Date(metadata.date),
      durationSeconds: metadata.duration,
      prospectName: metadata.participants[0],
      audioUrl: urls.audioUrl,
      videoUrl: urls.videoUrl,
    });
    
    // Process transcript
    await this.processTranscript(recordingId, transcriptData);
    
    return recordingId;
  }
  
  /**
   * Process a recording from Google Drive
   */
  async processGoogleDriveRecording(fileId: string): Promise<number> {
    if (!this.googleDrive) {
      throw new Error('Google Drive integration not configured');
    }
    
    console.log(`Processing Google Drive recording: ${fileId}`);
    
    // Get file metadata
    const file = await this.googleDrive.getFileMetadata(fileId);
    
    // Create recording entry
    const recordingId = await this.createRecording({
      recordingId: `gdrive-${fileId}`,
      source: 'google_drive',
      googleDriveId: fileId,
      sourceUrl: file.webViewLink,
      callDate: new Date(file.createdTime),
      audioUrl: file.webContentLink,
    });
    
    // Download and transcribe
    await this.transcribeRecording(recordingId, file.webContentLink);
    
    return recordingId;
  }
  
  /**
   * Create a recording entry in the database
   */
  private async createRecording(data: Partial<CallRecording>): Promise<number> {
    const query = `
      INSERT INTO call_recordings (
        recording_id, source, source_url, google_drive_id, firefly_meeting_id,
        call_date, duration_seconds, call_type, sales_rep_id, sales_rep_name,
        prospect_name, prospect_company, pipedrive_deal_id, pipedrive_person_id,
        pipedrive_org_id, audio_url, video_url, processing_status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING id
    `;
    
    const values = [
      data.recordingId,
      data.source,
      data.sourceUrl,
      data.googleDriveId,
      data.fireflyMeetingId,
      data.callDate,
      data.durationSeconds,
      data.callType,
      data.salesRepId,
      data.salesRepName,
      data.prospectName,
      data.prospectCompany,
      data.pipedriveDealId,
      data.pipedrivePersonId,
      data.pipedriveOrgId,
      data.audioUrl,
      data.videoUrl,
      'pending',
    ];
    
    const result = await this.db.query(query, values);
    return result.rows[0].id;
  }
  
  /**
   * Transcribe a recording using OpenAI Whisper
   */
  private async transcribeRecording(recordingId: number, audioUrl: string): Promise<void> {
    console.log(`Transcribing recording ${recordingId}...`);
    
    // Update status
    await this.db.query(
      'UPDATE call_recordings SET processing_status = $1 WHERE id = $2',
      ['transcribing', recordingId]
    );
    
    // Note: In production, you would download the audio file first
    // For now, we'll simulate this
    
    // TODO: Implement actual Whisper transcription
    // const transcription = await this.openai.audio.transcriptions.create({
    //   file: audioFile,
    //   model: 'whisper-1',
    //   response_format: 'verbose_json',
    //   timestamp_granularities: ['segment'],
    // });
    
    console.log(`Transcription complete for recording ${recordingId}`);
  }
  
  /**
   * Process transcript and run analysis
   */
  private async processTranscript(
    recordingId: number,
    transcriptData: {
      transcript: string;
      sentences: Array<{
        text: string;
        speaker_name: string;
        start_time: number;
        end_time: number;
      }>;
    }
  ): Promise<void> {
    console.log(`Processing transcript for recording ${recordingId}...`);
    
    // Update status
    await this.db.query(
      'UPDATE call_recordings SET processing_status = $1 WHERE id = $2',
      ['analyzing', recordingId]
    );
    
    // Convert to speaker segments
    const speakerSegments: SpeakerSegment[] = transcriptData.sentences.map((s) => ({
      speaker: s.speaker_name.toLowerCase().includes('sales') || s.speaker_name.toLowerCase().includes('rep') 
        ? 'sales_rep' 
        : 'prospect',
      startTime: s.start_time,
      endTime: s.end_time,
      duration: s.end_time - s.start_time,
      text: s.text,
    }));
    
    // Calculate talk time statistics
    const salesRepTime = speakerSegments
      .filter((s) => s.speaker === 'sales_rep')
      .reduce((sum, s) => sum + s.duration, 0);
    
    const prospectTime = speakerSegments
      .filter((s) => s.speaker === 'prospect')
      .reduce((sum, s) => sum + s.duration, 0);
    
    const talkRatio = prospectTime > 0 ? salesRepTime / prospectTime : 0;
    
    // Save transcript
    const transcriptQuery = `
      INSERT INTO call_transcripts (
        recording_id, full_transcript, transcript_json, speaker_segments,
        word_count, sales_rep_talk_time_seconds, prospect_talk_time_seconds, talk_ratio
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
    `;
    
    const transcriptValues = [
      recordingId,
      transcriptData.transcript,
      JSON.stringify({ segments: transcriptData.sentences }),
      JSON.stringify(speakerSegments),
      transcriptData.transcript.split(/\s+/).length,
      Math.round(salesRepTime),
      Math.round(prospectTime),
      talkRatio,
    ];
    
    const transcriptResult = await this.db.query(transcriptQuery, transcriptValues);
    const transcriptId = transcriptResult.rows[0].id;
    
    // Create CallTranscript object for analysis
    const transcript: CallTranscript = {
      id: transcriptId,
      recordingId,
      fullTranscript: transcriptData.transcript,
      transcriptJson: { segments: speakerSegments },
      speakerSegments,
      wordCount: transcriptData.transcript.split(/\s+/).length,
      salesRepTalkTimeSeconds: Math.round(salesRepTime),
      prospectTalkTimeSeconds: Math.round(prospectTime),
      talkRatio,
      createdAt: new Date(),
    };
    
    // Run Straight Line analysis
    await this.runAnalysis(recordingId, transcript);
  }
  
  /**
   * Run Straight Line analysis on a transcript
   */
  private async runAnalysis(recordingId: number, transcript: CallTranscript): Promise<void> {
    console.log(`Running Straight Line analysis for recording ${recordingId}...`);
    
    try {
      // Run the analysis
      const analysis = await this.analyzer.analyzeSalesCall(transcript, recordingId);
      
      // Save analysis to database
      const query = `
        INSERT INTO straight_line_analysis (
          recording_id, certainty_product, certainty_salesperson, certainty_company,
          tonality_score, tonality_confidence, tonality_enthusiasm, tonality_authenticity,
          script_adherence_score, script_type, script_sections_completed,
          rapport_score, mirroring_detected, active_listening_score,
          discovery_questions_asked, discovery_quality_score, pain_points_identified,
          presentation_clarity_score, benefits_vs_features_ratio, value_proposition_strength,
          objections_encountered, objections_handled_count, objection_handling_score,
          closing_attempts, closing_technique, closing_success,
          overall_straight_line_score, conversion_likelihood,
          ai_summary, strengths, areas_for_improvement, key_quotes,
          coaching_points, recommended_training, analyzed_by, ai_model_version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36
        )
      `;
      
      const values = [
        analysis.recordingId,
        analysis.certaintyProduct,
        analysis.certaintySalesperson,
        analysis.certaintyCompany,
        analysis.tonalityScore,
        analysis.tonalityConfidence,
        analysis.tonalityEnthusiasm,
        analysis.tonalityAuthenticity,
        analysis.scriptAdherenceScore,
        analysis.scriptType,
        JSON.stringify(analysis.scriptSectionsCompleted),
        analysis.rapportScore,
        analysis.mirroringDetected,
        analysis.activeListeningScore,
        analysis.discoveryQuestionsAsked,
        analysis.discoveryQualityScore,
        JSON.stringify(analysis.painPointsIdentified),
        analysis.presentationClarityScore,
        analysis.benefitsVsFeaturesRatio,
        analysis.valuePropositionStrength,
        JSON.stringify(analysis.objectionsEncountered),
        analysis.objectionsHandledCount,
        analysis.objectionHandlingScore,
        analysis.closingAttempts,
        analysis.closingTechnique,
        analysis.closingSuccess,
        analysis.overallStraightLineScore,
        analysis.conversionLikelihood,
        analysis.aiSummary,
        JSON.stringify(analysis.strengths),
        JSON.stringify(analysis.areasForImprovement),
        JSON.stringify(analysis.keyQuotes),
        JSON.stringify(analysis.coachingPoints),
        JSON.stringify(analysis.recommendedTraining),
        analysis.analyzedBy,
        analysis.aiModelVersion,
      ];
      
      await this.db.query(query, values);
      
      // Update recording status
      await this.db.query(
        'UPDATE call_recordings SET processing_status = $1, analysis_completed = true, analyzed_at = NOW() WHERE id = $2',
        ['completed', recordingId]
      );
      
      console.log(`✅ Analysis complete for recording ${recordingId}`);
      console.log(`Overall Straight Line Score: ${analysis.overallStraightLineScore}/10`);
      console.log(`Conversion Likelihood: ${analysis.conversionLikelihood}/10`);
      
    } catch (error) {
      console.error(`Error analyzing recording ${recordingId}:`, error);
      
      // Update status to error
      await this.db.query(
        'UPDATE call_recordings SET processing_status = $1 WHERE id = $2',
        ['error', recordingId]
      );
      
      throw error;
    }
  }
  
  /**
   * Get analysis for a recording
   */
  async getAnalysis(recordingId: number): Promise<StraightLineAnalysis | null> {
    const query = 'SELECT * FROM straight_line_analysis WHERE recording_id = $1';
    const result = await this.db.query(query, [recordingId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    return {
      id: row.id,
      recordingId: row.recording_id,
      certaintyProduct: parseFloat(row.certainty_product),
      certaintySalesperson: parseFloat(row.certainty_salesperson),
      certaintyCompany: parseFloat(row.certainty_company),
      tonalityScore: parseFloat(row.tonality_score),
      tonalityConfidence: parseFloat(row.tonality_confidence),
      tonalityEnthusiasm: parseFloat(row.tonality_enthusiasm),
      tonalityAuthenticity: parseFloat(row.tonality_authenticity),
      scriptAdherenceScore: parseFloat(row.script_adherence_score),
      scriptType: row.script_type,
      scriptSectionsCompleted: row.script_sections_completed,
      rapportScore: parseFloat(row.rapport_score),
      mirroringDetected: row.mirroring_detected,
      activeListeningScore: parseFloat(row.active_listening_score),
      discoveryQuestionsAsked: row.discovery_questions_asked,
      discoveryQualityScore: parseFloat(row.discovery_quality_score),
      painPointsIdentified: row.pain_points_identified,
      presentationClarityScore: parseFloat(row.presentation_clarity_score),
      benefitsVsFeaturesRatio: parseFloat(row.benefits_vs_features_ratio),
      valuePropositionStrength: parseFloat(row.value_proposition_strength),
      objectionsEncountered: row.objections_encountered,
      objectionsHandledCount: row.objections_handled_count,
      objectionHandlingScore: parseFloat(row.objection_handling_score),
      closingAttempts: row.closing_attempts,
      closingTechnique: row.closing_technique,
      closingSuccess: row.closing_success,
      overallStraightLineScore: parseFloat(row.overall_straight_line_score),
      conversionLikelihood: parseFloat(row.conversion_likelihood),
      aiSummary: row.ai_summary,
      strengths: row.strengths,
      areasForImprovement: row.areas_for_improvement,
      keyQuotes: row.key_quotes,
      coachingPoints: row.coaching_points,
      recommendedTraining: row.recommended_training,
      createdAt: row.created_at,
      analyzedBy: row.analyzed_by,
      aiModelVersion: row.ai_model_version,
    };
  }
  
  /**
   * List all recordings with their analysis status
   */
  async listRecordings(filters?: {
    salesRepId?: number;
    startDate?: Date;
    endDate?: Date;
    status?: string;
  }): Promise<CallRecording[]> {
    let query = 'SELECT * FROM call_recordings WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;
    
    if (filters?.salesRepId) {
      query += ` AND sales_rep_id = $${paramCount++}`;
      values.push(filters.salesRepId);
    }
    
    if (filters?.startDate) {
      query += ` AND call_date >= $${paramCount++}`;
      values.push(filters.startDate);
    }
    
    if (filters?.endDate) {
      query += ` AND call_date <= $${paramCount++}`;
      values.push(filters.endDate);
    }
    
    if (filters?.status) {
      query += ` AND processing_status = $${paramCount++}`;
      values.push(filters.status);
    }
    
    query += ' ORDER BY call_date DESC';
    
    const result = await this.db.query(query, values);
    return result.rows;
  }
  
  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.db.end();
  }
}

