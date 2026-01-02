'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Rock, RockStatus, Swarm } from '@/types/database'
import { format } from 'date-fns'

export function useRocks() {
  const [rocks, setRocks] = useState<Rock[]>([])
  const [swarms, setSwarms] = useState<Swarm[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const fetchRocks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('rocks')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRocks(data)
    }
    setLoading(false)
  }, [supabase])

  const fetchSwarms = useCallback(async () => {
    const { data, error } = await supabase
      .from('swarms')
      .select('*')
      .eq('active', true)
      .order('swarm_date', { ascending: true })

    if (!error && data) {
      setSwarms(data)
    }
  }, [supabase])

  const addRock = async (rock: Omit<Rock, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('rocks')
      .insert(rock as never)
      .select()
      .single()

    if (!error && data) {
      setRocks(prev => [data, ...prev])
      return data
    }
    return null
  }

  const updateRock = async (id: string, updates: Partial<Rock>) => {
    const { data, error } = await supabase
      .from('rocks')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setRocks(prev => prev.map(r => r.id === id ? data : r))
      return data
    }
    return null
  }

  const deleteRock = async (id: string) => {
    const { error } = await supabase
      .from('rocks')
      .delete()
      .eq('id', id)

    if (!error) {
      setRocks(prev => prev.filter(r => r.id !== id))
      return true
    }
    return false
  }

  const updateStatus = async (id: string, status: RockStatus) => {
    return updateRock(id, { status })
  }

  const updateProgress = async (id: string, progress: number) => {
    return updateRock(id, { progress: Math.min(100, Math.max(0, progress)) })
  }

  // Light the beacon - create a swarm for a rock on a specific date
  const lightBeacon = async (rockId: string, date: string, description?: string) => {
    // First, deactivate any existing swarms for that date
    await supabase
      .from('swarms')
      .update({ active: false } as never)
      .eq('swarm_date', date)

    // Create new swarm
    const { data, error } = await supabase
      .from('swarms')
      .insert({
        rock_id: rockId,
        swarm_date: date,
        active: true,
        description: description || null,
      } as never)
      .select()
      .single()

    if (!error && data) {
      setSwarms(prev => [...prev.filter(s => s.swarm_date !== date), data])
      return data
    }
    return null
  }

  // Extinguish beacon - deactivate swarm
  const extinguishBeacon = async (swarmId: string) => {
    const { error } = await supabase
      .from('swarms')
      .update({ active: false } as never)
      .eq('id', swarmId)

    if (!error) {
      setSwarms(prev => prev.filter(s => s.id !== swarmId))
      return true
    }
    return false
  }

  // Get active rocks only
  const getActiveRocks = () => {
    return rocks.filter(r => r.status === 'Active')
  }

  // Get swarm for a specific date
  const getSwarmForDate = (date: string) => {
    return swarms.find(s => s.swarm_date === date)
  }

  // Check if there's an active beacon today
  const hasTodayBeacon = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return swarms.some(s => s.swarm_date === today && s.active)
  }

  // Get today's active swarm with rock details
  const getTodaySwarm = () => {
    const today = format(new Date(), 'yyyy-MM-dd')
    const swarm = swarms.find(s => s.swarm_date === today && s.active)
    if (!swarm) return null

    const rock = rocks.find(r => r.id === swarm.rock_id)
    return { ...swarm, rock }
  }

  return {
    rocks,
    swarms,
    loading,
    fetchRocks,
    fetchSwarms,
    addRock,
    updateRock,
    deleteRock,
    updateStatus,
    updateProgress,
    lightBeacon,
    extinguishBeacon,
    getActiveRocks,
    getSwarmForDate,
    hasTodayBeacon,
    getTodaySwarm,
  }
}
