import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
})

export async function GET(request: NextRequest) {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        pipedrive_stage_id as "pipedriveStageId",
        stage_name as "stageName",
        stage_order as "stageOrder",
        pipeline_id as "pipelineId"
      FROM pipeline_stages
      ORDER BY stage_order ASC
    `)
    
    return NextResponse.json(result.rows)
  } catch (error: any) {
    console.error('Error fetching pipeline stages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pipeline stages', details: error.message },
      { status: 500 }
    )
  }
}

