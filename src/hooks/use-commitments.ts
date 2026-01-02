'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Commitment, BlockType } from '@/types/database'
import { BLOCK_HOURS } from '@/types/database'
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns'

export function useCommitments(userId: string | undefined) {
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [loading, setLoading] = useState(false)
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const supabase = createClient()

  const fetchCommitments = useCallback(async (weekStart: Date = currentWeekStart) => {
    if (!userId) return

    setLoading(true)
    const weekStartStr = format(weekStart, 'yyyy-MM-dd')
    const weekEndStr = format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd')

    const { data, error } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', userId)
      .gte('date', weekStartStr)
      .lte('date', weekEndStr)
      .order('created_at', { ascending: true })

    if (!error && data) {
      setCommitments(data)
    }
    setLoading(false)
  }, [userId, currentWeekStart, supabase])

  const addCommitment = async (
    date: string,
    type: BlockType,
    description: string,
    rockId?: string,
    engagementId?: string
  ) => {
    if (!userId) return null

    const hours = BLOCK_HOURS[type]

    const { data, error } = await supabase
      .from('commitments')
      .insert({
        user_id: userId,
        date,
        type,
        description,
        hours_value: hours,
        rock_id: rockId || null,
        engagement_id: engagementId || null,
        completed: false,
      } as never)
      .select()
      .single()

    if (!error && data) {
      setCommitments(prev => [...prev, data])
      return data
    }
    return null
  }

  const updateCommitment = async (id: string, updates: Partial<Commitment>) => {
    const { data, error } = await supabase
      .from('commitments')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setCommitments(prev => prev.map(c => c.id === id ? data : c))
      return data
    }
    return null
  }

  const deleteCommitment = async (id: string) => {
    const { error } = await supabase
      .from('commitments')
      .delete()
      .eq('id', id)

    if (!error) {
      setCommitments(prev => prev.filter(c => c.id !== id))
      return true
    }
    return false
  }

  const moveCommitment = async (id: string, newDate: string) => {
    return updateCommitment(id, { date: newDate })
  }

  const toggleComplete = async (id: string) => {
    const commitment = commitments.find(c => c.id === id)
    if (!commitment) return null
    return updateCommitment(id, { completed: !commitment.completed })
  }

  const nextWeek = () => {
    const newWeek = addWeeks(currentWeekStart, 1)
    setCurrentWeekStart(newWeek)
    fetchCommitments(newWeek)
  }

  const prevWeek = () => {
    const newWeek = subWeeks(currentWeekStart, 1)
    setCurrentWeekStart(newWeek)
    fetchCommitments(newWeek)
  }

  const goToCurrentWeek = () => {
    const thisWeek = startOfWeek(new Date(), { weekStartsOn: 1 })
    setCurrentWeekStart(thisWeek)
    fetchCommitments(thisWeek)
  }

  // Get commitments for a specific date
  const getCommitmentsForDate = (date: string) => {
    return commitments.filter(c => c.date === date)
  }

  // Calculate hours for a specific date
  const getHoursForDate = (date: string) => {
    return getCommitmentsForDate(date).reduce((sum, c) => sum + c.hours_value, 0)
  }

  // Calculate weekly totals by type
  const getWeeklyTotals = () => {
    return {
      rock: commitments.filter(c => c.type === 'Rock').reduce((sum, c) => sum + c.hours_value, 0),
      pebble: commitments.filter(c => c.type === 'Pebble').reduce((sum, c) => sum + c.hours_value, 0),
      sand: commitments.filter(c => c.type === 'Sand').reduce((sum, c) => sum + c.hours_value, 0),
      total: commitments.reduce((sum, c) => sum + c.hours_value, 0),
    }
  }

  return {
    commitments,
    loading,
    currentWeekStart,
    fetchCommitments,
    addCommitment,
    updateCommitment,
    deleteCommitment,
    moveCommitment,
    toggleComplete,
    nextWeek,
    prevWeek,
    goToCurrentWeek,
    getCommitmentsForDate,
    getHoursForDate,
    getWeeklyTotals,
  }
}
