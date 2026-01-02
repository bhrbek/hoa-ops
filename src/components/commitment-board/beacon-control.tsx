'use client'

import { useState } from 'react'
import type { Rock, Swarm } from '@/types/database'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Flame, Sparkles } from 'lucide-react'
import { WEEKDAY_FULL } from '@/lib/constants'
import { format, addDays, startOfWeek } from 'date-fns'

interface BeaconControlProps {
  rocks: Rock[]
  swarms: Swarm[]
  weekStart: Date
  onLightBeacon: (rockId: string, date: string) => void
  onExtinguishBeacon: (swarmId: string) => void
}

export function BeaconControl({
  rocks,
  swarms,
  weekStart,
  onLightBeacon,
  onExtinguishBeacon,
}: BeaconControlProps) {
  const [open, setOpen] = useState(false)
  const [selectedRock, setSelectedRock] = useState<string>('')
  const [selectedDay, setSelectedDay] = useState<string>('')

  const activeRocks = rocks.filter(r => r.status === 'Active')

  // Get dates for the week
  const weekDates = WEEKDAY_FULL.map((day, i) => ({
    label: day,
    value: format(addDays(weekStart, i), 'yyyy-MM-dd'),
  }))

  // Current active swarms for this week
  const activeSwarms = swarms.filter(s =>
    s.active && weekDates.some(d => d.value === s.swarm_date)
  )

  const handleLight = () => {
    if (selectedRock && selectedDay) {
      onLightBeacon(selectedRock, selectedDay)
      setOpen(false)
      setSelectedRock('')
      setSelectedDay('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-beacon hover:bg-beacon/90 text-black">
          <Flame className="mr-2 h-4 w-4" />
          Light the Beacon
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-beacon" />
            Light the Beacon
          </DialogTitle>
          <DialogDescription>
            Focus the team on a strategic rock. The selected day will glow amber on the Commitment Board.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Active Beacons */}
          {activeSwarms.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Active Beacons</Label>
              <div className="space-y-2">
                {activeSwarms.map((swarm) => {
                  const rock = rocks.find(r => r.id === swarm.rock_id)
                  return (
                    <div
                      key={swarm.id}
                      className="flex items-center justify-between p-2 rounded-md bg-beacon/10 border border-beacon/30"
                    >
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-beacon animate-pulse" />
                        <span className="text-sm font-medium">{rock?.title}</span>
                        <span className="text-xs text-muted-foreground">
                          ({format(new Date(swarm.swarm_date), 'EEE, MMM d')})
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onExtinguishBeacon(swarm.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        Extinguish
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Select Rock */}
          <div className="space-y-2">
            <Label>Select Rock</Label>
            <Select value={selectedRock} onValueChange={setSelectedRock}>
              <SelectTrigger className="bg-muted">
                <SelectValue placeholder="Choose a rock to focus on..." />
              </SelectTrigger>
              <SelectContent>
                {activeRocks.map((rock) => (
                  <SelectItem key={rock.id} value={rock.id}>
                    {rock.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeRocks.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No active rocks. Create rocks in The Quarry first.
              </p>
            )}
          </div>

          {/* Select Day */}
          <div className="space-y-2">
            <Label>Select Day</Label>
            <Select value={selectedDay} onValueChange={setSelectedDay}>
              <SelectTrigger className="bg-muted">
                <SelectValue placeholder="Choose a day..." />
              </SelectTrigger>
              <SelectContent>
                {weekDates.map((day) => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label} ({format(new Date(day.value), 'MMM d')})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleLight}
            disabled={!selectedRock || !selectedDay}
            className="bg-beacon hover:bg-beacon/90 text-black"
          >
            <Flame className="mr-2 h-4 w-4" />
            Light Beacon
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
