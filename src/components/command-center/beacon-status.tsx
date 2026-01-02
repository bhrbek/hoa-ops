'use client'

import { useJar } from '@/contexts/jar-context'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Flame, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export function BeaconStatus() {
  const { activeSwarm } = useJar()

  if (!activeSwarm) {
    return (
      <Card className="bg-card border-border h-full">
        <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
            <Flame className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-mono text-lg font-semibold mb-2">No Active Beacon</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Light a beacon to focus the team on a strategic rock.
          </p>
          <Button variant="outline" size="sm">
            View Quarry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const dayName = format(new Date(activeSwarm.swarm_date), 'EEEE')
  const timeOfDay = new Date().getHours() < 12 ? 'AM' : 'PM'

  return (
    <Card className="bg-card border-border h-full relative overflow-hidden">
      {/* Beacon glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-beacon/20 via-transparent to-transparent animate-beacon" />

      <CardContent className="p-6 h-full flex flex-col relative z-10">
        <div className="flex items-center gap-2 mb-4">
          <span className="flex h-2 w-2 rounded-full bg-beacon animate-pulse" />
          <span className="text-xs font-medium uppercase tracking-wider text-beacon">
            Beacon Active
          </span>
        </div>

        <h2 className="font-mono text-2xl font-bold mb-2">
          {dayName} {timeOfDay} is{' '}
          <span className="text-beacon">{activeSwarm.rock?.title || 'Focus'}</span>{' '}
          Time.
        </h2>

        <p className="text-sm text-muted-foreground mb-6">
          Status: Active. Join the swarm to maximize velocity or initiate shields for deep work.
        </p>

        <div className="flex gap-3 mt-auto">
          <Button className="bg-beacon hover:bg-beacon/90 text-beacon-foreground">
            <Play className="mr-2 h-4 w-4" />
            Join Swarm
          </Button>
          <Button variant="outline">
            <Pause className="mr-2 h-4 w-4" />
            Start Deep Work
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
