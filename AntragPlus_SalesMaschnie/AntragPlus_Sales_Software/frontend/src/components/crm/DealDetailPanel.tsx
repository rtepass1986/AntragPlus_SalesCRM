'use client'

import { useState, useEffect } from 'react'
import type { Deal, Activity } from '@/lib/crm-types'
import { activitiesApi } from '@/lib/crm-api'
import clsx from 'clsx'

interface DealDetailPanelProps {
  deal: Deal
  onClose: () => void
  onUpdate?: (deal: Deal) => void
}

export function DealDetailPanel({ deal, onClose, onUpdate }: DealDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'activities' | 'files'>('overview')
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoadingActivities, setIsLoadingActivities] = useState(false)

  useEffect(() => {
    if (activeTab === 'activities') {
      loadActivities()
    }
  }, [activeTab, deal.id])

  const loadActivities = async () => {
    setIsLoadingActivities(true)
    try {
      // TODO: Replace with real API call when activities endpoint is ready
      // const data = await activitiesApi.getAll({ dealId: deal.id })
      // setActivities(data)
      setActivities([]) // Empty for now
    } catch (error) {
      console.error('Failed to load activities:', error)
    } finally {
      setIsLoadingActivities(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: deal.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nicht gesetzt'
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString))
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-hidden bg-white shadow-2xl">
      {/* Header */}
      <div className="border-b border-zinc-200 bg-zinc-50 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-zinc-900">{deal.title}</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Deal #{deal.id} • Erstellt {formatDate(deal.createdAt)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-4 border-b border-zinc-200">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          >
            Übersicht
          </TabButton>
          <TabButton
            active={activeTab === 'activities'}
            onClick={() => setActiveTab('activities')}
          >
            Aktivitäten ({deal.activitiesCount})
          </TabButton>
          <TabButton
            active={activeTab === 'files'}
            onClick={() => setActiveTab('files')}
          >
            Dateien ({deal.filesCount})
          </TabButton>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-180px)] overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Key Info */}
            <div className="grid grid-cols-2 gap-6">
              <InfoCard label="Deal Wert" value={formatCurrency(deal.value)} icon="💰" />
              <InfoCard label="Wahrscheinlichkeit" value={`${deal.probability}%`} icon="📊" />
              <InfoCard label="Phase" value={deal.stage} icon="🎯" />
              <InfoCard label="Status" value={deal.status === 'open' ? 'Offen' : deal.status === 'won' ? 'Gewonnen' : 'Verloren'} icon="✨" />
            </div>

            {/* Organization & Contact */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900">Organisation & Kontakt</h3>
              
              {deal.organizationName && (
                <div className="rounded-lg border border-zinc-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">{deal.organizationName}</p>
                      <p className="text-sm text-zinc-600">Organisation</p>
                    </div>
                  </div>
                </div>
              )}

              {deal.contactName && (
                <div className="rounded-lg border border-zinc-200 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-zinc-900">{deal.contactName}</p>
                      <p className="text-sm text-zinc-600">Kontaktperson</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900">Zeitplan</h3>
              <div className="space-y-3">
                <TimelineItem
                  label="Erwarteter Abschluss"
                  value={formatDate(deal.expectedCloseDate)}
                />
                <TimelineItem
                  label="Erstellt"
                  value={formatDate(deal.createdAt)}
                />
                <TimelineItem
                  label="Zuletzt aktualisiert"
                  value={formatDate(deal.updatedAt)}
                />
              </div>
            </div>

            {/* Description */}
            {deal.description && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-zinc-900">Beschreibung</h3>
                <p className="text-sm text-zinc-600 whitespace-pre-wrap">{deal.description}</p>
              </div>
            )}

            {/* Additional Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900">Zusätzliche Informationen</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-zinc-600">Verantwortlich</p>
                  <p className="font-medium text-zinc-900">{deal.ownerName || 'Unbekannt'}</p>
                </div>
                {deal.source && (
                  <div>
                    <p className="text-sm text-zinc-600">Quelle</p>
                    <p className="font-medium text-zinc-900">{deal.source}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="p-6">
            {isLoadingActivities ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-600 border-r-transparent"></div>
                  <p className="mt-4 text-sm text-zinc-600">Lädt Aktivitäten...</p>
                </div>
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="rounded-lg border border-zinc-200 p-4">
                    <p className="font-medium text-zinc-900">{activity.subject}</p>
                    <p className="mt-1 text-sm text-zinc-600">{activity.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-zinc-500">Noch keine Aktivitäten</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="p-6">
            <div className="py-12 text-center">
              <p className="text-sm text-zinc-500">Keine Dateien angehängt</p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 bg-zinc-50 px-6 py-4">
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Schließen
          </button>
          <div className="flex gap-2">
            <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100">
              Bearbeiten
            </button>
            <button className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm">
              In Pipedrive öffnen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'border-b-2 pb-2 text-sm font-medium transition-colors',
        active
          ? 'border-cyan-600 text-cyan-600'
          : 'border-transparent text-zinc-600 hover:text-zinc-900'
      )}
    >
      {children}
    </button>
  )
}

function InfoCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm text-zinc-600">{label}</p>
          <p className="text-lg font-semibold text-zinc-900 capitalize">{value}</p>
        </div>
      </div>
    </div>
  )
}

function TimelineItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-3">
      <span className="text-sm text-zinc-600">{label}</span>
      <span className="text-sm font-medium text-zinc-900">{value}</span>
    </div>
  )
}

