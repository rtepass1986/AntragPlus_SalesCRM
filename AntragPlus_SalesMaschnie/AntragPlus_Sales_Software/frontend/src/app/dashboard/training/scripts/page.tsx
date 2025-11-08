'use client'

import { useState } from 'react'
import { AIRulesManager } from '@/components/training/AIRulesManager'
import type { CallScript, EmailTemplate, FireflyRecording, AIScriptUpdate } from '@/lib/training-types'

export default function ScriptsTemplatesPage() {
  const [activeTab, setActiveTab] = useState<'scripts' | 'templates' | 'firefly' | 'ai-updates' | 'ai-rules'>('scripts')
  const [selectedScript, setSelectedScript] = useState<CallScript | null>(null)

  // Mock data - Replace with API calls
  const mockScripts: CallScript[] = [
    {
      id: 'script-1',
      name: 'Discovery Call Script - Nonprofit Sector',
      category: 'discovery',
      stage: 'Awareness',
      content: `# Discovery Call Script

## Opening (2 min)
- "Guten Tag [Name], vielen Dank für Ihre Zeit heute..."
- Build rapport, confirm time available

## Pain Point Discovery (10 min)
- "Erzählen Sie mir über Ihre aktuellen Prozesse für..."
- Active listening, take notes
- Key questions:
  * Current software/tools?
  * Main challenges?
  * Team size and roles?

## Solution Alignment (10 min)
- Position AntragPlus as solution
- Focus on specific pain points mentioned
- Share relevant case study

## Next Steps (5 min)
- "Based on what you've shared, I'd like to..."
- Schedule demo
- Send follow-up email
- Confirm decision makers

## Closing
- "Vielen Dank für das Gespräch..."`,
      version: 3,
      lastUpdated: '2024-11-05T10:00:00Z',
      updatedBy: 'ai',
      fireflyCallIds: ['call-123', 'call-124', 'call-125'],
      aiConfidence: 0.92,
      usage: 45,
      successRate: 68,
      avgCallDuration: 28,
      tags: ['Discovery', 'Nonprofit', 'German'],
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'script-2',
      name: 'Objection Handling - Budget Concerns',
      category: 'objection_handling',
      stage: 'Decision',
      content: `# Budget Objection Handling

## Common Objection
"Das ist zu teuer für uns..."

## Response Framework

### 1. Acknowledge (Don't Dismiss)
- "Ich verstehe, Budget ist immer ein wichtiger Faktor..."

### 2. Reframe Value
- ROI calculation
- Time savings quantified
- Cost of current solution (including hidden costs)

### 3. Flexible Options
- Payment plans
- Phased implementation
- Different package tiers

### 4. Social Proof
- "Ähnliche Organisationen haben..."
- Case study examples
- References available

## Closing
- "Lassen Sie uns gemeinsam durchrechnen..."`,
      version: 2,
      lastUpdated: '2024-10-28T14:00:00Z',
      updatedBy: 'ai',
      fireflyCallIds: ['call-112', 'call-115'],
      aiConfidence: 0.88,
      usage: 32,
      successRate: 75,
      avgCallDuration: 15,
      tags: ['Objections', 'Budget', 'German'],
      createdAt: '2024-02-10T10:00:00Z',
    },
  ]

  const mockTemplates: EmailTemplate[] = [
    {
      id: 'template-1',
      name: 'Initial Cold Outreach - Nonprofit',
      subject: 'Digitalisierung für {organizationType} leicht gemacht',
      category: 'cold_outreach',
      stage: 'Awareness',
      content: `Hallo {firstName},

ich hoffe, diese Nachricht erreicht Sie zur rechten Zeit.

Mein Name ist {senderName} von AntragPlus, und ich unterstütze gemeinnützige Organisationen wie {organizationName} dabei, ihre Antrags- und Förderprozesse zu digitalisieren und zu optimieren.

**Warum ich mich melde:**
Viele {organizationType}s stehen vor ähnlichen Herausforderungen:
- Zeitaufwändige manuelle Antragsverwaltung
- Fehlende Übersicht über laufende Förderungen
- Schwierige Berichterstattung an Geldgeber

Wir haben für über 150+ gemeinnützige Organisationen eine Lösung entwickelt, die durchschnittlich **15 Stunden pro Woche** einspart.

**Kurze Frage:** Wäre ein 15-minütiges Gespräch nächste Woche interessant für Sie?

Beste Grüße,
{senderName}
{senderTitle}
{senderPhone}`,
      variables: ['{firstName}', '{organizationName}', '{organizationType}', '{senderName}', '{senderTitle}', '{senderPhone}'],
      version: 5,
      lastUpdated: '2024-11-03T11:00:00Z',
      updatedBy: 'ai',
      basedOnCalls: ['call-130', 'call-131'],
      aiConfidence: 0.95,
      usage: 234,
      openRate: 42,
      responseRate: 18,
      conversionRate: 12,
      tags: ['Cold Outreach', 'Nonprofit', 'German'],
      createdAt: '2024-01-10T10:00:00Z',
    },
  ]

  const mockFireflyRecordings: FireflyRecording[] = [
    {
      id: 'call-130',
      title: 'Discovery Call - Deutscher Caritasverband',
      date: '2024-11-04T14:30:00Z',
      duration: 1850, // seconds
      participants: ['Max Mustermann', 'Anna Schmidt'],
      dealId: 'deal-1',
      dealName: 'CRM Software Implementation',
      transcript: '[Full transcript would be here...]',
      summary: 'Successful discovery call. Key pain points: manual data entry, lack of reporting. Next step: product demo scheduled.',
      keyMoments: [
        {
          timestamp: 450,
          type: 'objection',
          description: 'Budget concern raised',
          quote: 'Das Budget ist dieses Jahr schon sehr knapp...',
        },
        {
          timestamp: 920,
          type: 'win',
          description: 'Expressed strong interest',
          quote: 'Das klingt genau nach dem, was wir brauchen!',
        },
      ],
      actionItems: [
        'Send product demo invite',
        'Prepare customized proposal',
        'Share case study: Similar organization',
      ],
      usedForTemplates: ['template-1'],
      status: 'analyzed',
    },
  ]

  const mockAIUpdates: AIScriptUpdate[] = [
    {
      id: 'update-1',
      scriptId: 'script-1',
      type: 'call_script',
      sourceType: 'firefly_recording',
      sourceId: 'call-130',
      sourceName: 'Discovery Call - Deutscher Caritasverband',
      originalContent: 'Old opening line...',
      suggestedContent: 'New improved opening based on 15 successful calls...',
      changes: [
        {
          type: 'modification',
          section: 'Opening',
          before: 'Guten Tag, mein Name ist...',
          after: 'Guten Tag [Name], vielen Dank für Ihre Zeit heute. Ich habe mir Ihre Website angesehen...',
          reason: 'Personalized opening increases engagement by 23% (based on 15 calls)',
        },
      ],
      reasoning: 'Analysis of top-performing discovery calls shows personalized openings lead to better engagement',
      confidence: 0.92,
      basedOnCalls: 15,
      status: 'pending_review',
      createdAt: '2024-11-05T09:00:00Z',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              SCRIPTS & VORLAGEN
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              KI-gestützte Call-Scripts und E-Mail-Vorlagen aus echten Gesprächen
            </p>
          </div>
          <div className="flex gap-3">
            <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
              Firefly Recording hochladen
            </button>
            <button className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm">
              + Neu erstellen
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-zinc-200">
        <nav className="-mb-px flex space-x-8">
          <TabButton active={activeTab === 'scripts'} onClick={() => setActiveTab('scripts')}>
            📞 Call Scripts ({mockScripts.length})
          </TabButton>
          <TabButton active={activeTab === 'templates'} onClick={() => setActiveTab('templates')}>
            📧 Email Templates ({mockTemplates.length})
          </TabButton>
          <TabButton active={activeTab === 'firefly'} onClick={() => setActiveTab('firefly')}>
            🎙️ Firefly Recordings ({mockFireflyRecordings.length})
          </TabButton>
          <TabButton active={activeTab === 'ai-updates'} onClick={() => setActiveTab('ai-updates')}>
            🤖 AI Updates ({mockAIUpdates.length})
          </TabButton>
          <TabButton active={activeTab === 'ai-rules'} onClick={() => setActiveTab('ai-rules')}>
            ⚙️ AI Rules
          </TabButton>
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'scripts' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {mockScripts.map((script) => (
              <ScriptCard key={script.id} script={script} onClick={() => setSelectedScript(script)} />
            ))}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {mockTemplates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
          </div>
        )}

        {activeTab === 'firefly' && (
          <div className="space-y-4">
            {mockFireflyRecordings.map((recording) => (
              <FireflyCard key={recording.id} recording={recording} />
            ))}
          </div>
        )}

        {activeTab === 'ai-updates' && (
          <div className="space-y-4">
            {mockAIUpdates.map((update) => (
              <AIUpdateCard key={update.id} update={update} />
            ))}
          </div>
        )}

        {activeTab === 'ai-rules' && <AIRulesManager />}
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

function ScriptCard({ script, onClick }: { script: CallScript; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-300"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-zinc-900 group-hover:text-blue-700">{script.name}</h3>
          <p className="mt-1 text-sm text-zinc-600 capitalize">{script.category.replace('_', ' ')}</p>
        </div>
        {script.updatedBy === 'ai' && (
          <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
            🤖 AI Updated
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <StatMini label="Used" value={script.usage.toString()} />
        <StatMini label="Success" value={`${script.successRate}%`} />
        <StatMini label="Avg Time" value={`${script.avgCallDuration}min`} />
      </div>

      {/* AI Info */}
      {script.fireflyCallIds.length > 0 && (
        <div className="mt-4 rounded-lg bg-purple-50 p-3">
          <p className="text-xs text-purple-700">
            Based on {script.fireflyCallIds.length} Firefly recordings • Confidence: {Math.round(script.aiConfidence * 100)}%
          </p>
        </div>
      )}

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1">
        {script.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}

function TemplateCard({ template }: { template: EmailTemplate }) {
  return (
    <div className="group cursor-pointer rounded-lg border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-zinc-900 group-hover:text-blue-700">{template.name}</h3>
          <p className="mt-1 text-sm text-zinc-600 capitalize">{template.category.replace('_', ' ')}</p>
        </div>
        {template.updatedBy === 'ai' && (
          <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-700">
            🤖 AI Updated
          </span>
        )}
      </div>

      {/* Subject Line */}
      <div className="mt-3 rounded-lg bg-zinc-50 p-3">
        <p className="text-xs text-zinc-600">Subject:</p>
        <p className="text-sm font-medium text-zinc-900">{template.subject}</p>
      </div>

      {/* Performance Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <StatMini label="Open Rate" value={`${template.openRate}%`} />
        <StatMini label="Response" value={`${template.responseRate}%`} />
        <StatMini label="Convert" value={`${template.conversionRate}%`} />
      </div>

      {/* Variables */}
      {template.variables.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {template.variables.slice(0, 3).map((variable) => (
            <span key={variable} className="rounded bg-blue-100 px-2 py-0.5 font-mono text-xs text-blue-700">
              {variable}
            </span>
          ))}
          {template.variables.length > 3 && (
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
              +{template.variables.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function FireflyCard({ recording }: { recording: FireflyRecording }) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    return `${mins} min`
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('de-DE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
              <span className="text-lg">🎙️</span>
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900">{recording.title}</h3>
              <p className="text-sm text-zinc-600">
                {formatDate(recording.date)} • {formatDuration(recording.duration)}
              </p>
            </div>
          </div>

          {/* Summary */}
          <p className="mt-4 text-sm text-zinc-700">{recording.summary}</p>

          {/* Key Moments */}
          {recording.keyMoments.length > 0 && (
            <div className="mt-4 space-y-2">
              {recording.keyMoments.map((moment, idx) => (
                <div key={idx} className="rounded-lg bg-zinc-50 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500">
                      {Math.floor(moment.timestamp / 60)}:{String(moment.timestamp % 60).padStart(2, '0')}
                    </span>
                    <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700 capitalize">
                      {moment.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="mt-1 text-sm italic text-zinc-600">&ldquo;{moment.quote}&rdquo;</p>
                </div>
              ))}
            </div>
          )}

          {/* Status */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex h-2 w-2 rounded-full ${recording.status === 'analyzed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              <span className="text-xs text-zinc-600 capitalize">{recording.status}</span>
            </div>
            {recording.usedForTemplates.length > 0 && (
              <span className="text-xs text-zinc-600">
                Used for {recording.usedForTemplates.length} template updates
              </span>
            )}
          </div>
        </div>

        <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
          View Full Analysis
        </button>
      </div>
    </div>
  )
}

function AIUpdateCard({ update }: { update: AIScriptUpdate }) {
  return (
    <div className="rounded-lg border-2 border-purple-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700 capitalize">
              {update.type.replace('_', ' ')}
            </span>
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
              Pending Review
            </span>
          </div>

          <h3 className="mt-3 font-semibold text-zinc-900">
            Suggested Update from {update.sourceName}
          </h3>
          <p className="mt-1 text-sm text-zinc-600">{update.reasoning}</p>

          {/* Changes */}
          <div className="mt-4 space-y-3">
            {update.changes.map((change, idx) => (
              <div key={idx} className="rounded-lg border border-zinc-200 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-zinc-500">{change.section}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    change.type === 'addition' ? 'bg-green-100 text-green-700' :
                    change.type === 'modification' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {change.type}
                  </span>
                </div>
                
                {/* Before/After */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-1">Before:</p>
                    <p className="text-sm text-zinc-700 bg-red-50 p-2 rounded">{change.before}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-zinc-500 mb-1">After:</p>
                    <p className="text-sm text-zinc-900 bg-green-50 p-2 rounded font-medium">{change.after}</p>
                  </div>
                </div>
                
                <p className="mt-2 text-xs text-zinc-600 italic">{change.reason}</p>
              </div>
            ))}
          </div>

          {/* AI Stats */}
          <div className="mt-4 flex items-center gap-4 text-xs text-zinc-600">
            <span>📊 Based on {update.basedOnCalls} calls</span>
            <span>🎯 Confidence: {Math.round(update.confidence * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        <button className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
          ✓ Accept Changes
        </button>
        <button className="flex-1 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
          ✗ Reject
        </button>
        <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
          Review Later
        </button>
      </div>
    </div>
  )
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-zinc-600">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-zinc-900">{value}</p>
    </div>
  )
}

