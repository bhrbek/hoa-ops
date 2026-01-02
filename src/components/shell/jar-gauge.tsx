'use client'

import { useJar } from '@/contexts/jar-context'
import { cn } from '@/lib/utils'

export function JarGauge() {
  const { jarFillLevel, isShielded } = useJar()

  const getStatusColor = () => {
    if (jarFillLevel >= 100) return 'text-overload'
    if (jarFillLevel >= 80) return 'text-warning'
    return 'text-muted-foreground'
  }

  const getBarColor = () => {
    if (jarFillLevel >= 100) return 'bg-overload'
    if (jarFillLevel >= 80) return 'bg-warning'
    return 'bg-water'
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium uppercase tracking-wider text-muted-foreground">
          Jar Fill Level
        </span>
        <span className={cn('font-mono font-bold', getStatusColor())}>
          {jarFillLevel}%
        </span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', getBarColor())}
          style={{ width: `${Math.min(100, jarFillLevel)}%` }}
        />
      </div>
      {isShielded && (
        <p className="text-xs text-warning font-medium">
          Capacity approaching limit
        </p>
      )}
    </div>
  )
}
