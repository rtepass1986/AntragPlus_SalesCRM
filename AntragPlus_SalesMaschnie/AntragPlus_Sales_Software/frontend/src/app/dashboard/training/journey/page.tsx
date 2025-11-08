'use client'

import { useState } from 'react'

interface JourneyPhase {
  id: string
  number: number
  name: string
  ziel: string
  owner: string
  assets: string[]
  schwachpunkt: string
  prioritat: string
  color: string
  progress: number
}

export default function CustomerJourneyPage() {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)
  const [showAISuggestions, setShowAISuggestions] = useState(false)

  const journey: JourneyPhase[] = [
    {
      id: 'phase-1',
      number: 1,
      name: 'Aufmerksamkeit & Interesse',
      ziel: 'Gemeinnützige Organisationen verstehen den Nutzen von AntragPlus und zeigen konkretes Interesse',
      owner: 'Marketing / Growth',
      assets: ['Blog', 'SEO-Landingpages', 'Social-Ads', 'Newsletter'],
      schwachpunkt: 'Förderlandschaft wird nicht verstanden, Nutzen bleibt abstrakt',
      prioritat: 'Mehr Bildung statt Werbung – Case Studies, interaktive Förderfinder-Tools, klare Nutzenkommunikation',
      color: 'bg-blue-500',
      progress: 85,
    },
    {
      id: 'phase-2',
      number: 2,
      name: 'Erstkontakt & Qualifizierung',
      ziel: 'Persönliche Verbindung aufbauen, Vertrauen gewinnen, Termin sichern',
      owner: 'Sales-Team',
      assets: ['Warm-Up-E-Mail', 'Personalisiertes Demo-Deck', 'CRM-Sequenzen'],
      schwachpunkt: 'Nach Demo fehlt strukturierter Follow-Up-Prozess',
      prioritat: 'Automatisierte E-Mail-Sequenzen, Reminder im CRM, Demo-Storyline mit konkretem Mehrwert',
      color: 'bg-indigo-500',
      progress: 72,
    },
    {
      id: 'phase-3',
      number: 3,
      name: 'Onboarding & Vorbereitung',
      ziel: 'Kunde startet Antrag, alle Unterlagen vollständig',
      owner: 'Customer Success / Projektbegleitung',
      assets: ['Onboarding-Checkliste', 'Formular', 'Vorlagenpaket'],
      schwachpunkt: 'Unklare Anforderungen, viele Rückfragen',
      prioritat: 'Interaktive Schritt-für-Schritt-Guides, Standard-Checklisten, Vorbefüllung von Feldern durch KI',
      color: 'bg-purple-500',
      progress: 68,
    },
    {
      id: 'phase-4',
      number: 4,
      name: 'Antragseinreichung & Review',
      ziel: 'Antrag fehlerfrei eingereicht und bestätigt',
      owner: 'Account Manager',
      assets: ['Upload-Plattform', 'Review-Checkliste', 'Status-E-Mails'],
      schwachpunkt: 'Unsicherheit über Erfolgschancen',
      prioritat: 'Sichtbare Erfolgsindikatoren, Gamification-Elemente, Fortschritts-Leiste',
      color: 'bg-pink-500',
      progress: 90,
    },
    {
      id: 'phase-5',
      number: 5,
      name: 'Förderzusage & Kommunikation',
      ziel: 'Bewilligung erreicht, klare Kommunikation zu nächsten Schritten',
      owner: 'Account Manager',
      assets: ['Vorlagen für E-Mail-Kommunikation', 'Reporting-Dashboard'],
      schwachpunkt: 'Erwartungsmanagement, Unsicherheit bei Nachweispflichten',
      prioritat: 'Post-Win-Check-in-Call, automatische Projekt-Kick-Off-E-Mail, Übersicht "Was jetzt?"',
      color: 'bg-green-500',
      progress: 82,
    },
    {
      id: 'phase-6',
      number: 6,
      name: 'Projektmanagement & Nachweisführung',
      ziel: 'Projekt erfolgreich umsetzen, Fristen und Pflichten einhalten',
      owner: 'Projektleitung (intern/extern)',
      assets: ['PM-Portal', 'Reporting-Vorlagen', 'Erinnerungssystem'],
      schwachpunkt: 'Fehlendes Verständnis der Förderlogik und Fristen',
      prioritat: 'Mini-Tutorials in der Plattform, automatische Erinnerungen, Templates für Verwendungsnachweise',
      color: 'bg-teal-500',
      progress: 65,
    },
    {
      id: 'phase-7',
      number: 7,
      name: 'Bindung & Ausbau',
      ziel: 'Kund:innen behalten und neue Förderprojekte gemeinsam anstoßen',
      owner: 'Key Account Manager',
      assets: ['Quartals-Review', 'Erfolgsberichte', 'Newsletter'],
      schwachpunkt: 'Nach Projektende kein Kontakt, kein Storytelling über Erfolge',
      prioritat: 'Kundenstories sichtbar machen, Empfehlungsprogramme, Veranstaltungen für Bestandskunden',
      color: 'bg-cyan-500',
      progress: 58,
    },
  ]

  const avgProgress = Math.round(journey.reduce((sum, phase) => sum + phase.progress, 0) / journey.length)

  const aiSuggestions = [
    {
      id: 'sug-1',
      phase: 2,
      type: 'Sales Script',
      suggestion: 'Demo-Script erweitern: Füge konkrete ROI-Beispiele aus erfolgreichen Projekten hinzu',
      confidence: 92,
      impact: 'high',
    },
    {
      id: 'sug-2',
      phase: 1,
      type: 'Training',
      suggestion: 'Einwand-Behandlung optimieren: "Zu teuer" → Fokus auf Fördermittel-ROI statt Preis',
      confidence: 88,
      impact: 'high',
    },
    {
      id: 'sug-3',
      phase: 5,
      type: 'Gesprächsführung',
      suggestion: 'Post-Win-Call-Script: Strukturierte Erwartungsklärung für Nachweispflichten',
      confidence: 85,
      impact: 'medium',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              CUSTOMER JOURNEY
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Version 2.0 • Vollständige deutsche Sales-Journey mit KI-Optimierung
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAISuggestions(!showAISuggestions)}
              className="rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 transition-colors"
            >
              🤖 KI-Vorschläge ({aiSuggestions.length})
            </button>
            <button className="rounded-lg bg-gradient-to-r from-brand-blue-500 to-brand-cyan-500 px-4 py-2 text-sm font-medium text-white hover:from-brand-blue-600 hover:to-brand-cyan-600 transition-all shadow-sm hover:shadow-md">
              Journey bearbeiten
            </button>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-zinc-900">Gesamt-Fortschritt</h3>
            <span className="text-2xl font-bold text-blue-600">{avgProgress}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-700"
              style={{ width: `${avgProgress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-zinc-600">
            Durchschnittliche Zielerreichung über alle 7 Phasen
          </p>
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {showAISuggestions && (
        <div className="mb-8 rounded-lg border-2 border-purple-200 bg-purple-50 p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-purple-900 mb-2">
              🤖 KI-Verbesserungsvorschläge
            </h2>
            <p className="text-sm text-purple-700">
              Automatische Analyse deiner Scripts und Sales-Training. Keine automatischen Updates - nur Vorschläge zur manuellen Genehmigung.
            </p>
          </div>
          <div className="space-y-3">
            {aiSuggestions.map((suggestion) => (
              <div key={suggestion.id} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
                        Phase {suggestion.phase}
                      </span>
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                        {suggestion.type}
                      </span>
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                        suggestion.impact === 'high' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        Impact: {suggestion.impact}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-zinc-900">{suggestion.suggestion}</p>
                    <p className="mt-1 text-xs text-zinc-600">Vertrauen: {suggestion.confidence}%</p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <button className="rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700">
                      ✓ Manuell umsetzen
                    </button>
                    <button className="rounded-lg border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50">
                      ✗ Ignorieren
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Journey Phases */}
      <div className="relative">
        {/* Connection Line */}
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 via-pink-500 via-green-500 via-teal-500 to-cyan-500" />

        {/* Phases */}
        <div className="space-y-8">
          {journey.map((phase) => (
            <div key={phase.id} className="relative">
              <div className="flex items-start gap-6">
                {/* Phase Number */}
                <div className={`relative z-10 flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full ${phase.color} text-white shadow-lg ring-4 ring-white`}>
                  <span className="text-2xl font-bold">{phase.number}</span>
                </div>

                {/* Phase Content */}
                <div className="flex-1">
                  <div
                    className="cursor-pointer rounded-lg border-2 border-zinc-200 bg-white p-6 shadow-md hover:shadow-lg transition-all hover:border-blue-400"
                    onClick={() => setSelectedPhase(selectedPhase === phase.id ? null : phase.id)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-zinc-900">{phase.name}</h3>
                        <p className="mt-2 text-sm text-zinc-700">
                          <strong className="text-zinc-900">Ziel:</strong> {phase.ziel}
                        </p>
                      </div>
                      <button className="ml-4 text-zinc-400 hover:text-zinc-600 transition-colors">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={selectedPhase === phase.id ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                        </svg>
                      </button>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <InfoBadge label="Owner" value={phase.owner} icon="👤" />
                      <InfoBadge label="Fortschritt" value={`${phase.progress}%`} icon="📊" />
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="h-2 w-full rounded-full bg-zinc-200">
                        <div
                          className={`h-full rounded-full ${phase.color}`}
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {selectedPhase === phase.id && (
                      <div className="border-t border-zinc-200 pt-4 mt-4 space-y-4">
                        {/* Assets */}
                        <div>
                          <h4 className="text-sm font-semibold text-zinc-900 mb-2">📋 Assets:</h4>
                          <div className="flex flex-wrap gap-2">
                            {phase.assets.map((asset, idx) => (
                              <span
                                key={idx}
                                className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700"
                              >
                                {asset}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Schwachpunkt */}
                        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                          <h4 className="text-sm font-semibold text-red-900 mb-2">⚠️ Schwachpunkt:</h4>
                          <p className="text-sm text-red-700">{phase.schwachpunkt}</p>
                        </div>

                        {/* Priorität */}
                        <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                          <h4 className="text-sm font-semibold text-green-900 mb-2">🎯 Priorität:</h4>
                          <p className="text-sm text-green-700">{phase.prioritat}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 pt-2">
                          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
                            Phase bearbeiten
                          </button>
                          <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                            Touchpoints verwalten
                          </button>
                          <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                            KPIs festlegen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function InfoBadge({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2">
      <span>{icon}</span>
      <div>
        <p className="text-xs text-zinc-600">{label}</p>
        <p className="text-sm font-semibold text-zinc-900">{value}</p>
      </div>
    </div>
  )
}
