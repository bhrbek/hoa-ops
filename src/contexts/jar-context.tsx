'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, Rock, Swarm, Commitment, Engagement } from '@/types/database'
import { calculateRealCapacity, isOverloaded } from '@/types/database'
import { startOfWeek, endOfWeek, format } from 'date-fns'

interface JarContextType {
  // User
  user: UserProfile | null
  loading: boolean

  // Capacity calculations
  realCapacity: number
  weeklyLoad: number
  isShielded: boolean
  jarFillLevel: number

  // Active beacon/swarm
  activeSwarm: (Swarm & { rock?: Rock }) | null

  // Data
  commitments: Commitment[]
  engagements: Engagement[]
  rocks: Rock[]

  // Actions
  refreshData: () => Promise<void>
  setUser: (user: UserProfile | null) => void
}

const JarContext = createContext<JarContextType | undefined>(undefined)

export function JarProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [commitments, setCommitments] = useState<Commitment[]>([])
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [rocks, setRocks] = useState<Rock[]>([])
  const [activeSwarm, setActiveSwarm] = useState<(Swarm & { rock?: Rock }) | null>(null)

  const supabase = createClient()

  // Calculate capacity metrics
  const realCapacity = user ? calculateRealCapacity(user.capacity_hours) : 32
  const weeklyLoad = commitments.reduce((sum, c) => sum + c.hours_value, 0)
  const isShielded = isOverloaded(weeklyLoad, user?.capacity_hours)
  const jarFillLevel = Math.min(100, Math.round((weeklyLoad / realCapacity) * 100))

  // Fetch user profile
  const fetchUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) {
      setUser(null)
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    setUser(profile)
    setLoading(false)
  }

  // Fetch commitments for current week
  const fetchCommitments = async () => {
    if (!user) return

    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('commitments')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', weekStart)
      .lte('date', weekEnd)

    setCommitments(data || [])
  }

  // Fetch engagements
  const fetchEngagements = async () => {
    if (!user) return

    const { data } = await supabase
      .from('engagements')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setEngagements(data || [])
  }

  // Fetch rocks
  const fetchRocks = async () => {
    const { data } = await supabase
      .from('rocks')
      .select('*')
      .eq('status', 'Active')
      .order('created_at', { ascending: false })

    setRocks(data || [])
  }

  // Fetch active swarm
  const fetchActiveSwarm = async () => {
    const today = format(new Date(), 'yyyy-MM-dd')

    const { data } = await supabase
      .from('swarms')
      .select('*, rocks(*)')
      .eq('swarm_date', today)
      .eq('active', true)
      .single()

    if (data) {
      const swarmData = data as Swarm & { rocks: Rock }
      setActiveSwarm({
        ...swarmData,
        rock: swarmData.rocks,
      })
    } else {
      setActiveSwarm(null)
    }
  }

  // Refresh all data
  const refreshData = async () => {
    await Promise.all([
      fetchCommitments(),
      fetchEngagements(),
      fetchRocks(),
      fetchActiveSwarm(),
    ])
  }

  // Initial data fetch
  useEffect(() => {
    fetchUser()
  }, [])

  // Fetch data when user changes
  useEffect(() => {
    if (user) {
      refreshData()
    }
  }, [user])

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('jar-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'commitments' },
        () => fetchCommitments()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'engagements' },
        () => fetchEngagements()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rocks' },
        () => fetchRocks()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'swarms' },
        () => fetchActiveSwarm()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  return (
    <JarContext.Provider
      value={{
        user,
        loading,
        realCapacity,
        weeklyLoad,
        isShielded,
        jarFillLevel,
        activeSwarm,
        commitments,
        engagements,
        rocks,
        refreshData,
        setUser,
      }}
    >
      {children}
    </JarContext.Provider>
  )
}

export function useJar() {
  const context = useContext(JarContext)
  if (context === undefined) {
    throw new Error('useJar must be used within a JarProvider')
  }
  return context
}
