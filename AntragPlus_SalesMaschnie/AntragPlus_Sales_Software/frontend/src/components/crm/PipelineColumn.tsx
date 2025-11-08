'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Deal, PipelineStage } from '@/lib/crm-types'
import { DealCard } from './DealCard'
import clsx from 'clsx'

interface PipelineColumnProps {
  stage: PipelineStage
  name: string
  count: number
  totalValue: number
  deals: Deal[]
  color: string
  onDealClick: (deal: Deal) => void
  onAddDeal: () => void
}

export function PipelineColumn({
  stage,
  name,
  count,
  totalValue,
  deals,
  color,
  onDealClick,
  onAddDeal,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="flex w-80 flex-shrink-0 flex-col">
      {/* Column Header */}
      <div className={clsx('rounded-t-lg p-4', color)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-zinc-900">{name}</h3>
          <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-zinc-700">
            {count}
          </span>
        </div>
        <div className="mt-1 text-sm font-medium text-zinc-700">
          {formatCurrency(totalValue)}
        </div>
      </div>

      {/* Droppable Area */}
      <div
        ref={setNodeRef}
        className={clsx(
          'flex-1 space-y-3 overflow-y-auto rounded-b-lg border-2 border-t-0 bg-zinc-50 p-3',
          isOver ? 'border-brand-cyan-400 bg-cyan-50' : 'border-zinc-200'
        )}
        style={{ minHeight: '500px' }}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          {deals.map((deal) => (
            <DealCard key={deal.id} deal={deal} onClick={() => onDealClick(deal)} />
          ))}
        </SortableContext>

        {/* Add Deal Button */}
        <button
          onClick={onAddDeal}
          className="w-full rounded-lg border-2 border-dashed border-zinc-300 bg-white py-3 text-sm font-medium text-zinc-600 transition-colors hover:border-brand-cyan-400 hover:bg-cyan-50 hover:text-brand-cyan-700"
        >
          + Add Deal
        </button>
      </div>
    </div>
  )
}

