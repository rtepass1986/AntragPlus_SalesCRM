'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface DuplicateMatch {
  leadId1: number
  leadId2: number
  companyName1: string
  companyName2: string
  similarity: number
  matchReason: string[]
  suggestedMaster: number
}

interface DuplicatesPanelProps {
  isOpen: boolean
  onClose: () => void
  onMerged?: () => void
}

export function DuplicatesPanel({ isOpen, onClose, onMerged }: DuplicatesPanelProps) {
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [merging, setMerging] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadDuplicates()
    }
  }, [isOpen])

  const loadDuplicates = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/leads/duplicates')
      const data = await response.json()
      setDuplicates(data.duplicates || [])
    } catch (error) {
      console.error('Error loading duplicates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMerge = async (masterId: number, duplicateId: number, index: number) => {
    if (!confirm('Duplikate zusammenführen? Dies kann nicht rückgängig gemacht werden.')) {
      return
    }

    try {
      setMerging(index)
      
      const response = await fetch('/api/leads/duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterId,
          duplicateIds: [duplicateId],
        }),
      })

      if (!response.ok) {
        throw new Error('Merge fehlgeschlagen')
      }

      // Remove from list
      setDuplicates(prev => prev.filter((_, i) => i !== index))
      onMerged?.()
      
      alert('✅ Duplikate erfolgreich zusammengeführt')
    } catch (error: any) {
      alert(`Fehler: ${error.message}`)
    } finally {
      setMerging(null)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-3xl bg-white shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-gray-200 px-6 py-4 bg-orange-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-500" />
                Duplikate erkennen
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {duplicates.length} mögliche Duplikate gefunden
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent"></div>
                <p className="mt-4 text-sm text-gray-600">Suche nach Duplikaten...</p>
              </div>
            </div>
          ) : duplicates.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Keine Duplikate gefunden!</h3>
              <p className="text-sm text-gray-600">Alle Leads sind eindeutig.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {duplicates.map((dup, index) => (
                <div
                  key={index}
                  className="rounded-lg border-2 border-orange-200 bg-white p-5"
                >
                  {/* Match Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold">
                          {Math.round(dup.similarity)}% Ähnlich
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                        {dup.matchReason.map((reason, idx) => (
                          <span key={idx} className="px-2 py-1 rounded bg-gray-100">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Companies Side-by-Side */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Lead 1 */}
                    <div className={`rounded-lg border-2 p-4 ${
                      dup.suggestedMaster === dup.leadId1 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-600">Lead #{dup.leadId1}</span>
                        {dup.suggestedMaster === dup.leadId1 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-600 text-white font-medium">
                            Master
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900">{dup.companyName1}</p>
                    </div>

                    {/* Lead 2 */}
                    <div className={`rounded-lg border-2 p-4 ${
                      dup.suggestedMaster === dup.leadId2 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-600">Lead #{dup.leadId2}</span>
                        {dup.suggestedMaster === dup.leadId2 && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-600 text-white font-medium">
                            Master
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900">{dup.companyName2}</p>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleMerge(dup.suggestedMaster, 
                        dup.suggestedMaster === dup.leadId1 ? dup.leadId2 : dup.leadId1,
                        index
                      )}
                      disabled={merging === index}
                      className="rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 text-sm font-medium text-white hover:from-orange-600 hover:to-orange-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {merging === index ? 'Wird zusammengeführt...' : 'Zusammenführen'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </>
  )
}

