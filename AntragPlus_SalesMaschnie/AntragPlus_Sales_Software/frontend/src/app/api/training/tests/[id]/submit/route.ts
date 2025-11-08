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
    const { attemptId, answers } = body

    // Get correct answers
    const questionsResult = await pool.query(
      `SELECT id, correct_answer, points FROM test_questions WHERE test_id = $1`,
      [testId]
    )

    const correctAnswers = new Map(
      questionsResult.rows.map(q => [q.id, { correct: q.correct_answer, points: q.points }])
    )

    // Grade answers
    let totalPoints = 0
    let earnedPoints = 0
    const gradedAnswers = []

    for (const answer of answers) {
      const correctData = correctAnswers.get(answer.questionId)
      if (!correctData) continue

      const isCorrect = answer.userAnswer === correctData.correct
      const pointsEarned = isCorrect ? correctData.points : 0

      totalPoints += correctData.points
      earnedPoints += pointsEarned

      gradedAnswers.push({
        questionId: answer.questionId,
        userAnswer: answer.userAnswer,
        isCorrect,
        pointsEarned,
      })

      // Save answer
      await pool.query(
        `INSERT INTO test_answers (attempt_id, question_id, user_answer, is_correct, points_earned)
         VALUES ($1, $2, $3, $4, $5)`,
        [attemptId, answer.questionId, answer.userAnswer, isCorrect, pointsEarned]
      )
    }

    // Calculate score
    const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0

    // Get passing score
    const testResult = await pool.query(
      `SELECT passing_score FROM tests WHERE id = $1`,
      [testId]
    )
    const passingScore = testResult.rows[0].passing_score
    const passed = score >= passingScore

    // Update attempt
    const attemptResult = await pool.query(
      `UPDATE test_attempts 
       SET completed_at = NOW(), 
           duration = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
           score = $2, 
           passed = $3
       WHERE id = $1 RETURNING *`,
      [attemptId, score, passed]
    )

    return NextResponse.json({
      success: true,
      data: {
        score,
        passed,
        totalPoints,
        earnedPoints,
        answers: gradedAnswers,
        attempt: attemptResult.rows[0],
      },
    })
  } catch (error: any) {
    console.error('Error submitting test:', error)
    return NextResponse.json(
      { error: 'Failed to submit test', details: error.message },
      { status: 500 }
    )
  }
}

