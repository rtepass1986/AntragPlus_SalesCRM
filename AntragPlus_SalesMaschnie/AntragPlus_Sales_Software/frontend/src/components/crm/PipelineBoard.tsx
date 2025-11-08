'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import type { Deal, PipelineStage } from '@/lib/crm-types'
import { PipelineColumn } from './PipelineColumn'
import { DealCard } from './DealCard'

interface PipedriveStage {
  id: number
  pipedriveStageId: number
  stageName: string
  stageOrder: number
  pipelineId: number
}

interface DealsByStageData {
  stage: PipedriveStage
  deals: any[]
  totalValue: number
  count: number
}

interface PipelineBoardProps {
  dealsByStage?: DealsByStageData[]
  deals?: Deal[]
  onDealMove: (dealId: string, newStage: PipelineStage | number) => Promise<void>
  onDealClick: (deal: Deal) => void
  onAddDeal: (stage: PipelineStage | string) => void
}

// Color mapping for different stages
const STAGE_COLORS: Record<string, string> = {
  'follow': 'bg-blue-100',
  'kontakt': 'bg-cyan-100',
  'link': 'bg-purple-100',
  'erstberatung': 'bg-orange-100',
  'vertrags': 'bg-yellow-100',
  'projektideen': 'bg-pink-100',
  'nutzungsvertrag': 'bg-indigo-100',
  'beauftragung': 'bg-green-100',
  'projekt': 'bg-teal-100',
  'förderantrag': 'bg-emerald-100',
  'gewonnen': 'bg-green-200',
  'won': 'bg-green-200',
  'lost': 'bg-red-100',
}

function getStageColor(stageName: string): string {
  const lowerName = stageName.toLowerCase()
  for (const [key, color] of Object.entries(STAGE_COLORS)) {
    if (lowerName.includes(key)) {
      return color
    }
  }
  return 'bg-gray-100'
}

export function PipelineBoard({ dealsByStage, deals, onDealMove, onDealClick, onAddDeal }: PipelineBoardProps) {
  const [activeDeal, setActiveDeal] = useState<any | null>(null)
  const [stageStats, setStageStats] = useState<any[]>([])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Use dealsByStage if provided (real Pipedrive data), otherwise fallback to deals grouping
  useEffect(() => {
    if (dealsByStage && dealsByStage.length > 0) {
      // Using real Pipedrive stages
      const stats = dealsByStage.map((stageData) => ({
        stage: stageData.stage.pipedriveStageId,
        stageId: stageData.stage.pipedriveStageId,
        name: stageData.stage.stageName,
        color: getStageColor(stageData.stage.stageName),
        count: stageData.count,
        totalValue: stageData.totalValue,
        deals: stageData.deals,
      }))
      setStageStats(stats)
    } else if (deals) {
      // Fallback: if we only have deals array, try to group them
      // This shouldn't happen in production but good for backward compatibility
      setStageStats([])
    }
  }, [dealsByStage, deals])

  const handleDragStart = (event: DragStartEvent) => {
    // Find the deal across all stages
    let foundDeal = null
    for (const stageStat of stageStats) {
      foundDeal = stageStat.deals.find((d: any) => String(d.id) === String(event.active.id))
      if (foundDeal) break
    }
    setActiveDeal(foundDeal || null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDeal(null)

    if (!over) return

    const dealId = String(active.id)
    const newStageId = Number(over.id)

    // Find the current deal
    let currentDeal = null
    for (const stageStat of stageStats) {
      currentDeal = stageStat.deals.find((d: any) => String(d.id) === dealId)
      if (currentDeal) break
    }

    if (!currentDeal || currentDeal.stageId === newStageId) return

    // Optimistic update
    setStageStats((prevStats) => {
      return prevStats.map((stat) => {
        if (stat.stageId === currentDeal.stageId) {
          // Remove from old stage
          return {
            ...stat,
            deals: stat.deals.filter((d: any) => String(d.id) !== dealId),
            count: stat.count - 1,
            totalValue: stat.totalValue - (currentDeal.value || 0),
          }
        } else if (stat.stageId === newStageId) {
          // Add to new stage
          const updatedDeal = { ...currentDeal, stageId: newStageId }
          return {
            ...stat,
            deals: [...stat.deals, updatedDeal],
            count: stat.count + 1,
            totalValue: stat.totalValue + (currentDeal.value || 0),
          }
        }
        return stat
      })
    })

    try {
      await onDealMove(dealId, newStageId)
    } catch (error) {
      console.error('Failed to move deal:', error)
      // Could reload from server here if needed
    }
  }

  if (stageStats.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-zinc-500">Loading pipeline...</p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {stageStats.map((column) => (
          <PipelineColumn
            key={column.stageId || column.stage}
            stage={column.stageId || column.stage}
            name={column.name}
            count={column.count}
            totalValue={column.totalValue}
            deals={column.deals}
            color={column.color}
            onDealClick={onDealClick}
            onAddDeal={() => onAddDeal(column.name)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="rotate-3 transform opacity-90">
            <DealCard deal={activeDeal} onClick={() => {}} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

