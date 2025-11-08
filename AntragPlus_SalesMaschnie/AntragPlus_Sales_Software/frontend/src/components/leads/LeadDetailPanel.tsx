'use client'

import { XMarkIcon, GlobeAltIcon, EnvelopeIcon, PhoneIcon, MapPinIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import type { LeadDetail } from '@/lib/leads-api'

interface LeadDetailPanelProps {
  lead: LeadDetail
  onClose: () => void
  onUpdate?: (lead: LeadDetail) => void
}

export function LeadDetailPanel({ lead, onClose, onUpdate }: LeadDetailPanelProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nie'
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'enriched': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'enriched': return 'Angereichert'
      case 'pending': return 'Ausstehend'
      case 'failed': return 'Fehlgeschlagen'
      default: return status
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{lead.companyName}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(lead.status)}`}>
              {getStatusText(lead.status)}
            </span>
            {lead.confidence > 0 && (
              <span className="text-xs text-gray-500">
                Konfidenz: {Math.round(lead.confidence * 100)}%
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Contact Information */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
            Kontaktinformationen
          </h3>
          <div className="space-y-3">
            {lead.website && (
              <InfoItem
                icon={<GlobeAltIcon className="h-5 w-5" />}
                label="Website"
                value={
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:text-cyan-700 hover:underline"
                  >
                    {lead.website}
                  </a>
                }
              />
            )}
            {lead.email && (
              <InfoItem
                icon={<EnvelopeIcon className="h-5 w-5" />}
                label="E-Mail"
                value={
                  <a href={`mailto:${lead.email}`} className="text-cyan-600 hover:text-cyan-700 hover:underline">
                    {lead.email}
                  </a>
                }
              />
            )}
            {lead.phone && (
              <InfoItem
                icon={<PhoneIcon className="h-5 w-5" />}
                label="Telefon"
                value={
                  <a href={`tel:${lead.phone}`} className="text-cyan-600 hover:text-cyan-700 hover:underline">
                    {lead.phone}
                  </a>
                }
              />
            )}
            {lead.address && (
              <InfoItem
                icon={<MapPinIcon className="h-5 w-5" />}
                label="Adresse"
                value={lead.address}
              />
            )}
            {lead.linkedIn && (
              <InfoItem
                icon={<BuildingOfficeIcon className="h-5 w-5" />}
                label="LinkedIn"
                value={
                  <a
                    href={lead.linkedIn}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 hover:text-cyan-700 hover:underline"
                  >
                    LinkedIn Profil
                  </a>
                }
              />
            )}
          </div>
        </section>

        {/* Organization Details */}
        <section>
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
            Organisationsdetails
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {lead.industry && (
              <DetailCard label="Branche" value={lead.industry} />
            )}
            {lead.tätigkeitsfeld && (
              <DetailCard label="Tätigkeitsfeld" value={lead.tätigkeitsfeld} />
            )}
            {lead.legalForm && (
              <DetailCard label="Rechtsform" value={lead.legalForm} />
            )}
            {lead.foundedYear && (
              <DetailCard label="Gegründet" value={lead.foundedYear.toString()} />
            )}
            {lead.employees && (
              <DetailCard label="Mitarbeiter" value={lead.employees} />
            )}
          </div>
        </section>

        {/* Leadership */}
        {lead.leadership && lead.leadership.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Führungspersonal
            </h3>
            <div className="space-y-3">
              {lead.leadership.map((person, idx) => (
                <div key={idx} className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{person.name}</p>
                      <p className="text-sm text-gray-600">{person.role}</p>
                    </div>
                  </div>
                  {(person.email || person.phone) && (
                    <div className="mt-2 space-y-1 text-sm">
                      {person.email && (
                        <p className="text-gray-600">
                          📧 {person.email}
                        </p>
                      )}
                      {person.phone && (
                        <p className="text-gray-600">
                          📞 {person.phone}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {lead.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center rounded-full bg-cyan-100 px-3 py-1 text-sm font-medium text-cyan-800"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Notes */}
        {lead.notes && (
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Notizen
            </h3>
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.notes}</p>
            </div>
          </section>
        )}

        {/* Enrichment History */}
        {lead.enrichmentHistory && lead.enrichmentHistory.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
              Anreicherungs-Verlauf
            </h3>
            <div className="space-y-2">
              {lead.enrichmentHistory.map((entry, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-900">
                      {entry.fields.length} Felder angereichert ({Math.round(entry.confidence * 100)}% Konfidenz)
                    </p>
                    <p className="text-gray-500">{formatDate(entry.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Metadata */}
        <section className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
            Metadaten
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <span className="font-medium">Lead ID:</span> {lead.id}
            </p>
            {lead.pipedriveOrgId && (
              <p>
                <span className="font-medium">Pipedrive Org ID:</span> {lead.pipedriveOrgId}
              </p>
            )}
            <p>
              <span className="font-medium">Zuletzt aktualisiert:</span> {formatDate(lead.updatedAt)}
            </p>
            {lead.enrichmentDate && (
              <p>
                <span className="font-medium">Angereichert am:</span> {formatDate(lead.enrichmentDate)}
              </p>
            )}
          </div>
        </section>
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex gap-3">
        <button className="flex-1 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm">
          Erneut anreichern
        </button>
        <button className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Bearbeiten
        </button>
      </div>
    </div>
  )
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 text-gray-400 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
        <div className="mt-1 text-sm text-gray-900">{value}</div>
      </div>
    </div>
  )
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3 bg-white">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900">{value}</p>
    </div>
  )
}

