'use client'

import { useState, useEffect } from 'react'
import { leadsApi, type Lead, type LeadDetail, type LeadStats } from '@/lib/leads-api'
import { LeadDetailPanel } from '@/components/leads/LeadDetailPanel'
import { CSVUploadModal } from '@/components/leads/CSVUploadModal'
import { LeadReviewCard } from '@/components/leads/LeadReviewCard'
import { DuplicatesPanel } from '@/components/leads/DuplicatesPanel'
import { MagnifyingGlassIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function LeadsPage() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'enriched' | 'pending' | 'failed' | 'review' | 'approved'>('all')
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<LeadStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedLead, setSelectedLead] = useState<LeadDetail | null>(null)
  const [loadingLeadDetail, setLoadingLeadDetail] = useState(false)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [selectedLeadsForBatch, setSelectedLeadsForBatch] = useState<string[]>([])
  const [editingLead, setEditingLead] = useState<LeadDetail | null>(null)
  const [duplicatesPanelOpen, setDuplicatesPanelOpen] = useState(false)

  // Load leads
  useEffect(() => {
    loadLeads()
  }, [selectedTab, page, searchQuery])

  const loadLeads = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await leadsApi.getLeads({
        status: selectedTab === 'all' ? undefined : selectedTab,
        search: searchQuery || undefined,
        page,
        limit: 20,
      })

      setLeads(response.leads)
      setStats(response.stats)
      setTotalPages(response.pagination.totalPages)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Leads')
      console.error('Error loading leads:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLeadClick = async (leadId: string) => {
    try {
      setLoadingLeadDetail(true)
      const response = await leadsApi.getLead(leadId)
      setSelectedLead(response.lead)
    } catch (err: any) {
      console.error('Error loading lead detail:', err)
    } finally {
      setLoadingLeadDetail(false)
    }
  }

  const handleEnrich = async () => {
    const pendingLeadIds = leads
      .filter(l => l.status === 'pending')
      .map(l => l.id)

    if (pendingLeadIds.length === 0) {
      alert('Keine ausstehenden Leads zum Anreichern')
      return
    }

    try {
      setEnriching(true)
      await leadsApi.enrichLeads(pendingLeadIds)
      alert(`Anreicherung für ${pendingLeadIds.length} Leads gestartet`)
      // Reload leads after a short delay
      setTimeout(() => {
        loadLeads()
      }, 1000)
    } catch (err: any) {
      alert('Fehler beim Starten der Anreicherung')
      console.error(err)
    } finally {
      setEnriching(false)
    }
  }

  const handleExport = async () => {
    try {
      const blob = await leadsApi.exportLeads(selectedTab === 'all' ? undefined : selectedTab)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-${selectedTab}-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Export-Funktion wird noch implementiert')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `vor ${diffMins} Min`
    if (diffHours < 24) return `vor ${diffHours} Std`
    if (diffDays < 30) return `vor ${diffDays} Tagen`
    
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  const handleApproveLead = async (leadId: string, editedFields?: any) => {
    try {
      const result = await leadsApi.approveLead(leadId, editedFields)
      alert(`✅ ${result.message}\n\nKontakt ID: ${result.contactId}\nDeal ID: ${result.dealId}`)
      loadLeads() // Reload
    } catch (error: any) {
      alert(`Fehler: ${error.message}`)
    }
  }

  const handleRejectLead = async (leadId: string) => {
    try {
      await leadsApi.rejectLead(leadId)
      alert('Lead abgelehnt')
      loadLeads()
    } catch (error: any) {
      alert(`Fehler: ${error.message}`)
    }
  }

  const handleBatchApprove = async () => {
    if (selectedLeadsForBatch.length === 0) {
      alert('Keine Leads ausgewählt')
      return
    }

    if (confirm(`${selectedLeadsForBatch.length} Leads genehmigen und zu Pipeline hinzufügen?`)) {
      try {
        const result = await leadsApi.batchApproveLead(selectedLeadsForBatch)
        alert(`✅ ${result.message}`)
        setSelectedLeadsForBatch([])
        loadLeads()
      } catch (error: any) {
        alert(`Fehler: ${error.message}`)
      }
    }
  }

  const getStatusBadge = (status: Lead['status']) => {
    switch (status) {
      case 'enriched':
        return <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Angereichert</span>
      case 'pending':
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">Ausstehend</span>
      case 'failed':
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Fehlgeschlagen</span>
    }
  }

  // Loading State
  if (loading && leads.length === 0) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="rounded-lg border border-zinc-200 bg-white p-6">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Error State
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            LEAD ENRICHMENT
          </h1>
        </div>
        <div className="rounded-lg bg-red-50 border border-red-200 p-6">
          <h3 className="text-lg font-semibold text-red-900">Fehler beim Laden</h3>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            onClick={loadLeads}
            className="mt-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          LEAD ENRICHMENT
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          KI-gestützte Lead-Anreicherung und Verwaltung
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Gesamt Leads" value={stats.total.toString()} trend={`+${((stats.total / (stats.total || 1)) * 100).toFixed(0)}%`} />
          <StatCard label="Angereichert" value={stats.enriched.toString()} trend={`${((stats.enriched / (stats.total || 1)) * 100).toFixed(0)}%`} />
          <StatCard label="Ø Konfidenz" value={`${Math.round(stats.avgConfidence * 100)}%`} trend="+5%" />
          <StatCard label="Monatliche Kosten" value={`€${stats.costEstimate.toFixed(2)}`} trend="+12%" />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-4">
        <button
          onClick={handleEnrich}
          disabled={enriching}
          className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {enriching ? (
            <span className="flex items-center gap-2">
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
              Anreicherung läuft...
            </span>
          ) : (
            'Anreicherung starten'
          )}
        </button>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors"
        >
          📄 CSV hochladen
        </button>
        <button
          onClick={() => setDuplicatesPanelOpen(true)}
          className="rounded-lg border border-orange-300 px-6 py-2.5 text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors flex items-center gap-2"
        >
          <ExclamationTriangleIcon className="h-5 w-5" />
          Duplikate prüfen
        </button>
        <button
          onClick={handleExport}
          className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors"
        >
          Report exportieren
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Suche nach Unternehmen, Branche, Tätigkeitsfeld..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1) // Reset to first page on search
            }}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <button
          onClick={loadLeads}
          className="rounded-lg border border-gray-300 p-2.5 text-gray-600 hover:bg-gray-50 transition-colors"
          title="Aktualisieren"
        >
          <ArrowPathIcon className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-200">
        <nav className="-mb-px flex space-x-6">
          {(['all', 'pending', 'enriched', 'review', 'approved', 'failed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setSelectedTab(tab)
                setPage(1) // Reset to first page
              }}
              className={`
                whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${
                  selectedTab === tab
                    ? 'border-cyan-600 text-cyan-600'
                    : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                }
              `}
            >
              {tab === 'all' ? 'Alle' : 
               tab === 'pending' ? 'Ausstehend' : 
               tab === 'enriched' ? 'Angereichert' : 
               tab === 'review' ? 'Review' :
               tab === 'approved' ? 'Genehmigt' :
               'Fehlgeschlagen'}
              {stats && (
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {tab === 'all' ? stats.total : tab === 'enriched' ? stats.enriched : tab === 'pending' ? stats.pending : stats.failed}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Review Tab - Special View */}
      {selectedTab === 'review' && (
        <div className="space-y-4">
          {/* Batch Actions */}
          {selectedLeadsForBatch.length > 0 && (
            <div className="rounded-lg bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 p-4 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                {selectedLeadsForBatch.length} Leads ausgewählt
              </span>
              <button
                onClick={handleBatchApprove}
                className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2 text-sm font-medium text-white hover:from-green-600 hover:to-green-700 transition-colors shadow-sm"
              >
                <CheckCircleIcon className="h-5 w-5" />
                Alle genehmigen
              </button>
            </div>
          )}

          {/* Review Cards */}
          {leads.length > 0 ? (
            <div className="space-y-4">
              {leads.map((lead) => (
                <LeadReviewCard
                  key={lead.id}
                  lead={lead as LeadDetail}
                  onApprove={handleApproveLead}
                  onReject={handleRejectLead}
                  onEdit={(l) => {
                    setSelectedLead(l)
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
              <p className="mt-4 text-sm text-gray-500">
                🎉 Keine Leads brauchen Review! Alle haben hohe Konfidenz (≥80%)
              </p>
            </div>
          )}
        </div>
      )}

      {/* Regular Table View (for non-review tabs) */}
      {selectedTab !== 'review' && (
        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow">
          <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Unternehmen
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Konfidenz
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Tätigkeitsfeld
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                Aktualisiert
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <p className="text-sm text-zinc-500">
                    {searchQuery
                      ? 'Keine Leads gefunden. Versuchen Sie eine andere Suche.'
                      : 'Keine Leads gefunden. CSV hochladen oder Anreicherung starten.'}
                  </p>
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleLeadClick(lead.id)}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{lead.companyName}</div>
                      {lead.website && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">{lead.website}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(lead.status)}
                  </td>
                  <td className="px-6 py-4">
                    {lead.confidence > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className={`h-full rounded-full ${
                              lead.confidence >= 0.8 ? 'bg-green-500' : lead.confidence >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${lead.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(lead.confidence * 100)}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {lead.tätigkeitsfeld || lead.industry || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {formatDate(lead.updatedAt)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLeadClick(lead.id)
                      }}
                      className="text-sm font-medium text-cyan-600 hover:text-cyan-700"
                    >
                      Details →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Seite {page} von {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Zurück
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Weiter
            </button>
          </div>
        </div>
      )}

      {/* Lead Detail Panel */}
      {selectedLead && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedLead(null)}
          />
          <LeadDetailPanel
            lead={selectedLead}
            onClose={() => setSelectedLead(null)}
            onUpdate={(updatedLead) => {
              setSelectedLead(updatedLead)
              loadLeads() // Reload list
            }}
          />
        </>
      )}

      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={(imported) => {
          console.log(`${imported} leads imported`)
          loadLeads() // Reload list
        }}
      />

      {/* Duplicates Panel */}
      <DuplicatesPanel
        isOpen={duplicatesPanelOpen}
        onClose={() => setDuplicatesPanelOpen(false)}
        onMerged={() => {
          loadLeads()
        }}
      />
    </div>
  )
}

function StatCard({ label, value, trend }: { label: string; value: string; trend: string }) {
  const isPositive = trend.startsWith('+')
  
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow">
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-zinc-900">{value}</span>
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {trend}
        </span>
      </dd>
    </div>
  )
}
