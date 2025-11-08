'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Deal } from '@/lib/crm-types'
import clsx from 'clsx'

interface DealCardProps {
  deal: Deal
  onClick: () => void
  isDragging?: boolean
}

export function DealCard({ deal, onClick, isDragging = false }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortableDragging } = useSortable({
    id: deal.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: deal.currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('de-DE', {
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={clsx(
        'group cursor-pointer rounded-lg border bg-white p-4 shadow-sm transition-all hover:shadow-md',
        (isDragging || isSortableDragging) && 'opacity-50',
        'border-zinc-200 hover:border-brand-cyan-300'
      )}
    >
      {/* Deal Title */}
      <div className="mb-2">
        <h4 className="line-clamp-2 font-medium text-zinc-900 group-hover:text-brand-blue-600">
          {deal.title}
        </h4>
      </div>

      {/* Organization */}
      {deal.organizationName && (
        <div className="mb-2 flex items-center gap-1 text-sm text-zinc-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <span className="truncate">{deal.organizationName}</span>
        </div>
      )}

      {/* Contact */}
      {deal.contactName && (
        <div className="mb-3 flex items-center gap-1 text-sm text-zinc-600">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="truncate">{deal.contactName}</span>
        </div>
      )}

      {/* Deal Value */}
      <div className="mb-2 text-lg font-semibold text-zinc-900">
        {formatCurrency(deal.value)}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        {/* Expected Close Date */}
        {deal.expectedCloseDate && (
          <div className="flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{formatDate(deal.expectedCloseDate)}</span>
          </div>
        )}

        {/* Probability */}
        {deal.probability > 0 && (
          <div className="rounded bg-blue-100 px-1.5 py-0.5 font-medium text-blue-700">
            {deal.probability}%
          </div>
        )}
      </div>

      {/* Tags */}
      {deal.tags && deal.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {deal.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600"
            >
              {tag}
            </span>
          ))}
          {deal.tags.length > 2 && (
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              +{deal.tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

