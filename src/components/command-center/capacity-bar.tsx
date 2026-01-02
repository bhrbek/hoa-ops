'use client'

import { useJar } from '@/contexts/jar-context'
import { useCapacity, getCapacityBarSegments } from '@/hooks/use-capacity'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function CapacityBar() {
  const { user, commitments, jarFillLevel } = useJar()
  const capacity = useCapacity(commitments, user)
  const segments = getCapacityBarSegments(capacity)

  const getStatusText = () => {
    if (jarFillLevel >= 100) return 'Overloaded'
    if (jarFillLevel >= 80) return 'Near Capacity'
    return 'Available'
  }

  const getStatusColor = () => {
    if (jarFillLevel >= 100) return 'text-overload'
    if (jarFillLevel >= 80) return 'text-warning'
    return 'text-success'
  }

  return (
    <Card className="bg-card border-border h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            MY JAR CAPACITY
          </CardTitle>
          <span className={cn('text-2xl font-mono font-bold', getStatusColor())}>
            {jarFillLevel}% Full
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Capacity Bar */}
        <div className="h-8 w-full rounded-md overflow-hidden flex bg-muted">
          {/* Water (striped) */}
          <div
            className="water-stripes opacity-60"
            style={{ width: `${segments.water}%` }}
          />
          {/* Rock */}
          <div
            className="bg-rock"
            style={{ width: `${segments.rock}%` }}
          />
          {/* Pebble */}
          <div
            className="bg-pebble"
            style={{ width: `${segments.pebble}%` }}
          />
          {/* Sand */}
          <div
            className="bg-sand"
            style={{ width: `${segments.sand}%` }}
          />
          {/* Empty */}
          <div
            className="bg-muted"
            style={{ width: `${segments.empty}%` }}
          />
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-rock" />
            <span className="text-muted-foreground">Rocks</span>
            <span className="ml-auto font-mono">{capacity.rockHours}h</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-pebble" />
            <span className="text-muted-foreground">Pebbles</span>
            <span className="ml-auto font-mono">{capacity.pebbleHours}h</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm bg-sand" />
            <span className="text-muted-foreground">Sand</span>
            <span className="ml-auto font-mono">{capacity.sandHours}h</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-sm water-stripes opacity-60" />
            <span className="text-muted-foreground">Water</span>
            <span className="ml-auto font-mono">{capacity.waterHours}h</span>
          </div>
        </div>

        {/* Status */}
        <div className={cn(
          'text-xs font-medium text-center py-1 rounded',
          jarFillLevel >= 100 ? 'bg-overload/20 text-overload' :
          jarFillLevel >= 80 ? 'bg-warning/20 text-warning' :
          'bg-success/20 text-success'
        )}>
          {getStatusText()} - {capacity.weeklyRemaining}h remaining
        </div>
      </CardContent>
    </Card>
  )
}
