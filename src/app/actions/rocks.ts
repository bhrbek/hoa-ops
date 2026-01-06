'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess, requireTeamRole, getActiveTeam } from './auth'
import type { Rock, RockWithProjects, RockWithBuildSignals, RockWithAll } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get rocks for a team
 */
export async function getRocks(teamId: string, quarter?: string): Promise<RockWithProjects[]> {
  console.log('[getRocks] Starting for team:', teamId, 'quarter:', quarter)

  try {
    await requireTeamAccess(teamId)
    console.log('[getRocks] Access check passed')
  } catch (err) {
    console.error('[getRocks] Access check failed:', err)
    throw err
  }

  const supabase = await createClient()

  let query = (supabase as any)
    .from('rocks')
    .select(`
      *,
      owner:profiles(*),
      projects(*)
    `)
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (quarter) {
    query = query.eq('quarter', quarter)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching rocks:', error)
    throw new Error('Failed to fetch rocks')
  }

  return data as RockWithProjects[]
}

/**
 * Get rocks for the active team
 */
export async function getActiveRocks(quarter?: string): Promise<RockWithProjects[]> {
  console.log('[getActiveRocks] Starting, quarter:', quarter)

  const activeTeam = await getActiveTeam()
  console.log('[getActiveRocks] Active team:', activeTeam?.team?.id)

  if (!activeTeam?.team?.id) {
    console.log('[getActiveRocks] No active team, returning empty')
    return []
  }

  return getRocks(activeTeam.team.id, quarter)
}

/**
 * Get a single rock with projects
 */
export async function getRock(rockId: string): Promise<RockWithProjects | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('rocks')
    .select(`
      *,
      owner:profiles(*),
      projects(*)
    `)
    .eq('id', rockId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    console.error('Error fetching rock:', error)
    return null
  }

  // Verify team access before returning data
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null
  }

  return data as RockWithProjects
}

/**
 * Get a rock with build signals
 */
export async function getRockWithBuildSignals(rockId: string): Promise<RockWithBuildSignals | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('rocks')
    .select(`
      *,
      owner:profiles(*),
      build_signals(*)
    `)
    .eq('id', rockId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    console.error('Error fetching rock:', error)
    return null
  }

  // Verify team access before returning data
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null
  }

  return data as RockWithBuildSignals
}

/**
 * Get a rock with all relations (projects, build signals, evidence)
 */
export async function getRockWithAll(rockId: string): Promise<RockWithAll | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('rocks')
    .select(`
      *,
      owner:profiles(*),
      projects(*),
      build_signals(*),
      evidence:engagements(*)
    `)
    .eq('id', rockId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    console.error('Error fetching rock:', error)
    return null
  }

  // Verify team access before returning data
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null
  }

  return data as RockWithAll
}

/**
 * Create a new rock
 */
export async function createRock(data: {
  team_id: string
  title: string
  perfect_outcome: string
  worst_outcome?: string
  quarter?: string
  owner_id?: string
}): Promise<Rock> {
  const { userId } = await requireTeamAccess(data.team_id)
  const supabase = await createClient()

  const { data: rock, error } = await (supabase as any)
    .from('rocks')
    .insert({
      team_id: data.team_id,
      title: data.title,
      perfect_outcome: data.perfect_outcome,
      worst_outcome: data.worst_outcome,
      quarter: data.quarter || 'Q1 2026',
      owner_id: data.owner_id || userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating rock:', error)
    throw new Error('Failed to create rock')
  }

  revalidatePath('/rocks')
  revalidatePath('/')
  return rock
}

/**
 * Update a rock
 */
export async function updateRock(
  rockId: string,
  data: Partial<Pick<Rock, 'title' | 'status' | 'perfect_outcome' | 'worst_outcome' | 'progress_override' | 'owner_id'>>
): Promise<Rock> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get rock's team and owner to check access - use maybeSingle() as rock might not exist
  const { data: rock } = await (supabase as any)
    .from('rocks')
    .select('team_id, owner_id')
    .eq('id', rockId)
    .maybeSingle()

  if (!rock) throw new Error('Rock not found')

  // Check access - must be owner, manager, or org_admin
  if (rock.owner_id !== user.id) {
    // Non-owners must be managers or org admins
    await requireTeamRole(rock.team_id, 'manager')
  } else {
    // Owners still need team access
    await requireTeamAccess(rock.team_id)
  }

  const { data: updated, error } = await (supabase as any)
    .from('rocks')
    .update(data)
    .eq('id', rockId)
    .select()
    .single()

  if (error) {
    console.error('Error updating rock:', error)
    throw new Error('Failed to update rock')
  }

  revalidatePath('/rocks')
  revalidatePath('/')
  return updated
}

/**
 * Soft delete a rock
 */
export async function deleteRock(rockId: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get rock's team and owner to check access - use maybeSingle() as rock might not exist
  const { data: rock } = await (supabase as any)
    .from('rocks')
    .select('team_id, owner_id')
    .eq('id', rockId)
    .maybeSingle()

  if (!rock) throw new Error('Rock not found')

  // Check access - must be owner, manager, or org_admin
  let userId: string
  if (rock.owner_id !== user.id) {
    // Non-owners must be managers or org admins
    const access = await requireTeamRole(rock.team_id, 'manager')
    userId = access.userId
  } else {
    // Owners still need team access
    const access = await requireTeamAccess(rock.team_id)
    userId = access.userId
  }

  const { error } = await (supabase as any)
    .from('rocks')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', rockId)

  if (error) {
    console.error('Error deleting rock:', error)
    throw new Error('Failed to delete rock')
  }

  revalidatePath('/rocks')
  revalidatePath('/')
}

/**
 * Calculate rock progress using database function
 */
export async function calculateRockProgress(rockId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .rpc('calculate_rock_progress', { rock_uuid: rockId })

  if (error) {
    console.error('Error calculating rock progress:', error)
    return 0
  }

  return data
}

/**
 * Get rocks by status for a team
 */
export async function getRocksByStatus(teamId: string, status: string): Promise<RockWithProjects[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('rocks')
    .select(`
      *,
      owner:profiles(*),
      projects(*)
    `)
    .eq('team_id', teamId)
    .eq('status', status)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching rocks by status:', error)
    return []
  }

  return data as RockWithProjects[]
}
