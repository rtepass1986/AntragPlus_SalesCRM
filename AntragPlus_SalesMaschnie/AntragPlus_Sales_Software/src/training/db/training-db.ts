/**
 * Training Module Database Service
 * PostgreSQL operations for training features
 */

import { Pool } from 'pg'

export class TrainingDB {
  private pool: Pool

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    })
  }

  // ===================================
  // CUSTOMER JOURNEY QUERIES
  // ===================================

  async getActiveJourney() {
    const result = await this.pool.query(
      `SELECT * FROM customer_journeys WHERE is_active = true ORDER BY created_at DESC LIMIT 1`
    )
    return result.rows[0]
  }

  async getJourneyStages(journeyId: string) {
    const result = await this.pool.query(
      `SELECT * FROM journey_stages WHERE journey_id = $1 ORDER BY stage_number ASC`,
      [journeyId]
    )
    return result.rows
  }

  async getStageAssets(stageId: string) {
    const result = await this.pool.query(
      `SELECT * FROM journey_assets WHERE stage_id = $1`,
      [stageId]
    )
    return result.rows
  }

  async getAISuggestions(journeyId: string, status = 'pending') {
    const result = await this.pool.query(
      `SELECT * FROM ai_journey_suggestions 
       WHERE journey_id = $1 AND status = $2 
       ORDER BY created_at DESC`,
      [journeyId, status]
    )
    return result.rows
  }

  async acceptAISuggestion(suggestionId: string, reviewedBy: string) {
    const result = await this.pool.query(
      `UPDATE ai_journey_suggestions 
       SET status = 'accepted', reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $1 RETURNING *`,
      [suggestionId, reviewedBy]
    )
    return result.rows[0]
  }

  // ===================================
  // SCRIPTS & TEMPLATES QUERIES
  // ===================================

  async getCallScripts(category?: string) {
    const query = category
      ? `SELECT * FROM call_scripts WHERE category = $1 ORDER BY updated_at DESC`
      : `SELECT * FROM call_scripts ORDER BY updated_at DESC`
    
    const result = category
      ? await this.pool.query(query, [category])
      : await this.pool.query(query)
    
    return result.rows
  }

  async getCallScript(id: string) {
    const result = await this.pool.query(
      `SELECT * FROM call_scripts WHERE id = $1`,
      [id]
    )
    return result.rows[0]
  }

  async createCallScript(data: any) {
    const result = await this.pool.query(
      `INSERT INTO call_scripts (name, category, stage, content, tags)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [data.name, data.category, data.stage, data.content, data.tags || []]
    )
    return result.rows[0]
  }

  async updateCallScript(id: string, data: any) {
    const result = await this.pool.query(
      `UPDATE call_scripts 
       SET name = COALESCE($2, name),
           content = COALESCE($3, content),
           version = version + 1,
           updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, data.name, data.content]
    )
    return result.rows[0]
  }

  async getEmailTemplates(category?: string) {
    const query = category
      ? `SELECT * FROM email_templates WHERE category = $1 ORDER BY updated_at DESC`
      : `SELECT * FROM email_templates ORDER BY updated_at DESC`
    
    const result = category
      ? await this.pool.query(query, [category])
      : await this.pool.query(query)
    
    return result.rows
  }

  // ===================================
  // FIREFLY RECORDINGS QUERIES
  // ===================================

  async getFireflyRecordings(status?: string) {
    const query = status
      ? `SELECT * FROM firefly_recordings WHERE status = $1 ORDER BY recording_date DESC`
      : `SELECT * FROM firefly_recordings ORDER BY recording_date DESC`
    
    const result = status
      ? await this.pool.query(query, [status])
      : await this.pool.query(query)
    
    return result.rows
  }

  async createFireflyRecording(data: any) {
    const result = await this.pool.query(
      `INSERT INTO firefly_recordings 
       (title, recording_date, duration, participants, deal_id, deal_name, file_url, transcript)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [data.title, data.recordingDate, data.duration, data.participants, 
       data.dealId, data.dealName, data.fileUrl, data.transcript]
    )
    return result.rows[0]
  }

  async getKeyMoments(recordingId: string) {
    const result = await this.pool.query(
      `SELECT * FROM recording_key_moments WHERE recording_id = $1 ORDER BY timestamp_seconds ASC`,
      [recordingId]
    )
    return result.rows
  }

  async getPendingAIUpdates() {
    const result = await this.pool.query(
      `SELECT * FROM ai_script_updates WHERE status = 'pending_review' ORDER BY created_at DESC`
    )
    return result.rows
  }

  // ===================================
  // TRAINING MATERIALS QUERIES
  // ===================================

  async getTrainingMaterials(category?: string) {
    const query = category && category !== 'all'
      ? `SELECT m.*, 
          (SELECT COUNT(*) FROM user_progress WHERE material_id = m.id AND status = 'completed') as completions,
          (SELECT COUNT(*) FROM user_progress WHERE material_id = m.id) as views
         FROM training_materials m WHERE category = $1 ORDER BY created_at DESC`
      : `SELECT m.*,
          (SELECT COUNT(*) FROM user_progress WHERE material_id = m.id AND status = 'completed') as completions,
          (SELECT COUNT(*) FROM user_progress WHERE material_id = m.id) as views
         FROM training_materials m ORDER BY created_at DESC`
    
    const result = category && category !== 'all'
      ? await this.pool.query(query, [category])
      : await this.pool.query(query)
    
    return result.rows
  }

  async createTrainingMaterial(data: any) {
    const result = await this.pool.query(
      `INSERT INTO training_materials 
       (title, material_type, category, description, file_url, estimated_duration, is_mandatory, tags, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [data.title, data.type, data.category, data.description, data.fileUrl, 
       data.estimatedDuration, data.mandatory || false, data.tags || [], data.createdBy]
    )
    return result.rows[0]
  }

  async getUserProgress(userId: string, materialId?: string) {
    const query = materialId
      ? `SELECT * FROM user_progress WHERE user_id = $1 AND material_id = $2`
      : `SELECT * FROM user_progress WHERE user_id = $1`
    
    const params = materialId ? [userId, materialId] : [userId]
    const result = await this.pool.query(query, params)
    
    return materialId ? result.rows[0] : result.rows
  }

  async updateProgress(userId: string, userName: string, materialId: string, progress: number, status: string) {
    const result = await this.pool.query(
      `INSERT INTO user_progress (user_id, user_name, material_id, progress, status, last_accessed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, material_id) 
       DO UPDATE SET progress = $4, status = $5, last_accessed_at = NOW()
       RETURNING *`,
      [userId, userName, materialId, progress, status]
    )
    return result.rows[0]
  }

  // ===================================
  // TESTS & ASSESSMENTS QUERIES
  // ===================================

  async getTests(userId?: string) {
    const result = await this.pool.query(
      `SELECT t.*,
        (SELECT COUNT(*) FROM test_attempts WHERE test_id = t.id ${userId ? 'AND user_id = $1' : ''}) as attempt_count
       FROM tests t ORDER BY created_at DESC`,
      userId ? [userId] : []
    )
    return result.rows
  }

  async getTestQuestions(testId: string) {
    const result = await this.pool.query(
      `SELECT * FROM test_questions WHERE test_id = $1 ORDER BY order_index ASC`,
      [testId]
    )
    return result.rows
  }

  async createTestAttempt(testId: string, userId: string, userName: string) {
    const result = await this.pool.query(
      `INSERT INTO test_attempts (test_id, user_id, user_name, started_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [testId, userId, userName]
    )
    return result.rows[0]
  }

  async submitTestAttempt(attemptId: string, answers: any[], score: number, passed: boolean) {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      
      // Update attempt
      const attemptResult = await client.query(
        `UPDATE test_attempts 
         SET completed_at = NOW(), 
             duration = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
             score = $2, passed = $3
         WHERE id = $1 RETURNING *`,
        [attemptId, score, passed]
      )
      
      // Save answers
      for (const answer of answers) {
        await client.query(
          `INSERT INTO test_answers (attempt_id, question_id, user_answer, is_correct, points_earned)
           VALUES ($1, $2, $3, $4, $5)`,
          [attemptId, answer.questionId, answer.userAnswer, answer.isCorrect, answer.pointsEarned]
        )
      }
      
      await client.query('COMMIT')
      return attemptResult.rows[0]
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async getUserTestResults(userId: string) {
    const result = await this.pool.query(
      `SELECT ta.*, t.title as test_name
       FROM test_attempts ta
       JOIN tests t ON ta.test_id = t.id
       WHERE ta.user_id = $1
       ORDER BY ta.created_at DESC`,
      [userId]
    )
    return result.rows
  }

  // ===================================
  // UTILITY
  // ===================================

  async close() {
    await this.pool.end()
  }
}

export function createTrainingDB(connectionString: string) {
  return new TrainingDB(connectionString)
}

