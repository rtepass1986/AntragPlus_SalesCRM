import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export async function GET() {
  try {
    // Get active journey
    const journeyResult = await pool.query(
      `SELECT * FROM customer_journeys WHERE is_active = true ORDER BY created_at DESC LIMIT 1`
    )
    
    if (journeyResult.rows.length === 0) {
      return NextResponse.json({ error: 'No active journey found' }, { status: 404 })
    }

    const journey = journeyResult.rows[0]

    // Get all stages for this journey
    const stagesResult = await pool.query(
      `SELECT * FROM journey_stages WHERE journey_id = $1 ORDER BY stage_number ASC`,
      [journey.id]
    )

    // Get assets for each stage
    const stagesWithAssets = await Promise.all(
      stagesResult.rows.map(async (stage) => {
        const assetsResult = await pool.query(
          `SELECT asset_name FROM journey_assets WHERE stage_id = $1`,
          [stage.id]
        )
        return {
          ...stage,
          assets: assetsResult.rows.map(r => r.asset_name),
        }
      })
    )

    // Get AI suggestions
    const suggestionsResult = await pool.query(
      `SELECT * FROM ai_journey_suggestions 
       WHERE journey_id = $1 AND status = 'pending' 
       ORDER BY created_at DESC`,
      [journey.id]
    )

    const response = {
      id: journey.id,
      name: journey.name,
      version: journey.version,
      description: journey.description,
      stages: stagesWithAssets.map(stage => ({
        id: stage.id,
        number: stage.stage_number,
        name: stage.name,
        ziel: stage.ziel,
        owner: stage.owner,
        assets: stage.assets,
        schwachpunkt: stage.schwachpunkt,
        prioritat: stage.prioritat,
        color: stage.color,
        progress: stage.progress,
      })),
      aiSuggestions: suggestionsResult.rows.map(s => ({
        id: s.id,
        phase: s.stage_id,
        type: s.suggestion_type,
        suggestion: s.suggestion,
        confidence: parseFloat(s.confidence) * 100,
        impact: s.impact,
        status: s.status,
      })),
      createdAt: journey.created_at,
      updatedAt: journey.updated_at,
      updatedBy: journey.created_by,
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Error fetching journey:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer journey', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { journeyId, stages } = body

    // Update stages
    for (const stage of stages) {
      await pool.query(
        `UPDATE journey_stages 
         SET progress = $2, updated_at = NOW()
         WHERE id = $1`,
        [stage.id, stage.progress]
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating journey:', error)
    return NextResponse.json(
      { error: 'Failed to update journey', details: error.message },
      { status: 500 }
    )
  }
}

