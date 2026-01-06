'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Project, ProjectWithTasks } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getProjects(rockId?: string): Promise<ProjectWithTasks[]> {
  const supabase = await createClient()

  let query = (supabase as any)
    .from('projects')
    .select(`
      *,
      owner:profiles(*),
      tasks(*)
    `)
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

export async function createProject(data: {
  rock_id: string
  title: string
  start_date?: string
  end_date?: string
  estimated_hours?: number
}): Promise<Project> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: project, error } = await (supabase as any)
    .from('projects')
    .insert({
      rock_id: data.rock_id,
      title: data.title,
      start_date: data.start_date,
      end_date: data.end_date,
      estimated_hours: data.estimated_hours || 0,
      owner_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating project:', error)
    throw new Error('Failed to create project')
  }

  revalidatePath('/climb')
  revalidatePath('/')
  return project
}

export async function updateProject(
  projectId: string,
  data: Partial<Pick<Project, 'title' | 'status' | 'start_date' | 'end_date' | 'estimated_hours'>>
): Promise<Project> {
  const supabase = await createClient()

  const { data: project, error } = await (supabase as any)
    .from('projects')
    .update(data)
    .eq('id', projectId)
    .select()
    .single()

  if (error) {
    console.error('Error updating project:', error)
    throw new Error('Failed to update project')
  }

  revalidatePath('/climb')
  revalidatePath('/')
  return project
}

export async function deleteProject(projectId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) {
    console.error('Error deleting project:', error)
    throw new Error('Failed to delete project')
  }

  revalidatePath('/climb')
  revalidatePath('/')
}

export async function markProjectComplete(projectId: string): Promise<Project> {
  return updateProject(projectId, { status: 'Done' })
}
