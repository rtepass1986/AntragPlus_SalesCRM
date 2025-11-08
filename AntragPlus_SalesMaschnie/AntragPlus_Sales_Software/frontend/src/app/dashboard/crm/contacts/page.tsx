'use client'

import { useState, useEffect } from 'react'
import type { Contact } from '@/lib/crm-types'
import { contactsApi } from '@/lib/crm-api'
import { ContactDetailPanel } from '@/components/crm/ContactDetailPanel'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  useEffect(() => {
    loadContacts()
  }, [])

  const loadContacts = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await contactsApi.getAll()
      setContacts(data)
    } catch (err: any) {
      console.error('Failed to load contacts:', err)
      setError('Failed to load contacts from Pipedrive')
    } finally {
      setIsLoading(false)
    }
  }

  const filteredContacts = contacts.filter(contact =>
    contact.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.organizationName?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Nie'
    return new Intl.DateTimeFormat('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-cyan-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Lädt Kontakte aus Pipedrive...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-blue-900">Fehler beim Laden</h3>
        <p className="mt-2 text-sm text-blue-700">{error}</p>
        <button
          onClick={loadContacts}
          className="mt-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700"
        >
          Erneut Versuchen
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
          KONTAKTE
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Verwalte alle deine Kontakte und Beziehungen
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <span className="text-3xl mr-3">👥</span>
              <div>
                <dt className="text-sm font-medium text-gray-500 truncate">Gesamt Kontakte</dt>
                <dd className="text-2xl font-semibold text-gray-900">{contacts.length}</dd>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <span className="text-3xl mr-3">🏢</span>
              <div>
                <dt className="text-sm font-medium text-gray-500 truncate">Mit Organisation</dt>
                <dd className="text-2xl font-semibold text-gray-900">{contacts.filter(c => c.organizationId).length}</dd>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <span className="text-3xl mr-3">📧</span>
              <div>
                <dt className="text-sm font-medium text-gray-500 truncate">Mit E-Mail</dt>
                <dd className="text-2xl font-semibold text-gray-900">{contacts.filter(c => c.email).length}</dd>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & New Button */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Suche nach Name, E-Mail oder Organisation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        <button className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:from-cyan-600 hover:to-blue-700 transition-all shadow-sm flex items-center gap-2">
          <PlusIcon className="h-5 w-5" />
          Neuer Kontakt
        </button>
      </div>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredContacts.map((contact) => (
          <div
            key={contact.id}
            onClick={() => setSelectedContact(contact)}
            className="group cursor-pointer rounded-lg border border-gray-200 bg-white p-6 shadow transition-all hover:shadow-md hover:border-cyan-300"
          >
            {/* Avatar & Name */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-lg font-semibold text-white">
                {contact.firstName?.[0] || contact.fullName?.[0] || '?'}
              </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-zinc-900 truncate group-hover:text-blue-700">
                    {contact.fullName}
                  </h3>
                  {contact.title && (
                    <p className="text-sm text-zinc-600 truncate">{contact.title}</p>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="mt-4 space-y-2">
                {contact.email && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="truncate">{contact.email}</span>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span className="truncate">{contact.phone}</span>
                  </div>
                )}
                {contact.organizationName && (
                  <div className="flex items-center gap-2 text-sm text-zinc-600">
                    <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <span className="truncate">{contact.organizationName}</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <span className="text-xs text-gray-500">
                  Letzter Kontakt: {formatDate(contact.lastContactedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredContacts.length === 0 && (
          <div className="py-12 text-center bg-white rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">
              {searchQuery ? 'Keine Kontakte gefunden' : 'Noch keine Kontakte'}
            </p>
          </div>
        )}

      {/* Contact Detail Panel */}
      {selectedContact && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setSelectedContact(null)}
          />
          <ContactDetailPanel
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
            onUpdate={(updatedContact) => {
              setSelectedContact(updatedContact)
              loadContacts() // Reload list
            }}
          />
        </>
      )}
    </div>
  )
}

