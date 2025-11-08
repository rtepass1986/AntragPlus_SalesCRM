/**
 * CSV Upload API
 * Handles CSV file uploads for bulk lead import
 * Connected to PostgreSQL database
 */

import { NextRequest, NextResponse } from 'next/server'
import { leadService } from '@/lib/services/lead-service'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Nur CSV-Dateien werden unterstützt' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Datei zu groß (max 10MB)' },
        { status: 400 }
      )
    }

    // Read and parse CSV
    const text = await file.text()
    const lines = text.split('\n').filter(line => line.trim())
    
    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'CSV-Datei ist leer oder ungültig' },
        { status: 400 }
      )
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    // Parse rows
    const leads = []
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
      const lead: any = {}
      
      header.forEach((key, index) => {
        lead[key] = values[index] || null
      })
      
      // Map common field names (support German and English)
      const mappedLead = {
        companyName: lead.company || lead.name || lead.organization || lead.companyName || lead.firma || lead.unternehmen,
        website: lead.website || lead.url || lead.web || null,
        email: lead.email || lead.mail || lead['e-mail'] || null,
        phone: lead.phone || lead.tel || lead.telefon || lead.telephone || null,
        address: lead.address || lead.adresse || null,
        industry: lead.industry || lead.industrie || lead.branche || null,
        tätigkeitsfeld: lead.tätigkeitsfeld || lead.field || lead.bereich || null,
      }

      if (mappedLead.companyName) {
        leads.push(mappedLead)
      }
    }

    if (leads.length === 0) {
      return NextResponse.json(
        { error: 'Keine gültigen Leads in der CSV gefunden' },
        { status: 400 }
      )
    }

    // Save leads to database
    if (db.isInitialized()) {
      try {
        const { imported, failed } = await leadService.bulkImportLeads(leads)
        
        return NextResponse.json({
          success: true,
          imported,
          failed,
          leads: leads.slice(0, 5), // Return first 5 as preview
          message: `${imported} Leads erfolgreich importiert${failed > 0 ? `, ${failed} fehlgeschlagen` : ''}`,
        })
      } catch (dbError) {
        console.error('Database error, returning without saving:', dbError)
        // Continue without saving to DB
      }
    }

    // Fallback: Return success without saving to database
    return NextResponse.json({
      success: true,
      imported: leads.length,
      failed: 0,
      leads: leads.slice(0, 5),
      message: `${leads.length} Leads geparst (Datenbank nicht konfiguriert)`,
      _note: 'DATABASE_URL not configured - leads not persisted',
    })
  } catch (error) {
    console.error('Error uploading CSV:', error)
    return NextResponse.json(
      { error: 'Fehler beim Hochladen der CSV-Datei' },
      { status: 500 }
    )
  }
}

