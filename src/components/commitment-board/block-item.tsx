'use client'

import { useDraggable } from '@dnd-kit/core'
import type { Commitment } from '@/types/database'
import { Button } from '@/components/ui/button'
import { X, GripVertical, Mountain, Circle, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BlockItemProps {
  commitment: Commitment
  isDragging?: boolean
  onDelete?: () => void
}

export function BlockItem({ commitment, isDragging, onDelete }: BlockItemProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: commitment.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined

  const getBlockStyles = () => {
    switch (commitment.type) {
      case 'Rock':
        return 'bg-rock text-rock-foreground'
      case 'Pebble':
        return 'bg-pebble text-pebble-foreground'
      case 'Sand':
        return 'bg-sand text-sand-foreground'
    }
  }

  const getIcon = () => {
    switch (commitment.type) {
      case 'Rock':
        return <Mountain className="h-3 w-3" />
      case 'Pebble':
        return <Circle className="h-3 w-3" />
      case 'Sand':
        return <Layers className="h-3 w-3" />
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-md px-2 py-1.5 text-xs font-medium flex items-center gap-1.5 cursor-grab active:cursor-grabbing',
        getBlockStyles(),
        isDragging && 'opacity-80 shadow-lg ring-2 ring-primary',
        commitment.completed && 'opacity-60 line-through'
      )}
    >
      {/* Drag Handle */}
      <button
        className="touch-none opacity-50 hover:opacity-100"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="h-3 w-3" />
      </button>

      {/* Icon */}
      {getIcon()}

      {/* Content */}
      <span className="flex-1 truncate">{commitment.description}</span>

      {/* Hours */}
      <span className="opacity-70 text-[10px]">{commitment.hours_value}h</span>

      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}
