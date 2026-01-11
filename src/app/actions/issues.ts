'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess, getActiveTeam } from './auth'
import type { Issue, IssueWithRelations, IssuePriority, IssueStatus, IssueSource } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get issues for a team (team-scoped)
 * Issues are administrative tasks that need attention
 */
export async function getIssues(
  teamId: string,
  options?: {
    limit?: number
    offset?: number
    priorityId?: string  // Link to annual priority (rock)
    status?: IssueStatus
    priority?: IssuePriority
    assignedTo?: string
  }
): Promise<IssueWithRelations[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  let query = (supabase as any)
    .from('issues')
    .select(`
      *,
      owner:profiles!issues_owner_id_fkey(*),
      assigned_user:profiles!issues_assigned_to_fkey(*),
      priority_rock:rocks(id, title),
      customer:customers(id, name),
      categories:issue_domains(domain:domains(*)),
      vendors:issue_vendors(vendor:vendors(*))
    `)
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (options?.priorityId) {
    query = query.eq('priority_id', options.priorityId)
  }

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.priority) {
    query = query.eq('priority', options.priority)
  }

  if (options?.assignedTo) {
    query = query.eq('assigned_to', options.assignedTo)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching issues:', error)
    throw new Error('Failed to fetch issues')
  }

  // Transform the nested data
  return (data || []).map((issue: Record<string, unknown>) => {
    const { categories, vendors, ...rest } = issue
    return {
      ...rest,
      categories: Array.isArray(categories)
        ? categories.map((c: { domain: unknown }) => c.domain)
        : [],
      vendors: Array.isArray(vendors)
        ? vendors.map((v: { vendor: unknown }) => v.vendor)
        : [],
    }
  }) as IssueWithRelations[]
}

/**
 * Get issues for the active team
 */
export async function getActiveIssues(options?: {
  limit?: number
  offset?: number
  priorityId?: string
  status?: IssueStatus
  priority?: IssuePriority
}): Promise<IssueWithRelations[]> {
  const activeTeam = await getActiveTeam()

  if (!activeTeam?.team?.id) {
    return []
  }

  return getIssues(activeTeam.team.id, options)
}

/**
 * Get a single issue by ID
 */
export async function getIssue(issueId: string): Promise<IssueWithRelations | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('issues')
    .select(`
      *,
      owner:profiles!issues_owner_id_fkey(*),
      assigned_user:profiles!issues_assigned_to_fkey(*),
      priority_rock:rocks(id, title),
      customer:customers(id, name),
      categories:issue_domains(domain:domains(*)),
      vendors:issue_vendors(vendor:vendors(*))
    `)
    .eq('id', issueId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('Error fetching issue:', error)
    return null
  }

  // Verify team access before returning data
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null  // User doesn't have access
  }

  const { categories, vendors, ...rest } = data
  return {
    ...rest,
    categories: Array.isArray(categories)
      ? categories.map((c: { domain: unknown }) => c.domain)
      : [],
    vendors: Array.isArray(vendors)
      ? vendors.map((v: { vendor: unknown }) => v.vendor)
      : [],
  } as IssueWithRelations
}

/**
 * Create a new issue
 * Members can create issues in their team
 */
export async function createIssue(data: {
  team_id: string
  title: string
  description?: string
  issue_type?: string  // 'issue', 'task', 'action_item'
  priority?: IssuePriority
  status?: IssueStatus
  assigned_to?: string
  due_date?: string
  priority_id?: string  // Link to annual priority (rock)
  customer_id?: string
  customer_name?: string
  source?: IssueSource
  source_id?: string
  property_address?: string
  lot_number?: string
  category_ids?: string[]  // domains
  vendor_ids?: string[]
}): Promise<Issue> {
  const { userId } = await requireTeamAccess(data.team_id)
  const supabase = await createClient()

  // Create issue
  const { data: issue, error } = await (supabase as any)
    .from('issues')
    .insert({
      team_id: data.team_id,
      owner_id: userId,
      title: data.title,
      description: data.description,
      issue_type: data.issue_type || 'issue',
      priority: data.priority || 'medium',
      status: data.status || 'open',
      assigned_to: data.assigned_to,
      due_date: data.due_date,
      priority_id: data.priority_id,
      customer_id: data.customer_id,
      customer_name: data.customer_name,
      source: data.source || 'manual',
      source_id: data.source_id,
      property_address: data.property_address,
      lot_number: data.lot_number,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating issue:', error)
    throw new Error('Failed to create issue')
  }

  // Add category (domain) relations
  if (data.category_ids && data.category_ids.length > 0) {
    const categoryInserts = data.category_ids.map((domain_id) => ({
      issue_id: issue.id,
      domain_id,
    }))
    await (supabase as any).from('issue_domains').insert(categoryInserts)
  }

  // Add vendor relations
  if (data.vendor_ids && data.vendor_ids.length > 0) {
    const vendorInserts = data.vendor_ids.map((vendor_id) => ({
      issue_id: issue.id,
      vendor_id,
    }))
    await (supabase as any).from('issue_vendors').insert(vendorInserts)
  }

  revalidatePath('/issues')
  revalidatePath('/')
  revalidatePath('/priorities')
  return issue
}

/**
 * Update an issue
 * Members can edit ANY issue in their team
 */
export async function updateIssue(
  issueId: string,
  data: Partial<Pick<Issue,
    | 'title'
    | 'description'
    | 'issue_type'
    | 'priority'
    | 'status'
    | 'assigned_to'
    | 'due_date'
    | 'priority_id'
    | 'customer_id'
    | 'customer_name'
    | 'property_address'
    | 'lot_number'
  >> & {
    category_ids?: string[]
    vendor_ids?: string[]
  }
): Promise<Issue> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get issue's team to check access
  const { data: issue } = await (supabase as any)
    .from('issues')
    .select('team_id')
    .eq('id', issueId)
    .maybeSingle()

  if (!issue) throw new Error('Issue not found')

  // Any team member can edit
  await requireTeamAccess(issue.team_id)

  const { category_ids, vendor_ids, ...updateData } = data

  // Track who edited
  const updatePayload = {
    ...updateData,
    updated_at: new Date().toISOString()
  }

  const { data: updated, error } = await (supabase as any)
    .from('issues')
    .update(updatePayload)
    .eq('id', issueId)
    .select()
    .single()

  if (error) {
    console.error('Error updating issue:', error)
    throw new Error('Failed to update issue')
  }

  // Update category relations if provided
  if (category_ids !== undefined) {
    await (supabase as any)
      .from('issue_domains')
      .delete()
      .eq('issue_id', issueId)

    if (category_ids.length > 0) {
      const categoryInserts = category_ids.map((domain_id) => ({
        issue_id: issueId,
        domain_id,
      }))
      await (supabase as any).from('issue_domains').insert(categoryInserts)
    }
  }

  // Update vendor relations if provided
  if (vendor_ids !== undefined) {
    await (supabase as any)
      .from('issue_vendors')
      .delete()
      .eq('issue_id', issueId)

    if (vendor_ids.length > 0) {
      const vendorInserts = vendor_ids.map((vendor_id) => ({
        issue_id: issueId,
        vendor_id,
      }))
      await (supabase as any).from('issue_vendors').insert(vendorInserts)
    }
  }

  revalidatePath('/issues')
  revalidatePath('/')
  revalidatePath('/priorities')
  return updated
}

/**
 * Soft delete an issue
 * Only owner, manager, or org admin can delete
 */
export async function deleteIssue(issueId: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get issue's team and owner to check access
  const { data: issue } = await (supabase as any)
    .from('issues')
    .select('team_id, owner_id')
    .eq('id', issueId)
    .maybeSingle()

  if (!issue) throw new Error('Issue not found')

  // Check access - must be owner, manager, or org_admin
  const { userId, role, isOrgAdmin } = await requireTeamAccess(issue.team_id)

  const isOwner = issue.owner_id === user.id
  const canDelete = isOwner || role === 'manager' || isOrgAdmin

  if (!canDelete) {
    throw new Error('Access denied: only owner, manager, or org admin can delete issues')
  }

  const { error } = await (supabase as any)
    .from('issues')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', issueId)

  if (error) {
    console.error('Error deleting issue:', error)
    throw new Error('Failed to delete issue')
  }

  revalidatePath('/issues')
  revalidatePath('/')
  revalidatePath('/priorities')
}

/**
 * Get issue stats for a team
 */
export async function getIssueStats(teamId: string): Promise<{
  totalIssues: number
  openIssues: number
  inProgressIssues: number
  resolvedIssues: number
  urgentIssues: number
}> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('issues')
    .select('status, priority')
    .eq('team_id', teamId)
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching issue stats:', error)
    throw new Error('Failed to fetch issue stats')
  }

  return {
    totalIssues: data.length,
    openIssues: data.filter((i: { status: string }) => i.status === 'open').length,
    inProgressIssues: data.filter((i: { status: string }) => i.status === 'in_progress').length,
    resolvedIssues: data.filter((i: { status: string }) => i.status === 'resolved' || i.status === 'closed').length,
    urgentIssues: data.filter((i: { priority: string }) => i.priority === 'urgent').length,
  }
}

/**
 * Get active team's issue stats
 */
export async function getActiveIssueStats(): Promise<{
  totalIssues: number
  openIssues: number
  inProgressIssues: number
  resolvedIssues: number
  urgentIssues: number
}> {
  const activeTeam = await getActiveTeam()

  if (!activeTeam?.team?.id) {
    return { totalIssues: 0, openIssues: 0, inProgressIssues: 0, resolvedIssues: 0, urgentIssues: 0 }
  }

  return getIssueStats(activeTeam.team.id)
}

/**
 * Get issues by status
 */
export async function getIssuesByStatus(
  teamId: string,
  status: IssueStatus
): Promise<IssueWithRelations[]> {
  return getIssues(teamId, { status })
}

/**
 * Get issues assigned to a specific user
 */
export async function getAssignedIssues(
  teamId: string,
  userId: string
): Promise<IssueWithRelations[]> {
  return getIssues(teamId, { assignedTo: userId })
}

/**
 * Get overdue issues
 */
export async function getOverdueIssues(teamId: string): Promise<IssueWithRelations[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  const { data, error } = await (supabase as any)
    .from('issues')
    .select(`
      *,
      owner:profiles!issues_owner_id_fkey(*),
      assigned_user:profiles!issues_assigned_to_fkey(*),
      priority_rock:rocks(id, title),
      customer:customers(id, name),
      categories:issue_domains(domain:domains(*)),
      vendors:issue_vendors(vendor:vendors(*))
    `)
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .lt('due_date', today)
    .not('status', 'in', '("resolved","closed")')
    .order('due_date', { ascending: true })

  if (error) {
    console.error('Error fetching overdue issues:', error)
    return []
  }

  return (data || []).map((issue: Record<string, unknown>) => {
    const { categories, vendors, ...rest } = issue
    return {
      ...rest,
      categories: Array.isArray(categories)
        ? categories.map((c: { domain: unknown }) => c.domain)
        : [],
      vendors: Array.isArray(vendors)
        ? vendors.map((v: { vendor: unknown }) => v.vendor)
        : [],
    }
  }) as IssueWithRelations[]
}

// ============================================
// Legacy aliases for backward compatibility
// ============================================

/** @deprecated Use getIssues instead */
export const getEngagements = getIssues

/** @deprecated Use getActiveIssues instead */
export const getActiveEngagements = getActiveIssues

/** @deprecated Use getIssue instead */
export const getEngagement = getIssue

/** @deprecated Use createIssue instead */
export async function createEngagement(data: {
  team_id: string
  customer_name?: string
  customer_id?: string
  date?: string
  activity_type: string
  revenue_impact?: number
  gp_impact?: number
  notes?: string
  rock_id?: string
  domain_ids?: string[]
  oem_ids?: string[]
}): Promise<Issue> {
  // Map old engagement fields to new issue fields
  return createIssue({
    team_id: data.team_id,
    title: data.customer_name || 'Untitled Issue',
    description: data.notes,
    issue_type: data.activity_type,
    customer_id: data.customer_id,
    customer_name: data.customer_name,
    priority_id: data.rock_id,
    category_ids: data.domain_ids,
    vendor_ids: data.oem_ids,
  })
}

/** @deprecated Use updateIssue instead */
export const updateEngagement = updateIssue

/** @deprecated Use deleteIssue instead */
export const deleteEngagement = deleteIssue
