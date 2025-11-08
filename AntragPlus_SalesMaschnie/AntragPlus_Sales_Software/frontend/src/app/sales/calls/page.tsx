/**
 * CALL ANALYSIS View
 * Shows recent calls with Straight Line scores and coaching
 */

'use client'

import { useState, useEffect } from 'react'
import { PhoneIcon, PlayIcon, DocumentArrowDownIcon, ChartBarIcon } from '@heroicons/react/24/outline'

interface CallAnalysis {
  id: number
  prospectName: string
  callDate: string
  duration: number
  overallScore: number
  certaintyProduct: number
  certaintySalesperson: number
  certaintyCompany: number
  tonalityScore: number
  scriptAdherence: number
  closingAttempts: number
  conversionLikelihood: number
  aiSummary: string
  strengths: string[]
  areasForImprovement: string[]
  coachingPoints: Array<{
    area: string
    observation: string
    recommendation: string
    priority: string
  }>
}

function getScoreColor(score: number): string {
  if (score >= 8) return 'text-green-600'
  if (score >= 6) return 'text-yellow-600'
  return 'text-red-600'
}

function getScoreEmoji(score: number): string {
  if (score >= 9) return '⭐'
  if (score >= 8) return '✅'
  if (score >= 6) return '⚠️'
  return '❌'
}

export default function CallsPage() {
  const [calls, setCalls] = useState<CallAnalysis[]>([])
  const [selectedCall, setSelectedCall] = useState<CallAnalysis | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCalls()
  }, [])

  async function fetchCalls() {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/calls/recent')
      // const data = await response.json()
      
      // Mock data
      setCalls([
        {
          id: 1,
          prospectName: 'Deutsche Kinder Hilfe',
          callDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          duration: 1104, // 18:24 in seconds
          overallScore: 8.5,
          certaintyProduct: 8.0,
          certaintySalesperson: 9.0,
          certaintyCompany: 7.0,
          tonalityScore: 8.5,
          scriptAdherence: 8.0,
          closingAttempts: 3,
          conversionLikelihood: 8.2,
          aiSummary: 'Exzellentes Discovery-Gespräch. Rep baute starken Rapport auf und identifizierte 3 zentrale Pain Points. Produktsicherheit ist hoch (8/10). Geringfügige Verbesserung bei Firmensicherheit nötig. Starker Abschluss mit 3 Versuchen.',
          strengths: [
            '7 qualitativ hochwertige Discovery-Fragen gestellt',
            'Emotionale und logische Pain Points identifiziert',
            'Exzellente Tonalität - selbstbewusst und authentisch',
            'Starke Rückbindung zu Pain Points in Präsentation',
            '3 Abschlussversuche mit Assumptive-Technik'
          ],
          areasForImprovement: [
            'Mehr Firmensicherheit aufbauen - nur 1 Fallstudie erwähnt',
            'Gesprächsanteil war 65/35 (sollte 40/60 sein)',
            'Hätte vor Abschluss nochmal Sicherheit aufbauen können'
          ],
          coachingPoints: [
            {
              area: 'Firmensicherheit',
              observation: 'Nur eine Kundenerfolgsstory erwähnt',
              recommendation: '3-4 relevante Fallstudien vorbereiten. Während des gesamten Gesprächs nutzen, nicht nur in Präsentation.',
              priority: 'high'
            },
            {
              area: 'Gesprächsanteil',
              observation: 'Rep sprach 65% der Zeit vs. 35% für Prospect',
              recommendation: 'Mehr offene Fragen stellen. Prospect mehr reden lassen. 60% der Zeit zuhören.',
              priority: 'medium'
            }
          ]
        },
        {
          id: 2,
          prospectName: 'Umweltschutz München',
          callDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          duration: 960,
          overallScore: 6.5,
          certaintyProduct: 7.0,
          certaintySalesperson: 6.5,
          certaintyCompany: 5.0,
          tonalityScore: 6.0,
          scriptAdherence: 7.0,
          closingAttempts: 1,
          conversionLikelihood: 5.5,
          aiSummary: 'Call needs improvement. Low company certainty and weak tonality. Only 1 closing attempt. Prospect interested but not convinced.',
          strengths: [
            'Good product knowledge',
            'Followed script structure'
          ],
          areasForImprovement: [
            'Company certainty very low (5/10)',
            'Sounded uncertain - work on tonality',
            'Only 1 closing attempt - need 2-3 minimum',
            'Did not address objections effectively'
          ],
          coachingPoints: [
            {
              area: 'Company Trust',
              observation: 'No case studies or social proof mentioned',
              recommendation: 'Always have 3 case studies ready. Mention company track record early.',
              priority: 'high'
            },
            {
              area: 'Closing',
              observation: 'Only asked for sale once at end of call',
              recommendation: 'Use multiple closing techniques. Ask 2-3 times minimum.',
              priority: 'high'
            }
          ]
        },
      ])

      setLoading(false)
    } catch (error) {
      console.error('Error fetching calls:', error)
      setLoading(false)
    }
  }

  function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  function formatDate(isoString: string): string {
    const date = new Date(isoString)
    const now = new Date()
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${Math.round(diffHours)} hours ago`
    if (diffHours < 48) return 'Yesterday'
    return date.toLocaleDateString('de-DE')
  }

  if (loading) {
    return <div className="text-center py-12">Lädt Anrufe...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          ANRUFANALYSE
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          KI-gestützte Leistungseinblicke mit Jordan Belforts Straight Line System
        </p>
      </div>

      {/* Recent Calls */}
      <div className="space-y-4">
        {calls.map((call) => (
          <div key={call.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <PhoneIcon className="h-5 w-5 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">{call.prospectName}</h3>
                    <span className={`text-2xl ${getScoreEmoji(call.overallScore)}`}>
                      {getScoreEmoji(call.overallScore)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDate(call.callDate)} • {formatDuration(call.duration)}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(call.overallScore)}`}>
                    {call.overallScore}/10
                  </div>
                  <div className="text-sm text-gray-500">Overall</div>
                </div>
              </div>

              {/* The Three Tens */}
              <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-3">THE THREE TENS</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Product Certainty</span>
                      <span className={`font-medium ${getScoreColor(call.certaintyProduct)}`}>
                        {call.certaintyProduct}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${call.certaintyProduct * 10}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Salesperson Certainty</span>
                      <span className={`font-medium ${getScoreColor(call.certaintySalesperson)}`}>
                        {call.certaintySalesperson}/10
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${call.certaintySalesperson * 10}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Company Certainty</span>
                      <span className={`font-medium ${getScoreColor(call.certaintyCompany)}`}>
                        {call.certaintyCompany}/10 {call.certaintyCompany < 8 && '⚠️ Focus here'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${call.certaintyCompany >= 8 ? 'bg-green-600' : 'bg-yellow-600'}`}
                        style={{ width: `${call.certaintyCompany * 10}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Scores */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className={`text-xl font-bold ${getScoreColor(call.tonalityScore)}`}>
                    {call.tonalityScore}/10
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Tonality</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className={`text-xl font-bold ${getScoreColor(call.scriptAdherence)}`}>
                    {call.scriptAdherence}/10
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Script</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">
                    {call.closingAttempts}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Closes</div>
                </div>
              </div>

              {/* AI Summary */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">{call.aiSummary}</p>
              </div>

              {/* Strengths & Improvements */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-green-600 mb-2">✅ Stärken</h5>
                  <ul className="space-y-1">
                    {call.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-gray-600">• {strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-orange-600 mb-2">📈 Verbesserungsbereiche</h5>
                  <ul className="space-y-1">
                    {call.areasForImprovement.map((area, index) => (
                      <li key={index} className="text-sm text-gray-600">• {area}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Coaching Points */}
              {call.coachingPoints.length > 0 && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">🎓 Coaching-Empfehlungen</h5>
                  <div className="space-y-2">
                    {call.coachingPoints.map((point, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-blue-900 uppercase">{point.area}</span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                point.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {point.priority}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-700">
                              <span className="font-medium">Observation:</span> {point.observation}
                            </p>
                            <p className="mt-1 text-sm text-gray-700">
                              <span className="font-medium">💡 Tip:</span> {point.recommendation}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <PlayIcon className="h-4 w-4 mr-2" />
                  Aufnahme Anhören
                </button>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <ChartBarIcon className="h-4 w-4 mr-2" />
                  Vollständige Analyse
                </button>
                <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Bericht Herunterladen
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload New Recording */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Neue Aufnahme Hochladen</h3>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-gray-400 transition-colors cursor-pointer">
          <PhoneIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">Anrufaufnahme ziehen & ablegen oder klicken zum Durchsuchen</p>
          <p className="mt-1 text-xs text-gray-500">Unterstützt MP3, WAV, M4A (Firefly/Google Drive Auto-Sync aktiviert)</p>
        </div>
      </div>
    </div>
  )
}


