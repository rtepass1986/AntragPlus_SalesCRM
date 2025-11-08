import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT * FROM firefly_recordings ORDER BY recording_date DESC`
    )

    const recordings = await Promise.all(
      result.rows.map(async (row) => {
        // Get key moments
        const momentsResult = await pool.query(
          `SELECT * FROM recording_key_moments WHERE recording_id = $1 ORDER BY timestamp_seconds ASC`,
          [row.id]
        )

        return {
          id: row.id,
          title: row.title,
          date: row.recording_date,
          duration: row.duration,
          participants: row.participants || [],
          dealId: row.deal_id,
          dealName: row.deal_name,
          transcript: row.transcript,
          summary: row.summary,
          keyMoments: momentsResult.rows.map(m => ({
            timestamp: m.timestamp_seconds,
            type: m.moment_type,
            description: m.description,
            quote: m.quote,
          })),
          actionItems: [], // TODO: Extract from summary
          usedForTemplates: [], // TODO: Link to templates
          status: row.status,
        }
      })
    )

    return NextResponse.json(recordings)
  } catch (error: any) {
    console.error('Error fetching Firefly recordings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recordings', details: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, recordingDate, duration, participants, dealId, dealName, transcript } = body

    const result = await pool.query(
      `INSERT INTO firefly_recordings 
       (title, recording_date, duration, participants, deal_id, deal_name, transcript, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'processing') RETURNING *`,
      [title, recordingDate, duration, participants || [], dealId, dealName, transcript]
    )

    const recording = result.rows[0]

    // TODO: Trigger AI analysis in background
    
    return NextResponse.json({
      success: true,
      data: {
        id: recording.id,
        title: recording.title,
        status: recording.status,
      },
    })
  } catch (error: any) {
    console.error('Error creating Firefly recording:', error)
    return NextResponse.json(
      { error: 'Failed to create recording', details: error.message },
      { status: 500 }
    )
  }
}

