'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess } from './auth'
import type { Milestone, MilestoneStatus } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get all milestones for a project
 */
export async function getMilestones(projectId: string): Promise<Milestone[]> {
  const supabase = await createClient()

  // Get project's team to check access
  const { data: project } = await (supabase as any)
    .from('projects')
    .select('team_id')
    .eq('id', projectId)
    .single()

  if (!project) throw new Error('Project not found')

  await requireTeamAccess(project.team_id)

  const { data, error } = await (supabase as any)
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching milestones:', error)
    throw new Error('Failed to fetch milestones')
  }

  return data as Milestone[]
}

/**
 * Get a single milestone
 */
export async function getMilestone(milestoneId: string): Promise<Milestone | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('milestones')
    .select('*')
    .eq('id', milestoneId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    console.error('Error fetching milestone:', error)
    return null
  }

  // Verify team access before returning data
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null
  }

  return data as Milestone
}

/**
 * Create a new milestone
 */
export async function createMilestone(data: {
  project_id: string
  title: string
  due_date?: string
  status?: MilestoneStatus
}): Promise<Milestone> {
  const supabase = await createClient()

  // Get project's team to check access and get team_id
  const { data: project } = await (supabase as any)
    .from('projects')
    .select('team_id')
    .eq('id', data.project_id)
    .single()

  if (!project) throw new Error('Project not found')

  await requireTeamAccess(project.team_id)

  const { data: milestone, error } = await (supabase as any)
    .from('milestones')
    .insert({
      team_id: project.team_id,
      project_id: data.project_id,
      title: data.title,
      due_date: data.due_date,
      status: data.status || 'pending'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating milestone:', error)
    throw new Error('Failed to create milestone')
  }

  revalidatePath('/rocks')
  return milestone
}

/**
 * Update a milestone
 */
export async function updateMilestone(
  milestoneId: string,
  data: Partial<Pick<Milestone, 'title' | 'due_date' | 'status'>>
): Promise<Milestone> {
  const supabase = await createClient()

  // Get milestone's team to check access
  const { data: milestone } = await (supabase as any)
    .from('milestones')
    .select('team_id')
    .eq('id', milestoneId)
    .single()

  if (!milestone) throw new Error('Milestone not found')

  await requireTeamAccess(milestone.team_id)

  const updateData: Record<string, unknown> = { ...data }

  // If marking as completed, set completed_at
  if (data.status === 'completed') {
    updateData.completed_at = new Date().toISOString()
  } else if (data.status) {
    // If status is being changed to something other than completed, clear completed_at
    updateData.completed_at = null
  }

  const { data: updated, error } = await (supabase as any)
    .from('milestones')
    .update(updateData)
    .eq('id', milestoneId)
    .select()
    .single()

  if (error) {
    console.error('Error updating milestone:', error)
    throw new Error('Failed to update milestone')
  }

  revalidatePath('/rocks')
  return updated
}

/**
 * Mark a milestone as completed
 */
export async function completeMilestone(milestoneId: string): Promise<Milestone> {
  return updateMilestone(milestoneId, { status: 'completed' })
}

/**
 * Soft delete a milestone
 */
export async function deleteMilestone(milestoneId: string): Promise<void> {
  const supabase = await createClient()

  // Get milestone's team to check access
  const { data: milestone } = await (supabase as any)
    .from('milestones')
    .select('team_id')
    .eq('id', milestoneId)
    .single()

  if (!milestone) throw new Error('Milestone not found')

  const { userId } = await requireTeamAccess(milestone.team_id)

  const { error } = await (supabase as any)
    .from('milestones')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', milestoneId)

  if (error) {
    console.error('Error deleting milestone:', error)
    throw new Error('Failed to delete milestone')
  }

  revalidatePath('/rocks')
}

/**
 * Get upcoming milestones for a team
 */
export async function getUpcomingMilestones(teamId: string, days = 30): Promise<Milestone[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  const { data, error } = await (supabase as any)
    .from('milestones')
    .select('*')
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .neq('status', 'completed')
    .lte('due_date', futureDate.toISOString().split('T')[0])
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming milestones:', error)
    return []
  }

  return data as Milestone[]
}

/**
 * Get overdue milestones for a team
 */
export async function getOverdueMilestones(teamId: string): Promise<Milestone[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await (supabase as any)
    .from('milestones')
    .select('*')
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .neq('status', 'completed')
    .lt('due_date', today)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching overdue milestones:', error)
    return []
  }

  return data as Milestone[]
}
