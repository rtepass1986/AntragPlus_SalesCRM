/**
 * Sales Command Center Layout
 * AntragPlus Sales Dashboard with AI-powered TODOs
 */

'use client'

import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { 
  HomeIcon, 
  PhoneIcon, 
  ChartBarIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  BriefcaseIcon,
  FunnelIcon,
  UsersIcon,
  RocketLaunchIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  PresentationChartLineIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'HEUTE', href: '/sales', icon: HomeIcon, section: 'main' },
  { name: 'ANRUFANALYSE', href: '/sales/calls', icon: PhoneIcon, section: 'main' },
  
  // CRM Section
  { name: 'PIPELINE', href: '/dashboard/crm/pipeline', icon: FunnelIcon, section: 'crm' },
  { name: 'KONTAKTE', href: '/dashboard/crm/contacts', icon: UsersIcon, section: 'crm' },
  { name: 'LEADS', href: '/dashboard/leads', icon: BriefcaseIcon, section: 'crm' },
  { name: 'ANALYTICS', href: '/dashboard/analytics', icon: PresentationChartLineIcon, section: 'crm' },
  { name: 'SYNC', href: '/dashboard/sync', icon: ArrowPathIcon, section: 'crm' },
  
  // Training Section
  { name: 'TRAINING', href: '/dashboard/training', icon: AcademicCapIcon, section: 'training' },
  { name: 'LERNREISE', href: '/dashboard/training/journey', icon: RocketLaunchIcon, section: 'training' },
  { name: 'MATERIALIEN', href: '/dashboard/training/materials', icon: BookOpenIcon, section: 'training' },
  { name: 'SKRIPTE', href: '/dashboard/training/scripts', icon: DocumentTextIcon, section: 'training' },
  { name: 'TESTS', href: '/dashboard/training/tests', icon: ClipboardDocumentCheckIcon, section: 'training' },
  
  { name: 'TEAM', href: '/sales/team', icon: UserGroupIcon, section: 'main' },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [crmOpen, setCrmOpen] = useState(pathname.startsWith('/dashboard/crm') || pathname.startsWith('/dashboard/leads') || pathname.startsWith('/dashboard/analytics') || pathname.startsWith('/dashboard/sync'))
  const [trainingOpen, setTrainingOpen] = useState(pathname.startsWith('/dashboard/training'))
  
  // Mock data - replace with real user data
  const user = {
    name: 'Max Müller',
    score: 8.5,
    quota: 75,
  }

  const isCurrentPage = (href: string) => pathname === href

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16">
        <div className="flex items-center justify-between h-full px-6">
          {/* Logo - Clickable to return to main */}
          <Link href="/sales" className="flex items-center hover:opacity-80 transition-opacity">
            <Image 
              src="/antragplus-logo.png" 
              alt="AntragPlus" 
              width={180} 
              height={40}
              className="h-8 w-auto"
            />
            <span className="ml-4 text-sm font-medium text-gray-400 border-l border-gray-300 pl-4">
              Sales Cockpit
            </span>
          </Link>

          {/* Right Side - Search, Notifications, Profile */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Suchen..."
                className="w-64 px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <BellIcon className="h-6 w-6" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-cyan-500 rounded-full"></span>
            </button>

            {/* Profile */}
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-300">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">Score: {user.score}/10</p>
              </div>
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Left Sidebar (Cockpit) */}
      <div className="fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-slate-800 to-slate-900 pt-16">
        {/* User Info Card */}
        <div className="p-4 border-b border-slate-700">
          <div className="bg-slate-700/50 rounded-lg p-3">
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-cyan-400">
                  ⭐ {user.score}/10 Punkte
                </p>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-300 mb-1">
                <span>Monatsquote</span>
                <span className="font-semibold text-cyan-400">{user.quota}%</span>
              </div>
              <div className="w-full bg-slate-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${user.quota}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Main Section */}
          {navigation.filter(item => item.section === 'main').map((item) => {
            const isActive = isCurrentPage(item.href)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={classNames(
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border-l-4 border-cyan-400'
                    : 'text-gray-300 hover:bg-slate-700 hover:text-white border-l-4 border-transparent',
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-r-md transition-all'
                )}
              >
                <item.icon
                  className={classNames(
                    isActive ? 'text-cyan-400' : 'text-gray-400 group-hover:text-gray-300',
                    'mr-3 h-5 w-5 flex-shrink-0'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          })}
          
          {/* CRM Section - Collapsable */}
          <div className="pt-4">
            <button
              onClick={() => setCrmOpen(!crmOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-cyan-400 transition-colors"
            >
              <span>CRM</span>
              {crmOpen ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
            {crmOpen && (
              <div className="space-y-1 mt-1">
                {navigation.filter(item => item.section === 'crm').map((item) => {
                  const isActive = isCurrentPage(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        isActive
                          ? 'bg-cyan-500/10 text-cyan-400 border-l-4 border-cyan-400'
                          : 'text-gray-300 hover:bg-slate-700 hover:text-white border-l-4 border-transparent',
                        'group flex items-center px-3 py-2 text-sm font-medium rounded-r-md transition-all'
                      )}
                    >
                      <item.icon
                        className={classNames(
                          isActive ? 'text-cyan-400' : 'text-gray-400 group-hover:text-gray-300',
                          'mr-3 h-5 w-5 flex-shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Training Section - Collapsable */}
          <div className="pt-4">
            <button
              onClick={() => setTrainingOpen(!trainingOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-cyan-400 transition-colors"
            >
              <span>TRAINING</span>
              {trainingOpen ? (
                <ChevronDownIcon className="h-4 w-4" />
              ) : (
                <ChevronRightIcon className="h-4 w-4" />
              )}
            </button>
            {trainingOpen && (
              <div className="space-y-1 mt-1">
                {navigation.filter(item => item.section === 'training').map((item) => {
                  const isActive = isCurrentPage(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        isActive
                          ? 'bg-cyan-500/10 text-cyan-400 border-l-4 border-cyan-400'
                          : 'text-gray-300 hover:bg-slate-700 hover:text-white border-l-4 border-transparent',
                        'group flex items-center px-3 py-2 text-sm font-medium rounded-r-md transition-all'
                      )}
                    >
                      <item.icon
                        className={classNames(
                          isActive ? 'text-cyan-400' : 'text-gray-400 group-hover:text-gray-300',
                          'mr-3 h-5 w-5 flex-shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-slate-700 p-3">
          <button
            onClick={() => {/* logout */}}
            className="w-full group flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-slate-700 hover:text-white transition-colors"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-300" />
            Abmelden
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64 pt-16">
        {/* Breadcrumb */}
        {pathname !== '/sales' && (
          <div className="bg-white border-b border-gray-200">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
              <nav className="flex items-center space-x-2 text-sm">
                <Link 
                  href="/sales" 
                  className="text-cyan-600 hover:text-cyan-700 font-medium transition-colors"
                >
                  ← Zurück zur Hauptseite
                </Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">
                  {navigation.find(n => n.href === pathname)?.name || 'Seite'}
                </span>
              </nav>
            </div>
          </div>
        )}
        
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}


