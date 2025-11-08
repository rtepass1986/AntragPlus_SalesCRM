import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    const query = category
      ? `SELECT * FROM call_scripts WHERE category = $1 ORDER BY updated_at DESC`
      : `SELECT * FROM call_scripts ORDER BY updated_at DESC`

    const result = category
      ? await pool.query(query, [category])
      : await pool.query(query)

    const scripts = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      stage: row.stage,
      content: row.content,
      version: row.version,
      lastUpdated: row.updated_at,
      updatedBy: row.updated_by,
      fireflyCallIds: [], // TODO: Link to firefly recordings
      aiConfidence: parseFloat(row.ai_confidence || 0),
      usage: row.usage_count,
      successRate: parseFloat(row.success_rate || 0),
      avgCallDuration: row.avg_call_duration,
      tags: row.tags || [],
      createdAt: row.created_at,
    }))

    return NextResponse.json(scripts)
  } catch (error: any) {
    console.error('Error fetching scripts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scripts', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, category, stage, content, tags } = body

    const result = await pool.query(
      `INSERT INTO call_scripts (name, category, stage, content, tags)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, category, stage || 'General', content, tags || []]
    )

    const script = result.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        id: script.id,
        name: script.name,
        category: script.category,
        stage: script.stage,
        content: script.content,
        version: script.version,
        createdAt: script.created_at,
      },
    })
  } catch (error: any) {
    console.error('Error creating script:', error)
    return NextResponse.json(
      { error: 'Failed to create script', details: error.message },
      { status: 500 }
    )
  }
}

