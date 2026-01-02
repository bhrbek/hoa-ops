'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Engagement, EngagementStatus } from '@/types/database'

export function useEngagements(userId: string | undefined) {
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [loading, setLoading] = useState(false)

  const supabase = createClient()

  const fetchEngagements = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    const { data, error } = await supabase
      .from('engagements')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setEngagements(data)
    }
    setLoading(false)
  }, [userId, supabase])

  const addEngagement = async (engagement: Omit<Engagement, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!userId) return null

    const { data, error } = await supabase
      .from('engagements')
      .insert({
        ...engagement,
        user_id: userId,
      } as never)
      .select()
      .single()

    if (!error && data) {
      setEngagements(prev => [data, ...prev])
      return data
    }
    return null
  }

  const updateEngagement = async (id: string, updates: Partial<Engagement>) => {
    const { data, error } = await supabase
      .from('engagements')
      .update(updates as never)
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setEngagements(prev => prev.map(e => e.id === id ? data : e))
      return data
    }
    return null
  }

  const deleteEngagement = async (id: string) => {
    const { error } = await supabase
      .from('engagements')
      .delete()
      .eq('id', id)

    if (!error) {
      setEngagements(prev => prev.filter(e => e.id !== id))
      return true
    }
    return false
  }

  const toggleSignal = async (id: string) => {
    const engagement = engagements.find(e => e.id === id)
    if (!engagement) return null
    return updateEngagement(id, { is_strategic_signal: !engagement.is_strategic_signal })
  }

  const updateStatus = async (id: string, status: EngagementStatus) => {
    return updateEngagement(id, { status })
  }

  // Get strategic signals only
  const getStrategicSignals = () => {
    return engagements.filter(e => e.is_strategic_signal)
  }

  // Get active engagements
  const getActiveEngagements = () => {
    return engagements.filter(e => e.status === 'Active' || e.status === 'Lead')
  }

  // Get engagements by domain
  const getByDomain = (domain: string) => {
    return engagements.filter(e => e.domains.includes(domain))
  }

  // Get total effort hours
  const getTotalEffort = () => {
    return engagements
      .filter(e => e.status === 'Active')
      .reduce((sum, e) => sum + e.estimated_effort, 0)
  }

  return {
    engagements,
    loading,
    fetchEngagements,
    addEngagement,
    updateEngagement,
    deleteEngagement,
    toggleSignal,
    updateStatus,
    getStrategicSignals,
    getActiveEngagements,
    getByDomain,
    getTotalEffort,
  }
}
