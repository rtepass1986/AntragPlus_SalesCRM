'use client'

import { useState, useEffect } from 'react'
import { activitiesApi } from '@/lib/crm-api'
import { CreateActivityModal } from '@/components/crm/CreateActivityModal'
import type { Activity, ActivityType, ActivityStatus } from '@/lib/crm-types'
import { 
  PhoneIcon, 
  VideoCameraIcon, 
  EnvelopeIcon, 
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  PlusIcon
} from '@heroicons/react/24/outline'

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'upcoming' | 'overdue' | 'completed'>('all')
  const [createModalOpen, setCreateModalOpen] = useState(false)

  useEffect(() => {
    loadActivities()
  }, [selectedFilter])

  const loadActivities = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let data: Activity[]
      if (selectedFilter === 'upcoming') {
        data = await activitiesApi.getUpcoming(7)
      } else if (selectedFilter === 'overdue') {
        data = await activitiesApi.getOverdue()
      } else {
        data = await activitiesApi.getAll({
          status: selectedFilter === 'completed' ? ['completed'] : undefined
        })
      }
      
      setActivities(data)
    } catch (err: any) {
      console.error('Error loading activities:', err)
      setError('Fehler beim Laden der Aktivitäten')
      // Fallback to empty
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async (activityId: string) => {
    try {
      await activitiesApi.markComplete(activityId)
      loadActivities()
    } catch (error) {
      console.error('Error marking activity complete:', error)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Kein Datum'
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Heute'
    if (diffDays === 1) return 'Morgen'
    if (diffDays === -1) return 'Gestern'
    if (diffDays < -1) return `Überfällig (${Math.abs(diffDays)} Tage)`
    
    return new Intl.DateTimeFormat('de-DE', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'call': return <PhoneIcon className="h-5 w-5" />
      case 'meeting': return <VideoCameraIcon className="h-5 w-5" />
      case 'email': return <EnvelopeIcon className="h-5 w-5" />
      case 'task': return <CheckCircleIcon className="h-5 w-5" />
      default: return <CalendarIcon className="h-5 w-5" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-300'
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-300'
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-300'
      case 'low': return 'bg-gray-100 text-gray-700 border-gray-300'
      default: return 'bg-gray-100 text-gray-700 border-gray-300'
    }
  }

  const getStatusColor = (status: ActivityStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
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

  const stats = {
    total: activities.length,
    upcoming: activities.filter(a => a.status === 'pending' && a.dueDate && new Date(a.dueDate) >= new Date()).length,
    overdue: activities.filter(a => a.status === 'pending' && a.dueDate && new Date(a.dueDate) < new Date()).length,
    completed: activities.filter(a => a.status === 'completed').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            AKTIVITÄTEN
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Verwalte alle Aufgaben, Anrufe, Meetings und Termine
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <PlusIcon className="h-5 w-5" />
          Neue Aktivität
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Gesamt" value={stats.total.toString()} icon="📋" />
        <StatCard label="Anstehend" value={stats.upcoming.toString()} icon="📅" />
        <StatCard label="Überfällig" value={stats.overdue.toString()} icon="⚠️" />
        <StatCard label="Abgeschlossen" value={stats.completed.toString()} icon="✅" />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-4">
        <div className="flex gap-2">
          {['all', 'upcoming', 'overdue', 'completed'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === filter
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {filter === 'all' ? 'Alle' : filter === 'upcoming' ? 'Anstehend' : filter === 'overdue' ? 'Überfällig' : 'Abgeschlossen'}
            </button>
          ))}
        </div>
      </div>

      {/* Activities List */}
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">
              {selectedFilter === 'all' ? 'Keine Aktivitäten vorhanden' : 'Keine Aktivitäten in dieser Kategorie'}
            </p>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="mt-4 text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Erste Aktivität erstellen
            </button>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="rounded-lg border border-gray-200 bg-white p-5 hover:border-cyan-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  activity.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {getActivityIcon(activity.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{activity.subject}</h3>
                      {activity.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{activity.description}</p>
                      )}
                      
                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        {activity.dealTitle && (
                          <span className="text-xs text-gray-600">
                            Deal: <span className="font-medium">{activity.dealTitle}</span>
                          </span>
                        )}
                        {activity.contactName && (
                          <span className="text-xs text-gray-600">
                            Kontakt: <span className="font-medium">{activity.contactName}</span>
                          </span>
                        )}
                        {activity.dueDate && (
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {formatDate(activity.dueDate)}
                            {activity.dueTime && ` • ${activity.dueTime}`}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status === 'completed' ? 'Abgeschlossen' : activity.status === 'cancelled' ? 'Abgebrochen' : 'Offen'}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getPriorityColor(activity.priority)}`}>
                        {activity.priority === 'urgent' ? 'Dringend' : activity.priority === 'high' ? 'Hoch' : activity.priority === 'medium' ? 'Mittel' : 'Niedrig'}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  {activity.status === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleComplete(activity.id)}
                        className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                      >
                        Als erledigt markieren
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Activity Modal */}
      <CreateActivityModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          loadActivities()
        }}
      />
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <dt className="text-sm font-medium text-zinc-500">{label}</dt>
          <dd className="text-2xl font-semibold text-zinc-900">{value}</dd>
        </div>
      </div>
    </div>
  )
}

