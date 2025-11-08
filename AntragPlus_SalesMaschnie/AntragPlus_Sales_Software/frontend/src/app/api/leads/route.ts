/**
 * Leads API Endpoints
 * Handles lead management, enrichment, and CSV uploads
 * Connected to PostgreSQL database
 */

import { NextRequest, NextResponse } from 'next/server'
import { leadService } from '@/lib/services/lead-service'
import { db } from '@/lib/db'

// GET /api/leads - List all leads with filtering
export async function GET(request: NextRequest) {
  try {
    // Check if database is available
    if (!db.isInitialized()) {
      // Fallback to mock data if database not available
      return getFallbackMockData(request)
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as 'pending' | 'enriched' | 'failed' | null
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const result = await leadService.getLeads({
      status: status || undefined,
      search: search || undefined,
      page,
      limit,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching leads:', error)
    
    // Fallback to mock data on error
    return getFallbackMockData(request)
  }
}

// POST /api/leads - Create new lead or trigger enrichment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Check database availability
    if (!db.isInitialized()) {
      return NextResponse.json(
        { error: 'Datenbank nicht verfügbar' },
        { status: 503 }
      )
    }

    if (body.action === 'enrich') {
      // Trigger enrichment for pending leads
      const leadIds = body.leadIds || []
      
      const result = await leadService.enrichLeads(leadIds)
      
      return NextResponse.json({
        success: true,
        message: result.message,
        jobId: `enrich-${Date.now()}`,
        queued: result.queued,
      })
    }

    // Create new lead
    const newLead = await leadService.createLead({
      companyName: body.companyName,
      website: body.website,
      email: body.email,
      phone: body.phone,
      source: 'manual',
      createdBy: 'user', // TODO: Get from session
    })

    return NextResponse.json({
      success: true,
      lead: newLead,
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating lead:', error)
    return NextResponse.json(
      { error: 'Fehler beim Erstellen des Leads' },
      { status: 500 }
    )
  }
}

// Fallback mock data function when database is not available
function getFallbackMockData(request: NextRequest) {
  const mockLeads = [
    {
      id: '1',
      companyName: 'Deutscher Caritasverband e.V.',
      website: 'https://www.caritas.de',
      industry: 'Sozialwesen',
      tätigkeitsfeld: 'Wohlfahrtsverband',
      status: 'enriched' as const,
      confidence: 0.95,
      email: 'info@caritas.de',
      phone: '+49 761 200-0',
      address: 'Karlstraße 40, 79104 Freiburg',
      linkedIn: 'https://linkedin.com/company/caritas-deutschland',
      enrichmentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      pipedriveOrgId: 123,
      notes: 'Großer Wohlfahrtsverband mit über 25.000 Einrichtungen'
    },
    {
      id: '2',
      companyName: 'NABU - Naturschutzbund Deutschland e.V.',
      website: 'https://www.nabu.de',
      industry: 'Umweltschutz',
      tätigkeitsfeld: 'Naturschutz',
      status: 'enriched' as const,
      confidence: 0.92,
      email: 'nabu@nabu.de',
      phone: '+49 30 284984-0',
      address: 'Charitéstraße 3, 10117 Berlin',
      linkedIn: 'https://linkedin.com/company/nabu',
      enrichmentDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      pipedriveOrgId: 124,
      notes: 'Einer der größten deutschen Umweltverbände'
    },
    {
      id: '3',
      companyName: 'Deutsches Rotes Kreuz e.V.',
      website: 'https://www.drk.de',
      industry: 'Rettungsdienst',
      tätigkeitsfeld: 'Katastrophenschutz',
      status: 'enriched' as const,
      confidence: 0.98,
      email: 'drk@drk.de',
      phone: '+49 30 85404-0',
      address: 'Carstennstraße 58, 12205 Berlin',
      linkedIn: 'https://linkedin.com/company/deutsches-rotes-kreuz',
      enrichmentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
      pipedriveOrgId: 125,
      notes: 'Teil der internationalen Rotkreuz-Bewegung'
    },
    {
      id: '4',
      companyName: 'Greenpeace Deutschland',
      website: null,
      industry: null,
      tätigkeitsfeld: null,
      status: 'pending' as const,
      confidence: 0,
      email: null,
      phone: null,
      address: null,
      linkedIn: null,
      enrichmentDate: null,
      updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      pipedriveOrgId: null,
      notes: null
    },
  ]

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  let filteredLeads = [...mockLeads]

  if (status && status !== 'all') {
    filteredLeads = filteredLeads.filter(lead => lead.status === status)
  }

  if (search) {
    const searchLower = search.toLowerCase()
    filteredLeads = filteredLeads.filter(lead =>
      lead.companyName.toLowerCase().includes(searchLower) ||
      lead.tätigkeitsfeld?.toLowerCase().includes(searchLower) ||
      lead.industry?.toLowerCase().includes(searchLower)
    )
  }

  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex)

  const stats = {
    total: mockLeads.length,
    enriched: mockLeads.filter(l => l.status === 'enriched').length,
    pending: mockLeads.filter(l => l.status === 'pending').length,
    failed: mockLeads.filter(l => l.status === 'failed').length,
    avgConfidence: mockLeads.filter(l => l.status === 'enriched').reduce((sum, l) => sum + l.confidence, 0) / mockLeads.filter(l => l.status === 'enriched').length || 0,
    costEstimate: mockLeads.length * 0.05,
  }

  return NextResponse.json({
    leads: paginatedLeads,
    pagination: {
      page,
      limit,
      total: filteredLeads.length,
      totalPages: Math.ceil(filteredLeads.length / limit),
    },
    stats,
    _note: 'Using fallback mock data - DATABASE_URL not configured',
  })
}

