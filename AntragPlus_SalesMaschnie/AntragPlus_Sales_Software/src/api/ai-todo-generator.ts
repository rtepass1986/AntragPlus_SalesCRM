/**
 * AI TODO Generator
 * Automatically creates tasks based on call analysis, calendar, and sales flow
 */

import { Pool } from 'pg';
import type {
  StraightLineAnalysis,
  CallRecording,
} from '../types/call-recording-types';
import type { DashboardTodo } from './dashboard-api';

export class AITodoGenerator {
  private db: Pool;
  
  constructor(databaseUrl: string) {
    this.db = new Pool({ connectionString: databaseUrl });
  }
  
  /**
   * Generate TODOs after a call is analyzed
   */
  async generateTodosFromCallAnalysis(
    recording: CallRecording,
    analysis: StraightLineAnalysis
  ): Promise<number[]> {
    const todos: Omit<DashboardTodo, 'id' | 'createdAt'>[] = [];
    
    // 1. LOW SCORE - Review recording
    if (analysis.overallStraightLineScore < 7.0) {
      todos.push({
        title: 'Review low-scoring call recording',
        description: `Call with ${recording.prospectName} scored ${analysis.overallStraightLineScore}/10`,
        priority: analysis.overallStraightLineScore < 5.0 ? 'URGENT' : 'HIGH',
        deadline: this.calculateDeadline('before_next_call'),
        source: 'ai_call_analysis',
        relatedDealId: recording.pipedriveDealId,
        relatedCallRecordingId: recording.id,
        relatedProspectName: recording.prospectName,
        goal: `Understand what went wrong and improve next time`,
        strategy: `Focus on: ${this.getWeakAreas(analysis).join(', ')}`,
        checklist: [
          { item: 'Listen to full recording', completed: false },
          { item: 'Read AI coaching points', completed: false },
          { item: 'Practice improved approach', completed: false },
        ],
        resources: {
          training: this.getRecommendedTraining(analysis),
        },
        status: 'pending',
        aiReason: `Call score (${analysis.overallStraightLineScore}/10) below target. Need to review and improve.`,
        aiConfidence: 0.95,
      });
    }
    
    // 2. CERTAINTY GAPS - Follow-up needed
    const certaintyGaps = this.getCertaintyGaps(analysis);
    if (certaintyGaps.length > 0) {
      const needsUrgentFollowup = 
        analysis.certaintyProduct < 6.0 ||
        analysis.certaintySalesperson < 6.0 ||
        analysis.certaintyCompany < 6.0;
      
      todos.push({
        title: `Follow-up call needed - Build ${certaintyGaps.join(' & ')} certainty`,
        description: `${recording.prospectName} needs more certainty before closing`,
        priority: needsUrgentFollowup ? 'URGENT' : 'HIGH',
        deadline: this.calculateDeadline('24_to_48_hours'),
        source: 'ai_call_analysis',
        relatedDealId: recording.pipedriveDealId,
        relatedCallRecordingId: recording.id,
        relatedProspectName: recording.prospectName,
        goal: `Get all certainty levels to 8+/10`,
        strategy: this.getCertaintyBuildingStrategy(certaintyGaps),
        recommendedScript: 'Certainty Building Close',
        checklist: this.getCertaintyChecklist(certaintyGaps),
        status: 'pending',
        aiReason: `Certainty gaps detected: ${certaintyGaps.map(g => `${g} at ${this.getCertaintyScore(analysis, g)}/10`).join(', ')}`,
        aiConfidence: 0.90,
      });
    }
    
    // 3. NO CLOSING ATTEMPT - Training needed
    if (analysis.closingAttempts === 0 && analysis.overallStraightLineScore > 6.0) {
      todos.push({
        title: 'Training: Always Ask for the Sale',
        description: 'Recent call had no closing attempt - Jordan Belfort rule: Always close!',
        priority: 'MEDIUM',
        deadline: this.calculateDeadline('this_week'),
        source: 'ai_call_analysis',
        relatedCallRecordingId: recording.id,
        relatedProspectName: recording.prospectName,
        goal: 'Learn to always ask for the sale',
        checklist: [
          { item: 'Watch "Closing Techniques" training (15 min)', completed: false },
          { item: 'Practice 3 different closing lines', completed: false },
          { item: 'Use in next 3 calls', completed: false },
        ],
        resources: {
          training: 'Closing Techniques Module',
        },
        status: 'pending',
        aiReason: 'Good call overall but missed closing opportunity. Need to practice asking for sale.',
        aiConfidence: 0.85,
      });
    }
    
    // 4. HIGH CONVERSION LIKELIHOOD - Schedule closing call
    if (analysis.conversionLikelihood > 7.5 && !recording.pipedriveDealId) {
      todos.push({
        title: '🔥 HOT LEAD - Schedule closing call ASAP',
        description: `${recording.prospectName} shows high buying signals`,
        priority: 'URGENT',
        deadline: this.calculateDeadline('within_48_hours'),
        source: 'ai_call_analysis',
        relatedCallRecordingId: recording.id,
        relatedProspectName: recording.prospectName,
        goal: 'Close the deal',
        strategy: 'Strike while iron is hot - high conversion likelihood',
        recommendedScript: 'Assumptive Close',
        checklist: [
          { item: 'Schedule call for tomorrow or next day', completed: false },
          { item: 'Prepare closing script', completed: false },
          { item: 'Have contract/proposal ready', completed: false },
        ],
        status: 'pending',
        aiReason: `Conversion likelihood at ${analysis.conversionLikelihood}/10 - ready to close!`,
        aiConfidence: 0.92,
      });
    }
    
    // 5. POOR TALK RATIO - Coaching needed
    const talkRatio = this.estimateTalkRatio(analysis);
    if (talkRatio > 1.5) { // Rep talking too much
      todos.push({
        title: 'Coaching: Listen more, talk less',
        description: 'You talked too much in recent call - aim for 40/60 ratio',
        priority: 'MEDIUM',
        deadline: this.calculateDeadline('this_week'),
        source: 'ai_call_analysis',
        relatedCallRecordingId: recording.id,
        goal: 'Achieve 40% talk time (you) vs 60% (prospect)',
        checklist: [
          { item: 'Review "Active Listening" module', completed: false },
          { item: 'Practice asking open-ended questions', completed: false },
          { item: 'Let prospect speak more in next calls', completed: false },
        ],
        resources: {
          training: 'Active Listening Workshop',
        },
        status: 'pending',
        aiReason: 'Talk ratio imbalanced - need to let prospect speak more',
        aiConfidence: 0.80,
      });
    }
    
    // 6. FOLLOW-UP EMAIL - After good call
    if (analysis.overallStraightLineScore >= 7.0) {
      todos.push({
        title: `Send follow-up email to ${recording.prospectName}`,
        description: 'Strike while iron is hot - send summary & next steps',
        priority: 'HIGH',
        deadline: this.calculateDeadline('within_24_hours'),
        source: 'ai_call_analysis',
        relatedDealId: recording.pipedriveDealId,
        relatedCallRecordingId: recording.id,
        relatedProspectName: recording.prospectName,
        goal: 'Keep momentum going',
        checklist: [
          { item: 'Review AI-generated email draft', completed: false },
          { item: 'Customize with personal touches', completed: false },
          { item: 'Send within 24 hours', completed: false },
        ],
        resources: {
          template: 'post-call-summary',
          aiDraft: this.generateEmailDraft(recording, analysis),
        },
        status: 'pending',
        aiReason: 'Good call - send follow-up to maintain momentum',
        aiConfidence: 0.88,
      });
    }
    
    // Insert all TODOs
    const todoIds = await this.insertTodos(recording.salesRepId!, todos);
    
    return todoIds;
  }
  
  /**
   * Generate TODOs when call is scheduled
   */
  async generateTodosFromScheduledCall(
    salesRepId: number,
    scheduledCall: {
      id: number;
      prospectName: string;
      scheduledTime: Date;
      callType: string;
      pipedriveDealId?: number;
      lastCallScore?: number;
    }
  ): Promise<number[]> {
    const todos: Omit<DashboardTodo, 'id' | 'createdAt'>[] = [];
    
    // Prep task 30-60 minutes before call
    const prepDeadline = new Date(scheduledCall.scheduledTime);
    prepDeadline.setMinutes(prepDeadline.getMinutes() - 30);
    
    todos.push({
      title: `Prep for ${scheduledCall.callType} call: ${scheduledCall.prospectName}`,
      description: `Call scheduled for ${scheduledCall.scheduledTime.toLocaleTimeString()}`,
      priority: 'HIGH',
      deadline: prepDeadline,
      source: 'calendar',
      relatedDealId: scheduledCall.pipedriveDealId,
      relatedProspectName: scheduledCall.prospectName,
      goal: 'Be fully prepared for the call',
      recommendedScript: this.getScriptForCallType(scheduledCall.callType),
      checklist: [
        { item: 'Review previous call notes', completed: false },
        { item: 'Review prospect pain points', completed: false },
        { item: 'Customize script to their needs', completed: false },
        { item: 'Prepare objection responses', completed: false },
        { item: 'Have case studies/materials ready', completed: false },
      ],
      status: 'pending',
      aiReason: `Scheduled ${scheduledCall.callType} call needs preparation`,
      aiConfidence: 0.95,
    });
    
    return await this.insertTodos(salesRepId, todos);
  }
  
  /**
   * Generate TODOs based on sales flow triggers
   */
  async generateTodosFromSalesFlow(
    salesRepId: number,
    trigger: {
      type: 'deal_stuck' | 'no_activity' | 'proposal_sent' | 'demo_completed';
      dealId: number;
      prospectName: string;
      daysSince: number;
      context?: any;
    }
  ): Promise<number[]> {
    const todos: Omit<DashboardTodo, 'id' | 'createdAt'>[] = [];
    
    switch (trigger.type) {
      case 'deal_stuck':
        todos.push({
          title: `Deal stuck in stage for ${trigger.daysSince} days`,
          description: `${trigger.prospectName} hasn't moved forward`,
          priority: trigger.daysSince > 7 ? 'URGENT' : 'HIGH',
          deadline: this.calculateDeadline('this_week'),
          source: 'sales_flow',
          relatedDealId: trigger.dealId,
          relatedProspectName: trigger.prospectName,
          goal: 'Push deal forward or qualify out',
          strategy: trigger.daysSince > 7 
            ? 'Urgent: Call today to revive or close out'
            : 'Review and create action plan',
          checklist: [
            { item: 'Review why deal is stuck', completed: false },
            { item: 'Call to re-engage', completed: false },
            { item: 'Set clear next steps or close out', completed: false },
          ],
          status: 'pending',
          aiReason: `Deal stagnant for ${trigger.daysSince} days - action needed`,
          aiConfidence: 0.90,
        });
        break;
      
      case 'no_activity':
        todos.push({
          title: `No contact with ${trigger.prospectName} for ${trigger.daysSince} days`,
          description: 'Follow-up needed to keep deal alive',
          priority: 'HIGH',
          deadline: this.calculateDeadline('today'),
          source: 'sales_flow',
          relatedDealId: trigger.dealId,
          relatedProspectName: trigger.prospectName,
          goal: 'Re-engage prospect',
          recommendedScript: 'Re-engagement Call',
          checklist: [
            { item: 'Send re-engagement email', completed: false },
            { item: 'Schedule call', completed: false },
            { item: 'Prepare value reminder', completed: false },
          ],
          status: 'pending',
          aiReason: `${trigger.daysSince} days since last contact - prospect may be going cold`,
          aiConfidence: 0.88,
        });
        break;
      
      case 'proposal_sent':
        todos.push({
          title: `Proposal follow-up: ${trigger.prospectName}`,
          description: `Proposal sent ${trigger.daysSince} days ago`,
          priority: trigger.daysSince > 3 ? 'URGENT' : 'HIGH',
          deadline: this.calculateDeadline('today'),
          source: 'sales_flow',
          relatedDealId: trigger.dealId,
          relatedProspectName: trigger.prospectName,
          goal: 'Get decision on proposal',
          recommendedScript: 'Proposal Follow-up',
          strategy: 'Assumptive close - act like deal is moving forward',
          checklist: [
            { item: 'Call to discuss proposal', completed: false },
            { item: 'Address any questions', completed: false },
            { item: 'Ask for decision', completed: false },
          ],
          status: 'pending',
          aiReason: 'Proposal sent but no response - need to push for decision',
          aiConfidence: 0.92,
        });
        break;
    }
    
    return await this.insertTodos(salesRepId, todos);
  }
  
  /**
   * Calculate priority score for todo
   */
  private calculatePriorityScore(todo: Partial<DashboardTodo>): number {
    let score = 0;
    
    // Urgency factors
    if (todo.deadline) {
      const hoursUntil = (todo.deadline.getTime() - Date.now()) / (1000 * 60 * 60);
      if (hoursUntil < 2) score += 50;
      else if (hoursUntil < 24) score += 30;
      else if (hoursUntil < 48) score += 20;
    }
    
    // AI confidence
    if (todo.aiConfidence) {
      score += todo.aiConfidence * 20;
    }
    
    // Source importance
    if (todo.source === 'ai_call_analysis') score += 15;
    
    return score;
  }
  
  /**
   * Helper: Get weak areas from analysis
   */
  private getWeakAreas(analysis: StraightLineAnalysis): string[] {
    const weak: string[] = [];
    
    if (analysis.certaintyProduct < 7.0) weak.push('product certainty');
    if (analysis.certaintySalesperson < 7.0) weak.push('salesperson certainty');
    if (analysis.certaintyCompany < 7.0) weak.push('company certainty');
    if (analysis.tonalityScore < 7.0) weak.push('tonality');
    if (analysis.discoveryQualityScore < 7.0) weak.push('discovery');
    if (analysis.objectionHandlingScore < 7.0) weak.push('objection handling');
    if (analysis.closingAttempts === 0) weak.push('closing');
    
    return weak;
  }
  
  /**
   * Helper: Get certainty gaps
   */
  private getCertaintyGaps(analysis: StraightLineAnalysis): string[] {
    const gaps: string[] = [];
    
    if (analysis.certaintyProduct < 8.0) gaps.push('product');
    if (analysis.certaintySalesperson < 8.0) gaps.push('salesperson');
    if (analysis.certaintyCompany < 8.0) gaps.push('company');
    
    return gaps;
  }
  
  /**
   * Helper: Get certainty score by type
   */
  private getCertaintyScore(analysis: StraightLineAnalysis, type: string): number {
    switch (type) {
      case 'product': return analysis.certaintyProduct;
      case 'salesperson': return analysis.certaintySalesperson;
      case 'company': return analysis.certaintyCompany;
      default: return 0;
    }
  }
  
  /**
   * Helper: Get certainty building strategy
   */
  private getCertaintyBuildingStrategy(gaps: string[]): string {
    const strategies = {
      product: 'Show more proof it works (case studies, demos, testimonials)',
      salesperson: 'Build more rapport and trust',
      company: 'Share company credentials, longevity, client success stories',
    };
    
    return gaps.map(g => strategies[g as keyof typeof strategies]).join('. ');
  }
  
  /**
   * Helper: Get certainty checklist
   */
  private getCertaintyChecklist(gaps: string[]): { item: string; completed: boolean }[] {
    const items: { item: string; completed: boolean }[] = [];
    
    if (gaps.includes('product')) {
      items.push({ item: 'Prepare 3 product case studies', completed: false });
      items.push({ item: 'Have demo/proof ready', completed: false });
    }
    
    if (gaps.includes('salesperson')) {
      items.push({ item: 'Research prospect background', completed: false });
      items.push({ item: 'Find common ground/rapport builders', completed: false });
    }
    
    if (gaps.includes('company')) {
      items.push({ item: 'Prepare company credentials/awards', completed: false });
      items.push({ item: 'Have 2-3 impressive client names ready', completed: false });
    }
    
    items.push({ item: 'Practice "Three Tens" script', completed: false });
    
    return items;
  }
  
  /**
   * Helper: Estimate talk ratio
   */
  private estimateTalkRatio(analysis: StraightLineAnalysis): number {
    // If we had transcript, we'd calculate actual ratio
    // For now, estimate based on discovery questions
    if (analysis.discoveryQuestionsAsked < 5) return 1.8; // Probably talked too much
    if (analysis.discoveryQuestionsAsked > 7) return 0.8; // Good listening
    return 1.2; // Moderate
  }
  
  /**
   * Helper: Get recommended training
   */
  private getRecommendedTraining(analysis: StraightLineAnalysis): string {
    const weak = this.getWeakAreas(analysis);
    
    if (weak.includes('company certainty')) return 'Building Company Certainty';
    if (weak.includes('product certainty')) return 'Product Value Communication';
    if (weak.includes('tonality')) return 'Tonality Masterclass';
    if (weak.includes('discovery')) return 'Discovery Question Workshop';
    if (weak.includes('objection handling')) return 'Objection Handling Mastery';
    if (weak.includes('closing')) return 'Closing Techniques';
    
    return 'Straight Line Fundamentals';
  }
  
  /**
   * Helper: Get script for call type
   */
  private getScriptForCallType(callType: string): string {
    const scripts: { [key: string]: string } = {
      discovery: 'Jordan Belfort Discovery Script',
      demo: 'Demo/Presentation Script',
      closing: 'Closing Script',
      follow_up: 'Follow-up Script',
    };
    
    return scripts[callType] || 'Discovery Script';
  }
  
  /**
   * Helper: Generate email draft
   */
  private generateEmailDraft(
    recording: CallRecording,
    analysis: StraightLineAnalysis
  ): string {
    return `Hi ${recording.prospectName},

Great talking with you today about ${analysis.painPointsIdentified[0] || 'your needs'}!

As discussed, here's how we'll help you solve ${analysis.painPointsIdentified[0] || 'this challenge'}:

[Customize with specifics from call]

Next steps:
- [Action item 1]
- [Action item 2]

Looking forward to working together!

Best,
[Your Name]`;
  }
  
  /**
   * Helper: Calculate deadline based on type
   */
  private calculateDeadline(type: string): Date {
    const now = new Date();
    
    switch (type) {
      case 'today':
        now.setHours(17, 0, 0, 0); // End of today
        return now;
      
      case 'within_24_hours':
        now.setHours(now.getHours() + 24);
        return now;
      
      case '24_to_48_hours':
        now.setHours(now.getHours() + 36); // Middle of range
        return now;
      
      case 'within_48_hours':
        now.setHours(now.getHours() + 48);
        return now;
      
      case 'before_next_call':
        // Assume next business day
        now.setDate(now.getDate() + 1);
        now.setHours(9, 0, 0, 0);
        return now;
      
      case 'this_week':
        // End of this week
        const dayOfWeek = now.getDay();
        const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
        now.setDate(now.getDate() + daysUntilFriday);
        now.setHours(17, 0, 0, 0);
        return now;
      
      default:
        now.setHours(now.getHours() + 24);
        return now;
    }
  }
  
  /**
   * Insert TODOs into database
   */
  private async insertTodos(
    salesRepId: number,
    todos: Omit<DashboardTodo, 'id' | 'createdAt'>[]
  ): Promise<number[]> {
    const ids: number[] = [];
    
    for (const todo of todos) {
      const priorityScore = this.calculatePriorityScore(todo);
      
      const query = `
        INSERT INTO ai_todos (
          sales_rep_id, title, description, priority, deadline,
          source, related_deal_id, related_call_recording_id, related_prospect_name,
          goal, strategy, recommended_script, checklist, resources,
          status, ai_reason, ai_confidence, ai_priority_score
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
        )
        RETURNING id
      `;
      
      const values = [
        salesRepId,
        todo.title,
        todo.description,
        todo.priority,
        todo.deadline,
        todo.source,
        todo.relatedDealId,
        todo.relatedCallRecordingId,
        todo.relatedProspectName,
        todo.goal,
        todo.strategy,
        todo.recommendedScript,
        JSON.stringify(todo.checklist),
        JSON.stringify(todo.resources),
        todo.status,
        todo.aiReason,
        todo.aiConfidence,
        priorityScore,
      ];
      
      const result = await this.db.query(query, values);
      ids.push(result.rows[0].id);
    }
    
    return ids;
  }
  
  async close(): Promise<void> {
    await this.db.end();
  }
}


