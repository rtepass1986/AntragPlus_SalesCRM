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

    const query = category && category !== 'all'
      ? `SELECT m.*, 
          (SELECT COUNT(*) FROM user_progress WHERE material_id = m.id AND status = 'completed') as completions,
          (SELECT COUNT(*) FROM user_progress WHERE material_id = m.id) as views,
          (SELECT AVG(test_score) FROM user_progress WHERE material_id = m.id AND test_score IS NOT NULL) as avg_score
         FROM training_materials m WHERE category = $1 ORDER BY created_at DESC`
      : `SELECT m.*,
          (SELECT COUNT(*) FROM user_progress WHERE material_id = m.id AND status = 'completed') as completions,
          (SELECT COUNT(*) FROM user_progress WHERE material_id = m.id) as views,
          (SELECT AVG(test_score) FROM user_progress WHERE material_id = m.id AND test_score IS NOT NULL) as avg_score
         FROM training_materials m ORDER BY created_at DESC`

    const result = category && category !== 'all'
      ? await pool.query(query, [category])
      : await pool.query(query)

    const materials = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      type: row.material_type,
      category: row.category,
      description: row.description,
      fileUrl: row.file_url,
      videoUrl: row.video_url,
      content: row.content,
      estimatedDuration: row.estimated_duration,
      mandatory: row.is_mandatory,
      prerequisite: row.prerequisite_ids || [],
      assignedTo: row.assigned_to || ['all'],
      views: parseInt(row.views || 0),
      completions: parseInt(row.completions || 0),
      avgScore: row.avg_score ? parseFloat(row.avg_score).toFixed(0) : null,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      version: row.version,
      tags: row.tags || [],
    }))

    return NextResponse.json(materials)
  } catch (error: any) {
    console.error('Error fetching training materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      title,
      type,
      category,
      description,
      fileUrl,
      videoUrl,
      content,
      estimatedDuration,
      mandatory,
      tags,
      createdBy,
    } = body

    const result = await pool.query(
      `INSERT INTO training_materials 
       (title, material_type, category, description, file_url, video_url, content, 
        estimated_duration, is_mandatory, tags, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [title, type, category, description, fileUrl, videoUrl, content,
       estimatedDuration, mandatory || false, tags || [], createdBy || 'System']
    )

    return NextResponse.json({ success: true, data: result.rows[0] })
  } catch (error: any) {
    console.error('Error creating material:', error)
    return NextResponse.json(
      { error: 'Failed to create material', details: error.message },
      { status: 500 }
    )
  }
}

