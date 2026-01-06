'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess, requireTeamRole, getActiveTeam } from './auth'
import type { Project, ProjectWithTasks, ProjectWithMilestones, ProjectWithAll } from '@/types/supabase'

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
      owner:profiles(*),
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

  const { data, error } = await (supabase as any)
    .from('projects')
    .select(`
      *,
      owner:profiles(*),
      tasks(*)
    `)
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    console.error('Error fetching project:', error)
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

  const { data, error } = await (supabase as any)
    .from('projects')
    .select(`
      *,
      owner:profiles(*),
      milestones(*)
    `)
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    console.error('Error fetching project:', error)
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

  const { data, error } = await (supabase as any)
    .from('projects')
    .select(`
      *,
      owner:profiles(*),
      tasks(*),
      milestones(*)
    `)
    .eq('id', projectId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    console.error('Error fetching project:', error)
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
 */
export async function createProject(data: {
  rock_id: string
  title: string
  start_date?: string
  end_date?: string
  estimated_hours?: number
  owner_id?: string
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

  if (!rock) throw new Error('Rock not found')

  await requireTeamAccess(rock.team_id)

  const { data: project, error } = await (supabase as any)
    .from('projects')
    .insert({
      team_id: rock.team_id,
      rock_id: data.rock_id,
      title: data.title,
      start_date: data.start_date,
      end_date: data.end_date,
      estimated_hours: data.estimated_hours || 0,
      owner_id: data.owner_id || user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error)
    throw new Error('Failed to create project')
  }

  revalidatePath('/rocks')
  revalidatePath('/')
  return project
}

/**
 * Update a project
 */
export async function updateProject(
  projectId: string,
  data: Partial<Pick<Project, 'title' | 'status' | 'start_date' | 'end_date' | 'estimated_hours' | 'owner_id'>>
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
      owner:profiles(*),
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
