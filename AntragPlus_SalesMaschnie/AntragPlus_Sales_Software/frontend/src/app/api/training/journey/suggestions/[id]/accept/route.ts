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
    const { id } = await params
    const body = await request.json()
    const { reviewedBy } = body

    const result = await pool.query(
      `UPDATE ai_journey_suggestions 
       SET status = 'accepted', reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $1 RETURNING *`,
      [id, reviewedBy || 'System']
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error('Error accepting suggestion:', error)
    return NextResponse.json(
      { error: 'Failed to accept suggestion', details: error.message },
      { status: 500 }
    )
  }
}

