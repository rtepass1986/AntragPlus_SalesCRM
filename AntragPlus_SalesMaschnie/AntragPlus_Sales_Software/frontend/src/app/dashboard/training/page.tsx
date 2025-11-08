'use client'

import Link from 'next/link'

export default function TrainingDashboardPage() {
  const stats = {
    journeyPhases: 7,
    callRecordings: 12,
    scripts: 8,
    courses: 15,
    teamMembers: 5,
    completionRate: 78,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          SALES TRAINING
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Zentrale für Verkaufsprozesse, Scripts, Schulungen und Call-Analysen
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 text-center">
            <div className="text-3xl mb-2">🗺️</div>
            <div className="text-2xl font-semibold text-gray-900">7</div>
            <div className="text-xs text-gray-500">Journey Phasen</div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 text-center">
            <div className="text-3xl mb-2">🎙️</div>
            <div className="text-2xl font-semibold text-gray-900">{stats.callRecordings}</div>
            <div className="text-xs text-gray-500">Call Recordings</div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 text-center">
            <div className="text-3xl mb-2">📝</div>
            <div className="text-2xl font-semibold text-gray-900">{stats.scripts}</div>
            <div className="text-xs text-gray-500">Scripts</div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 text-center">
            <div className="text-3xl mb-2">📚</div>
            <div className="text-2xl font-semibold text-gray-900">{stats.courses}</div>
            <div className="text-xs text-gray-500">Kurse</div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 text-center">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-semibold text-gray-900">{stats.teamMembers}</div>
            <div className="text-xs text-gray-500">Team</div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-4 text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-2xl font-semibold text-gray-900">{stats.completionRate}%</div>
            <div className="text-xs text-gray-500">Abschlussrate</div>
          </div>
        </div>
      </div>

      {/* Main 4-Section Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* 1. Customer Journey */}
        <Link
          href="/dashboard/training/journey"
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-8 shadow transition-all hover:shadow-lg hover:scale-[1.02]"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl text-white shadow-lg">
                🗺️
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">
                  Customer Journey
                </h2>
                <p className="text-sm text-cyan-600">7 Phasen • KI-optimiert</p>
              </div>
            </div>
            
            <p className="text-sm text-zinc-700 mb-4">
              Visueller Sales-Prozess von Aufmerksamkeit bis Kundenbindung mit KPIs und Touchpoints
            </p>

            {/* Mini Journey Preview */}
            <div className="space-y-2">
              <MiniPhase name="1. Aufmerksamkeit & Interesse" progress={85} />
              <MiniPhase name="2. Erstkontakt & Qualifizierung" progress={72} />
              <MiniPhase name="3. Onboarding & Vorbereitung" progress={68} />
              <MiniPhase name="4. Antragseinreichung" progress={90} />
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-cyan-600">
              Zur Customer Journey
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* 2. Call Recordings (Firefly) */}
        <Link
          href="/dashboard/training/scripts"
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-8 shadow transition-all hover:shadow-lg hover:scale-[1.02]"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-2xl text-white shadow-lg">
                🎙️
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Call Recordings
                </h2>
                <p className="text-sm text-blue-600">{stats.callRecordings} Firefly Aufnahmen</p>
              </div>
            </div>
            
            <p className="text-sm text-zinc-700 mb-4">
              Firefly Call-Analysen mit Key Moments, Einwänden und Erfolgsmustern
            </p>

            {/* Recent Recordings */}
            <div className="space-y-2">
              <RecordingItem title="Discovery Call - Caritas" duration="32 min" status="analyzed" />
              <RecordingItem title="Demo - NABU" duration="45 min" status="analyzed" />
              <RecordingItem title="Closing Call - AWO" duration="28 min" status="processing" />
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600">
              Zu den Recordings
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* 3. Scripts & Templates */}
        <Link
          href="/dashboard/training/scripts"
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-cyan-50 to-blue-50 p-8 shadow transition-all hover:shadow-lg hover:scale-[1.02]"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl text-white shadow-lg">
                📝
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">
                  Scripts & Templates
                </h2>
                <p className="text-sm text-cyan-600">{stats.scripts} Scripts • KI-optimiert</p>
              </div>
            </div>
            
            <p className="text-sm text-zinc-700 mb-4">
              Call Scripts und E-Mail-Vorlagen, automatisch optimiert durch Top-Performer-Calls
            </p>

            {/* Script Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/80 p-3">
                <p className="text-xs text-gray-600">Erfolgsrate</p>
                <p className="text-lg font-bold text-cyan-700">72%</p>
              </div>
              <div className="rounded-lg bg-white/80 p-3">
                <p className="text-xs text-gray-600">KI Updates</p>
                <p className="text-lg font-bold text-blue-700">3 ausstehend</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-cyan-600">
              Zu Scripts & Templates
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>

        {/* 4. Courses (Training Materials) */}
        <Link
          href="/dashboard/training/materials"
          className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-8 shadow transition-all hover:shadow-lg hover:scale-[1.02]"
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-2xl text-white shadow-lg">
                📚
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Kurse & Schulungen
                </h2>
                <p className="text-sm text-blue-600">{stats.courses} Kurse verfügbar</p>
              </div>
            </div>
            
            <p className="text-sm text-zinc-700 mb-4">
              Schulungsmaterialien, Videos, PDFs und interaktive Kurse für dein Sales-Team
            </p>

            {/* Course Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-white/80 p-3">
                <p className="text-xs text-gray-600">Pflicht-Kurse</p>
                <p className="text-lg font-bold text-cyan-700">5</p>
              </div>
              <div className="rounded-lg bg-white/80 p-3">
                <p className="text-xs text-gray-600">Abgeschlossen</p>
                <p className="text-lg font-bold text-blue-700">{stats.completionRate}%</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600">
              Zu den Kursen
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h3 className="font-semibold text-gray-900 mb-4">Schnellzugriff</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <QuickActionButton icon="🤖" label="AI Updates prüfen" badge="3" />
          <QuickActionButton icon="📤" label="Recording hochladen" />
          <QuickActionButton icon="📝" label="Neues Script" />
          <QuickActionButton icon="🎯" label="Test starten" />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
        <h3 className="font-semibold text-gray-900 mb-4">Letzte Aktivitäten</h3>
        <div className="space-y-3">
          <ActivityItem
            icon="🤖"
            title="KI hat Discovery Script aktualisiert"
            time="Vor 2 Stunden"
            color="text-cyan-600"
          />
          <ActivityItem
            icon="🎙️"
            title="Neues Firefly Recording: Closing Call - AWO"
            time="Vor 5 Stunden"
            color="text-blue-600"
          />
          <ActivityItem
            icon="✅"
            title="Max Mustermann hat 'Produktwissen Test' bestanden (92%)"
            time="Gestern"
            color="text-cyan-600"
          />
          <ActivityItem
            icon="📚"
            title="Neuer Kurs hochgeladen: Einwandbehandlung 2.0"
            time="Vor 2 Tagen"
            color="text-blue-600"
          />
        </div>
      </div>
    </div>
  )
}

function MiniPhase({ name, progress }: { name: string; progress: number }) {
  return (
    <div className="text-xs">
      <div className="flex items-center justify-between mb-1">
        <span className="text-gray-700 truncate">{name}</span>
        <span className="font-medium text-cyan-700">{progress}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-white/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

function RecordingItem({ title, duration, status }: { title: string; duration: string; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-white/80 p-2 text-xs">
      <span className="text-gray-700 truncate">{title}</span>
      <div className="flex items-center gap-2 ml-2">
        <span className="text-gray-600">{duration}</span>
        <span className={`rounded-full px-2 py-0.5 font-medium ${
          status === 'analyzed' ? 'bg-cyan-100 text-cyan-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {status === 'analyzed' ? '✓' : '⏳'}
        </span>
      </div>
    </div>
  )
}

function QuickActionButton({ icon, label, badge }: { icon: string; label: string; badge?: string }) {
  return (
    <button className="relative rounded-lg border border-gray-300 bg-white p-3 text-center text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:border-cyan-400">
      {badge && (
        <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-500 text-xs font-bold text-white">
          {badge}
        </span>
      )}
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-xs">{label}</div>
    </button>
  )
}

function ActivityItem({ icon, title, time, color }: { icon: string; title: string; time: string; color: string }) {
  return (
    <div className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
      <span className="text-xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <p className={`text-xs ${color}`}>{time}</p>
      </div>
    </div>
  )
}

