import { NextResponse } from 'next/server'

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN || ''
const PIPEDRIVE_BASE_URL = 'https://api.pipedrive.com/v1'

function transformContact(pp: any) {
  return {
    id: String(pp.id),
    firstName: pp.first_name || '',
    lastName: pp.last_name || '',
    fullName: pp.name || '',
    email: pp.email?.[0]?.value || null,
    phone: pp.phone?.[0]?.value || null,
    mobile: null,
    title: null,
    organizationId: pp.org_id ? String(pp.org_id) : null,
    organizationName: pp.org_name || undefined,
    linkedinUrl: null,
    twitterHandle: null,
    photoUrl: pp.picture_url || null,
    tags: [],
    customFields: {},
    ownerId: pp.owner_id ? String(pp.owner_id) : 'unknown',
    ownerName: undefined,
    createdAt: pp.add_time || new Date().toISOString(),
    updatedAt: pp.update_time || new Date().toISOString(),
    lastContactedAt: pp.last_activity_date || null,
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = searchParams.get('limit') || '500'

    const url = new URL(`${PIPEDRIVE_BASE_URL}/persons`)
    url.searchParams.append('api_token', PIPEDRIVE_API_TOKEN)
    url.searchParams.append('limit', limit)

    const response = await fetch(url.toString())
    
    if (!response.ok) {
      throw new Error(`Pipedrive API error: ${response.status}`)
    }

    const data = await response.json()
    const contacts = (data.data || []).map(transformContact)

    return NextResponse.json(contacts)
  } catch (error: any) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts', details: error.message },
      { status: 500 }
    )
  }
}

