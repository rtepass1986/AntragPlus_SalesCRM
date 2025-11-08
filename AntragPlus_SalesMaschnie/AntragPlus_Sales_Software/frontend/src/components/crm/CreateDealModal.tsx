'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { dealsApi } from '@/lib/crm-api'
import type { DealFormData } from '@/lib/crm-types'

interface CreateDealModalProps {
  isOpen: boolean
  onClose: () => void
  defaultStage?: string
  onSuccess?: () => void
}

export function CreateDealModal({ isOpen, onClose, defaultStage, onSuccess }: CreateDealModalProps) {
  const [formData, setFormData] = useState<DealFormData>({
    title: '',
    value: 0,
    currency: 'EUR',
    stage: (defaultStage as any) || 'lead',
    probability: 20,
    expectedCloseDate: '',
    description: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title) {
      setError('Titel ist erforderlich')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      await dealsApi.create(formData)
      
      onSuccess?.()
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen des Deals')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      value: 0,
      currency: 'EUR',
      stage: 'lead',
      probability: 20,
      expectedCloseDate: '',
      description: '',
    })
    setError(null)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl pointer-events-auto max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 sticky top-0 bg-white">
            <h2 className="text-xl font-bold text-gray-900">Neuer Deal</h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deal Titel *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="z.B. CRM System für Caritas München"
                required
              />
            </div>

            {/* Value & Currency */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deal Wert
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  min="0"
                  step="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Währung
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>

            {/* Probability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wahrscheinlichkeit: {formData.probability}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Expected Close Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Erwartetes Abschlussdatum
              </label>
              <input
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beschreibung
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="Deal Details, Notizen, etc."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={loading || !formData.title}
                className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird erstellt...' : 'Deal erstellen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

