'use client'

import { useState } from 'react'
import { CheckCircleIcon, XCircleIcon, PencilIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import type { LeadDetail } from '@/lib/leads-api'

interface LeadReviewCardProps {
  lead: LeadDetail
  onApprove: (leadId: string, editedFields?: any) => Promise<void>
  onReject: (leadId: string) => Promise<void>
  onEdit: (lead: LeadDetail) => void
}

export function LeadReviewCard({ lead, onApprove, onReject, onEdit }: LeadReviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50'
    if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const handleApprove = async () => {
    if (confirm(`Lead "${lead.companyName}" genehmigen und zu Pipeline hinzufügen?`)) {
      setLoading(true)
      try {
        await onApprove(lead.id)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleReject = async () => {
    if (confirm(`Lead "${lead.companyName}" wirklich ablehnen?`)) {
      setLoading(true)
      try {
        await onReject(lead.id)
      } finally {
        setLoading(false)
      }
    }
  }

  const fieldCount = [
    lead.website,
    lead.email,
    lead.phone,
    lead.address,
    lead.industry,
    lead.tätigkeitsfeld,
    lead.linkedIn,
  ].filter(Boolean).length

  return (
    <div className="rounded-lg border-2 border-gray-200 bg-white hover:border-cyan-300 transition-all">
      {/* Header - Always Visible */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Company Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-bold text-gray-900 truncate">{lead.companyName}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getConfidenceColor(lead.confidence)}`}>
                {Math.round(lead.confidence * 100)}% Konfidenz
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {lead.industry && (
                <span className="flex items-center gap-1">
                  <span className="font-medium">Branche:</span> {lead.industry}
                </span>
              )}
              {lead.tätigkeitsfeld && (
                <span className="flex items-center gap-1">
                  <span className="font-medium">Feld:</span> {lead.tätigkeitsfeld}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="font-medium">Felder:</span> {fieldCount}/7
              </span>
            </div>

            {/* Quick Preview */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              {lead.website && <span className="text-cyan-600">🌐 Website</span>}
              {lead.email && <span className="text-cyan-600">📧 Email</span>}
              {lead.phone && <span className="text-cyan-600">📞 Phone</span>}
              {lead.leadership && lead.leadership.length > 0 && (
                <span className="text-purple-600">👥 {lead.leadership.length} Leadership</span>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={handleApprove}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-4 py-2 text-sm font-medium text-white hover:from-green-600 hover:to-green-700 transition-colors shadow-sm disabled:opacity-50"
            >
              <CheckCircleIcon className="h-5 w-5" />
              Genehmigen
            </button>
            <button
              onClick={() => onEdit(lead)}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <PencilIcon className="h-5 w-5" />
              Bearbeiten
            </button>
            <button
              onClick={handleReject}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <XCircleIcon className="h-5 w-5" />
              Ablehnen
            </button>
          </div>
        </div>

        {/* Expand/Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="h-4 w-4" />
              Weniger anzeigen
            </>
          ) : (
            <>
              <ChevronDownIcon className="h-4 w-4" />
              Alle Details anzeigen
            </>
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-5 bg-gray-50 space-y-4">
          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Kontaktinformationen</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailField label="Website" value={lead.website} link />
              <DetailField label="Email" value={lead.email} link={lead.email ? `mailto:${lead.email}` : undefined} />
              <DetailField label="Telefon" value={lead.phone} link={lead.phone ? `tel:${lead.phone}` : undefined} />
              <DetailField label="Adresse" value={lead.address} />
              <DetailField label="LinkedIn" value={lead.linkedIn} link />
            </div>
          </div>

          {/* Organization Details */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Organisationsdetails</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailField label="Rechtsform" value={lead.legalForm} />
              <DetailField label="Gegründet" value={lead.foundedYear?.toString()} />
              <DetailField label="Mitarbeiter" value={lead.employees} />
              <DetailField label="Branche" value={lead.industry} />
            </div>
          </div>

          {/* Leadership */}
          {lead.leadership && lead.leadership.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Führungspersonal ({lead.leadership.length})</h4>
              <div className="space-y-2">
                {lead.leadership.map((person, idx) => (
                  <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                    <p className="font-medium text-gray-900">{person.name}</p>
                    <p className="text-sm text-gray-600">{person.role}</p>
                    {person.email && <p className="text-sm text-gray-600">📧 {person.email}</p>}
                    {person.phone && <p className="text-sm text-gray-600">📞 {person.phone}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {lead.notes && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Notizen</h4>
              <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border border-gray-200 whitespace-pre-wrap">
                {lead.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DetailField({ label, value, link }: { label: string; value?: string | null; link?: boolean | string }) {
  if (!value) {
    return (
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-gray-400 italic">Nicht vorhanden</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      {link ? (
        <a
          href={typeof link === 'string' ? link : value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-600 hover:text-cyan-700 hover:underline truncate block"
        >
          {value}
        </a>
      ) : (
        <p className="text-gray-900 truncate">{value}</p>
      )}
    </div>
  )
}

