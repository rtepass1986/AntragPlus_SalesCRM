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
      ? `SELECT * FROM email_templates WHERE category = $1 ORDER BY updated_at DESC`
      : `SELECT * FROM email_templates ORDER BY updated_at DESC`

    const result = category
      ? await pool.query(query, [category])
      : await pool.query(query)

    const templates = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      subject: row.subject,
      category: row.category,
      stage: row.stage,
      content: row.content,
      variables: row.variables || [],
      version: row.version,
      lastUpdated: row.updated_at,
      updatedBy: row.updated_by,
      basedOnCalls: [], // TODO: Link to successful emails
      aiConfidence: parseFloat(row.ai_confidence || 0),
      usage: row.usage_count,
      openRate: parseFloat(row.open_rate || 0),
      responseRate: parseFloat(row.response_rate || 0),
      conversionRate: parseFloat(row.conversion_rate || 0),
      tags: row.tags || [],
      createdAt: row.created_at,
    }))

    return NextResponse.json(templates)
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, subject, category, stage, content, variables, tags } = body

    const result = await pool.query(
      `INSERT INTO email_templates (name, subject, category, stage, content, variables, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, subject, category, stage || 'General', content, variables || [], tags || []]
    )

    const template = result.rows[0]

    return NextResponse.json({
      success: true,
      data: {
        id: template.id,
        name: template.name,
        subject: template.subject,
        category: template.category,
        createdAt: template.created_at,
      },
    })
  } catch (error: any) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    )
  }
}

