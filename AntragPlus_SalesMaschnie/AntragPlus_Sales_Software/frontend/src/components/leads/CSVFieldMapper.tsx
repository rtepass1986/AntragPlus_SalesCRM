'use client'

import { useState } from 'react'
import { ArrowRightIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'

export interface FieldMapping {
  csvColumn: string
  dbField: string | 'new' | 'skip'
  newFieldName?: string
  newFieldType?: 'text' | 'email' | 'phone' | 'url' | 'number' | 'date'
}

interface CSVFieldMapperProps {
  csvColumns: string[]
  onComplete: (mappings: FieldMapping[]) => void
  onBack: () => void
}

// Standard database fields (base + your custom fields)
const STANDARD_FIELDS = [
  { value: 'company_name', label: 'Firmenname', required: true },
  { value: 'address', label: 'Anschrift', required: false },
  { value: 'tätigkeitsfeld', label: 'Tätigkeitsfeld', required: false },
  
  // Custom fields from your CSV
  { value: 'custom:geber', label: '🎯 Geber (Donor)', required: false },
  { value: 'custom:fördererfahrung', label: '📊 Fördererfahrung', required: false },
  { value: 'custom:jahr', label: '📅 Jahr', required: false },
  { value: 'custom:förderzweck', label: '💡 Förderzweck (Purpose)', required: false },
  { value: 'custom:betrag', label: '💰 Betrag (Amount)', required: false },
  { value: 'custom:empfaengerid', label: '🆔 Empfänger ID', required: false },
  
  // Fields that will be enriched (nicht in CSV)
  { value: 'website', label: '🔍 Website (via Enrichment)', required: false },
  { value: 'email', label: '🔍 E-Mail (via Enrichment)', required: false },
  { value: 'phone', label: '🔍 Telefon (via Enrichment)', required: false },
  { value: 'linkedin_url', label: '🔍 LinkedIn (via Enrichment)', required: false },
  { value: 'industry', label: '🔍 Branche (via Enrichment)', required: false },
  { value: 'founded_year', label: '🔍 Gründungsjahr (via Enrichment)', required: false },
  { value: 'legal_form', label: '🔍 Rechtsform (via Enrichment)', required: false },
  { value: 'employees_estimate', label: '🔍 Mitarbeiter (via Enrichment)', required: false },
  { value: 'notes', label: 'Notizen', required: false },
]

export function CSVFieldMapper({ csvColumns, onComplete, onBack }: CSVFieldMapperProps) {
  const [mappings, setMappings] = useState<FieldMapping[]>(
    csvColumns.map(col => {
      // Auto-detect common field names
      const autoDetected = autoDetectField(col)
      return {
        csvColumn: col,
        dbField: autoDetected,
      }
    })
  )

  const handleMappingChange = (index: number, dbField: string) => {
    const newMappings = [...mappings]
    newMappings[index] = {
      ...newMappings[index],
      dbField,
      newFieldName: dbField === 'new' ? '' : undefined,
      newFieldType: dbField === 'new' ? 'text' : undefined,
    }
    setMappings(newMappings)
  }

  const handleNewFieldConfig = (index: number, fieldName: string, fieldType: string) => {
    const newMappings = [...mappings]
    newMappings[index] = {
      ...newMappings[index],
      newFieldName: fieldName,
      newFieldType: fieldType as any,
    }
    setMappings(newMappings)
  }

  const canProceed = () => {
    // Check if required field (company_name) is mapped
    const hasCompanyName = mappings.some(m => m.dbField === 'company_name')
    
    // Check if all 'new' fields have names
    const allNewFieldsNamed = mappings
      .filter(m => m.dbField === 'new')
      .every(m => m.newFieldName && m.newFieldName.trim() !== '')

    return hasCompanyName && allNewFieldsNamed
  }

  const getMappedFields = () => {
    return mappings.filter(m => m.dbField !== 'skip')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900">Schritt 2: Felder zuordnen</h3>
        <p className="text-sm text-gray-600 mt-2">
          Wähle für jede CSV-Spalte das passende Datenbankfeld aus dem Dropdown.
        </p>
      </div>

      {/* Required Field Notice */}
      {!mappings.some(m => m.dbField === 'company_name') && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-700">
            ⚠️ <strong>Pflichtfeld fehlt:</strong> Mindestens eine Spalte muss "Firmenname" zugeordnet werden
          </p>
        </div>
      )}

      {/* Mapping List - Simple Left/Right Layout */}
      <div className="space-y-3">
        {csvColumns.map((csvCol, index) => {
          const isUsedByOther = mappings.some((m, i) => i !== index && m.dbField === mappings[index].dbField && m.dbField !== 'skip' && m.dbField !== 'new')
          
          return (
            <div key={index} className="space-y-3">
              <div className="flex items-center gap-4 p-3 bg-white rounded-lg border border-gray-200 hover:border-cyan-300 transition-colors">
                {/* Left: CSV Column Name */}
                <div className="w-1/3">
                  <span className="font-mono text-sm font-semibold text-gray-900 bg-blue-50 px-3 py-2 rounded block text-center">
                    {csvCol}
                  </span>
                </div>

                {/* Arrow */}
                <ArrowRightIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />

                {/* Right: Dropdown */}
                <div className="flex-1">
                  <select
                    value={mappings[index].dbField}
                    onChange={(e) => handleMappingChange(index, e.target.value)}
                    className={`w-full rounded-lg border px-4 py-2 text-sm font-medium focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                      mappings[index].dbField === 'skip' 
                        ? 'border-gray-300 text-gray-500' 
                        : isUsedByOther
                        ? 'border-orange-300 bg-orange-50 text-orange-700'
                        : 'border-green-300 bg-green-50 text-green-700'
                    }`}
                  >
                    <option value="skip">— Überspringen —</option>
                    <optgroup label="Standard Felder">
                      {STANDARD_FIELDS.map(field => {
                        const alreadyMapped = mappings.some((m, i) => i !== index && m.dbField === field.value)
                        return (
                          <option 
                            key={field.value} 
                            value={field.value}
                            disabled={alreadyMapped}
                          >
                            {field.label} {field.required ? '(Pflicht)' : ''} {alreadyMapped ? '(Bereits gemappt)' : ''}
                          </option>
                        )
                      })}
                    </optgroup>
                    <option value="new">➕ Neues Feld erstellen...</option>
                  </select>
                </div>
              </div>

              {/* New Field Configuration */}
              {mappings[index].dbField === 'new' && (
                <div className="ml-12 pl-4 border-l-2 border-cyan-500 space-y-3 py-3">
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Neuer Feldname
                    </label>
                    <input
                      type="text"
                      placeholder="z.B. jahresumsatz, mitgliederzahl"
                      value={mappings[index].newFieldName || ''}
                      onChange={(e) => handleNewFieldConfig(index, e.target.value, mappings[index].newFieldType || 'text')}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      Feldtyp
                    </label>
                    <select
                      value={mappings[index].newFieldType || 'text'}
                      onChange={(e) => handleNewFieldConfig(index, mappings[index].newFieldName || '', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="text">Text</option>
                      <option value="email">E-Mail</option>
                      <option value="phone">Telefon</option>
                      <option value="url">URL</option>
                      <option value="number">Zahl</option>
                      <option value="date">Datum</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="rounded-lg bg-cyan-50 border border-cyan-200 p-4">
        <h4 className="text-sm font-semibold text-cyan-900 mb-2">📊 Zusammenfassung</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-cyan-700">CSV Spalten:</p>
            <p className="font-bold text-cyan-900">{csvColumns.length}</p>
          </div>
          <div>
            <p className="text-cyan-700">Gemappt:</p>
            <p className="font-bold text-cyan-900">{mappings.filter(m => m.dbField !== 'skip').length}</p>
          </div>
          <div>
            <p className="text-cyan-700">Neue Felder:</p>
            <p className="font-bold text-cyan-900">{mappings.filter(m => m.dbField === 'new').length}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Zurück
        </button>
        <button
          onClick={() => onComplete(mappings)}
          disabled={!canProceed()}
          className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Import starten ({getMappedFields().length} Felder)
        </button>
      </div>
    </div>
  )
}

// Auto-detect field mapping based on column name
function autoDetectField(columnName: string): string {
  const normalized = columnName.toLowerCase().trim()

  // YOUR SPECIFIC CSV FIELDS (Exact match priority)
  if (normalized === 'firmename' || normalized === 'firmenname') {
    return 'company_name'
  }
  
  if (normalized === 'anschrift') {
    return 'address'
  }
  
  if (normalized === 'tätigkeitsfeld') {
    return 'tätigkeitsfeld'
  }
  
  if (normalized === 'geber') {
    return 'custom:geber'
  }
  
  if (normalized === 'fördererfahrung' || normalized === 'foerdererfahrung') {
    return 'custom:fördererfahrung'
  }
  
  if (normalized === 'jahr') {
    return 'custom:jahr'
  }
  
  if (normalized === 'förderzweck' || normalized === 'foerderzweck') {
    return 'custom:förderzweck'
  }
  
  if (normalized === 'betrag') {
    return 'custom:betrag'
  }
  
  if (normalized === 'empfaengerid' || normalized === 'empfängerid') {
    return 'custom:empfaengerid'
  }

  // Generic Company name variations
  if (normalized.match(/^(company|name|firma|unternehmen|organization|organisation)$/)) {
    return 'company_name'
  }

  // Website variations (will be enriched)
  if (normalized.match(/^(website|url|web|homepage|site)$/)) {
    return 'website'
  }

  // Email variations (will be enriched)
  if (normalized.match(/^(email|e-mail|mail|e_mail)$/)) {
    return 'email'
  }

  // Phone variations (will be enriched)
  if (normalized.match(/^(phone|telefon|tel|telephone|fon)$/)) {
    return 'phone'
  }

  // Address variations
  if (normalized.match(/^(address|adresse|standort)$/)) {
    return 'address'
  }

  // Industry variations (will be enriched)
  if (normalized.match(/^(industry|industrie|branche|sektor|sector)$/)) {
    return 'industry'
  }

  // Tätigkeitsfeld variations
  if (normalized.match(/^(taetigkeitsfeld|field|bereich|arbeitsbereich)$/)) {
    return 'tätigkeitsfeld'
  }

  // LinkedIn variations (will be enriched)
  if (normalized.match(/^(linkedin|linked_in)$/)) {
    return 'linkedin_url'
  }

  // Legal form variations (will be enriched)
  if (normalized.match(/^(legal_form|rechtsform|form)$/)) {
    return 'legal_form'
  }

  // Founded year variations (will be enriched)
  if (normalized.match(/^(founded|founded_year|gründung|gründungsjahr|year)$/)) {
    return 'founded_year'
  }

  // Default: skip unknown fields
  return 'skip'
}

