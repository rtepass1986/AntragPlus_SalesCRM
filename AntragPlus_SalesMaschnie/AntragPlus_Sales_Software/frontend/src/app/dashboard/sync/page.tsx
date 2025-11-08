'use client'

import { Container } from '@/components/Container'

export default function SyncPage() {
  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl">
          Pipedrive ↔ Asana Sync
        </h1>
        <p className="mt-6 text-base text-zinc-600">
          Real-time bidirectional synchronization between Pipedrive and Asana
        </p>
      </header>

      {/* Sync Status */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Last Sync" value="Never" sublabel="—" />
        <StatCard label="Pipedrive Deals" value="0" sublabel="Total deals" />
        <StatCard label="Asana Tasks" value="0" sublabel="Total tasks" />
        <StatCard label="Synced Items" value="0" sublabel="Last 24h" />
      </div>

      {/* Actions */}
      <div className="mt-8 flex flex-wrap gap-4">
        <button className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          Trigger Sync Now
        </button>
        <button className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors">
          Run Backfill
        </button>
        <button className="rounded-lg border border-zinc-300 px-6 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors">
          View Logs
        </button>
      </div>

      {/* Sync Configuration */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-800">Sync Configuration</h2>
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Pipedrive Settings */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-zinc-900">Pipedrive</h3>
            <dl className="mt-4 space-y-3">
              <ConfigItem label="API Status" value="Not Connected" status="error" />
              <ConfigItem label="Stages to Sync" value="9 stages" status="ok" />
              <ConfigItem label="Custom Fields" value="15 fields" status="ok" />
              <ConfigItem label="Webhook" value="Inactive" status="pending" />
            </dl>
          </div>

          {/* Asana Settings */}
          <div className="rounded-lg border border-zinc-200 bg-white p-6">
            <h3 className="text-lg font-semibold text-zinc-900">Asana</h3>
            <dl className="mt-4 space-y-3">
              <ConfigItem label="API Status" value="Not Connected" status="error" />
              <ConfigItem label="Project" value="Not Set" status="pending" />
              <ConfigItem label="Sections" value="—" status="pending" />
              <ConfigItem label="Webhook" value="Inactive" status="pending" />
            </dl>
          </div>
        </div>
      </div>

      {/* Recent Sync Activity */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-800">Recent Activity</h2>
        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Deal/Task
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Message
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-sm text-zinc-500">
                    No sync activity yet. Trigger a sync to see results here.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </Container>
  )
}

function StatCard({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className="mt-2">
        <span className="text-3xl font-semibold text-zinc-900">{value}</span>
        <p className="mt-1 text-sm text-zinc-500">{sublabel}</p>
      </dd>
    </div>
  )
}

function ConfigItem({ label, value, status }: { label: string; value: string; status: 'ok' | 'pending' | 'error' }) {
  const statusColors = {
    ok: 'bg-green-500',
    pending: 'bg-yellow-500',
    error: 'bg-red-500',
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <dt className="text-zinc-600">{label}</dt>
      <dd className="flex items-center gap-2">
        <span className="font-medium text-zinc-900">{value}</span>
        <div className={`h-2 w-2 rounded-full ${statusColors[status]}`} />
      </dd>
    </div>
  )
}

