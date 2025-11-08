import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    const result = await pool.query(
      `SELECT t.*,
        (SELECT COUNT(*) FROM test_attempts WHERE test_id = t.id ${userId ? 'AND user_id = $1' : ''}) as attempt_count,
        (SELECT json_agg(json_build_object(
          'id', id, 'type', question_type, 'question', question, 
          'options', options, 'points', points, 'category', category
        ) ORDER BY order_index) FROM test_questions WHERE test_id = t.id) as questions
       FROM tests t ORDER BY created_at DESC`,
      userId ? [userId] : []
    )

    const tests = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      materialId: row.material_id,
      questions: row.questions || [],
      timeLimit: row.time_limit,
      passingScore: row.passing_score,
      maxAttempts: row.max_attempts,
      randomizeQuestions: row.randomize_questions,
      showCorrectAnswers: row.show_correct_answers,
      mandatory: row.is_mandatory,
      frequency: row.frequency,
      nextDue: row.next_due,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      tags: row.tags || [],
    }))

    return NextResponse.json(tests)
  } catch (error: any) {
    console.error('Error fetching tests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tests', details: error.message },
      { status: 500 }
    )
  }
}

