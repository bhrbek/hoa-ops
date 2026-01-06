'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess, requireTeamRole, getActiveTeam, getCurrentUser } from './auth'
import type { Commitment, CommitmentStatus, CommitmentWithRelations, CarryoverAction, CommitmentCarryover } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get Monday of the given date's week
 */
function getWeekOf(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

/**
 * Get commitments for a team
 */
export async function getCommitments(
  teamId: string,
  weekOf?: string
): Promise<CommitmentWithRelations[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  let query = (supabase as any)
    .from('commitments')
    .select(`
      *,
      project:projects(id, title, rock_id),
      build_signal:build_signals(id, title, status),
      owner:profiles(id, full_name, avatar_url)
    `)
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (weekOf) {
    query = query.eq('week_of', weekOf)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching commitments:', error)
    throw new Error('Failed to fetch commitments')
  }

  return data as CommitmentWithRelations[]
}

/**
 * Get commitments for active team
 */
export async function getActiveCommitments(weekOf?: string): Promise<CommitmentWithRelations[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) throw new Error('No active team')

  const week = weekOf || getWeekOf(new Date())
  return getCommitments(activeTeam.team.id, week)
}

/**
 * Get current user's commitments
 */
export async function getMyCommitments(weekOf?: string): Promise<CommitmentWithRelations[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let query = (supabase as any)
    .from('commitments')
    .select(`
      *,
      project:projects(id, title, rock_id),
      build_signal:build_signals(id, title, status),
      owner:profiles(id, full_name, avatar_url)
    `)
    .eq('owner_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (weekOf) {
    query = query.eq('week_of', weekOf)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching my commitments:', error)
    throw new Error('Failed to fetch commitments')
  }

  return data as CommitmentWithRelations[]
}

/**
 * Get a single commitment
 */
export async function getCommitment(commitmentId: string): Promise<CommitmentWithRelations | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('commitments')
    .select(`
      *,
      project:projects(id, title, rock_id),
      build_signal:build_signals(id, title, status),
      owner:profiles(id, full_name, avatar_url)
    `)
    .eq('id', commitmentId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    console.error('Error fetching commitment:', error)
    return null
  }

  // Verify team access before returning data
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null  // User doesn't have access
  }

  return data as CommitmentWithRelations
}

/**
 * Create a new commitment
 * Commitments MUST be linked to both a project and a build signal
 */
export async function createCommitment(data: {
  project_id: string
  build_signal_id: string
  definition_of_done: string
  week_of?: string
  notes?: string
}): Promise<Commitment> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get project's team and rock - use maybeSingle() as project might not exist
  const { data: project } = await (supabase as any)
    .from('projects')
    .select('team_id, rock_id')
    .eq('id', data.project_id)
    .maybeSingle()

  if (!project) throw new Error('Project not found')

  await requireTeamAccess(project.team_id)

  // Validate build signal belongs to the same rock - use maybeSingle() as signal might not exist
  const { data: signal } = await (supabase as any)
    .from('build_signals')
    .select('rock_id')
    .eq('id', data.build_signal_id)
    .maybeSingle()

  if (!signal) throw new Error('Build signal not found')
  if (signal.rock_id !== project.rock_id) {
    throw new Error('Build signal must belong to the same rock as the project')
  }

  const weekOf = data.week_of || getWeekOf(new Date())

  const { data: commitment, error } = await (supabase as any)
    .from('commitments')
    .insert({
      team_id: project.team_id,
      owner_id: user.id,
      project_id: data.project_id,
      build_signal_id: data.build_signal_id,
      rock_id: project.rock_id,
      definition_of_done: data.definition_of_done,
      week_of: weekOf,
      notes: data.notes,
      status: 'planned'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating commitment:', error)
    throw new Error('Failed to create commitment')
  }

  revalidatePath('/commitment-board')
  revalidatePath('/')
  return commitment
}

/**
 * Update a commitment (owner only)
 */
export async function updateCommitment(
  commitmentId: string,
  data: Partial<Pick<Commitment, 'definition_of_done' | 'notes' | 'status'>>
): Promise<Commitment> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get commitment to check ownership - use maybeSingle() as commitment might not exist
  const { data: commitment } = await (supabase as any)
    .from('commitments')
    .select('owner_id, team_id')
    .eq('id', commitmentId)
    .maybeSingle()

  if (!commitment) throw new Error('Commitment not found')

  // Check access - must be owner, manager, or org_admin
  if (commitment.owner_id !== user.id) {
    // Non-owners must be managers or org admins to update
    await requireTeamRole(commitment.team_id, 'manager')
  }

  const updateData: Record<string, unknown> = { ...data }

  // If marking as done, set completed_at
  if (data.status === 'done') {
    updateData.completed_at = new Date().toISOString()
  }

  const { data: updated, error } = await (supabase as any)
    .from('commitments')
    .update(updateData)
    .eq('id', commitmentId)
    .select()
    .single()

  if (error) {
    console.error('Error updating commitment:', error)
    throw new Error('Failed to update commitment')
  }

  revalidatePath('/commitment-board')
  revalidatePath('/')
  return updated
}

/**
 * Mark a commitment as done
 */
export async function markCommitmentDone(commitmentId: string): Promise<Commitment> {
  return updateCommitment(commitmentId, { status: 'done' })
}

/**
 * Mark a commitment as blocked
 */
export async function markCommitmentBlocked(commitmentId: string, notes?: string): Promise<Commitment> {
  return updateCommitment(commitmentId, { status: 'blocked', notes })
}

/**
 * Carry a commitment to next week
 */
export async function carryCommitment(
  commitmentId: string,
  nextWeek: string
): Promise<CommitmentCarryover> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get original commitment
  const original = await getCommitment(commitmentId)
  if (!original) throw new Error('Commitment not found')

  // Check access - must be owner or manager to carry someone else's commitment
  if (original.owner_id !== user.id) {
    await requireTeamRole(original.team_id, 'manager')
  }

  // Mark original as slipped
  await updateCommitment(commitmentId, { status: 'slipped' })

  // Create new commitment for next week
  const { data: newCommitment, error } = await (supabase as any)
    .from('commitments')
    .insert({
      team_id: original.team_id,
      owner_id: original.owner_id,
      project_id: original.project_id,
      build_signal_id: original.build_signal_id,
      rock_id: original.rock_id,
      definition_of_done: original.definition_of_done,
      week_of: nextWeek,
      notes: `Carried from ${original.week_of}`,
      status: 'planned',
      carried_from_id: commitmentId
    })
    .select()
    .single()

  if (error) {
    console.error('Error carrying commitment:', error)
    throw new Error('Failed to carry commitment')
  }

  revalidatePath('/commitment-board')
  revalidatePath('/')

  return {
    action: 'carry',
    originalCommitmentId: commitmentId,
    newCommitmentIds: [newCommitment.id]
  }
}

/**
 * Split a commitment into multiple smaller ones
 */
export async function splitCommitment(
  commitmentId: string,
  newCommitments: Array<{
    definition_of_done: string
    notes?: string
  }>
): Promise<CommitmentCarryover> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get original commitment
  const original = await getCommitment(commitmentId)
  if (!original) throw new Error('Commitment not found')

  // Check access - must be owner or manager to split someone else's commitment
  if (original.owner_id !== user.id) {
    await requireTeamRole(original.team_id, 'manager')
  }

  // Mark original as slipped
  await updateCommitment(commitmentId, { status: 'slipped' })

  // Create new commitments
  const inserts = newCommitments.map(c => ({
    team_id: original.team_id,
    owner_id: original.owner_id,
    project_id: original.project_id,
    build_signal_id: original.build_signal_id,
    rock_id: original.rock_id,
    definition_of_done: c.definition_of_done,
    week_of: original.week_of, // Keep same week
    notes: c.notes,
    status: 'planned',
    split_from_id: commitmentId
  }))

  const { data: created, error } = await (supabase as any)
    .from('commitments')
    .insert(inserts)
    .select()

  if (error) {
    console.error('Error splitting commitment:', error)
    throw new Error('Failed to split commitment')
  }

  revalidatePath('/commitment-board')
  revalidatePath('/')

  return {
    action: 'split',
    originalCommitmentId: commitmentId,
    newCommitmentIds: created.map((c: Commitment) => c.id)
  }
}

/**
 * Drop a commitment (soft delete)
 */
export async function dropCommitment(commitmentId: string): Promise<CommitmentCarryover> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get commitment to check ownership - use maybeSingle() as commitment might not exist
  const { data: commitment } = await (supabase as any)
    .from('commitments')
    .select('owner_id, team_id')
    .eq('id', commitmentId)
    .maybeSingle()

  if (!commitment) throw new Error('Commitment not found')

  // Check access - must be owner or manager to drop someone else's commitment
  if (commitment.owner_id !== user.id) {
    await requireTeamRole(commitment.team_id, 'manager')
  }

  const { error } = await (supabase as any)
    .from('commitments')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id
    })
    .eq('id', commitmentId)

  if (error) {
    console.error('Error dropping commitment:', error)
    throw new Error('Failed to drop commitment')
  }

  revalidatePath('/commitment-board')
  revalidatePath('/')

  return {
    action: 'drop',
    originalCommitmentId: commitmentId,
    newCommitmentIds: []
  }
}

/**
 * Get commitments that need carryover action (slipped from previous week)
 */
export async function getPendingCarryovers(teamId: string): Promise<CommitmentWithRelations[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const thisWeek = getWeekOf(new Date())

  const { data, error } = await (supabase as any)
    .from('commitments')
    .select(`
      *,
      project:projects(id, title, rock_id),
      build_signal:build_signals(id, title, status),
      owner:profiles(id, full_name, avatar_url)
    `)
    .eq('team_id', teamId)
    .lt('week_of', thisWeek)
    .eq('status', 'planned') // Still planned = needs action
    .is('deleted_at', null)
    .order('week_of', { ascending: true })

  if (error) {
    console.error('Error fetching pending carryovers:', error)
    return []
  }

  return data as CommitmentWithRelations[]
}

/**
 * Get commitment statistics for a team
 */
export async function getCommitmentStats(teamId: string, weekOf?: string): Promise<{
  total: number
  done: number
  planned: number
  blocked: number
  slipped: number
  completionRate: number
}> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  let query = (supabase as any)
    .from('commitments')
    .select('status')
    .eq('team_id', teamId)
    .is('deleted_at', null)

  if (weekOf) {
    query = query.eq('week_of', weekOf)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching commitment stats:', error)
    return { total: 0, done: 0, planned: 0, blocked: 0, slipped: 0, completionRate: 0 }
  }

  const stats = {
    total: data.length,
    done: data.filter((c: Commitment) => c.status === 'done').length,
    planned: data.filter((c: Commitment) => c.status === 'planned').length,
    blocked: data.filter((c: Commitment) => c.status === 'blocked').length,
    slipped: data.filter((c: Commitment) => c.status === 'slipped').length,
    completionRate: 0
  }

  // Completion rate = done / (done + slipped)
  const completed = stats.done + stats.slipped
  stats.completionRate = completed > 0 ? Math.round((stats.done / completed) * 100) : 0

  return stats
}
