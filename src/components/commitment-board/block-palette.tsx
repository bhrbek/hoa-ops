'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mountain, Circle, Layers } from 'lucide-react'

export function BlockPalette() {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="py-3">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase">
          Matter Palette
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Rock */}
        <div className="flex items-center gap-3 p-2 rounded-md bg-rock text-rock-foreground">
          <Mountain className="h-4 w-4" />
          <div className="flex-1">
            <div className="text-sm font-medium">Rock Block</div>
            <div className="text-xs opacity-70">4 hours default</div>
          </div>
        </div>

        {/* Pebble */}
        <div className="flex items-center gap-3 p-2 rounded-md bg-pebble text-pebble-foreground">
          <Circle className="h-4 w-4" />
          <div className="flex-1">
            <div className="text-sm font-medium">Pebble</div>
            <div className="text-xs opacity-70">2 hours default</div>
          </div>
        </div>

        {/* Sand */}
        <div className="flex items-center gap-3 p-2 rounded-md bg-sand text-sand-foreground">
          <Layers className="h-4 w-4" />
          <div className="flex-1">
            <div className="text-sm font-medium">Sand Pile</div>
            <div className="text-xs opacity-70">0.5 hours default</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
