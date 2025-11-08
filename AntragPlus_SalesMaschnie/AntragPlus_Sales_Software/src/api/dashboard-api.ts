/**
 * Dashboard API Endpoints
 * Provides data for the sales dashboard
 */

import { Pool } from 'pg';
import type {
  CallRecording,
  StraightLineAnalysis,
  CallTranscript,
} from '../types/call-recording-types';

export interface DashboardTodo {
  id: number;
  title: string;
  description: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  deadline: Date;
  source: string;
  relatedDealId?: number;
  relatedCallRecordingId?: number;
  relatedProspectName?: string;
  goal: string;
  strategy?: string;
  recommendedScript?: string;
  checklist?: { item: string; completed: boolean }[];
  resources?: {
    script?: string;
    training?: string;
    template?: string;
    aiDraft?: string;
  };
  status: 'pending' | 'in_progress' | 'completed' | 'snoozed';
  aiReason: string;
  aiConfidence: number;
  createdAt: Date;
}

export interface ScheduledCall {
  id: number;
  prospectName: string;
  prospectCompany?: string;
  callType: string;
  scheduledTime: Date;
  durationMinutes: number;
  pipedriveDealId?: number;
  lastCallScore?: number;
  painPoints?: string[];
  objectionsExpected?: string[];
  recommendedScript?: string;
  prepNotes?: string;
  status: string;
}

export interface DashboardStats {
  // Today's stats
  tasksTotal: number;
  tasksCompleted: number;
  callsScheduled: number;
  callsCompleted: number;
  urgentTasks: number;
  pipelineValue: number;
  quotaProgress: number;
  consecutiveDaysActive: number;
  
  // Performance
  avgCallScore: number;
  avgCertaintyProduct: number;
  avgCertaintySalesperson: number;
  avgCertaintyCompany: number;
  
  // Trends
  scoreVsLastWeek: number;
  callsVsLastWeek: number;
  conversionRate: number;
}

export interface RecentCallWithAnalysis {
  recording: CallRecording;
  analysis: StraightLineAnalysis;
  transcript?: CallTranscript;
}

export class DashboardAPI {
  private db: Pool;
  
  constructor(databaseUrl: string) {
    this.db = new Pool({ connectionString: databaseUrl });
  }
  
  /**
   * Get TODAY view data
   */
  async getTodayView(salesRepId: number): Promise<{
    stats: DashboardStats;
    todos: DashboardTodo[];
    scheduledCalls: ScheduledCall[];
    recentInsights: any[];
  }> {
    const [stats, todos, scheduledCalls, recentInsights] = await Promise.all([
      this.getDashboardStats(salesRepId),
      this.getTodos(salesRepId),
      this.getScheduledCalls(salesRepId),
      this.getRecentInsights(salesRepId),
    ]);
    
    return {
      stats,
      todos,
      scheduledCalls,
      recentInsights,
    };
  }
  
  /**
   * Get dashboard stats
   */
  private async getDashboardStats(salesRepId: number): Promise<DashboardStats> {
    // Today's tasks
    const tasksQuery = await this.db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status != 'completed') as tasks_total,
        COUNT(*) FILTER (WHERE status = 'completed') as tasks_completed,
        COUNT(*) FILTER (WHERE priority = 'URGENT' AND status != 'completed') as urgent_tasks
      FROM ai_todos 
      WHERE sales_rep_id = $1 
        AND (deadline IS NULL OR deadline::date = CURRENT_DATE OR status != 'completed')`,
      [salesRepId]
    );
    
    // Today's calls
    const callsQuery = await this.db.query(
      `SELECT 
        COUNT(*) FILTER (WHERE status = 'scheduled') as calls_scheduled,
        COUNT(*) FILTER (WHERE status = 'completed') as calls_completed
      FROM call_schedule 
      WHERE sales_rep_id = $1 
        AND scheduled_time::date = CURRENT_DATE`,
      [salesRepId]
    );
    
    // Performance metrics (last 7 days)
    const perfQuery = await this.db.query(
      `SELECT 
        AVG(overall_straight_line_score) as avg_score,
        AVG(certainty_product) as avg_product,
        AVG(certainty_salesperson) as avg_salesperson,
        AVG(certainty_company) as avg_company
      FROM straight_line_analysis sla
      JOIN call_recordings cr ON sla.recording_id = cr.id
      WHERE cr.sales_rep_id = $1 
        AND cr.call_date >= CURRENT_DATE - INTERVAL '7 days'`,
      [salesRepId]
    );
    
    // Quota & pipeline (from Pipedrive - mock for now)
    const quotaProgress = 75; // TODO: Get from Pipedrive
    const pipelineValue = 45000; // TODO: Get from Pipedrive
    
    // Streak
    const streakQuery = await this.db.query(
      `SELECT consecutive_days_active 
      FROM dashboard_stats 
      WHERE sales_rep_id = $1 
      ORDER BY stat_date DESC LIMIT 1`,
      [salesRepId]
    );
    
    const tasks = tasksQuery.rows[0] || {};
    const calls = callsQuery.rows[0] || {};
    const perf = perfQuery.rows[0] || {};
    const streak = streakQuery.rows[0]?.consecutive_days_active || 0;
    
    return {
      tasksTotal: parseInt(tasks.tasks_total || '0'),
      tasksCompleted: parseInt(tasks.tasks_completed || '0'),
      callsScheduled: parseInt(calls.calls_scheduled || '0'),
      callsCompleted: parseInt(calls.calls_completed || '0'),
      urgentTasks: parseInt(tasks.urgent_tasks || '0'),
      pipelineValue,
      quotaProgress,
      consecutiveDaysActive: streak,
      avgCallScore: parseFloat(perf.avg_score || '0'),
      avgCertaintyProduct: parseFloat(perf.avg_product || '0'),
      avgCertaintySalesperson: parseFloat(perf.avg_salesperson || '0'),
      avgCertaintyCompany: parseFloat(perf.avg_company || '0'),
      scoreVsLastWeek: 0.8, // TODO: Calculate
      callsVsLastWeek: 3, // TODO: Calculate
      conversionRate: 60, // TODO: Calculate
    };
  }
  
  /**
   * Get TODOs for a sales rep
   */
  async getTodos(
    salesRepId: number,
    filters?: {
      status?: string;
      priority?: string;
      limit?: number;
    }
  ): Promise<DashboardTodo[]> {
    let query = `
      SELECT * FROM ai_todos 
      WHERE sales_rep_id = $1
    `;
    
    const params: any[] = [salesRepId];
    let paramCount = 2;
    
    if (filters?.status) {
      query += ` AND status = $${paramCount++}`;
      params.push(filters.status);
    } else {
      // Default: only show non-completed
      query += ` AND status != 'completed'`;
    }
    
    if (filters?.priority) {
      query += ` AND priority = $${paramCount++}`;
      params.push(filters.priority);
    }
    
    // Order by priority and deadline
    query += `
      ORDER BY 
        CASE priority
          WHEN 'URGENT' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          WHEN 'LOW' THEN 4
        END,
        deadline ASC NULLS LAST,
        created_at DESC
    `;
    
    if (filters?.limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(filters.limit);
    }
    
    const result = await this.db.query(query, params);
    
    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      priority: row.priority,
      deadline: row.deadline,
      source: row.source,
      relatedDealId: row.related_deal_id,
      relatedCallRecordingId: row.related_call_recording_id,
      relatedProspectName: row.related_prospect_name,
      goal: row.goal,
      strategy: row.strategy,
      recommendedScript: row.recommended_script,
      checklist: row.checklist,
      resources: row.resources,
      status: row.status,
      aiReason: row.ai_reason,
      aiConfidence: parseFloat(row.ai_confidence),
      createdAt: row.created_at,
    }));
  }
  
  /**
   * Get scheduled calls
   */
  async getScheduledCalls(
    salesRepId: number,
    filters?: {
      date?: Date;
      status?: string;
    }
  ): Promise<ScheduledCall[]> {
    let query = `
      SELECT * FROM call_schedule 
      WHERE sales_rep_id = $1
    `;
    
    const params: any[] = [salesRepId];
    let paramCount = 2;
    
    if (filters?.date) {
      query += ` AND scheduled_time::date = $${paramCount++}::date`;
      params.push(filters.date);
    } else {
      // Default: today's calls
      query += ` AND scheduled_time::date = CURRENT_DATE`;
    }
    
    if (filters?.status) {
      query += ` AND status = $${paramCount++}`;
      params.push(filters.status);
    } else {
      query += ` AND status = 'scheduled'`;
    }
    
    query += ` ORDER BY scheduled_time ASC`;
    
    const result = await this.db.query(query, params);
    
    return result.rows.map((row) => ({
      id: row.id,
      prospectName: row.prospect_name,
      prospectCompany: row.prospect_company,
      callType: row.call_type,
      scheduledTime: row.scheduled_time,
      durationMinutes: row.duration_minutes,
      pipedriveDealId: row.pipedrive_deal_id,
      lastCallScore: row.last_call_score,
      painPoints: row.pain_points,
      objectionsExpected: row.objections_expected,
      recommendedScript: row.recommended_script,
      prepNotes: row.prep_notes,
      status: row.status,
    }));
  }
  
  /**
   * Get recent insights
   */
  private async getRecentInsights(salesRepId: number): Promise<any[]> {
    const query = `
      SELECT 
        cr.id,
        cr.prospect_name,
        cr.call_date,
        sla.overall_straight_line_score,
        sla.conversion_likelihood,
        sla.ai_summary,
        sla.coaching_points
      FROM call_recordings cr
      JOIN straight_line_analysis sla ON sla.recording_id = cr.id
      WHERE cr.sales_rep_id = $1
        AND cr.call_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY cr.call_date DESC
      LIMIT 5
    `;
    
    const result = await this.db.query(query, [salesRepId]);
    return result.rows;
  }
  
  /**
   * Get recent calls with analysis
   */
  async getRecentCallsWithAnalysis(
    salesRepId: number,
    limit: number = 10
  ): Promise<RecentCallWithAnalysis[]> {
    const query = `
      SELECT 
        cr.*,
        sla.*,
        ct.*
      FROM call_recordings cr
      LEFT JOIN straight_line_analysis sla ON sla.recording_id = cr.id
      LEFT JOIN call_transcripts ct ON ct.recording_id = cr.id
      WHERE cr.sales_rep_id = $1
      ORDER BY cr.call_date DESC
      LIMIT $2
    `;
    
    const result = await this.db.query(query, [salesRepId, limit]);
    
    // TODO: Transform rows to proper structure
    return [];
  }
  
  /**
   * Update TODO status
   */
  async updateTodoStatus(
    todoId: number,
    status: 'pending' | 'in_progress' | 'completed' | 'snoozed',
    completedAt?: Date
  ): Promise<void> {
    const query = `
      UPDATE ai_todos 
      SET status = $1,
          completed_at = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `;
    
    await this.db.query(query, [status, completedAt, todoId]);
  }
  
  /**
   * Update TODO checklist item
   */
  async updateTodoChecklistItem(
    todoId: number,
    itemIndex: number,
    completed: boolean
  ): Promise<void> {
    const query = `
      UPDATE ai_todos 
      SET checklist = jsonb_set(
            checklist,
            ARRAY[$2::text, 'completed'],
            $3::text::jsonb
          ),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    await this.db.query(query, [todoId, itemIndex, completed]);
  }
  
  /**
   * Mark TODO as viewed
   */
  async markTodoViewed(todoId: number): Promise<void> {
    await this.db.query(
      `UPDATE ai_todos SET viewed_at = CURRENT_TIMESTAMP WHERE id = $1 AND viewed_at IS NULL`,
      [todoId]
    );
  }
  
  /**
   * Close database connection
   */
  async close(): Promise<void> {
    await this.db.end();
  }
}


