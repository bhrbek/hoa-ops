'use client'

import { useMemo } from 'react'
import type { Commitment, UserProfile } from '@/types/database'
import {
  calculateRealCapacity,
  isOverloaded,
  isDayOverloaded,
  WEEKLY_CAPACITY_DEFAULT,
  WHIRLWIND_FACTOR
} from '@/types/database'
import { format, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns'

interface CapacityData {
  // Weekly metrics
  realCapacity: number
  weeklyLoad: number
  weeklyRemaining: number
  isShielded: boolean
  jarFillLevel: number
  waterHours: number

  // By type
  rockHours: number
  pebbleHours: number
  sandHours: number

  // Daily breakdown
  dailyLoads: Record<string, number>
  overloadedDays: string[]
}

export function useCapacity(
  commitments: Commitment[],
  user: UserProfile | null,
  weekStart: Date = startOfWeek(new Date(), { weekStartsOn: 1 })
): CapacityData {
  return useMemo(() => {
    const capacityHours = user?.capacity_hours || WEEKLY_CAPACITY_DEFAULT
    const realCapacity = calculateRealCapacity(capacityHours)
    const waterHours = capacityHours * WHIRLWIND_FACTOR

    // Calculate totals by type
    const rockHours = commitments
      .filter(c => c.type === 'Rock')
      .reduce((sum, c) => sum + c.hours_value, 0)

    const pebbleHours = commitments
      .filter(c => c.type === 'Pebble')
      .reduce((sum, c) => sum + c.hours_value, 0)

    const sandHours = commitments
      .filter(c => c.type === 'Sand')
      .reduce((sum, c) => sum + c.hours_value, 0)

    const weeklyLoad = rockHours + pebbleHours + sandHours
    const weeklyRemaining = Math.max(0, realCapacity - weeklyLoad)
    const isShielded = isOverloaded(weeklyLoad, capacityHours)
    const jarFillLevel = Math.min(100, Math.round((weeklyLoad / realCapacity) * 100))

    // Calculate daily loads
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
      .slice(0, 5) // Mon-Fri only

    const dailyLoads: Record<string, number> = {}
    const overloadedDays: string[] = []

    weekDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd')
      const dayLoad = commitments
        .filter(c => c.date === dateStr)
        .reduce((sum, c) => sum + c.hours_value, 0)

      dailyLoads[dateStr] = dayLoad

      if (isDayOverloaded(dayLoad)) {
        overloadedDays.push(dateStr)
      }
    })

    return {
      realCapacity,
      weeklyLoad,
      weeklyRemaining,
      isShielded,
      jarFillLevel,
      waterHours,
      rockHours,
      pebbleHours,
      sandHours,
      dailyLoads,
      overloadedDays,
    }
  }, [commitments, user, weekStart])
}

// Utility function to get capacity bar segments
export function getCapacityBarSegments(data: CapacityData, totalWidth: number = 100) {
  const { realCapacity, waterHours, rockHours, pebbleHours, sandHours } = data
  const totalCapacity = realCapacity + waterHours

  // Calculate percentages
  const waterPercent = (waterHours / totalCapacity) * totalWidth
  const rockPercent = (rockHours / totalCapacity) * totalWidth
  const pebblePercent = (pebbleHours / totalCapacity) * totalWidth
  const sandPercent = (sandHours / totalCapacity) * totalWidth
  const emptyPercent = Math.max(0, totalWidth - waterPercent - rockPercent - pebblePercent - sandPercent)

  return {
    water: waterPercent,
    rock: rockPercent,
    pebble: pebblePercent,
    sand: sandPercent,
    empty: emptyPercent,
  }
}
