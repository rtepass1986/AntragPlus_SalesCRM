'use client'

import { useState } from 'react'
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { DealFilters } from '@/lib/crm-types'

interface AdvancedFiltersProps {
  onApply: (filters: DealFilters) => void
  onReset: () => void
  currentFilters?: DealFilters
}

export function AdvancedFilters({ onApply, onReset, currentFilters }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<DealFilters>(currentFilters || {})

  const handleApply = () => {
    onApply(filters)
    setIsOpen(false)
  }

  const handleReset = () => {
    setFilters({})
    onReset()
    setIsOpen(false)
  }

  const activeFilterCount = Object.keys(filters).filter(key => {
    const value = filters[key as keyof DealFilters]
    return value !== undefined && value !== null && value !== ''
  }).length

  return (
    <>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
      >
        <FunnelIcon className="h-5 w-5" />
        <span>Filter</span>
        {activeFilterCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-cyan-500 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-12 z-50 w-96 bg-white rounded-lg shadow-xl border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Erweiterte Filter</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Filters */}
            <div className="space-y-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  multiple
                  value={filters.status || []}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value) as any
                    setFilters({ ...filters, status: selected })
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  size={3}
                >
                  <option value="open">Offen</option>
                  <option value="won">Gewonnen</option>
                  <option value="lost">Verloren</option>
                </select>
              </div>

              {/* Value Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Wert
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Min €"
                    value={filters.minValue || ''}
                    onChange={(e) => setFilters({ ...filters, minValue: Number(e.target.value) || undefined })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <input
                    type="number"
                    placeholder="Max €"
                    value={filters.maxValue || ''}
                    onChange={(e) => setFilters({ ...filters, maxValue: Number(e.target.value) || undefined })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zeitraum
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    placeholder="Von"
                    value={filters.dateRange?.from || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateRange: { ...filters.dateRange, from: e.target.value, to: filters.dateRange?.to || '' }
                    })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <input
                    type="date"
                    placeholder="Bis"
                    value={filters.dateRange?.to || ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateRange: { from: filters.dateRange?.from || '', ...filters.dateRange, to: e.target.value }
                    })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Suchbegriff
                </label>
                <input
                  type="text"
                  placeholder="Suche in Titel, Organisation..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value || undefined })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Zurücksetzen
              </button>
              <button
                onClick={handleApply}
                className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm"
              >
                Filter anwenden
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

