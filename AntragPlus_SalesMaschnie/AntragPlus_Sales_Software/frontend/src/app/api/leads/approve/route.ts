/**
 * Lead Approval API
 * Approve leads and convert to internal contacts/deals
 */

import { NextRequest, NextResponse } from 'next/server'
import { leadToCRMService } from '@/lib/services/lead-to-crm-service'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId, leadIds, editedFields, notes } = body

    // Check database
    if (!db.isInitialized()) {
      return NextResponse.json(
        { error: 'Datenbank nicht verfügbar' },
        { status: 503 }
      )
    }

    // Batch approval
    if (leadIds && Array.isArray(leadIds)) {
      const result = await leadToCRMService.batchApproveLead(
        leadIds,
        'user' // TODO: Get from session
      )

      return NextResponse.json({
        success: true,
        message: `${result.successful} Leads genehmigt, ${result.failed} fehlgeschlagen`,
        successful: result.successful,
        failed: result.failed,
        results: result.results,
      })
    }

    // Single approval
    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId erforderlich' },
        { status: 400 }
      )
    }

    const result = await leadToCRMService.approveLead({
      leadId,
      editedFields,
      approvedBy: 'user', // TODO: Get from session
      notes,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, details: result.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      contactId: result.contactId,
      dealId: result.dealId,
    })
  } catch (error: any) {
    console.error('Error approving lead:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Genehmigung', details: error.message },
      { status: 500 }
    )
  }
}

