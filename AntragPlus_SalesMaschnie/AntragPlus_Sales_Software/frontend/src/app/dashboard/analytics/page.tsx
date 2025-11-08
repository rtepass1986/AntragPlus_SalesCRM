'use client'

import { Container } from '@/components/Container'

export default function AnalyticsPage() {
  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-4xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl">
          Analytics & Reports
        </h1>
        <p className="mt-6 text-base text-zinc-600">
          Performance insights, metrics, and data quality analysis
        </p>
      </header>

      {/* Key Metrics */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Conversion Rate" value="0%" change="+0%" />
        <MetricCard label="Avg Time to Close" value="0d" change="-0%" />
        <MetricCard label="Active Pipeline" value="€0" change="+0%" />
        <MetricCard label="Quality Score" value="0/100" change="+0" />
      </div>

      {/* Charts Section */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Leads by Stage */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-zinc-900">Leads by Stage</h3>
          <div className="mt-6 flex h-64 items-center justify-center rounded border border-dashed border-zinc-300">
            <p className="text-sm text-zinc-500">Chart: Leads distribution across pipeline stages</p>
          </div>
        </div>

        {/* Enrichment Quality Trend */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-zinc-900">Enrichment Quality</h3>
          <div className="mt-6 flex h-64 items-center justify-center rounded border border-dashed border-zinc-300">
            <p className="text-sm text-zinc-500">Chart: Average confidence score over time</p>
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-zinc-900">Conversion Funnel</h3>
          <div className="mt-6 flex h-64 items-center justify-center rounded border border-dashed border-zinc-300">
            <p className="text-sm text-zinc-500">Chart: Lead progression through sales funnel</p>
          </div>
        </div>

        {/* Time Tracking */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-zinc-900">Time per Stage</h3>
          <div className="mt-6 flex h-64 items-center justify-center rounded border border-dashed border-zinc-300">
            <p className="text-sm text-zinc-500">Chart: Average time spent in each stage</p>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-800">Generated Reports</h2>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
            Generate New Report
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Report Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Generated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Records
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-sm text-zinc-500">
                    No reports available. Generate your first report to get started.
                  </p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Stage Gap Analysis */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-800">Stage Gap Analysis</h2>
        <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6">
          <p className="text-sm text-zinc-500">
            Analyze gaps in data completeness across pipeline stages. Run analysis to see results.
          </p>
          <button className="mt-4 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors">
            Run Gap Analysis
          </button>
        </div>
      </div>
    </Container>
  )
}

function MetricCard({ label, value, change }: { label: string; value: string; change: string }) {
  const isPositive = change.startsWith('+')
  
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6">
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className="mt-2 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-zinc-900">{value}</span>
        <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
      </dd>
    </div>
  )
}

