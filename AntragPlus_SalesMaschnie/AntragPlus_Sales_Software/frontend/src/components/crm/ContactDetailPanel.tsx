'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, EnvelopeIcon, PhoneIcon, BuildingOfficeIcon, LinkIcon, PencilIcon } from '@heroicons/react/24/outline'
import type { Contact, Deal, Activity } from '@/lib/crm-types'
import { contactsApi } from '@/lib/crm-api'

interface ContactDetailPanelProps {
  contact: Contact
  onClose: () => void
  onUpdate?: (contact: Contact) => void
}

export function ContactDetailPanel({ contact, onClose, onUpdate }: ContactDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'deals' | 'activities'>('overview')
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (activeTab === 'deals') {
      loadDeals()
    } else if (activeTab === 'activities') {
      loadActivities()
    }
  }, [activeTab, contact.id])

  const loadDeals = async () => {
    try {
      setLoading(true)
      const data = await contactsApi.getDeals(contact.id)
      setDeals(data)
    } catch (error) {
      console.error('Error loading deals:', error)
      setDeals([])
    } finally {
      setLoading(false)
    }
  }

  const loadActivities = async () => {
    try {
      setLoading(true)
      const data = await contactsApi.getActivities(contact.id)
      setActivities(data)
    } catch (error) {
      console.error('Error loading activities:', error)
      setActivities([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nie'
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateString))
  }

  const getInitials = () => {
    return `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`.toUpperCase() || '?'
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-blue-50 px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4 flex-1">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {contact.photoUrl ? (
                <img
                  src={contact.photoUrl}
                  alt={contact.fullName}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xl font-bold">
                  {getInitials()}
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-gray-900 truncate">{contact.fullName}</h2>
              <div className="flex flex-col gap-1 mt-1">
                {contact.title && (
                  <p className="text-sm text-gray-600">{contact.title}</p>
                )}
                {contact.organizationName && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BuildingOfficeIcon className="h-4 w-4" />
                    <span>{contact.organizationName}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="ml-4 rounded-lg p-2 text-gray-400 hover:text-gray-600 hover:bg-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-4 border-b border-gray-200">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            Übersicht
          </TabButton>
          <TabButton active={activeTab === 'deals'} onClick={() => setActiveTab('deals')}>
            Deals ({deals.length})
          </TabButton>
          <TabButton active={activeTab === 'activities'} onClick={() => setActiveTab('activities')}>
            Aktivitäten ({activities.length})
          </TabButton>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <div className="p-6 space-y-6">
            {/* Contact Information */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                  Kontaktinformationen
                </h3>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1"
                >
                  <PencilIcon className="h-4 w-4" />
                  Bearbeiten
                </button>
              </div>

              <div className="space-y-3">
                {contact.email && (
                  <ContactInfoItem
                    icon={<EnvelopeIcon className="h-5 w-5" />}
                    label="E-Mail"
                    value={
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-cyan-600 hover:text-cyan-700 hover:underline"
                      >
                        {contact.email}
                      </a>
                    }
                  />
                )}
                {contact.phone && (
                  <ContactInfoItem
                    icon={<PhoneIcon className="h-5 w-5" />}
                    label="Telefon"
                    value={
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-cyan-600 hover:text-cyan-700 hover:underline"
                      >
                        {contact.phone}
                      </a>
                    }
                  />
                )}
                {contact.mobile && (
                  <ContactInfoItem
                    icon={<PhoneIcon className="h-5 w-5" />}
                    label="Mobil"
                    value={
                      <a
                        href={`tel:${contact.mobile}`}
                        className="text-cyan-600 hover:text-cyan-700 hover:underline"
                      >
                        {contact.mobile}
                      </a>
                    }
                  />
                )}
                {contact.linkedinUrl && (
                  <ContactInfoItem
                    icon={<LinkIcon className="h-5 w-5" />}
                    label="LinkedIn"
                    value={
                      <a
                        href={contact.linkedinUrl}
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

            {/* Tags */}
            {contact.tags && contact.tags.length > 0 && (
              <section>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag, idx) => (
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

            {/* Quick Stats */}
            <section>
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                Statistiken
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <StatCard label="Deals" value="0" />
                <StatCard label="Aktivitäten" value="0" />
                <StatCard label="E-Mails" value="0" />
              </div>
            </section>

            {/* Last Contact */}
            <section className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                Letzter Kontakt
              </h3>
              <p className="text-sm text-gray-600">
                {formatDate(contact.lastContactedAt)}
              </p>
            </section>

            {/* Metadata */}
            <section className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">
                Metadaten
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium">Kontakt ID:</span> {contact.id}
                </p>
                <p>
                  <span className="font-medium">Erstellt:</span> {formatDate(contact.createdAt)}
                </p>
                <p>
                  <span className="font-medium">Aktualisiert:</span> {formatDate(contact.updatedAt)}
                </p>
                {contact.ownerName && (
                  <p>
                    <span className="font-medium">Verantwortlich:</span> {contact.ownerName}
                  </p>
                )}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'deals' && (
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-600 border-r-transparent"></div>
                  <p className="mt-4 text-sm text-gray-600">Lädt Deals...</p>
                </div>
              </div>
            ) : deals.length > 0 ? (
              <div className="space-y-4">
                {deals.map((deal) => (
                  <div key={deal.id} className="rounded-lg border border-gray-200 p-4 hover:border-cyan-300 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{deal.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(deal.value)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                            {deal.stage}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                            {deal.probability}% Wahrscheinlichkeit
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">Keine Deals für diesen Kontakt</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'activities' && (
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-600 border-r-transparent"></div>
                  <p className="mt-4 text-sm text-gray-600">Lädt Aktivitäten...</p>
                </div>
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        activity.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{activity.subject}</h4>
                        <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="capitalize">{activity.type}</span>
                          {activity.dueDate && <span>Fällig: {formatDate(activity.dueDate)}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-gray-500">Keine Aktivitäten für diesen Kontakt</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
          >
            Schließen
          </button>
          <div className="flex gap-3">
            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white transition-colors">
              + Deal erstellen
            </button>
            <button className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white transition-colors">
              + Aktivität
            </button>
            <button className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-colors shadow-sm">
              Bearbeiten
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
        active
          ? 'border-cyan-600 text-cyan-600'
          : 'border-transparent text-gray-600 hover:text-gray-900'
      }`}
    >
      {children}
    </button>
  )
}

function ContactInfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0 text-gray-400 mt-0.5">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</p>
        <div className="text-sm text-gray-900">{value}</div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 p-4 text-center bg-white">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </div>
  )
}

