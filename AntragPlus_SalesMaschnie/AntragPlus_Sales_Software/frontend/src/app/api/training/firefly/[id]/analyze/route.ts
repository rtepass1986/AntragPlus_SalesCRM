import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import OpenAI from 'openai'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get recording
    const recordingResult = await pool.query(
      `SELECT * FROM firefly_recordings WHERE id = $1`,
      [id]
    )

    if (recordingResult.rows.length === 0) {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 })
    }

    const recording = recordingResult.rows[0]

    if (!recording.transcript) {
      return NextResponse.json({ error: 'No transcript available' }, { status: 400 })
    }

    // AI Analysis
    const analysisPrompt = `Analyze this sales call transcript and extract key information.

TRANSCRIPT:
${recording.transcript}

Provide a JSON response with:
1. summary: Brief overview (2-3 sentences)
2. keyMoments: Array of important moments:
   - timestampEstimate: seconds from start (estimate based on transcript flow)
   - type: 'objection' | 'question' | 'win' | 'next_step' | 'insight'
   - description: What happened
   - quote: Exact quote
3. actionItems: List of next steps mentioned
4. sentiment: 'positive' | 'neutral' | 'negative'

Return valid JSON only.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: analysisPrompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const analysis = JSON.parse(response.choices[0].message.content || '{}')

    // Update recording with summary
    await pool.query(
      `UPDATE firefly_recordings 
       SET summary = $2, status = 'analyzed', processed_at = NOW()
       WHERE id = $1`,
      [id, analysis.summary]
    )

    // Save key moments
    if (analysis.keyMoments) {
      for (const moment of analysis.keyMoments) {
        await pool.query(
          `INSERT INTO recording_key_moments 
           (recording_id, timestamp_seconds, moment_type, description, quote)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, moment.timestampEstimate || 0, moment.type, moment.description, moment.quote]
        )
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: analysis.summary,
        keyMoments: analysis.keyMoments,
        actionItems: analysis.actionItems,
        sentiment: analysis.sentiment,
      },
    })
  } catch (error: any) {
    console.error('Error analyzing recording:', error)
    return NextResponse.json(
      { error: 'Failed to analyze recording', details: error.message },
      { status: 500 }
    )
  }
}

