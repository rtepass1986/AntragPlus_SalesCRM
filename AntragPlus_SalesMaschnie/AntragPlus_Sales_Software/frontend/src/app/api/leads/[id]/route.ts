/**
 * Single Lead API Endpoints
 * GET, PUT, DELETE for individual leads
 * Connected to PostgreSQL database
 */

import { NextRequest, NextResponse } from 'next/server'
import { leadService } from '@/lib/services/lead-service'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // Check if database is available
    if (!db.isInitialized()) {
      // Return mock data if database not available
      return NextResponse.json({
        lead: getMockLeadDetail(id),
        _note: 'Using fallback mock data - DATABASE_URL not configured',
      })
    }

    const lead = await leadService.getLead(id)

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ lead })
  } catch (error) {
    console.error('Error fetching lead:', error)
    
    // Fallback to mock data
    return NextResponse.json({
      lead: getMockLeadDetail(params.id),
      _note: 'Using fallback mock data due to error',
    })
  }
}

function getMockLeadDetail(id: string) {
  return {
    id,
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
    notes: 'Großer Wohlfahrtsverband mit über 25.000 Einrichtungen',
    legalForm: 'e.V.',
    foundedYear: 1897,
    employees: '690.000 (geschätzt)',
    revenue: null,
    leadership: [
      {
        name: 'Präsident der Caritas',
        role: 'vorstandsvorsitzende',
        email: null,
        phone: null,
      }
    ],
    tags: ['Wohlfahrtsverband', 'Sozialwesen', 'Non-Profit'],
    enrichmentHistory: [
      {
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        fields: ['website', 'phone', 'address', 'linkedIn'],
        confidence: 0.95,
      }
    ]
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id
    const body = await request.json()

    // Check database availability
    if (!db.isInitialized()) {
      return NextResponse.json(
        { error: 'Datenbank nicht verfügbar' },
        { status: 503 }
      )
    }

    const lead = await leadService.updateLead(id, body)

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      lead,
    })
  } catch (error) {
    console.error('Error updating lead:', error)
    return NextResponse.json(
      { error: 'Fehler beim Aktualisieren des Leads' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id

    // Check database availability
    if (!db.isInitialized()) {
      return NextResponse.json(
        { error: 'Datenbank nicht verfügbar' },
        { status: 503 }
      )
    }

    const success = await leadService.deleteLead(id)

    if (!success) {
      return NextResponse.json(
        { error: 'Lead nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Lead gelöscht',
    })
  } catch (error) {
    console.error('Error deleting lead:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen des Leads' },
      { status: 500 }
    )
  }
}

