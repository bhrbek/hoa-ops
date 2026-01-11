'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess, getActiveTeam } from './auth'
import type { Signal, SignalWithRelations, SignalType } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get signals for a team
 * Signals are observations/evidence that justify priorities
 */
export async function getSignals(
  teamId: string,
  options?: {
    limit?: number
    offset?: number
    priorityId?: string  // Link to annual priority (rock)
    signalType?: SignalType
  }
): Promise<SignalWithRelations[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  let query = (supabase as any)
    .from('signals')
    .select(`
      *,
      owner:profiles!signals_owner_id_fkey(*),
      priority_rock:rocks(id, title),
      issue:issues(id, title, status)
    `)
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .order('date', { ascending: false })

  if (options?.priorityId) {
    query = query.eq('priority_id', options.priorityId)
  }

  if (options?.signalType) {
    query = query.eq('signal_type', options.signalType)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching signals:', error)
    throw new Error('Failed to fetch signals')
  }

  return data as SignalWithRelations[]
}

/**
 * Get signals for the active team
 */
export async function getActiveSignals(options?: {
  limit?: number
  offset?: number
  priorityId?: string
  signalType?: SignalType
}): Promise<SignalWithRelations[]> {
  const activeTeam = await getActiveTeam()

  if (!activeTeam?.team?.id) {
    return []
  }

  return getSignals(activeTeam.team.id, options)
}

/**
 * Get a single signal by ID
 */
export async function getSignal(signalId: string): Promise<SignalWithRelations | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('signals')
    .select(`
      *,
      owner:profiles!signals_owner_id_fkey(*),
      priority_rock:rocks(id, title),
      issue:issues(id, title, status)
    `)
    .eq('id', signalId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('Error fetching signal:', error)
    return null
  }

  // Verify team access
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null
  }

  return data as SignalWithRelations
}

/**
 * Create a new signal
 * Signals capture observations/evidence that inform priorities
 */
export async function createSignal(data: {
  team_id: string
  title: string
  description?: string
  signal_type?: SignalType
  priority_id?: string  // Link to annual priority (rock)
  date?: string
  property_address?: string
  lot_number?: string
}): Promise<Signal> {
  const { userId } = await requireTeamAccess(data.team_id)
  const supabase = await createClient()

  const { data: signal, error } = await (supabase as any)
    .from('signals')
    .insert({
      team_id: data.team_id,
      owner_id: userId,
      title: data.title,
      description: data.description,
      signal_type: data.signal_type || 'other',
      priority_id: data.priority_id,
      date: data.date || new Date().toISOString().split('T')[0],
      property_address: data.property_address,
      lot_number: data.lot_number,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating signal:', error)
    throw new Error('Failed to create signal')
  }

  revalidatePath('/signals')
  revalidatePath('/priorities')
  revalidatePath('/')
  return signal
}

/**
 * Update a signal
 */
export async function updateSignal(
  signalId: string,
  data: Partial<Pick<Signal,
    | 'title'
    | 'description'
    | 'signal_type'
    | 'priority_id'
    | 'date'
    | 'property_address'
    | 'lot_number'
  >>
): Promise<Signal> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get signal's team to check access
  const { data: signal } = await (supabase as any)
    .from('signals')
    .select('team_id')
    .eq('id', signalId)
    .maybeSingle()

  if (!signal) throw new Error('Signal not found')

  await requireTeamAccess(signal.team_id)

  const { data: updated, error } = await (supabase as any)
    .from('signals')
    .update(data)
    .eq('id', signalId)
    .select()
    .single()

  if (error) {
    console.error('Error updating signal:', error)
    throw new Error('Failed to update signal')
  }

  revalidatePath('/signals')
  revalidatePath('/priorities')
  revalidatePath('/')
  return updated
}

/**
 * Soft delete a signal
 */
export async function deleteSignal(signalId: string): Promise<void> {
  const supabase = await createClient()

  const { data: signal } = await (supabase as any)
    .from('signals')
    .select('team_id, owner_id')
    .eq('id', signalId)
    .maybeSingle()

  if (!signal) throw new Error('Signal not found')

  const { userId, role, isOrgAdmin } = await requireTeamAccess(signal.team_id)

  const { data: { user } } = await supabase.auth.getUser()
  const isOwner = signal.owner_id === user?.id
  const canDelete = isOwner || role === 'manager' || isOrgAdmin

  if (!canDelete) {
    throw new Error('Access denied: only owner, manager, or org admin can delete signals')
  }

  const { error } = await (supabase as any)
    .from('signals')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq('id', signalId)

  if (error) {
    console.error('Error deleting signal:', error)
    throw new Error('Failed to delete signal')
  }

  revalidatePath('/signals')
  revalidatePath('/priorities')
  revalidatePath('/')
}

/**
 * Promote a signal to an issue
 * Creates an issue linked to this signal
 */
export async function promoteSignalToIssue(signalId: string): Promise<string> {
  const supabase = await createClient()

  const { data: signal } = await (supabase as any)
    .from('signals')
    .select('*')
    .eq('id', signalId)
    .maybeSingle()

  if (!signal) throw new Error('Signal not found')

  const { userId } = await requireTeamAccess(signal.team_id)

  // Create an issue from the signal
  const { data: issue, error } = await (supabase as any)
    .from('issues')
    .insert({
      team_id: signal.team_id,
      owner_id: userId,
      title: signal.title,
      description: signal.description,
      issue_type: 'issue',
      priority: 'medium',
      status: 'open',
      source: 'signal',
      source_id: signalId,
      priority_id: signal.priority_id,
      property_address: signal.property_address,
      lot_number: signal.lot_number,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating issue from signal:', error)
    throw new Error('Failed to promote signal to issue')
  }

  // Link the signal to the new issue
  await (supabase as any)
    .from('signals')
    .update({ issue_id: issue.id })
    .eq('id', signalId)

  revalidatePath('/signals')
  revalidatePath('/issues')
  revalidatePath('/priorities')
  revalidatePath('/')

  return issue.id
}

/**
 * Get signal stats for a team
 */
export async function getSignalStats(teamId: string): Promise<{
  totalSignals: number
  byType: Record<SignalType, number>
  linkedToPriority: number
  promotedToIssue: number
}> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('signals')
    .select('signal_type, priority_id, issue_id')
    .eq('team_id', teamId)
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching signal stats:', error)
    throw new Error('Failed to fetch signal stats')
  }

  const signals = data || []
  const byType: Record<string, number> = {}

  for (const signal of signals) {
    const type = signal.signal_type || 'other'
    byType[type] = (byType[type] || 0) + 1
  }

  return {
    totalSignals: signals.length,
    byType: byType as Record<SignalType, number>,
    linkedToPriority: signals.filter((s: { priority_id: string | null }) => s.priority_id).length,
    promotedToIssue: signals.filter((s: { issue_id: string | null }) => s.issue_id).length,
  }
}

/**
 * Get active team's signal stats
 */
export async function getActiveSignalStats(): Promise<{
  totalSignals: number
  byType: Record<SignalType, number>
  linkedToPriority: number
  promotedToIssue: number
}> {
  const activeTeam = await getActiveTeam()

  if (!activeTeam?.team?.id) {
    return {
      totalSignals: 0,
      byType: {} as Record<SignalType, number>,
      linkedToPriority: 0,
      promotedToIssue: 0,
    }
  }

  return getSignalStats(activeTeam.team.id)
}

/**
 * Get signals by type
 */
export async function getSignalsByType(
  teamId: string,
  signalType: SignalType
): Promise<SignalWithRelations[]> {
  return getSignals(teamId, { signalType })
}

/**
 * Get signals for a specific priority
 */
export async function getSignalsForPriority(priorityId: string): Promise<SignalWithRelations[]> {
  const supabase = await createClient()

  // Get priority's team to check access
  const { data: priority } = await (supabase as any)
    .from('rocks')
    .select('team_id')
    .eq('id', priorityId)
    .maybeSingle()

  if (!priority) throw new Error('Priority not found')

  await requireTeamAccess(priority.team_id)

  const { data, error } = await (supabase as any)
    .from('signals')
    .select(`
      *,
      owner:profiles!signals_owner_id_fkey(*),
      issue:issues(id, title, status)
    `)
    .eq('priority_id', priorityId)
    .is('deleted_at', null)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching signals for priority:', error)
    return []
  }

  return data as SignalWithRelations[]
}

/**
 * Link a signal to a priority
 */
export async function linkSignalToPriority(
  signalId: string,
  priorityId: string
): Promise<Signal> {
  return updateSignal(signalId, { priority_id: priorityId })
}

/**
 * Unlink a signal from its priority
 */
export async function unlinkSignalFromPriority(signalId: string): Promise<Signal> {
  const supabase = await createClient()

  const { data: signal } = await (supabase as any)
    .from('signals')
    .select('team_id')
    .eq('id', signalId)
    .maybeSingle()

  if (!signal) throw new Error('Signal not found')

  await requireTeamAccess(signal.team_id)

  const { data: updated, error } = await (supabase as any)
    .from('signals')
    .update({ priority_id: null })
    .eq('id', signalId)
    .select()
    .single()

  if (error) {
    console.error('Error unlinking signal from priority:', error)
    throw new Error('Failed to unlink signal from priority')
  }

  revalidatePath('/signals')
  revalidatePath('/priorities')
  return updated
}
