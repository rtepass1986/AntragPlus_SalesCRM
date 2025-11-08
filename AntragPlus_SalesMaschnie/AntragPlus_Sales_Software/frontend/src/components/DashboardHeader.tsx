'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Container } from '@/components/Container'
import { Logo } from '@/components/Logo'
import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react'
import clsx from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  {
    name: 'Pipeline',
    submenu: [
      { name: 'Sales Pipeline', href: '/dashboard/crm/pipeline' },
      { name: 'Contacts', href: '/dashboard/crm/contacts' },
      { name: 'Leads', href: '/dashboard/leads' },
    ],
  },
  {
    name: 'Sales Training',
    submenu: [
      { name: 'Training Dashboard', href: '/dashboard/training' },
      { name: 'Customer Journey', href: '/dashboard/training/journey' },
      { name: 'Scripts & Templates', href: '/dashboard/training/scripts' },
      { name: 'Kurse & Schulungen', href: '/dashboard/training/materials' },
      { name: 'Tests', href: '/dashboard/training/tests' },
    ],
  },
  {
    name: 'Settings',
    submenu: [
      { name: 'Configuration', href: '/dashboard/settings' },
      { name: 'Sync', href: '/dashboard/sync' },
      { name: 'Analytics', href: '/dashboard/analytics' },
    ],
  },
]

export function DashboardHeader() {
  const pathname = usePathname()

  return (
    <header className="border-b border-zinc-200 bg-white">
      <Container>
        <nav className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <Logo className="h-8 w-auto" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:gap-x-1">
            {navigation.map((item) => {
              // Check if this is a submenu item
              if ('submenu' in item && item.submenu) {
                const isActive = item.submenu.some((subItem) => pathname === subItem.href)
                
                return (
                  <Menu key={item.name} as="div" className="relative">
                    <MenuButton
                      className={clsx(
                        'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-zinc-100 text-zinc-900'
                          : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                      )}
                    >
                      {item.name}
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </MenuButton>
                    <MenuItems className="absolute left-0 mt-2 w-56 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                      <div className="py-1">
                        {item.submenu.map((subItem) => (
                          <MenuItem key={subItem.href}>
                            {({ focus }) => (
                              <Link
                                href={subItem.href}
                                className={clsx(
                                  'block px-4 py-2 text-sm',
                                  focus || pathname === subItem.href
                                    ? 'bg-zinc-100 text-zinc-900'
                                    : 'text-zinc-700'
                                )}
                              >
                                {subItem.name}
                              </Link>
                            )}
                          </MenuItem>
                        ))}
                      </div>
                    </MenuItems>
                  </Menu>
                )
              }

              // Regular navigation item
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href
                    ? 'bg-gradient-to-r from-brand-cyan-50 to-brand-blue-50 text-brand-navy-900 border-b-2 border-brand-cyan-500'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-brand-navy-900'
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <button className="rounded-md px-3 py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Help
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue-500 to-brand-cyan-500 text-sm font-medium text-white shadow-sm">
              U
            </button>
          </div>
        </nav>
      </Container>
    </header>
  )
}

