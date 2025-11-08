'use client'

import type { Activity } from '@/lib/crm-types'

interface ActivityTimelineProps {
  activities: Activity[]
  isLoading?: boolean
}

export function ActivityTimeline({ activities, isLoading = false }: ActivityTimelineProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return ''
    return new Intl.DateTimeFormat('de-DE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
        )
      case 'meeting':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        )
      case 'email':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        )
      case 'task':
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
        )
      default:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        )
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-blue-100 text-blue-700'
      case 'meeting':
        return 'bg-purple-100 text-purple-700'
      case 'email':
        return 'bg-green-100 text-green-700'
      case 'task':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-zinc-100 text-zinc-700'
    }
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: 'bg-red-100 text-red-700',
      high: 'bg-orange-100 text-orange-700',
      medium: 'bg-yellow-100 text-yellow-700',
      low: 'bg-zinc-100 text-zinc-700',
    }
    return colors[priority as keyof typeof colors] || colors.low
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-zinc-600">Loading activities...</p>
        </div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
          <svg
            className="h-6 w-6 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-zinc-900">No activities</h3>
        <p className="mt-1 text-sm text-zinc-500">Get started by creating a new activity.</p>
      </div>
    )
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== activities.length - 1 ? (
                <span
                  className="absolute left-4 top-10 -ml-px h-full w-0.5 bg-zinc-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                {/* Icon */}
                <div>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white ${getActivityColor(activity.type)}`}
                  >
                    {getActivityIcon(activity.type)}
                  </span>
                </div>

                {/* Content */}
                <div className="flex min-w-0 flex-1 justify-between space-x-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-zinc-900">{activity.subject}</p>
                      {activity.status === 'completed' && (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          Completed
                        </span>
                      )}
                      {activity.priority !== 'low' && (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getPriorityBadge(activity.priority)}`}
                        >
                          {activity.priority}
                        </span>
                      )}
                    </div>
                    {activity.description && (
                      <p className="mt-0.5 text-sm text-zinc-600">{activity.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-zinc-500">
                      <span className="capitalize">{activity.type}</span>
                      {activity.contactName && <span>• {activity.contactName}</span>}
                      {activity.duration && <span>• {activity.duration} min</span>}
                    </div>
                    {activity.outcome && (
                      <div className="mt-2 rounded-lg bg-zinc-50 p-2">
                        <p className="text-xs text-zinc-600">
                          <strong>Outcome:</strong> {activity.outcome}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm text-zinc-500">
                    {activity.dueDate ? formatDate(activity.dueDate) : formatDate(activity.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

