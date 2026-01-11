'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess, requireTeamRole, getActiveTeam } from './auth'
import type { Project, ProjectWithTasks, ProjectWithMilestones, ProjectWithAll, ApprovalStatus, ProjectBudgetSummary } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get projects for a team
 */
export async function getProjects(teamId: string, rockId?: string): Promise<ProjectWithTasks[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  let query = (supabase as any)
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey(*),
      tasks(*)
    `)
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .order('start_date', { ascending: true })

  if (rockId) {
    query = query.eq('rock_id', rockId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching projects:', error)
    throw new Error('Failed to fetch projects')
  }

  return data as ProjectWithTasks[]
}

/**
 * Get projects for active team
 */
export async function getActiveProjects(rockId?: string): Promise<ProjectWithTasks[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) throw new Error('No active team')

  return getProjects(activeTeam.team.id, rockId)
}

/**
 * Get a single project with tasks
 */
export async function getProject(projectId: string): Promise<ProjectWithTasks | null> {
  const supabase = await createClient()

  // Use maybeSingle() as project might not exist
  const { data, error } = await (supabase as any)
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey(*),
      tasks(*)
    `)
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('Error fetching project:', error)
    return null
  }

  // Verify team access before returning data
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null
  }

  return data as ProjectWithTasks
}

/**
 * Get a project with milestones
 */
export async function getProjectWithMilestones(projectId: string): Promise<ProjectWithMilestones | null> {
  const supabase = await createClient()

  // Use maybeSingle() as project might not exist
  const { data, error } = await (supabase as any)
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey(*),
      milestones(*)
    `)
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('Error fetching project:', error)
    return null
  }

  // Verify team access before returning data
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null
  }

  return data as ProjectWithMilestones
}

/**
 * Get a project with all relations
 */
export async function getProjectWithAll(projectId: string): Promise<ProjectWithAll | null> {
  const supabase = await createClient()

  // Use maybeSingle() as project might not exist
  const { data, error } = await (supabase as any)
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey(*),
      tasks(*),
      milestones(*)
    `)
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('Error fetching project:', error)
    return null
  }

  // Verify team access before returning data
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null
  }

  return data as ProjectWithAll
}

/**
 * Create a new project
 * HOA projects include budget tracking and approval workflow
 */
export async function createProject(data: {
  rock_id: string  // Priority ID in HOA context
  title: string
  start_date?: string
  end_date?: string
  estimated_hours?: number
  owner_id?: string
  // HOA budget fields
  budget_amount?: number
  proposing_committee_id?: string
  description?: string
}): Promise<Project> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get rock's team_id - use maybeSingle() as rock might not exist
  const { data: rock } = await (supabase as any)
    .from('rocks')
    .select('team_id')
    .eq('id', data.rock_id)
    .maybeSingle()

  if (!rock) throw new Error('Priority not found')

  await requireTeamAccess(rock.team_id)

  const { data: project, error } = await (supabase as any)
    .from('projects')
    .insert({
      team_id: rock.team_id,
      rock_id: data.rock_id,
      title: data.title,
      description: data.description,
      start_date: data.start_date,
      end_date: data.end_date,
      estimated_hours: data.estimated_hours || 0,
      owner_id: data.owner_id || user.id,
      // HOA budget fields
      budget_amount: data.budget_amount || 0,
      actual_cost: 0,
      approval_status: 'proposed',
      proposing_committee_id: data.proposing_committee_id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error)
    throw new Error('Failed to create project')
  }

  revalidatePath('/priorities')
  revalidatePath('/rocks')
  revalidatePath('/')
  return project
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  data: Partial<Pick<Project,
    | 'title'
    | 'description'
    | 'status'
    | 'start_date'
    | 'end_date'
    | 'estimated_hours'
    | 'owner_id'
    | 'budget_amount'
    | 'actual_cost'
  >>
): Promise<Project> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get project's team and owner to check access - use maybeSingle() as project might not exist
  const { data: project } = await (supabase as any)
    .from('projects')
    .select('team_id, owner_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project) throw new Error('Project not found')

  // Check access - must be owner, manager, or org_admin
  if (project.owner_id !== user.id) {
    // Non-owners must be managers or org admins
    await requireTeamRole(project.team_id, 'manager')
  } else {
    // Owners still need team access
    await requireTeamAccess(project.team_id)
  }

  const { data: updated, error } = await (supabase as any)
    .from('projects')
    .update(data)
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Error updating project:', error)
    throw new Error('Failed to update project')
  }

  revalidatePath('/priorities')
  revalidatePath('/rocks')
  revalidatePath('/')
  return updated
}

/**
 * Soft delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get project's team and owner to check access - use maybeSingle() as project might not exist
  const { data: project } = await (supabase as any)
    .from('projects')
    .select('team_id, owner_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project) throw new Error('Project not found')

  // Check access - must be owner, manager, or org_admin
  let userId: string
  if (project.owner_id !== user.id) {
    // Non-owners must be managers or org admins
    const access = await requireTeamRole(project.team_id, 'manager')
    userId = access.userId
  } else {
    // Owners still need team access
    const access = await requireTeamAccess(project.team_id)
    userId = access.userId
  }

  const { error } = await (supabase as any)
    .from('projects')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', projectId)

  if (error) {
    console.error('Error deleting project:', error)
    throw new Error('Failed to delete project')
  }

  revalidatePath('/rocks')
  revalidatePath('/')
}

/**
 * Mark project as complete
 */
export async function markProjectComplete(projectId: string): Promise<Project> {
  return updateProject(projectId, { status: 'Done' })
}

/**
 * Get projects by status for a team
 */
export async function getProjectsByStatus(teamId: string, status: string): Promise<ProjectWithTasks[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey(*),
      tasks(*)
    `)
    .eq('team_id', teamId)
    .eq('status', status)
    .is('deleted_at', null)
    .order('start_date', { ascending: true })

  if (error) {
    console.error('Error fetching projects by status:', error)
    return []
  }

  return data as ProjectWithTasks[]
}

// ============================================
// HOA: Approval Workflow Functions
// ============================================

/**
 * Submit a project for board approval
 * Only project owner or manager can submit
 */
export async function submitProjectForApproval(projectId: string): Promise<Project> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: project } = await (supabase as any)
    .from('projects')
    .select('team_id, owner_id, approval_status')
    .eq('id', projectId)
    .maybeSingle()

  if (!project) throw new Error('Project not found')

  if (project.approval_status !== 'proposed') {
    throw new Error('Project has already been submitted for approval')
  }

  // Check access - must be owner or manager
  if (project.owner_id !== user.id) {
    await requireTeamRole(project.team_id, 'manager')
  } else {
    await requireTeamAccess(project.team_id)
  }

  const { data: updated, error } = await (supabase as any)
    .from('projects')
    .update({
      approval_status: 'board_review',
    })
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Error submitting project for approval:', error)
    throw new Error('Failed to submit project for approval')
  }

  revalidatePath('/priorities')
  revalidatePath('/rocks')
  revalidatePath('/')
  return updated
}

/**
 * Approve a project (org admin / board only)
 */
export async function approveProject(projectId: string): Promise<Project> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam?.isOrgAdmin) {
    throw new Error('Access denied: only board admins can approve projects')
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: project } = await (supabase as any)
    .from('projects')
    .select('approval_status')
    .eq('id', projectId)
    .maybeSingle()

  if (!project) throw new Error('Project not found')

  if (project.approval_status !== 'board_review') {
    throw new Error('Project is not in board review status')
  }

  const { data: updated, error } = await (supabase as any)
    .from('projects')
    .update({
      approval_status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Error approving project:', error)
    throw new Error('Failed to approve project')
  }

  revalidatePath('/priorities')
  revalidatePath('/rocks')
  revalidatePath('/')
  return updated
}

/**
 * Reject a project (org admin / board only)
 */
export async function rejectProject(projectId: string, reason?: string): Promise<Project> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam?.isOrgAdmin) {
    throw new Error('Access denied: only board admins can reject projects')
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: updated, error } = await (supabase as any)
    .from('projects')
    .update({
      approval_status: 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Error rejecting project:', error)
    throw new Error('Failed to reject project')
  }

  revalidatePath('/priorities')
  revalidatePath('/rocks')
  revalidatePath('/')
  return updated
}

/**
 * Start an approved project
 */
export async function startProject(projectId: string): Promise<Project> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: project } = await (supabase as any)
    .from('projects')
    .select('team_id, owner_id, approval_status')
    .eq('id', projectId)
    .maybeSingle()

  if (!project) throw new Error('Project not found')

  if (project.approval_status !== 'approved') {
    throw new Error('Project must be approved before starting')
  }

  await requireTeamAccess(project.team_id)

  const { data: updated, error } = await (supabase as any)
    .from('projects')
    .update({
      approval_status: 'in_progress',
      status: 'Active',
    })
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Error starting project:', error)
    throw new Error('Failed to start project')
  }

  revalidatePath('/priorities')
  revalidatePath('/rocks')
  revalidatePath('/')
  return updated
}

/**
 * Complete an in-progress project
 */
export async function completeProject(projectId: string): Promise<Project> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: project } = await (supabase as any)
    .from('projects')
    .select('team_id, owner_id, approval_status')
    .eq('id', projectId)
    .maybeSingle()

  if (!project) throw new Error('Project not found')

  if (project.approval_status !== 'in_progress') {
    throw new Error('Project must be in progress to complete')
  }

  // Check access - must be owner or manager
  if (project.owner_id !== user.id) {
    await requireTeamRole(project.team_id, 'manager')
  } else {
    await requireTeamAccess(project.team_id)
  }

  const { data: updated, error } = await (supabase as any)
    .from('projects')
    .update({
      approval_status: 'completed',
      status: 'Done',
    })
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Error completing project:', error)
    throw new Error('Failed to complete project')
  }

  revalidatePath('/priorities')
  revalidatePath('/rocks')
  revalidatePath('/')
  return updated
}

// ============================================
// HOA: Budget Tracking Functions
// ============================================

/**
 * Update project budget
 */
export async function updateProjectBudget(
  projectId: string,
  data: {
    budget_amount?: number
    actual_cost?: number
  }
): Promise<Project> {
  return updateProject(projectId, data)
}

/**
 * Get budget summary for a project
 */
export async function getProjectBudgetSummary(projectId: string): Promise<ProjectBudgetSummary | null> {
  const supabase = await createClient()

  const { data: project } = await (supabase as any)
    .from('projects')
    .select(`
      id,
      title,
      budget_amount,
      actual_cost,
      milestones(budgeted_cost, actual_cost)
    `)
    .eq('id', projectId)
    .is('deleted_at', null)
    .maybeSingle()

  if (!project) return null

  // Verify team access before returning data
  const fullProject = await getProject(projectId)
  if (!fullProject) return null

  // Calculate totals from milestones
  const milestones = project.milestones || []
  const milestoneBudget = milestones.reduce((sum: number, m: { budgeted_cost?: number }) =>
    sum + (m.budgeted_cost || 0), 0)
  const milestoneActual = milestones.reduce((sum: number, m: { actual_cost?: number }) =>
    sum + (m.actual_cost || 0), 0)

  const budgetAmount = project.budget_amount || 0
  const actualCost = project.actual_cost || milestoneActual

  return {
    projectId: project.id,
    projectTitle: project.title,
    budgetAmount,
    actualCost,
    remainingBudget: budgetAmount - actualCost,
    percentUsed: budgetAmount > 0 ? (actualCost / budgetAmount) * 100 : 0,
    milestoneBudgetTotal: milestoneBudget,
    milestoneActualTotal: milestoneActual,
  }
}

/**
 * Get budget summary for all projects in a team
 */
export async function getTeamBudgetSummary(teamId: string): Promise<{
  totalBudget: number
  totalActual: number
  totalRemaining: number
  projectCount: number
  approvedProjectCount: number
}> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('projects')
    .select('budget_amount, actual_cost, approval_status')
    .eq('team_id', teamId)
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching team budget summary:', error)
    throw new Error('Failed to fetch team budget summary')
  }

  const projects = data || []
  const totalBudget = projects.reduce((sum: number, p: { budget_amount?: number }) =>
    sum + (p.budget_amount || 0), 0)
  const totalActual = projects.reduce((sum: number, p: { actual_cost?: number }) =>
    sum + (p.actual_cost || 0), 0)
  const approvedProjects = projects.filter((p: { approval_status: string }) =>
    ['approved', 'in_progress', 'completed'].includes(p.approval_status))

  return {
    totalBudget,
    totalActual,
    totalRemaining: totalBudget - totalActual,
    projectCount: projects.length,
    approvedProjectCount: approvedProjects.length,
  }
}

/**
 * Get projects by approval status for a team
 */
export async function getProjectsByApprovalStatus(
  teamId: string,
  status: ApprovalStatus
): Promise<ProjectWithTasks[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('projects')
    .select(`
      *,
      owner:profiles!projects_owner_id_fkey(*),
      tasks(*)
    `)
    .eq('team_id', teamId)
    .eq('approval_status', status)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching projects by approval status:', error)
    return []
  }

  return data as ProjectWithTasks[]
}
