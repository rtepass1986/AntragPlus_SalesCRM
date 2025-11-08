'use client'

import { useState } from 'react'
import type { AIRule } from '@/lib/training-types'

export function AIRulesManager() {
  const [rules, setRules] = useState<AIRule[]>([
    {
      id: 'rule-1',
      name: 'Auto-Update Scripts from Top Performing Calls',
      description: 'Analyze winning calls and update scripts with successful techniques',
      enabled: true,
      triggerType: 'weekly_analysis',
      triggerConditions: {
        minWinRate: 70,
        minCallSamples: 5,
      },
      actions: [
        {
          type: 'update_script',
          target: 'all_discovery_scripts',
          parameters: {
            updateSections: ['opening', 'pain_discovery', 'closing'],
          },
        },
      ],
      minCallSamples: 5,
      minConfidence: 0.85,
      requiresReview: true,
      createdAt: '2024-01-20T10:00:00Z',
      lastRun: '2024-11-01T09:00:00Z',
    },
    {
      id: 'rule-2',
      name: 'Email Template Optimization',
      description: 'Update email templates based on high-performing emails (best open/response rates)',
      enabled: true,
      triggerType: 'performance_drop',
      triggerConditions: {
        minOpenRate: 30,
        minResponseRate: 15,
      },
      actions: [
        {
          type: 'update_template',
          target: 'cold_outreach_templates',
          parameters: {
            focusAreas: ['subject_line', 'opening', 'call_to_action'],
          },
        },
      ],
      minCallSamples: 10,
      minConfidence: 0.80,
      requiresReview: true,
      createdAt: '2024-02-15T10:00:00Z',
      lastRun: '2024-10-28T08:00:00Z',
    },
    {
      id: 'rule-3',
      name: 'Firefly Call Analysis',
      description: 'Automatically process new Firefly recordings for insights and script improvements',
      enabled: true,
      triggerType: 'new_firefly_call',
      triggerConditions: {
        dealStage: ['proposal', 'negotiation', 'won'],
      },
      actions: [
        {
          type: 'create_suggestion',
          target: 'relevant_scripts',
          parameters: {
            extractKeyMoments: true,
            analyzeObjections: true,
            identifyWinningPhrases: true,
          },
        },
      ],
      minCallSamples: 1,
      minConfidence: 0.75,
      requiresReview: true,
      createdAt: '2024-03-01T10:00:00Z',
      lastRun: '2024-11-04T15:30:00Z',
    },
  ])

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">AI Automation Rules</h2>
          <p className="text-sm text-zinc-600">
            Configure how AI analyzes calls and updates your scripts & templates
          </p>
        </div>
        <button className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700">
          + Add Rule
        </button>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div key={rule.id} className="rounded-lg border border-zinc-200 bg-white p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      rule.enabled ? 'bg-green-600' : 'bg-zinc-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                        rule.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <div>
                    <h3 className="font-semibold text-zinc-900">{rule.name}</h3>
                    <p className="text-sm text-zinc-600">{rule.description}</p>
                  </div>
                </div>

                {/* Configuration */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <ConfigItem label="Trigger" value={rule.triggerType.replace('_', ' ')} />
                  <ConfigItem label="Min Samples" value={rule.minCallSamples.toString()} />
                  <ConfigItem label="Min Confidence" value={`${Math.round(rule.minConfidence * 100)}%`} />
                  <ConfigItem label="Review Required" value={rule.requiresReview ? 'Yes' : 'No'} />
                </div>

                {/* Actions */}
                <div className="mt-4">
                  <p className="text-xs font-medium text-zinc-700 mb-2">Actions:</p>
                  <div className="flex flex-wrap gap-2">
                    {rule.actions.map((action, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 capitalize"
                      >
                        {action.type.replace('_', ' ')} → {action.target.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Last Run */}
                {rule.lastRun && (
                  <div className="mt-3 text-xs text-zinc-500">
                    Last run: {new Date(rule.lastRun).toLocaleString('de-DE')}
                  </div>
                )}
              </div>

              <button className="ml-4 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                Edit Rule
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 p-2">
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-zinc-900 capitalize">{value}</p>
    </div>
  )
}

