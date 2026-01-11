'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess } from './auth'
import type { Milestone, MilestoneStatus, MilestoneWithVendor, MilestoneChainItem } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get all milestones for a project
 * HOA milestones include vendor assignment, costs, and dependencies
 */
export async function getMilestones(projectId: string): Promise<MilestoneWithVendor[]> {
  const supabase = await createClient()

  // Get project's team to check access - use maybeSingle() as project might not exist
  const { data: project } = await (supabase as any)
    .from('projects')
    .select('team_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project) throw new Error('Project not found')

  await requireTeamAccess(project.team_id)

  const { data, error } = await (supabase as any)
    .from('milestones')
    .select(`
      *,
      vendor:vendors(id, name, specialty, contact_name, contact_phone, contact_email),
      depends_on:milestones!milestones_depends_on_id_fkey(id, title, status, due_date)
    `)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching milestones:', error)
    throw new Error('Failed to fetch milestones')
  }

  return data as MilestoneWithVendor[]
}

/**
 * Get a single milestone
 */
export async function getMilestone(milestoneId: string): Promise<Milestone | null> {
  const supabase = await createClient()

  // Use maybeSingle() as milestone might not exist
  const { data, error } = await (supabase as any)
    .from('milestones')
    .select('*')
    .eq('id', milestoneId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('Error fetching milestone:', error)
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
 * HOA milestones include vendor assignment, costs, and dependencies
 */
export async function createMilestone(data: {
  project_id: string
  title: string
  due_date?: string
  status?: MilestoneStatus
  // HOA fields
  vendor_id?: string
  budgeted_cost?: number
  depends_on_id?: string  // Milestone this one depends on (hand-off chain)
  description?: string
}): Promise<Milestone> {
  const supabase = await createClient()

  // Get project's team to check access and get team_id - use maybeSingle()
  const { data: project } = await (supabase as any)
    .from('projects')
    .select('team_id')
    .eq('id', data.project_id)
    .maybeSingle()

  if (!project) throw new Error('Project not found')

  await requireTeamAccess(project.team_id)

  const { data: milestone, error } = await (supabase as any)
    .from('milestones')
    .insert({
      team_id: project.team_id,
      project_id: data.project_id,
      title: data.title,
      description: data.description,
      due_date: data.due_date,
      status: data.status || 'pending',
      // HOA fields
      vendor_id: data.vendor_id,
      budgeted_cost: data.budgeted_cost || 0,
      actual_cost: 0,
      depends_on_id: data.depends_on_id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating milestone:', error)
    throw new Error('Failed to create milestone')
  }

  revalidatePath('/priorities')
  revalidatePath('/rocks')
  return milestone
}

/**
 * Update a milestone
 * HOA milestones include vendor assignment, costs, and dependencies
 */
export async function updateMilestone(
  milestoneId: string,
  data: Partial<Pick<Milestone,
    | 'title'
    | 'description'
    | 'due_date'
    | 'status'
    | 'vendor_id'
    | 'budgeted_cost'
    | 'actual_cost'
    | 'depends_on_id'
  >>
): Promise<Milestone> {
  const supabase = await createClient()

  // Get milestone's team to check access - use maybeSingle()
  const { data: milestone } = await (supabase as any)
    .from('milestones')
    .select('team_id')
    .eq('id', milestoneId)
    .maybeSingle()

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

  revalidatePath('/priorities')
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

  // Get milestone's team to check access - use maybeSingle()
  const { data: milestone } = await (supabase as any)
    .from('milestones')
    .select('team_id')
    .eq('id', milestoneId)
    .maybeSingle()

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

// ============================================
// HOA: Milestone Chain Functions
// ============================================

/**
 * Get the milestone dependency chain for a project
 * Returns milestones ordered by their dependency relationships (hand-off chain)
 */
export async function getMilestoneChain(projectId: string): Promise<MilestoneChainItem[]> {
  const milestones = await getMilestones(projectId)

  // Build a chain ordered by dependencies
  const chain: MilestoneChainItem[] = []
  const processed = new Set<string>()

  // Find root milestones (no dependencies)
  const roots = milestones.filter(m => !m.depends_on_id)

  // Process milestones in dependency order
  const processMilestone = (milestone: MilestoneWithVendor, depth: number) => {
    if (processed.has(milestone.id)) return
    processed.add(milestone.id)

    chain.push({
      id: milestone.id,
      title: milestone.title,
      status: milestone.status,
      dueDate: milestone.due_date,
      vendorName: milestone.vendor?.name || null,
      budgetedCost: milestone.budgeted_cost || 0,
      actualCost: milestone.actual_cost || 0,
      dependsOnId: milestone.depends_on_id || null,
      depth,
    })

    // Find and process dependents
    const dependents = milestones.filter(m => m.depends_on_id === milestone.id)
    for (const dependent of dependents) {
      processMilestone(dependent, depth + 1)
    }
  }

  for (const root of roots) {
    processMilestone(root, 0)
  }

  // Add any orphaned milestones (circular deps or invalid refs)
  for (const milestone of milestones) {
    if (!processed.has(milestone.id)) {
      processMilestone(milestone, 0)
    }
  }

  return chain
}

/**
 * Get milestones that depend on a specific milestone
 */
export async function getMilestoneDependents(milestoneId: string): Promise<Milestone[]> {
  const supabase = await createClient()

  // Get milestone's project to fetch all project milestones
  const { data: milestone } = await (supabase as any)
    .from('milestones')
    .select('project_id, team_id')
    .eq('id', milestoneId)
    .maybeSingle()

  if (!milestone) throw new Error('Milestone not found')

  await requireTeamAccess(milestone.team_id)

  const { data, error } = await (supabase as any)
    .from('milestones')
    .select('*')
    .eq('depends_on_id', milestoneId)
    .is('deleted_at', null)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching milestone dependents:', error)
    return []
  }

  return data as Milestone[]
}

/**
 * Check if completing a milestone would unblock any dependents
 */
export async function getUnblockedMilestones(milestoneId: string): Promise<Milestone[]> {
  const dependents = await getMilestoneDependents(milestoneId)
  // Return dependents that are pending (would be unblocked)
  return dependents.filter(m => m.status === 'pending')
}

// ============================================
// HOA: Vendor Assignment Functions
// ============================================

/**
 * Assign a vendor to a milestone
 */
export async function assignVendorToMilestone(
  milestoneId: string,
  vendorId: string,
  budgetedCost?: number
): Promise<Milestone> {
  return updateMilestone(milestoneId, {
    vendor_id: vendorId,
    budgeted_cost: budgetedCost,
  })
}

/**
 * Remove vendor from a milestone
 */
export async function removeVendorFromMilestone(milestoneId: string): Promise<Milestone> {
  const supabase = await createClient()

  const { data: milestone } = await (supabase as any)
    .from('milestones')
    .select('team_id')
    .eq('id', milestoneId)
    .maybeSingle()

  if (!milestone) throw new Error('Milestone not found')

  await requireTeamAccess(milestone.team_id)

  const { data: updated, error } = await (supabase as any)
    .from('milestones')
    .update({ vendor_id: null })
    .eq('id', milestoneId)
    .select()
    .single()

  if (error) {
    console.error('Error removing vendor from milestone:', error)
    throw new Error('Failed to remove vendor from milestone')
  }

  revalidatePath('/priorities')
  revalidatePath('/rocks')
  return updated
}

/**
 * Get milestones assigned to a specific vendor
 */
export async function getMilestonesByVendor(
  teamId: string,
  vendorId: string
): Promise<MilestoneWithVendor[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('milestones')
    .select(`
      *,
      vendor:vendors(id, name, specialty, contact_name, contact_phone, contact_email),
      project:projects(id, title)
    `)
    .eq('team_id', teamId)
    .eq('vendor_id', vendorId)
    .is('deleted_at', null)
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching milestones by vendor:', error)
    return []
  }

  return data as MilestoneWithVendor[]
}

/**
 * Record actual cost for a milestone
 */
export async function recordMilestoneActualCost(
  milestoneId: string,
  actualCost: number
): Promise<Milestone> {
  return updateMilestone(milestoneId, { actual_cost: actualCost })
}
