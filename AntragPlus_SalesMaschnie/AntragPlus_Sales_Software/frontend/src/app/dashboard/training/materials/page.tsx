'use client'

import { useState } from 'react'
import type { TrainingMaterial, UserProgress } from '@/lib/training-types'

export default function TrainingMaterialsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedMaterial, setSelectedMaterial] = useState<TrainingMaterial | null>(null)

  // Mock materials - Replace with API
  const mockMaterials: TrainingMaterial[] = [
    {
      id: 'mat-1',
      title: 'AntragPlus Product Overview',
      type: 'video',
      category: 'product',
      description: 'Complete overview of AntragPlus features, modules, and use cases',
      videoUrl: 'https://example.com/video1.mp4',
      estimatedDuration: 15,
      mandatory: true,
      prerequisite: [],
      assignedTo: ['all'],
      views: 124,
      completions: 98,
      avgScore: 87,
      createdBy: 'Training Team',
      createdAt: '2024-01-10T10:00:00Z',
      updatedAt: '2024-10-15T14:00:00Z',
      version: 2,
      tags: ['Product', 'Onboarding', 'Required'],
    },
    {
      id: 'mat-2',
      title: 'Discovery Call Best Practices',
      type: 'pdf',
      category: 'sales_process',
      description: 'Proven techniques for effective discovery calls with nonprofits',
      fileUrl: '/materials/discovery-best-practices.pdf',
      estimatedDuration: 20,
      mandatory: true,
      prerequisite: ['mat-1'],
      assignedTo: ['all'],
      views: 98,
      completions: 85,
      avgScore: 92,
      createdBy: 'Sales Manager',
      createdAt: '2024-02-01T10:00:00Z',
      updatedAt: '2024-11-01T09:00:00Z',
      version: 3,
      tags: ['Sales Process', 'Discovery', 'Required'],
    },
    {
      id: 'mat-3',
      title: 'Handling Common Objections',
      type: 'interactive',
      category: 'objection_handling',
      description: 'Interactive scenarios for handling budget, timing, and feature objections',
      estimatedDuration: 30,
      mandatory: false,
      prerequisite: ['mat-1', 'mat-2'],
      assignedTo: ['all'],
      views: 67,
      completions: 52,
      avgScore: 78,
      createdBy: 'Sales Team',
      createdAt: '2024-03-15T10:00:00Z',
      updatedAt: '2024-10-20T11:00:00Z',
      version: 1,
      tags: ['Objections', 'Interactive', 'Advanced'],
    },
    {
      id: 'mat-4',
      title: 'CRM & Pipeline Management',
      type: 'article',
      category: 'tools',
      description: 'How to use the CRM effectively: deal tracking, activities, and reporting',
      content: 'Article content here...',
      estimatedDuration: 10,
      mandatory: true,
      prerequisite: [],
      assignedTo: ['all'],
      views: 112,
      completions: 95,
      createdBy: 'Product Team',
      createdAt: '2024-01-20T10:00:00Z',
      updatedAt: '2024-11-02T10:00:00Z',
      version: 1,
      tags: ['Tools', 'CRM', 'Required'],
    },
  ]

  const categories = [
    { id: 'all', name: 'Alle Materialien', count: mockMaterials.length },
    { id: 'product', name: 'Produktwissen', count: mockMaterials.filter(m => m.category === 'product').length },
    { id: 'sales_process', name: 'Verkaufsprozess', count: mockMaterials.filter(m => m.category === 'sales_process').length },
    { id: 'objection_handling', name: 'Einwandbehandlung', count: mockMaterials.filter(m => m.category === 'objection_handling').length },
    { id: 'tools', name: 'Tools & Systeme', count: mockMaterials.filter(m => m.category === 'tools').length },
    { id: 'compliance', name: 'Compliance', count: mockMaterials.filter(m => m.category === 'compliance').length },
  ]

  const filteredMaterials = selectedCategory === 'all'
    ? mockMaterials
    : mockMaterials.filter(m => m.category === selectedCategory)

  const stats = {
    total: mockMaterials.length,
    mandatory: mockMaterials.filter(m => m.mandatory).length,
    completed: mockMaterials.filter(m => m.completions > 0).length,
    avgCompletion: Math.round(mockMaterials.reduce((sum, m) => sum + (m.completions / (m.views || 1) * 100), 0) / mockMaterials.length),
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              SCHULUNGSMATERIALIEN
            </h1>
            <p className="mt-2 text-sm text-zinc-600">
              Sales-Trainings-Bibliothek mit Videos, Dokumenten und interaktiven Inhalten
            </p>
          </div>
          <button className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm">
            📤 Material hochladen
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label="Gesamt Materialien" value={stats.total.toString()} icon="📚" />
          <StatCard label="Pflichtmaterial" value={stats.mandatory.toString()} icon="⚠️" />
          <StatCard label="Abgeschlossen" value={stats.completed.toString()} icon="✅" />
          <StatCard label="Ø Abschlussrate" value={`${stats.avgCompletion}%`} icon="📊" />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                  : 'bg-white border border-zinc-300 text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {cat.name} ({cat.count})
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`rounded-lg p-2 ${viewMode === 'grid' ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`rounded-lg p-2 ${viewMode === 'list' ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Materials Grid */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
        {filteredMaterials.map((material) => (
          <MaterialCard
            key={material.id}
            material={material}
            viewMode={viewMode}
            onClick={() => setSelectedMaterial(material)}
          />
        ))}
      </div>

      {filteredMaterials.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-sm text-zinc-500">Keine Materialien in dieser Kategorie gefunden</p>
        </div>
      )}
    </div>
  )
}

function MaterialCard({ material, viewMode, onClick }: { material: TrainingMaterial; viewMode: 'grid' | 'list'; onClick: () => void }) {
  const typeIcons = {
    video: '🎥',
    pdf: '📄',
    article: '📝',
    interactive: '🎮',
    quiz: '❓',
  }

  const completionRate = material.views > 0 ? Math.round((material.completions / material.views) * 100) : 0

  if (viewMode === 'list') {
    return (
      <div
        onClick={onClick}
        className="group cursor-pointer rounded-lg border border-zinc-200 bg-white p-4 shadow-sm hover:shadow-md transition-all hover:border-blue-300"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-2xl">
            {typeIcons[material.type]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-zinc-900 group-hover:text-blue-700 truncate">
                {material.title}
              </h3>
              {material.mandatory && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                  Pflicht
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-zinc-600 line-clamp-1">{material.description}</p>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-xs text-zinc-600">Dauer</p>
              <p className="font-medium text-zinc-900">{material.estimatedDuration} min</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-600">Abschluss</p>
              <p className="font-medium text-zinc-900">{completionRate}%</p>
            </div>
            {material.avgScore && (
              <div className="text-center">
                <p className="text-xs text-zinc-600">Ø Punkte</p>
                <p className="font-medium text-zinc-900">{material.avgScore}%</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer rounded-lg border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:border-blue-300"
    >
      {/* Type Icon */}
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-2xl">
          {typeIcons[material.type]}
        </div>
              {material.mandatory && (
                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                  Pflicht
                </span>
              )}
      </div>

      {/* Content */}
      <h3 className="mt-4 font-semibold text-zinc-900 group-hover:text-blue-700">
        {material.title}
      </h3>
      <p className="mt-2 text-sm text-zinc-600 line-clamp-2">{material.description}</p>

      {/* Meta */}
      <div className="mt-4 flex items-center gap-4 text-xs text-zinc-600">
        <span>⏱️ {material.estimatedDuration} min</span>
        <span>👁️ {material.views} Aufrufe</span>
        <span>✅ {material.completions} abgeschlossen</span>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-zinc-600 mb-1">
          <span>Abschlussrate</span>
          <span className="font-medium">{completionRate}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-zinc-200">
          <div
            className="h-full rounded-full bg-green-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-1">
        {material.tags.slice(0, 2).map((tag) => (
          <span key={tag} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
            {tag}
          </span>
        ))}
      </div>

      {/* Action Button */}
      <button className="mt-4 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm">
        Jetzt lernen
      </button>
    </div>
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

