import { NextResponse } from 'next/server'

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN || ''
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1'

// Stage mapping
const STAGE_MAPPING: Record<number, string> = {
  16: 'lead',
  18: 'qualified',
  9: 'proposal',
  22: 'negotiation',
  10: 'won',
  13: 'lost',
  15: 'won',
  11: 'lost',
  12: 'lost',
}

function transformDeal(pd: any) {
  const stage = pd.stage_id ? (STAGE_MAPPING[pd.stage_id] || 'lead') : 'lead'
  const probabilityMap: Record<string, number> = {
    lead: 10,
    qualified: 30,
    proposal: 50,
    negotiation: 70,
    won: 100,
    lost: 0,
  }

  return {
    id: String(pd.id),
    title: pd.title || 'Untitled Deal',
    value: pd.value || 0,
    currency: pd.currency || 'EUR',
    stage,
    status: pd.status === 'won' ? 'won' : pd.status === 'lost' ? 'lost' : 'open',
    probability: pd.probability || probabilityMap[stage] || 20,
    organizationId: pd.org_id ? String(pd.org_id) : null,
    organizationName: pd.org_name || null,
    contactId: pd.person_id ? String(pd.person_id) : null,
    contactName: pd.person_name || null,
    expectedCloseDate: pd.expected_close_date || null,
    actualCloseDate: pd.won_time || pd.lost_time || null,
    createdAt: pd.add_time || new Date().toISOString(),
    updatedAt: pd.update_time || new Date().toISOString(),
    ownerId: pd.user_id ? String(pd.user_id) : 'unknown',
    ownerName: pd.owner_name || null,
    description: pd.notes || null,
    source: null,
    lostReason: pd.lost_reason || null,
    tags: [],
    customFields: {},
    activitiesCount: pd.activities_count || 0,
    emailsCount: pd.email_messages_count || 0,
    filesCount: pd.files_count || 0,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all_not_deleted'

    const url = new URL(`${PIPEDRIVE_BASE_URL}/deals`)
    url.searchParams.append('api_token', PIPEDRIVE_API_TOKEN)
    url.searchParams.append('status', status)
    url.searchParams.append('limit', '500')

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`Pipedrive API error: ${response.status}`)
    }

    const data = await response.json()
    const deals = (data.data || []).map(transformDeal)

    return NextResponse.json(deals)
  } catch (error: any) {
    console.error('Error fetching deals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch deals', details: error.message },
      { status: 500 }
    )
  }
}

