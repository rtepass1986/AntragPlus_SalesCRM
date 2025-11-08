'use client'

import { useState } from 'react'
import type { Test, TestAttempt } from '@/lib/training-types'

export default function TestsPage() {
  const [activeView, setActiveView] = useState<'available' | 'results' | 'create'>('available')
  const [selectedTest, setSelectedTest] = useState<Test | null>(null)

  // Mock tests - Replace with API
  const mockTests: Test[] = [
    {
      id: 'test-1',
      title: 'Product Knowledge Assessment',
      description: 'Test your understanding of AntragPlus features, pricing, and use cases',
      materialId: 'mat-1',
      questions: [
        {
          id: 'q1',
          type: 'multiple_choice',
          question: 'Which feature helps nonprofits manage grant applications?',
          options: ['CRM Module', 'Application Tracker', 'Email Templates', 'All of the above'],
          correctAnswer: 'Application Tracker',
          points: 10,
          category: 'Features',
        },
        {
          id: 'q2',
          type: 'scenario',
          question: 'A nonprofit asks about pricing for 5 users. How would you respond?',
          correctAnswer: '€199/month for Professional plan',
          explanation: 'Professional plan covers up to 10 users, making it the right fit',
          points: 15,
          category: 'Pricing',
        },
      ],
      timeLimit: 20,
      passingScore: 80,
      maxAttempts: 3,
      randomizeQuestions: false,
      showCorrectAnswers: true,
      mandatory: true,
      frequency: 'quarterly',
      nextDue: '2024-12-01T00:00:00Z',
      createdBy: 'Training Team',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-10-01T10:00:00Z',
      tags: ['Product', 'Required', 'Quarterly'],
    },
    {
      id: 'test-2',
      title: 'Sales Process Certification',
      description: 'Comprehensive test on discovery calls, demos, and closing techniques',
      questions: [
        {
          id: 'q3',
          type: 'true_false',
          question: 'Should you always mention pricing in the first call?',
          correctAnswer: 'false',
          explanation: 'Focus on value discovery first, pricing comes after understanding needs',
          points: 5,
          category: 'Sales Process',
        },
      ],
      timeLimit: 30,
      passingScore: 85,
      maxAttempts: 2,
      randomizeQuestions: true,
      showCorrectAnswers: true,
      mandatory: true,
      frequency: 'monthly',
      nextDue: '2024-11-15T00:00:00Z',
      createdBy: 'Sales Manager',
      createdAt: '2024-02-01T10:00:00Z',
      updatedAt: '2024-11-01T10:00:00Z',
      tags: ['Sales Process', 'Required', 'Monthly'],
    },
    {
      id: 'test-3',
      title: 'Objection Handling Quiz',
      description: 'Practice responding to common objections from nonprofit decision makers',
      questions: [],
      timeLimit: 15,
      passingScore: 75,
      maxAttempts: 5,
      randomizeQuestions: true,
      showCorrectAnswers: false,
      mandatory: false,
      createdBy: 'Sales Team',
      createdAt: '2024-03-10T10:00:00Z',
      updatedAt: '2024-10-15T10:00:00Z',
      tags: ['Objections', 'Practice'],
    },
  ]

  const mockAttempts: TestAttempt[] = [
    {
      id: 'attempt-1',
      testId: 'test-1',
      userId: 'user-1',
      userName: 'Max Mustermann',
      startedAt: '2024-11-01T10:00:00Z',
      completedAt: '2024-11-01T10:18:00Z',
      duration: 1080,
      answers: {},
      score: 92,
      passed: true,
      feedback: 'Excellent work! Strong understanding of product features.',
    },
    {
      id: 'attempt-2',
      testId: 'test-2',
      userId: 'user-1',
      userName: 'Max Mustermann',
      startedAt: '2024-10-15T14:00:00Z',
      completedAt: '2024-10-15T14:25:00Z',
      duration: 1500,
      answers: {},
      score: 78,
      passed: false,
      feedback: 'Review the discovery call process. Focus on qualifying questions.',
    },
  ]

  const stats = {
    available: mockTests.filter(t => t.mandatory || !t.nextDue).length,
    completed: mockAttempts.filter(a => a.passed).length,
    pending: mockTests.filter(t => t.mandatory && t.nextDue && new Date(t.nextDue) <= new Date()).length,
    avgScore: mockAttempts.length > 0 ? Math.round(mockAttempts.reduce((sum, a) => sum + a.score, 0) / mockAttempts.length) : 0,
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              TESTS & PRÜFUNGEN
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Regelmäßige Prüfungen zur Sicherstellung der Sales-Fähigkeiten deines Teams
            </p>
          </div>
          <button className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm">
            + Test erstellen
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label="Verfügbare Tests" value={stats.available.toString()} icon="📋" />
          <StatCard label="Abgeschlossen" value={stats.completed.toString()} icon="✅" />
          <StatCard label="Ausstehend" value={stats.pending.toString()} icon="⏰" />
          <StatCard label="Ø Punkte" value={`${stats.avgScore}%`} icon="🎯" />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-zinc-200">
        <nav className="-mb-px flex space-x-8">
          <TabButton active={activeView === 'available'} onClick={() => setActiveView('available')}>
            Verfügbare Tests
          </TabButton>
          <TabButton active={activeView === 'results'} onClick={() => setActiveView('results')}>
            Meine Ergebnisse
          </TabButton>
        </nav>
      </div>

      {/* Content */}
      {activeView === 'available' && (
        <div className="space-y-4">
          {mockTests.map((test) => (
            <TestCard key={test.id} test={test} attempts={mockAttempts.filter(a => a.testId === test.id)} />
          ))}
        </div>
      )}

      {activeView === 'results' && (
        <div className="space-y-4">
          {mockAttempts.map((attempt) => {
            const test = mockTests.find(t => t.id === attempt.testId)
            return <AttemptCard key={attempt.id} attempt={attempt} testName={test?.title || 'Unknown Test'} />
          })}
        </div>
      )}
    </div>
  )
}

function TestCard({ test, attempts }: { test: Test; attempts: TestAttempt[] }) {
  const lastAttempt = attempts.length > 0 ? attempts[attempts.length - 1] : null
  const passedAttempts = attempts.filter(a => a.passed).length
  const canTakeTest = !test.maxAttempts || attempts.length < test.maxAttempts

  const getDueStatus = () => {
    if (!test.nextDue) return null
    const dueDate = new Date(test.nextDue)
    const now = new Date()
    const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil < 0) return { text: 'Überfällig', color: 'text-red-700 bg-red-100' }
    if (daysUntil <= 7) return { text: `Fällig in ${daysUntil}T`, color: 'text-orange-700 bg-orange-100' }
    return { text: `Fällig in ${daysUntil}T`, color: 'text-zinc-700 bg-zinc-100' }
  }

  const dueStatus = getDueStatus()

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-zinc-900">{test.title}</h3>
            {test.mandatory && (
              <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                Pflicht
              </span>
            )}
            {dueStatus && (
              <span className={`rounded-full px-2 py-1 text-xs font-medium ${dueStatus.color}`}>
                {dueStatus.text}
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-zinc-600">{test.description}</p>

          {/* Test Info */}
          <div className="mt-4 flex items-center gap-6 text-sm text-zinc-600">
            <span>❓ {test.questions.length} Fragen</span>
            {test.timeLimit && <span>⏱️ {test.timeLimit} min</span>}
            <span>📊 Bestehen: {test.passingScore}%</span>
            <span>🔄 Max {test.maxAttempts} Versuche</span>
          </div>

          {/* Attempts */}
          {attempts.length > 0 && (
            <div className="mt-4 rounded-lg bg-zinc-50 p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-600">
                  Versuche: {attempts.length}/{test.maxAttempts}
                </span>
                {lastAttempt && (
                  <span className={`font-medium ${lastAttempt.passed ? 'text-green-700' : 'text-red-700'}`}>
                    Letztes Ergebnis: {lastAttempt.score}% {lastAttempt.passed ? '✓' : '✗'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="ml-6">
          {canTakeTest ? (
            <button className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm">
              {passedAttempts > 0 ? 'Test wiederholen' : 'Test starten'}
            </button>
          ) : (
            <button disabled className="rounded-lg bg-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-500 cursor-not-allowed">
              Max. Versuche erreicht
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AttemptCard({ attempt, testName }: { attempt: TestAttempt; testName: string }) {
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('de-DE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${String(secs).padStart(2, '0')}`
  }

  return (
    <div className={`rounded-lg border-2 p-6 ${attempt.passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${attempt.passed ? '✅' : '❌'}`}></span>
            <div>
              <h3 className="font-semibold text-zinc-900">{testName}</h3>
              <p className="text-sm text-zinc-600">
                {formatDate(attempt.startedAt)} • Duration: {formatDuration(attempt.duration)}
              </p>
            </div>
          </div>

          {/* Score */}
          <div className="mt-4 flex items-center gap-6">
            <div>
              <p className="text-sm text-zinc-600">Punkte</p>
              <p className={`text-3xl font-bold ${attempt.passed ? 'text-green-700' : 'text-red-700'}`}>
                {attempt.score}%
              </p>
            </div>
            <div className="flex-1">
              <div className="h-3 w-full rounded-full bg-zinc-200">
                <div
                  className={`h-full rounded-full ${attempt.passed ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ width: `${attempt.score}%` }}
                />
              </div>
            </div>
          </div>

          {/* Feedback */}
          {attempt.feedback && (
            <div className="mt-4 rounded-lg bg-white p-4 border border-zinc-200">
              <p className="text-xs font-medium text-zinc-700 mb-1">Rückmeldung:</p>
              <p className="text-sm text-zinc-600">{attempt.feedback}</p>
            </div>
          )}
        </div>

        <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-white transition-colors">
          Details ansehen
        </button>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 pb-4 text-sm font-medium transition-colors ${
        active ? 'border-blue-600 text-blue-600' : 'border-transparent text-zinc-600 hover:text-zinc-900'
      }`}
    >
      {children}
    </button>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <dt className="text-sm font-medium text-zinc-500">{label}</dt>
          <dd className="mt-1 text-2xl font-semibold text-zinc-900">{value}</dd>
        </div>
      </div>
    </div>
  )
}

