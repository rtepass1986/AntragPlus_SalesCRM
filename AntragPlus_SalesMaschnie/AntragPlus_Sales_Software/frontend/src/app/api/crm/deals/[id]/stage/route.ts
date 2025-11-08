import { NextResponse } from 'next/server'

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN || ''
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1'

// Map CRM stages to Pipedrive stage IDs
const STAGE_TO_ID: Record<string, number> = {
  lead: 16,
  qualified: 18,
  proposal: 9,
  negotiation: 22,
  won: 10,
  lost: 13,
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { stage } = body
    
    const stageId = STAGE_TO_ID[stage] || 16

    const url = new URL(`${PIPEDRIVE_BASE_URL}/deals/${id}`)
    url.searchParams.append('api_token', PIPEDRIVE_API_TOKEN)

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage_id: stageId }),
    })

    if (!response.ok) {
      throw new Error(`Pipedrive API error: ${response.status}`)
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      data: data.data,
    })
  } catch (error: any) {
    console.error('Error updating deal stage:', error)
    return NextResponse.json(
      { error: 'Failed to update deal stage', details: error.message },
      { status: 500 }
    )
  }
}

