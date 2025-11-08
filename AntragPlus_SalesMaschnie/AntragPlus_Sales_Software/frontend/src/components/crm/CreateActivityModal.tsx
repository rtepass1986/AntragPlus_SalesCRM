'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { activitiesApi } from '@/lib/crm-api'
import type { ActivityFormData, ActivityType, PriorityLevel } from '@/lib/crm-types'

interface CreateActivityModalProps {
  isOpen: boolean
  onClose: () => void
  dealId?: string
  contactId?: string
  onSuccess?: () => void
}

export function CreateActivityModal({ isOpen, onClose, dealId, contactId, onSuccess }: CreateActivityModalProps) {
  const [formData, setFormData] = useState<ActivityFormData>({
    type: 'call',
    subject: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    dueTime: '',
    duration: 30,
    dealId: dealId,
    contactId: contactId,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subject) {
      setError('Betreff ist erforderlich')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      await activitiesApi.create(formData)
      
      onSuccess?.()
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Fehler beim Erstellen der Aktivität')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      type: 'call',
      subject: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      dueTime: '',
      duration: 30,
      dealId,
      contactId,
    })
    setError(null)
    onClose()
  }

  const activityTypes: { value: ActivityType; label: string; icon: string }[] = [
    { value: 'call', label: 'Anruf', icon: '📞' },
    { value: 'meeting', label: 'Meeting', icon: '👥' },
    { value: 'email', label: 'E-Mail', icon: '📧' },
    { value: 'task', label: 'Aufgabe', icon: '✓' },
    { value: 'note', label: 'Notiz', icon: '📝' },
  ]

  const priorities: { value: PriorityLevel; label: string; color: string }[] = [
    { value: 'low', label: 'Niedrig', color: 'bg-gray-100 text-gray-700' },
    { value: 'medium', label: 'Mittel', color: 'bg-blue-100 text-blue-700' },
    { value: 'high', label: 'Hoch', color: 'bg-orange-100 text-orange-700' },
    { value: 'urgent', label: 'Dringend', color: 'bg-red-100 text-red-700' },
  ]

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
            <h2 className="text-xl font-bold text-gray-900">Neue Aktivität</h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6">
            {/* Activity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Aktivitätstyp
              </label>
              <div className="grid grid-cols-5 gap-3">
                {activityTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      formData.type === type.value
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <span className="text-xs font-medium text-gray-700">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Betreff *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                placeholder="z.B. Follow-up Call mit Max Mustermann"
                required
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
                placeholder="Notizen, Gesprächsthemen, etc."
              />
            </div>

            {/* Date, Time & Duration */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Uhrzeit
                </label>
                <input
                  type="time"
                  value={formData.dueTime}
                  onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dauer (Min)
                </label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  min="5"
                  step="5"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Priorität
              </label>
              <div className="grid grid-cols-4 gap-3">
                {priorities.map((priority) => (
                  <button
                    key={priority.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: priority.value })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      formData.priority === priority.value
                        ? `${priority.color} ring-2 ring-cyan-500`
                        : `${priority.color} opacity-50 hover:opacity-100`
                    }`}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
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
                disabled={loading || !formData.subject}
                className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Wird erstellt...' : 'Aktivität erstellen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

