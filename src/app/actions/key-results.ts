'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess, getActiveTeam } from './auth'
import type { KeyResult, KeyResultStatus } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get all key results for a rock
 */
export async function getKeyResults(rockId: string): Promise<KeyResult[]> {
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
    .from('key_results')
    .select('*')
    .eq('rock_id', rockId)
    .is('deleted_at', null)
    .order('created_at')

  if (error) {
    console.error('Error fetching key results:', error)
    throw new Error('Failed to fetch key results')
  }

  return data as KeyResult[]
}

/**
 * Get all key results for a team
 */
export async function getTeamKeyResults(teamId: string): Promise<KeyResult[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('key_results')
    .select('*')
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching team key results:', error)
    throw new Error('Failed to fetch key results')
  }

  return data as KeyResult[]
}

/**
 * Get key results for active team
 */
export async function getActiveKeyResults(): Promise<KeyResult[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) throw new Error('No active team')

  return getTeamKeyResults(activeTeam.team.id)
}

/**
 * Get a single key result
 */
export async function getKeyResult(keyResultId: string): Promise<KeyResult | null> {
  const supabase = await createClient()

  // Use maybeSingle() as key result might not exist
  const { data, error } = await (supabase as any)
    .from('key_results')
    .select('*')
    .eq('id', keyResultId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('Error fetching key result:', error)
    return null
  }

  // Verify team access before returning data
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null
  }

  return data as KeyResult
}

/**
 * Create a new key result
 */
export async function createKeyResult(data: {
  rock_id: string
  title: string
  description?: string
  target_value?: number
  unit?: string
  due_date?: string
}): Promise<KeyResult> {
  const supabase = await createClient()

  // Get rock's team to check access and get team_id - use maybeSingle()
  const { data: rock } = await (supabase as any)
    .from('rocks')
    .select('team_id')
    .eq('id', data.rock_id)
    .maybeSingle()

  if (!rock) throw new Error('Rock not found')

  await requireTeamAccess(rock.team_id)

  const { data: keyResult, error } = await (supabase as any)
    .from('key_results')
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
    console.error('Error creating key result:', error)
    throw new Error('Failed to create key result')
  }

  revalidatePath('/rocks')
  revalidatePath('/')
  return keyResult
}

/**
 * Update a key result
 */
export async function updateKeyResult(
  keyResultId: string,
  data: Partial<Pick<KeyResult, 'title' | 'description' | 'target_value' | 'current_value' | 'unit' | 'status' | 'due_date'>>
): Promise<KeyResult> {
  const supabase = await createClient()

  // Get key result's team to check access - use maybeSingle()
  const { data: keyResult } = await (supabase as any)
    .from('key_results')
    .select('team_id')
    .eq('id', keyResultId)
    .maybeSingle()

  if (!keyResult) throw new Error('Key result not found')

  await requireTeamAccess(keyResult.team_id)

  const { data: updated, error } = await (supabase as any)
    .from('key_results')
    .update(data)
    .eq('id', keyResultId)
    .select()
    .single()

  if (error) {
    console.error('Error updating key result:', error)
    throw new Error('Failed to update key result')
  }

  revalidatePath('/rocks')
  revalidatePath('/')
  return updated
}

/**
 * Update key result progress (convenience method)
 */
export async function updateKeyResultProgress(
  keyResultId: string,
  currentValue: number
): Promise<KeyResult> {
  const supabase = await createClient()

  // Get key result to check target and auto-update status
  const existing = await getKeyResult(keyResultId)
  if (!existing) throw new Error('Key result not found')

  await requireTeamAccess(existing.team_id)

  let newStatus: KeyResultStatus = existing.status

  // Auto-update status based on progress
  if (currentValue > 0 && newStatus === 'not_started') {
    newStatus = 'in_progress'
  }

  // Check if achieved (if target_value is set)
  if (existing.target_value && currentValue >= existing.target_value) {
    newStatus = 'achieved'
  }

  const { data: updated, error } = await (supabase as any)
    .from('key_results')
    .update({
      current_value: currentValue,
      status: newStatus
    })
    .eq('id', keyResultId)
    .select()
    .single()

  if (error) {
    console.error('Error updating key result progress:', error)
    throw new Error('Failed to update key result progress')
  }

  revalidatePath('/rocks')
  revalidatePath('/')
  return updated
}

/**
 * Mark a key result as achieved
 */
export async function markKeyResultAchieved(keyResultId: string): Promise<KeyResult> {
  return updateKeyResult(keyResultId, { status: 'achieved' })
}

/**
 * Mark a key result as missed
 */
export async function markKeyResultMissed(keyResultId: string): Promise<KeyResult> {
  return updateKeyResult(keyResultId, { status: 'missed' })
}

/**
 * Soft delete a key result
 */
export async function deleteKeyResult(keyResultId: string): Promise<void> {
  const supabase = await createClient()

  // Get key result's team to check access - use maybeSingle()
  const { data: keyResult } = await (supabase as any)
    .from('key_results')
    .select('team_id')
    .eq('id', keyResultId)
    .maybeSingle()

  if (!keyResult) throw new Error('Key result not found')

  const { userId } = await requireTeamAccess(keyResult.team_id)

  const { error } = await (supabase as any)
    .from('key_results')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', keyResultId)

  if (error) {
    console.error('Error deleting key result:', error)
    throw new Error('Failed to delete key result')
  }

  revalidatePath('/rocks')
  revalidatePath('/')
}

/**
 * Get key results by status for a team
 */
export async function getKeyResultsByStatus(
  teamId: string,
  status: KeyResultStatus
): Promise<KeyResult[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('key_results')
    .select('*')
    .eq('team_id', teamId)
    .eq('status', status)
    .is('deleted_at', null)
    .order('due_date')

  if (error) {
    console.error('Error fetching key results by status:', error)
    return []
  }

  return data as KeyResult[]
}
