'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess, getActiveTeam } from './auth'
import type { BuildSignal, BuildSignalStatus } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get all build signals for a rock
 */
export async function getBuildSignals(rockId: string): Promise<BuildSignal[]> {
  const supabase = await createClient()

  // Get rock's team to check access - use maybeSingle()
  const { data: rock } = await (supabase as any)
    .from('rocks')
    .select('team_id')
    .eq('id', rockId)
    .maybeSingle()

  if (!rock) throw new Error('Rock not found')

  await requireTeamAccess(rock.team_id)

  const { data, error } = await (supabase as any)
    .from('build_signals')
    .select('*')
    .eq('rock_id', rockId)
    .is('deleted_at', null)
    .order('created_at')

  if (error) {
    console.error('Error fetching build signals:', error)
    throw new Error('Failed to fetch build signals')
  }

  return data as BuildSignal[]
}

/**
 * Get all build signals for a team
 */
export async function getTeamBuildSignals(teamId: string): Promise<BuildSignal[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('build_signals')
    .select('*')
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching team build signals:', error)
    throw new Error('Failed to fetch build signals')
  }

  return data as BuildSignal[]
}

/**
 * Get build signals for active team
 */
export async function getActiveBuildSignals(): Promise<BuildSignal[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) throw new Error('No active team')

  return getTeamBuildSignals(activeTeam.team.id)
}

/**
 * Get a single build signal
 */
export async function getBuildSignal(signalId: string): Promise<BuildSignal | null> {
  const supabase = await createClient()

  // Use maybeSingle() as signal might not exist
  const { data, error } = await (supabase as any)
    .from('build_signals')
    .select('*')
    .eq('id', signalId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('Error fetching build signal:', error)
    return null
  }

  // Verify team access before returning data
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null
  }

  return data as BuildSignal
}

/**
 * Create a new build signal
 */
export async function createBuildSignal(data: {
  rock_id: string
  title: string
  description?: string
  target_value?: number
  unit?: string
  due_date?: string
}): Promise<BuildSignal> {
  const supabase = await createClient()

  // Get rock's team to check access and get team_id - use maybeSingle()
  const { data: rock } = await (supabase as any)
    .from('rocks')
    .select('team_id')
    .eq('id', data.rock_id)
    .maybeSingle()

  if (!rock) throw new Error('Rock not found')

  await requireTeamAccess(rock.team_id)

  const { data: signal, error } = await (supabase as any)
    .from('build_signals')
    .insert({
      team_id: rock.team_id,
      rock_id: data.rock_id,
      title: data.title,
      description: data.description,
      target_value: data.target_value,
      current_value: 0,
      unit: data.unit,
      due_date: data.due_date,
      status: 'not_started'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating build signal:', error)
    throw new Error('Failed to create build signal')
  }

  revalidatePath('/rocks')
  revalidatePath('/')
  return signal
}

/**
 * Update a build signal
 */
export async function updateBuildSignal(
  signalId: string,
  data: Partial<Pick<BuildSignal, 'title' | 'description' | 'target_value' | 'current_value' | 'unit' | 'status' | 'due_date'>>
): Promise<BuildSignal> {
  const supabase = await createClient()

  // Get signal's team to check access - use maybeSingle()
  const { data: signal } = await (supabase as any)
    .from('build_signals')
    .select('team_id')
    .eq('id', signalId)
    .maybeSingle()

  if (!signal) throw new Error('Build signal not found')

  await requireTeamAccess(signal.team_id)

  const { data: updated, error } = await (supabase as any)
    .from('build_signals')
    .update(data)
    .eq('id', signalId)
    .select()
    .single()

  if (error) {
    console.error('Error updating build signal:', error)
    throw new Error('Failed to update build signal')
  }

  revalidatePath('/rocks')
  revalidatePath('/')
  return updated
}

/**
 * Update build signal progress (convenience method)
 */
export async function updateBuildSignalProgress(
  signalId: string,
  currentValue: number
): Promise<BuildSignal> {
  const supabase = await createClient()

  // Get signal to check target and auto-update status
  const existing = await getBuildSignal(signalId)
  if (!existing) throw new Error('Build signal not found')

  await requireTeamAccess(existing.team_id)

  let newStatus: BuildSignalStatus = existing.status

  // Auto-update status based on progress
  if (currentValue > 0 && newStatus === 'not_started') {
    newStatus = 'in_progress'
  }

  // Check if achieved (if target_value is set)
  if (existing.target_value && currentValue >= existing.target_value) {
    newStatus = 'achieved'
  }

  const { data: updated, error } = await (supabase as any)
    .from('build_signals')
    .update({
      current_value: currentValue,
      status: newStatus
    })
    .eq('id', signalId)
    .select()
    .single()

  if (error) {
    console.error('Error updating build signal progress:', error)
    throw new Error('Failed to update build signal progress')
  }

  revalidatePath('/rocks')
  revalidatePath('/')
  return updated
}

/**
 * Mark a build signal as achieved
 */
export async function markBuildSignalAchieved(signalId: string): Promise<BuildSignal> {
  return updateBuildSignal(signalId, { status: 'achieved' })
}

/**
 * Mark a build signal as missed
 */
export async function markBuildSignalMissed(signalId: string): Promise<BuildSignal> {
  return updateBuildSignal(signalId, { status: 'missed' })
}

/**
 * Soft delete a build signal
 */
export async function deleteBuildSignal(signalId: string): Promise<void> {
  const supabase = await createClient()

  // Get signal's team to check access - use maybeSingle()
  const { data: signal } = await (supabase as any)
    .from('build_signals')
    .select('team_id')
    .eq('id', signalId)
    .maybeSingle()

  if (!signal) throw new Error('Build signal not found')

  const { userId } = await requireTeamAccess(signal.team_id)

  const { error } = await (supabase as any)
    .from('build_signals')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', signalId)

  if (error) {
    console.error('Error deleting build signal:', error)
    throw new Error('Failed to delete build signal')
  }

  revalidatePath('/rocks')
  revalidatePath('/')
}

/**
 * Get build signals by status for a team
 */
export async function getBuildSignalsByStatus(
  teamId: string,
  status: BuildSignalStatus
): Promise<BuildSignal[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('build_signals')
    .select('*')
    .eq('team_id', teamId)
    .eq('status', status)
    .is('deleted_at', null)
    .order('due_date')

  if (error) {
    console.error('Error fetching build signals by status:', error)
    return []
  }

  return data as BuildSignal[]
}
