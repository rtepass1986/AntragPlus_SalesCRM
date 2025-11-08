'use client'

import { useState, useEffect } from 'react'
import { PipelineBoard } from '@/components/crm/PipelineBoard'
import { DealDetailPanel } from '@/components/crm/DealDetailPanel'
import { CreateDealModal } from '@/components/crm/CreateDealModal'
import { CreateActivityModal } from '@/components/crm/CreateActivityModal'
import { FileUploadModal } from '@/components/crm/FileUploadModal'
import { AdvancedFilters } from '@/components/crm/AdvancedFilters'
import type { Deal, PipelineStage, DealFilters } from '@/lib/crm-types'
import { dealsApi } from '@/lib/crm-api'

export default function CRMPipelinePage() {
  const [dealsByStage, setDealsByStage] = useState<any[]>([])
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null)
  const [isCreatingDeal, setIsCreatingDeal] = useState(false)
  const [newDealStage, setNewDealStage] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createActivityModalOpen, setCreateActivityModalOpen] = useState(false)
  const [fileUploadModalOpen, setFileUploadModalOpen] = useState(false)
  const [filters, setFilters] = useState<DealFilters>({})

  // Fetch real deals from Pipedrive on mount
  useEffect(() => {
    loadDeals()
  }, [])

  const loadDeals = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await dealsApi.getByStage()
      setDealsByStage(data)
    } catch (err: any) {
      console.error('Failed to load deals:', err)
      setError('Failed to load deals from database')
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate pipeline stats from dealsByStage
  const allDeals = dealsByStage.flatMap(stage => stage.deals)
  const stats = {
    totalDeals: allDeals.length,
    totalValue: dealsByStage.reduce((sum, stage) => sum + stage.totalValue, 0),
    avgDealValue: allDeals.length > 0 ? dealsByStage.reduce((sum, stage) => sum + stage.totalValue, 0) / allDeals.length : 0,
    openDeals: allDeals.filter((d: any) => d.status === 'open').length,
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleDealMove = async (dealId: string, newStageId: PipelineStage | number) => {
    try {
      // Update in Pipedrive
      await dealsApi.updateStage(dealId, newStageId as any)
      
      // The PipelineBoard component handles optimistic update
      // No need to reload here unless the update fails
    } catch (err) {
      console.error('Failed to move deal:', err)
      // Reload to get correct state from server
      loadDeals()
    }
  }

  const handleDealClick = (deal: any) => {
    setSelectedDeal(deal)
  }

  const handleAddDeal = (stage: string) => {
    setNewDealStage(stage)
    setIsCreatingDeal(true)
  }

  const handleApplyFilters = (newFilters: DealFilters) => {
    setFilters(newFilters)
    // TODO: Apply filters to deal loading
    loadDeals()
  }

  const handleResetFilters = () => {
    setFilters({})
    loadDeals()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Lädt Deals aus Pipedrive...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900">Fehler beim Laden</h3>
        <p className="mt-2 text-sm text-blue-700">{error}</p>
        <button
          onClick={loadDeals}
          className="mt-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700"
        >
          Erneut Versuchen
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          SALES PIPELINE
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Verwalte deine Deals durch alle Phasen des Verkaufsprozesses
        </p>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <span className="text-3xl mr-3">📊</span>
              <div>
                <dt className="text-sm font-medium text-gray-500 truncate">Gesamt Deals</dt>
                <dd className="text-2xl font-semibold text-gray-900">{stats.totalDeals}</dd>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <span className="text-3xl mr-3">💰</span>
              <div>
                <dt className="text-sm font-medium text-gray-500 truncate">Pipeline Wert</dt>
                <dd className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.totalValue)}</dd>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <span className="text-3xl mr-3">📈</span>
              <div>
                <dt className="text-sm font-medium text-gray-500 truncate">Durchschnitt</dt>
                <dd className="text-2xl font-semibold text-gray-900">{formatCurrency(stats.avgDealValue)}</dd>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <span className="text-3xl mr-3">🎯</span>
              <div>
                <dt className="text-sm font-medium text-gray-500 truncate">Offene Deals</dt>
                <dd className="text-2xl font-semibold text-gray-900">{stats.openDeals}</dd>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="relative">
          <AdvancedFilters
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            currentFilters={filters}
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setCreateActivityModalOpen(true)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            + Aktivität
          </button>
          <button
            onClick={() => setFileUploadModalOpen(true)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            📎 Dateien
          </button>
          <button
            onClick={() => setIsCreatingDeal(true)}
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
          >
            + Neuer Deal
          </button>
        </div>
      </div>

      {/* Pipeline Board */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <div className="p-6">
          <PipelineBoard
            dealsByStage={dealsByStage}
            onDealMove={handleDealMove}
            onDealClick={handleDealClick}
            onAddDeal={handleAddDeal}
          />
        </div>
      </div>

      {/* Help Text */}
      <div className="rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 p-4">
        <div className="flex items-start space-x-3">
          <span className="text-2xl">💡</span>
          <div>
            <p className="text-sm text-gray-700">
              <strong className="text-cyan-700">Tipp:</strong> Ziehe Deals zwischen Spalten um die Phase zu ändern. Klicke auf einen Deal für Details.
            </p>
          </div>
        </div>
      </div>

      {/* Deal Detail Panel */}
      {selectedDeal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedDeal(null)}
          />
          {/* Panel */}
          <DealDetailPanel
            deal={selectedDeal}
            onClose={() => setSelectedDeal(null)}
            onUpdate={(updatedDeal) => {
              // Reload deals to get updated data
              loadDeals()
              setSelectedDeal(updatedDeal)
            }}
          />
        </>
      )}

      {/* Create Deal Modal */}
      <CreateDealModal
        isOpen={isCreatingDeal}
        onClose={() => {
          setIsCreatingDeal(false)
          setNewDealStage('')
        }}
        defaultStage={newDealStage}
        onSuccess={() => {
          loadDeals()
        }}
      />

      {/* Create Activity Modal */}
      <CreateActivityModal
        isOpen={createActivityModalOpen}
        onClose={() => setCreateActivityModalOpen(false)}
        dealId={selectedDeal?.id}
        onSuccess={() => {
          // Reload if deal selected
          if (selectedDeal) {
            loadDeals()
          }
        }}
      />

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={fileUploadModalOpen}
        onClose={() => setFileUploadModalOpen(false)}
        dealId={selectedDeal?.id}
        onSuccess={() => {
          if (selectedDeal) {
            loadDeals()
          }
        }}
      />
    </div>
  )
}


