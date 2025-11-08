'use client'

import { useState, useRef } from 'react'
import { XMarkIcon, CloudArrowUpIcon, DocumentIcon, PhotoIcon, PaperClipIcon } from '@heroicons/react/24/outline'

interface FileUploadModalProps {
  isOpen: boolean
  onClose: () => void
  dealId?: string
  contactId?: string
  organizationId?: string
  onSuccess?: (files: any[]) => void
}

export function FileUploadModal({ isOpen, onClose, dealId, contactId, organizationId, onSuccess }: FileUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
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
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFilesAdded(droppedFiles)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      handleFilesAdded(selectedFiles)
    }
  }

  const handleFilesAdded = (newFiles: File[]) => {
    // Validate file size (25MB per file)
    const maxSize = 25 * 1024 * 1024
    const validFiles = newFiles.filter(file => {
      if (file.size > maxSize) {
        setError(`${file.name} ist zu groß (max 25MB)`)
        return false
      }
      return true
    })

    setFiles(prev => [...prev, ...validFiles])
    setError(null)
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    try {
      setUploading(true)
      setError(null)

      // Simulate upload progress for each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 20) {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: progress,
          }))
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      // TODO: Actual upload to server
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      if (dealId) formData.append('dealId', dealId)
      if (contactId) formData.append('contactId', contactId)
      if (organizationId) formData.append('organizationId', organizationId)

      // await fetch('/api/crm/files', { method: 'POST', body: formData })

      onSuccess?.(files.map(f => ({ name: f.name, size: f.size })))
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Fehler beim Hochladen')
    } finally {
      setUploading(false)
      setUploadProgress({})
    }
  }

  const handleClose = () => {
    setFiles([])
    setError(null)
    setUploadProgress({})
    setUploading(false)
    onClose()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <PhotoIcon className="h-10 w-10 text-purple-500" />
    if (file.type.includes('pdf')) return <DocumentIcon className="h-10 w-10 text-red-500" />
    return <PaperClipIcon className="h-10 w-10 text-gray-500" />
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
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">Dateien hochladen</h2>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Drag & Drop Zone */}
            {files.length === 0 && (
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
                <div className="p-12 text-center">
                  <CloudArrowUpIcon className={`mx-auto h-16 w-16 ${isDragging ? 'text-cyan-500' : 'text-gray-400'}`} />
                  <div className="mt-4">
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <span className="text-base font-medium text-cyan-600 hover:text-cyan-700">
                        Dateien auswählen
                      </span>
                      <input
                        ref={fileInputRef}
                        id="file-upload"
                        type="file"
                        multiple
                        className="sr-only"
                        onChange={handleFileSelect}
                      />
                    </label>
                    <p className="text-sm text-gray-600 mt-2">oder per Drag & Drop hochladen</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">
                    PDF, Bilder, Dokumente • Max 25MB pro Datei
                  </p>
                </div>
              </div>
            )}

            {/* Selected Files List */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Ausgewählte Dateien ({files.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    + Weitere hinzufügen
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={handleFileSelect}
                  />
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-cyan-300 transition-colors">
                      {getFileIcon(file)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                        
                        {/* Progress Bar */}
                        {uploading && uploadProgress[file.name] !== undefined && (
                          <div className="mt-2">
                            <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
                                style={{ width: `${uploadProgress[file.name]}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      {!uploading && (
                        <button
                          onClick={() => removeFile(index)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Info */}
            {!uploading && files.length > 0 && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-700">
                  <strong>{files.length}</strong> {files.length === 1 ? 'Datei' : 'Dateien'} bereit zum Hochladen
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {files.length > 0 && (
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
                disabled={uploading}
              >
                Abbrechen
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {uploading ? 'Wird hochgeladen...' : `${files.length} ${files.length === 1 ? 'Datei' : 'Dateien'} hochladen`}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

