import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: testId } = await params
    const body = await request.json()
    const { userId, userName } = body

    // Check if max attempts reached
    const attemptsCheck = await pool.query(
      `SELECT t.max_attempts, COUNT(ta.id) as attempts
       FROM tests t
       LEFT JOIN test_attempts ta ON ta.test_id = t.id AND ta.user_id = $2
       WHERE t.id = $1
       GROUP BY t.max_attempts`,
      [testId, userId]
    )

    if (attemptsCheck.rows.length > 0) {
      const { max_attempts, attempts } = attemptsCheck.rows[0]
      if (max_attempts && parseInt(attempts) >= max_attempts) {
        return NextResponse.json(
          { error: 'Maximum attempts reached' },
          { status: 403 }
        )
      }
    }

    // Create new attempt
    const result = await pool.query(
      `INSERT INTO test_attempts (test_id, user_id, user_name, started_at)
       VALUES ($1, $2, $3, NOW()) RETURNING *`,
      [testId, userId, userName]
    )

    // Get test questions (without correct answers)
    const questionsResult = await pool.query(
      `SELECT id, question_type, question, options, points, category
       FROM test_questions WHERE test_id = $1 ORDER BY order_index ASC`,
      [testId]
    )

    return NextResponse.json({
      success: true,
      data: {
        attemptId: result.rows[0].id,
        questions: questionsResult.rows,
        startedAt: result.rows[0].started_at,
      },
    })
  } catch (error: any) {
    console.error('Error starting test:', error)
    return NextResponse.json(
      { error: 'Failed to start test', details: error.message },
      { status: 500 }
    )
  }
}

