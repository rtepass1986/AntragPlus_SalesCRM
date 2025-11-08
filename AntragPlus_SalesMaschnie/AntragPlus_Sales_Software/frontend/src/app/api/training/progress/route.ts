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
    const materialId = searchParams.get('materialId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const query = materialId
      ? `SELECT * FROM user_progress WHERE user_id = $1 AND material_id = $2`
      : `SELECT * FROM user_progress WHERE user_id = $1`

    const params = materialId ? [userId, materialId] : [userId]
    const result = await pool.query(query, params)

    const progress = result.rows.map(row => ({
      userId: row.user_id,
      userName: row.user_name,
      materialId: row.material_id,
      status: row.status,
      progress: row.progress,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      lastAccessedAt: row.last_accessed_at,
      testScore: row.test_score,
      testAttempts: row.test_attempts,
      passed: row.passed,
    }))

    return NextResponse.json(materialId ? progress[0] : progress)
  } catch (error: any) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, userName, materialId, progress, status } = body

    const result = await pool.query(
      `INSERT INTO user_progress (user_id, user_name, material_id, progress, status, last_accessed_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (user_id, material_id) 
       DO UPDATE SET 
         progress = $4, 
         status = $5, 
         last_accessed_at = NOW(),
         completed_at = CASE WHEN $5 = 'completed' THEN NOW() ELSE user_progress.completed_at END
       RETURNING *`,
      [userId, userName, materialId, progress, status]
    )

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error('Error updating progress:', error)
    return NextResponse.json(
      { error: 'Failed to update progress', details: error.message },
      { status: 500 }
    )
  }
}

