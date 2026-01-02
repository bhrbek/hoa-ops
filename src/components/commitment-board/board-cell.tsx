'use client'

import { useDroppable } from '@dnd-kit/core'
import type { Commitment, BlockType } from '@/types/database'
import { BlockItem } from './block-item'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Mountain, Circle, Layers } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BoardCellProps {
  id: string
  userId: string
  date: string
  commitments: Commitment[]
  isOverloaded: boolean
  hasBeacon: boolean
  onDelete: (id: string) => void
  onAdd: (type: BlockType) => void
}

export function BoardCell({
  id,
  userId,
  date,
  commitments,
  isOverloaded,
  hasBeacon,
  onDelete,
  onAdd,
}: BoardCellProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[120px] p-2 rounded-md border-2 border-dashed transition-all',
        isOverloaded && 'bg-overload/10 border-overload',
        hasBeacon && !isOverloaded && 'beacon-column border-beacon/30',
        isOver && 'border-primary bg-primary/5',
        !isOverloaded && !hasBeacon && !isOver && 'border-border bg-muted/20'
      )}
    >
      <div className="space-y-1.5">
        {commitments.map((commitment) => (
          <BlockItem
            key={commitment.id}
            commitment={commitment}
            onDelete={() => onDelete(commitment.id)}
          />
        ))}

        {/* Drop hint when dragging over */}
        {isOver && (
          <div className="h-8 rounded border-2 border-dashed border-primary bg-primary/10 flex items-center justify-center text-xs text-primary">
            Drop here
          </div>
        )}

        {/* Add button */}
        {commitments.length === 0 && !isOver && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-8 text-xs text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/30"
              >
                <Plus className="mr-1 h-3 w-3" />
                Add Block
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={() => onAdd('Rock')}>
                <Mountain className="mr-2 h-4 w-4 text-rock-foreground" />
                <span>Rock (4h)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAdd('Pebble')}>
                <Circle className="mr-2 h-4 w-4 text-pebble" />
                <span>Pebble (2h)</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAdd('Sand')}>
                <Layers className="mr-2 h-4 w-4 text-sand-foreground" />
                <span>Sand (0.5h)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}
