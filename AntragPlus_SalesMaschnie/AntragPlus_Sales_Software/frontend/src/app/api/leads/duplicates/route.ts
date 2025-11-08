/**
 * Duplicate Detection API
 * Find and merge duplicate leads
 */

import { NextRequest, NextResponse } from 'next/server'
import { duplicateDetectionService } from '@/lib/services/duplicate-detection-service'
import { db } from '@/lib/db'

// GET /api/leads/duplicates - Find all duplicates
export async function GET(request: NextRequest) {
  try {
    if (!db.isInitialized()) {
      return NextResponse.json(
        { error: 'Datenbank nicht verfügbar' },
        { status: 503 }
      )
    }

    const duplicates = await duplicateDetectionService.findDuplicates()

    return NextResponse.json({
      duplicates,
      count: duplicates.length,
      message: duplicates.length > 0 
        ? `${duplicates.length} Duplikate gefunden` 
        : 'Keine Duplikate gefunden',
    })
  } catch (error: any) {
    console.error('Error finding duplicates:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Duplikatserkennung', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/leads/duplicates - Merge duplicates
export async function POST(request: NextRequest) {
  try {
    if (!db.isInitialized()) {
      return NextResponse.json(
        { error: 'Datenbank nicht verfügbar' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { masterId, duplicateIds } = body

    if (!masterId || !duplicateIds || !Array.isArray(duplicateIds)) {
      return NextResponse.json(
        { error: 'masterId und duplicateIds sind erforderlich' },
        { status: 400 }
      )
    }

    const result = await duplicateDetectionService.mergeDuplicates(masterId, duplicateIds)

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error: any) {
    console.error('Error merging duplicates:', error)
    return NextResponse.json(
      { error: 'Fehler beim Zusammenführen', details: error.message },
      { status: 500 }
    )
  }
}

