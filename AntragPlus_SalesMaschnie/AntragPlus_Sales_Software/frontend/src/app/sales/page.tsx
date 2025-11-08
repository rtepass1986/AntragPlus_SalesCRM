/**
 * TODAY View - Main Sales Dashboard
 * AI-powered daily action list
 */

'use client'

import { useState, useEffect } from 'react'
import { 
  ClockIcon, 
  PhoneIcon, 
  FireIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  LightBulbIcon,
  PlayIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline'

// Types
interface DashboardStats {
  tasksTotal: number
  tasksCompleted: number
  callsScheduled: number
  callsCompleted: number
  urgentTasks: number
  pipelineValue: number
  quotaProgress: number
  consecutiveDaysActive: number
  avgCallScore: number
}

interface Todo {
  id: number
  title: string
  description: string
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
  deadline: string
  relatedProspectName?: string
  goal: string
  strategy?: string
  recommendedScript?: string
  checklist?: { item: string; completed: boolean }[]
  resources?: {
    script?: string
    training?: string
    template?: string
    aiDraft?: string
  }
  status: string
  aiReason: string
}

interface ScheduledCall {
  id: number
  prospectName: string
  prospectCompany?: string
  callType: string
  scheduledTime: string
  lastCallScore?: number
  painPoints?: string[]
  objectionsExpected?: string[]
  recommendedScript?: string
  status: string
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
}

function getTimeUntil(isoString: string): string {
  const now = new Date()
  const target = new Date(isoString)
  const hoursUntil = (target.getTime() - now.getTime()) / (1000 * 60 * 60)
  
  if (hoursUntil < 0) return 'Overdue'
  if (hoursUntil < 1) return `In ${Math.round(hoursUntil * 60)} min`
  if (hoursUntil < 24) return `In ${Math.round(hoursUntil)} hours`
  return `In ${Math.round(hoursUntil / 24)} days`
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'URGENT': return 'text-blue-700 bg-blue-50 border-blue-300'
    case 'HIGH': return 'text-cyan-700 bg-cyan-50 border-cyan-200'
    case 'MEDIUM': return 'text-slate-700 bg-slate-50 border-slate-200'
    case 'LOW': return 'text-gray-600 bg-gray-50 border-gray-200'
    default: return 'text-gray-600 bg-gray-50 border-gray-200'
  }
}

function getPriorityIcon(priority: string) {
  switch (priority) {
    case 'URGENT': return '🔴'
    case 'HIGH': return '🟡'
    case 'MEDIUM': return '🟢'
    case 'LOW': return '⚪'
    default: return '⚪'
  }
}

export default function TodayPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [scheduledCalls, setScheduledCalls] = useState<ScheduledCall[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch data
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/dashboard/today')
      // const data = await response.json()
      
      // Mock data for now
      setStats({
        tasksTotal: 12,
        tasksCompleted: 3,
        callsScheduled: 4,
        callsCompleted: 0,
        urgentTasks: 2,
        pipelineValue: 45000,
        quotaProgress: 75,
        consecutiveDaysActive: 5,
        avgCallScore: 8.2,
      })

      setTodos([
        {
          id: 1,
          title: 'Anruf: Deutsche Kinder Hilfe',
          description: 'Letzter Anruf Score: 6.5/10 (Sicherheit aufbauen)',
          priority: 'URGENT',
          deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          relatedProspectName: 'Deutsche Kinder Hilfe',
          goal: 'Firmensicherheit auf 9/10 aufbauen',
          strategy: 'Fallstudien nutzen um Vertrauen aufzubauen',
          recommendedScript: 'Fallstudien-Abschluss',
          checklist: [
            { item: 'Letzte Anrufnotizen durchgehen (6.5/10 Score)', completed: false },
            { item: '3 Fallstudien vorbereiten (Kunde fragte nach Beweisen)', completed: false },
            { item: 'Preisgestaltung bereit haben (Preis-Einwand wahrscheinlich)', completed: false },
            { item: '"Dringlichkeits-Schleife" Antwort üben', completed: false },
          ],
          status: 'pending',
          aiReason: 'Sicherheitslücken im letzten Anruf erkannt. Follow-up innerhalb 48 Stunden nötig.',
        },
        {
          id: 2,
          title: 'Follow-up E-Mail senden: Umweltschutz München',
          description: 'Anruf gestern abgeschlossen, 8.5/10 Score',
          priority: 'HIGH',
          deadline: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
          relatedProspectName: 'Umweltschutz München',
          goal: 'Momentum beibehalten',
          checklist: [
            { item: 'KI-generierten E-Mail-Entwurf prüfen', completed: false },
            { item: 'Mit persönlichen Details anpassen', completed: false },
            { item: 'Innerhalb 24 Stunden senden', completed: false },
          ],
          resources: {
            template: 'post-call-summary',
            aiDraft: 'Hallo [Name], es war großartig gestern mit Ihnen zu sprechen...',
          },
          status: 'pending',
          aiReason: 'Guter Anruf - Follow-up senden um Schwung beizubehalten',
        },
      ])

      setScheduledCalls([
        {
          id: 1,
          prospectName: 'Jugendwerk Berlin',
          prospectCompany: 'Jugendwerk Berlin e.V.',
          callType: 'Demo',
          scheduledTime: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(),
          lastCallScore: 8.2,
          painPoints: ['Manual processes', 'Time waste'],
          objectionsExpected: ['Need to think about it'],
          recommendedScript: 'Demo Script',
          status: 'scheduled',
        },
        {
          id: 2,
          prospectName: 'Deutsche Kinder Hilfe',
          callType: 'Follow-up / Close',
          scheduledTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          lastCallScore: 6.5,
          status: 'scheduled',
        },
      ])

      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
    }
  }

  async function markTodoComplete(todoId: number) {
    // TODO: API call
    setTodos(todos.map(t => t.id === todoId ? { ...t, status: 'completed' } : t))
  }

  async function updateChecklistItem(todoId: number, itemIndex: number, completed: boolean) {
    // TODO: API call
    setTodos(todos.map(t => {
      if (t.id === todoId && t.checklist) {
        const newChecklist = [...t.checklist]
        newChecklist[itemIndex] = { ...newChecklist[itemIndex], completed }
        return { ...t, checklist: newChecklist }
      }
      return t
    }))
  }

  if (loading) {
    return <div className="text-center py-12">Lädt...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          HEUTIGE MISSION
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Aufgaben Fällig</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stats.tasksTotal}</div>
                      <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                        {stats.tasksCompleted} erledigt
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <PhoneIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Anrufe Geplant</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{stats.callsScheduled}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FireIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Dringend</dt>
                    <dd className="text-2xl font-semibold text-blue-600">{stats.urgentTasks}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Quota</dt>
                    <dd className="text-2xl font-semibold text-green-600">{stats.quotaProgress}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI-Generated TODOs */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">🤖 KI-Generierte Aufgaben</h2>
          <p className="mt-1 text-sm text-gray-500">
            Priorisierte Aufgaben basierend auf Anrufen, Kalender und Pipeline
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            {todos.filter(t => t.status !== 'completed').map((todo) => (
              <div
                key={todo.id}
                className={`border rounded-lg p-4 ${getPriorityColor(todo.priority)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{getPriorityIcon(todo.priority)}</span>
                      <h3 className="text-lg font-medium">{todo.title}</h3>
                    </div>
                    <p className="mt-1 text-sm opacity-75">{todo.description}</p>
                    
                    {todo.deadline && (
                      <p className="mt-1 text-xs font-medium">
                        ⏰ Deadline: {formatTime(todo.deadline)} ({getTimeUntil(todo.deadline)})
                      </p>
                    )}

                    {todo.goal && (
                      <p className="mt-2 text-sm font-medium">
                        🎯 Goal: {todo.goal}
                      </p>
                    )}

                    {todo.strategy && (
                      <p className="mt-1 text-sm">
                        💡 Strategy: {todo.strategy}
                      </p>
                    )}

                    {todo.checklist && todo.checklist.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">📋 Prep Checklist:</p>
                        <div className="space-y-1 ml-4">
                          {todo.checklist.map((item, index) => (
                            <label key={index} className="flex items-center space-x-2 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.completed}
                                onChange={(e) => updateChecklistItem(todo.id, index, e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className={item.completed ? 'line-through opacity-50' : ''}>
                                {item.item}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="mt-3 text-xs italic opacity-60">
                      {todo.aiReason}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {todo.recommendedScript && (
                    <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                      📋 Skript Ansehen
                    </button>
                  )}
                  <button
                    onClick={() => markTodoComplete(todo.id)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                  >
                    ✅ Erledigt
                  </button>
                  <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200">
                    ⏰ Verschieben
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Today's Calls */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">📞 HEUTIGE ANRUFE</h2>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="space-y-4">
            {scheduledCalls.map((call) => (
              <div key={call.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">
                        {call.callType === 'Demo' ? '🎯' : '📞'}
                      </span>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {formatTime(call.scheduledTime)} - {call.prospectName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Type: {call.callType} • {getTimeUntil(call.scheduledTime)}
                        </p>
                      </div>
                    </div>

                    {call.lastCallScore && (
                      <p className="mt-2 text-sm text-gray-600">
                        Last call: {call.lastCallScore}/10
                      </p>
                    )}

                    {call.painPoints && call.painPoints.length > 0 && (
                      <p className="mt-2 text-sm">
                        <span className="font-medium">Pain points:</span> {call.painPoints.join(', ')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                    🎯 Jetzt Vorbereiten
                  </button>
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    📋 Skript
                  </button>
                  <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    📞 Anruf Beitreten
                  </button>
                </div>
              </div>
            ))}

            <button className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors">
              + Neuen Anruf Planen
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Insights */}
      {stats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <LightBulbIcon className="h-8 w-8 text-blue-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">💡 SCHNELLE EINBLICKE</h3>
                <div className="mt-2 text-sm text-gray-700 space-y-2">
                  <p>
                    <span className="font-medium text-green-600">🎯 Großartige Arbeit!</span> Dein letzter Anruf: {stats.avgCallScore}/10 Punkte
                  </p>
                  <p>
                    📊 Diese Woche: {stats.callsScheduled} Anrufe geplant, {stats.avgCallScore.toFixed(1)} Durchschnittsscore
                  </p>
                  <p>
                    🔥 Du bist auf einer {stats.consecutiveDaysActive}-Tage-Serie! Weiter so!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


