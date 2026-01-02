'use client'

import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { format, addDays, startOfWeek } from 'date-fns'
import type { Commitment, UserProfile, Swarm, BlockType } from '@/types/database'
import { WEEKDAYS } from '@/lib/constants'
import { BoardCell } from './board-cell'
import { BlockItem } from './block-item'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isDayOverloaded, isOverloaded } from '@/types/database'

interface BoardGridProps {
  users: (UserProfile & { commitments: Commitment[] })[]
  weekStart: Date
  swarms: Swarm[]
  onMoveCommitment: (id: string, newDate: string) => void
  onDeleteCommitment: (id: string) => void
  onAddCommitment: (userId: string, date: string, type: BlockType) => void
}

export function BoardGrid({
  users,
  weekStart,
  swarms,
  onMoveCommitment,
  onDeleteCommitment,
  onAddCommitment,
}: BoardGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeCommitment, setActiveCommitment] = useState<Commitment | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  )

  // Generate dates for the week (Mon-Fri)
  const weekDates = WEEKDAYS.map((_, i) => {
    const date = addDays(weekStart, i)
    return {
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      dayNum: format(date, 'd'),
      dayName: WEEKDAYS[i],
    }
  })

  // Check if a date has an active beacon
  const getSwarmForDate = (dateStr: string) => {
    return swarms.find(s => s.swarm_date === dateStr && s.active)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)

    // Find the commitment being dragged
    for (const user of users) {
      const commitment = user.commitments.find(c => c.id === active.id)
      if (commitment) {
        setActiveCommitment(commitment)
        break
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    setActiveCommitment(null)

    if (over && active.id !== over.id) {
      // The over.id format is "cell-{userId}-{date}"
      const overData = (over.id as string).split('-')
      if (overData[0] === 'cell') {
        const newDate = overData.slice(2).join('-') // Handle date with dashes
        onMoveCommitment(active.id as string, newDate)
      }
    }
  }

  // Calculate if user is overloaded
  const getUserLoad = (user: UserProfile & { commitments: Commitment[] }) => {
    const weeklyLoad = user.commitments.reduce((sum, c) => sum + c.hours_value, 0)
    return {
      weeklyLoad,
      isOverloaded: isOverloaded(weeklyLoad, user.capacity_hours),
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header Row */}
          <div className="grid grid-cols-[200px_repeat(5,1fr)] gap-1 mb-1">
            <div className="p-3 text-xs font-medium text-muted-foreground uppercase">
              Team Member
            </div>
            {weekDates.map(({ dateStr, dayNum, dayName }) => {
              const swarm = getSwarmForDate(dateStr)
              return (
                <div
                  key={dateStr}
                  className={cn(
                    'p-3 rounded-t-md text-center border-b-2',
                    swarm ? 'border-beacon bg-beacon/10' : 'border-transparent bg-muted/30'
                  )}
                >
                  <div className="flex items-center justify-center gap-2">
                    {swarm && (
                      <span className="h-2 w-2 rounded-full bg-beacon animate-pulse" />
                    )}
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      {dayName}
                    </span>
                  </div>
                  <span className={cn(
                    'text-2xl font-mono font-bold',
                    swarm ? 'text-beacon' : 'text-foreground'
                  )}>
                    {dayNum}
                  </span>
                </div>
              )
            })}
          </div>

          {/* User Rows */}
          {users.map((user) => {
            const { weeklyLoad, isOverloaded: userOverloaded } = getUserLoad(user)

            return (
              <div
                key={user.id}
                className="grid grid-cols-[200px_repeat(5,1fr)] gap-1 mb-1"
              >
                {/* User Info */}
                <div className="p-3 bg-muted/30 rounded-l-md flex items-center gap-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                      </AvatarFallback>
                    </Avatar>
                    {userOverloaded && (
                      <div className="absolute -right-1 -top-1">
                        <Shield className="h-4 w-4 text-shield animate-shield" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">
                      {user.full_name}
                    </div>
                    <div className={cn(
                      'text-xs',
                      userOverloaded ? 'text-overload font-medium' : 'text-muted-foreground'
                    )}>
                      {userOverloaded ? 'OVERLOAD' : `${weeklyLoad}h / ${user.capacity_hours * 0.8}h`}
                    </div>
                  </div>
                </div>

                {/* Day Cells */}
                {weekDates.map(({ dateStr }) => {
                  const cellCommitments = user.commitments.filter(c => c.date === dateStr)
                  const cellHours = cellCommitments.reduce((sum, c) => sum + c.hours_value, 0)
                  const swarm = getSwarmForDate(dateStr)

                  return (
                    <BoardCell
                      key={`${user.id}-${dateStr}`}
                      id={`cell-${user.id}-${dateStr}`}
                      userId={user.id}
                      date={dateStr}
                      commitments={cellCommitments}
                      isOverloaded={isDayOverloaded(cellHours)}
                      hasBeacon={!!swarm}
                      onDelete={onDeleteCommitment}
                      onAdd={(type) => onAddCommitment(user.id, dateStr, type)}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeCommitment && (
          <BlockItem
            commitment={activeCommitment}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}
