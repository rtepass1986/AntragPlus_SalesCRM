'use client'

import { useState } from 'react'
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowRightIcon, XMarkIcon, CheckCircleIcon, PlusIcon } from '@heroicons/react/24/outline'

export interface FieldMapping {
  csvColumn: string
  dbField: string | null
  isCustomField: boolean
  customFieldName?: string
}

interface DragDropFieldMapperProps {
  csvColumns: string[]
  onComplete: (mappings: FieldMapping[]) => void
  onCancel: () => void
}

// Database fields that can be mapped to
const DB_FIELDS = [
  { id: 'company_name', label: 'Firmenname', icon: '🏢', required: true },
  { id: 'address', label: 'Anschrift', icon: '📍', required: false },
  { id: 'tätigkeitsfeld', label: 'Tätigkeitsfeld', icon: '🎯', required: false },
  { id: 'website', label: 'Website', icon: '🌐', required: false },
  { id: 'email', label: 'E-Mail', icon: '📧', required: false },
  { id: 'phone', label: 'Telefon', icon: '📞', required: false },
  { id: 'linkedin_url', label: 'LinkedIn', icon: '💼', required: false },
  { id: 'industry', label: 'Branche', icon: '🏭', required: false },
  { id: 'legal_form', label: 'Rechtsform', icon: '⚖️', required: false },
  { id: 'founded_year', label: 'Gründungsjahr', icon: '📅', required: false },
]

export function DragDropFieldMapper({ csvColumns, onComplete, onCancel }: DragDropFieldMapperProps) {
  const [mappings, setMappings] = useState<Record<string, string | null>>(
    csvColumns.reduce((acc, col) => {
      acc[col] = autoDetectField(col)
      return acc
    }, {} as Record<string, string | null>)
  )
  const [activeDrag, setActiveDrag] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDrag(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDrag(null)

    if (!over) return

    const csvColumn = active.id as string
    const dbField = over.id as string

    // Update mapping
    setMappings(prev => ({
      ...prev,
      [csvColumn]: dbField === 'unmapped' ? null : dbField,
    }))
  }

  const handleComplete = () => {
    const finalMappings: FieldMapping[] = csvColumns.map(col => ({
      csvColumn: col,
      dbField: mappings[col],
      isCustomField: mappings[col] ? !DB_FIELDS.some(f => f.id === mappings[col]) : false,
    }))

    onComplete(finalMappings)
  }

  const canProceed = () => {
    // At least company_name must be mapped
    return Object.values(mappings).some(m => m === 'company_name')
  }

  const getMappedCount = () => {
    return Object.values(mappings).filter(m => m !== null).length
  }

  const getUnmappedColumns = () => {
    return csvColumns.filter(col => !mappings[col])
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-gray-900">🎯 Felder zuordnen per Drag & Drop</h3>
          <p className="text-sm text-gray-600 mt-2">
            Ziehe CSV-Spalten auf die passenden Datenbank-Felder. Automatische Vorschläge sind bereits gemacht.
          </p>
        </div>

        {/* Progress */}
        <div className="rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-xs text-gray-600">CSV Spalten</p>
                <p className="text-2xl font-bold text-gray-900">{csvColumns.length}</p>
              </div>
              <ArrowRightIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-xs text-gray-600">Gemappt</p>
                <p className="text-2xl font-bold text-cyan-600">{getMappedCount()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Nicht zugeordnet</p>
                <p className="text-2xl font-bold text-orange-600">{getUnmappedColumns().length}</p>
              </div>
            </div>
            {!canProceed() && (
              <div className="text-xs text-red-600 font-medium">
                ⚠️ Firmename muss zugeordnet werden
              </div>
            )}
          </div>
        </div>

        {/* Mapping Area */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left: CSV Columns */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">CSV</span>
              Deine Spalten
            </h4>
            <div className="space-y-2">
              {csvColumns.map((col) => (
                <DraggableCSVColumn
                  key={col}
                  column={col}
                  mappedTo={mappings[col]}
                  onUnmap={() => setMappings(prev => ({ ...prev, [col]: null }))}
                />
              ))}
            </div>
          </div>

          {/* Right: DB Fields */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">DB</span>
              Datenbank Felder
            </h4>
            <div className="space-y-2">
              {DB_FIELDS.map((field) => (
                <DroppableDBField
                  key={field.id}
                  field={field}
                  mappedColumns={Object.entries(mappings)
                    .filter(([_, dbField]) => dbField === field.id)
                    .map(([col]) => col)}
                />
              ))}
              
              {/* Unmapped Drop Zone */}
              <DroppableDBField
                field={{ id: 'unmapped', label: 'Nicht zuordnen', icon: '🚫', required: false }}
                mappedColumns={getUnmappedColumns()}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
            onClick={handleComplete}
            disabled={!canProceed()}
            className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircleIcon className="h-5 w-5" />
            Import starten ({getMappedCount()} Felder)
          </button>
        </div>
      </div>

      <DragOverlay>
        {activeDrag ? (
          <div className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm">
            {activeDrag}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

// Draggable CSV Column
function DraggableCSVColumn({ column, mappedTo, onUnmap }: { column: string; mappedTo: string | null; onUnmap: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: column })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getMappedLabel = () => {
    if (!mappedTo) return null
    const field = DB_FIELDS.find(f => f.id === mappedTo)
    return field ? `${field.icon} ${field.label}` : mappedTo
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group relative rounded-lg border-2 p-3 cursor-grab active:cursor-grabbing transition-all ${
        mappedTo
          ? 'border-green-300 bg-green-50'
          : 'border-blue-300 bg-blue-50 hover:border-blue-400'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{column}</p>
          {mappedTo && (
            <p className="text-xs text-green-700 mt-1 flex items-center gap-1">
              <ArrowRightIcon className="h-3 w-3" />
              {getMappedLabel()}
            </p>
          )}
        </div>
        {mappedTo && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onUnmap()
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Droppable DB Field
function DroppableDBField({ field, mappedColumns }: { field: { id: string; label: string; icon: string; required: boolean }; mappedColumns: string[] }) {
  const { setNodeRef, isOver } = useSortable({ id: field.id })

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 border-dashed p-4 transition-all min-h-[80px] ${
        isOver
          ? 'border-cyan-500 bg-cyan-50 scale-105'
          : mappedColumns.length > 0
          ? 'border-green-300 bg-green-50'
          : 'border-gray-300 bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{field.icon}</span>
          <span className="text-sm font-semibold text-gray-900">{field.label}</span>
          {field.required && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
              Pflicht
            </span>
          )}
        </div>
      </div>

      {/* Mapped columns */}
      {mappedColumns.length > 0 ? (
        <div className="space-y-1">
          {mappedColumns.map((col) => (
            <div key={col} className="text-xs bg-white rounded px-2 py-1 text-gray-700 font-medium border border-gray-200">
              {col}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">
          {field.id === 'unmapped' ? 'Hierhin ziehen zum Überspringen' : 'Spalte hierhin ziehen'}
        </p>
      )}
    </div>
  )
}

// Auto-detect field based on column name
function autoDetectField(columnName: string): string | null {
  const normalized = columnName.toLowerCase().trim()

  // Exact matches for your fields
  if (normalized === 'firmename' || normalized === 'firmenname') return 'company_name'
  if (normalized === 'anschrift') return 'address'
  if (normalized === 'tätigkeitsfeld') return 'tätigkeitsfeld'
  if (normalized === 'website') return 'website'
  if (normalized === 'email' || normalized === 'e-mail') return 'email'
  if (normalized === 'phone' || normalized === 'telefon') return 'phone'
  if (normalized === 'linkedin') return 'linkedin_url'
  if (normalized === 'branche' || normalized === 'industry') return 'industry'
  if (normalized === 'rechtsform') return 'legal_form'
  if (normalized === 'gründungsjahr' || normalized === 'jahr') return 'founded_year'

  // Unknown fields - leave unmapped so user can decide
  return null
}

