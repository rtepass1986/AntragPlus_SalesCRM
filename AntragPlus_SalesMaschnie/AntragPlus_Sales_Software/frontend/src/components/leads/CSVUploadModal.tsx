'use client'

import { useState, useRef } from 'react'
import { XMarkIcon, CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { leadsApi } from '@/lib/leads-api'
import { CSVFieldMapper, type FieldMapping } from './CSVFieldMapper'

interface CSVUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (imported: number) => void
}

type UploadStep = 'upload' | 'mapping' | 'processing' | 'complete'

export function CSVUploadModal({ isOpen, onClose, onSuccess }: CSVUploadModalProps) {
  const [step, setStep] = useState<UploadStep>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [csvColumns, setCSVColumns] = useState<string[]>([])
  const [csvData, setCSVData] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ imported: number; message: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      handleFileSelected(droppedFile)
    } else {
      setError('Bitte nur CSV-Dateien hochladen')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelected(selectedFile)
    }
  }

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)

    try {
      // Parse CSV to get columns and preview data
      const text = await selectedFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        setError('CSV-Datei ist leer oder ungültig')
        return
      }

      // Parse header
      const header = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      setCSVColumns(header)

      // Parse first 5 rows for preview
      const rows = []
      for (let i = 1; i < Math.min(6, lines.length); i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        const row: any = {}
        header.forEach((key, index) => {
          row[key] = values[index] || ''
        })
        rows.push(row)
      }
      setCSVData(rows)

      // Move to mapping step
      setStep('mapping')
    } catch (err: any) {
      setError('Fehler beim Parsen der CSV-Datei')
    }
  }

  const handleMappingComplete = async (mappings: FieldMapping[]) => {
    if (!file) return

    try {
      setStep('processing')
      setUploading(true)
      setError(null)

      // TODO: Send mappings to backend for smart import
      // For now, use default upload
      const result = await leadsApi.uploadCSV(file)
      
      setSuccess({
        imported: result.imported,
        message: result.message,
      })
      
      setStep('complete')
      
      setTimeout(() => {
        onSuccess?.(result.imported)
        handleClose()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'Fehler beim Hochladen')
      setStep('mapping')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setStep('upload')
    setFile(null)
    setCSVColumns([])
    setCSVData([])
    setError(null)
    setSuccess(null)
    setUploading(false)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">CSV hochladen</h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 overflow-y-auto flex-1">
            {/* Step 1: Upload */}
            {step === 'upload' && (
              <>
                {/* Drag & Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative rounded-lg border-2 border-dashed transition-colors ${
                    isDragging
                      ? 'border-cyan-500 bg-cyan-50'
                      : 'border-gray-300 bg-gray-50'
                  }`}
                >
                  <div className="p-8 text-center">
                    <CloudArrowUpIcon className={`mx-auto h-12 w-12 ${isDragging ? 'text-cyan-500' : 'text-gray-400'}`} />
                    <div className="mt-4">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-cyan-600 hover:text-cyan-700">
                          Datei auswählen
                        </span>
                        <input
                          ref={fileInputRef}
                          id="file-upload"
                          type="file"
                          accept=".csv"
                          className="sr-only"
                          onChange={handleFileSelect}
                        />
                      </label>
                      <p className="text-sm text-gray-600 mt-1">oder per Drag & Drop hochladen</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">CSV bis 10MB</p>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* CSV Format Help */}
                <div className="mt-6 rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">📋 CSV Upload - Beliebige Spalten!</h4>
                  <div className="space-y-2 text-xs text-blue-700">
                    <p>✅ <strong>Beliebige CSV-Datei hochladen</strong></p>
                    <p>✅ <strong>Alle Spalten werden akzeptiert</strong></p>
                    <p>✅ <strong>Im nächsten Schritt:</strong> Du ordnest jede Spalte zu</p>
                    <p>✅ <strong>Auto-Detection</strong> schlägt Zuordnungen vor</p>
                    <p>✅ <strong>Neue Felder erstellen</strong> möglich</p>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <p className="text-xs text-blue-900 font-medium mb-1">Empfohlene Spalten:</p>
                    <div className="text-xs text-blue-600 font-mono bg-white rounded p-2 whitespace-nowrap overflow-x-auto">
                      Firmename,Geber,Fördererfahrung,jahr,anschrift,Tätigkeitsfeld,Förderzweck,betrag,empfaengerid
                    </div>
                  </div>
                  
                  <p className="mt-3 text-xs text-blue-600">
                    💡 <strong>Deal Value = 10% vom betrag</strong> • Fehlende Daten via Enrichment
                  </p>
                </div>
              </>
            )}

            {/* Step 2: Field Mapping */}
            {step === 'mapping' && (
              <CSVFieldMapper
                csvColumns={csvColumns}
                onComplete={handleMappingComplete}
                onBack={() => {
                  setStep('upload')
                  setFile(null)
                  setCSVColumns([])
                }}
              />
            )}

            {/* Step 3: Processing */}
            {step === 'processing' && (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-cyan-100 mb-4">
                  <svg className="animate-spin h-8 w-8 text-cyan-600" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Importiere Leads...</h3>
                <p className="text-sm text-gray-600">Bitte warten, dies kann einen Moment dauern.</p>
              </div>
            )}

            {/* Step 4: Complete */}
            {step === 'complete' && success && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Erfolgreich hochgeladen!</h3>
                <p className="text-sm text-gray-600">{success.message}</p>
              </div>
            )}
          </div>

          {/* Footer - Only for upload step */}
          {step === 'upload' && (
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

