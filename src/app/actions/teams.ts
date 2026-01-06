'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAdmin, requireTeamAccess, requireTeamRole, setActiveTeam, getActiveTeam } from './auth'
import type { Team, TeamMembership, TeamRole, Profile, TeamWithMembers, TeamWithOrg } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get all teams in an org
 */
export async function getTeams(orgId: string): Promise<TeamWithOrg[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await (supabase as any)
    .from('teams')
    .select(`
      *,
      org:orgs(*)
    `)
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('Error fetching teams:', error)
    throw new Error('Failed to fetch teams')
  }

  return data as TeamWithOrg[]
}

/**
 * Get a single team with org
 */
export async function getTeam(teamId: string): Promise<TeamWithOrg | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('teams')
    .select(`
      *,
      org:orgs(*)
    `)
    .eq('id', teamId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Error fetching team:', error)
    return null
  }

  return data as TeamWithOrg
}

/**
 * Create a new team (org admin only)
 */
export async function createTeam(data: {
  org_id: string
  name: string
  description?: string
}): Promise<Team> {
  const { userId } = await requireOrgAdmin(data.org_id)
  const supabase = await createClient()

  const { data: team, error } = await (supabase as any)
    .from('teams')
    .insert({
      org_id: data.org_id,
      name: data.name,
      description: data.description
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating team:', error)
    throw new Error('Failed to create team')
  }

  // Auto-add creator as manager
  await (supabase as any)
    .from('team_memberships')
    .insert({
      team_id: team.id,
      user_id: userId,
      role: 'manager'
    })

  revalidatePath('/settings/admin')
  return team
}

/**
 * Update a team (manager or org admin)
 */
export async function updateTeam(
  teamId: string,
  data: Partial<Pick<Team, 'name' | 'description'>>
): Promise<Team> {
  await requireTeamRole(teamId, 'manager')
  const supabase = await createClient()

  const { data: team, error } = await (supabase as any)
    .from('teams')
    .update(data)
    .eq('id', teamId)
    .select()
    .single()

  if (error) {
    console.error('Error updating team:', error)
    throw new Error('Failed to update team')
  }

  revalidatePath('/settings/admin')
  return team
}

/**
 * Soft delete a team (org admin only)
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const supabase = await createClient()

  // Get team's org
  const { data: team } = await (supabase as any)
    .from('teams')
    .select('org_id')
    .eq('id', teamId)
    .single()

  if (!team) throw new Error('Team not found')

  const { userId } = await requireOrgAdmin(team.org_id)

  const { error } = await (supabase as any)
    .from('teams')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', teamId)

  if (error) {
    console.error('Error deleting team:', error)
    throw new Error('Failed to delete team')
  }

  // If this was the active team, clear it
  const activeTeam = await getActiveTeam()
  if (activeTeam?.team.id === teamId) {
    // This will pick a new team automatically
    await setActiveTeam('')
  }

  revalidatePath('/settings/admin')
}

/**
 * Get team members
 */
export async function getTeamMembers(teamId: string): Promise<(TeamMembership & { user: Profile })[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('team_memberships')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .order('created_at')

  if (error) {
    console.error('Error fetching team members:', error)
    throw new Error('Failed to fetch team members')
  }

  return data as (TeamMembership & { user: Profile })[]
}

/**
 * Get team with members
 */
export async function getTeamWithMembers(teamId: string): Promise<TeamWithMembers | null> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data: team, error: teamError } = await (supabase as any)
    .from('teams')
    .select('*')
    .eq('id', teamId)
    .is('deleted_at', null)
    .single()

  if (teamError || !team) {
    console.error('Error fetching team:', teamError)
    return null
  }

  const { data: memberships } = await (supabase as any)
    .from('team_memberships')
    .select(`
      id,
      role,
      user:profiles(*)
    `)
    .eq('team_id', teamId)
    .is('deleted_at', null)

  return {
    ...team,
    members: (memberships || []).map((m: any) => ({
      ...m.user,
      role: m.role
    }))
  } as TeamWithMembers
}

/**
 * Add a member to a team (manager or org admin)
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: TeamRole = 'tsa'
): Promise<TeamMembership> {
  await requireTeamRole(teamId, 'manager')
  const supabase = await createClient()

  // Check if membership already exists (including soft-deleted)
  const { data: existing } = await (supabase as any)
    .from('team_memberships')
    .select('id, deleted_at')
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    if (existing.deleted_at) {
      // Restore soft-deleted membership
      const { data: restored, error } = await (supabase as any)
        .from('team_memberships')
        .update({
          role,
          deleted_at: null,
          deleted_by: null
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw new Error('Failed to restore membership')

      revalidatePath('/settings/admin')
      return restored
    }
    throw new Error('User is already a member of this team')
  }

  const { data: membership, error } = await (supabase as any)
    .from('team_memberships')
    .insert({
      team_id: teamId,
      user_id: userId,
      role
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding team member:', error)
    throw new Error('Failed to add team member')
  }

  revalidatePath('/settings/admin')
  return membership
}

/**
 * Update a team member's role (manager or org admin)
 */
export async function updateTeamMemberRole(
  teamId: string,
  userId: string,
  role: TeamRole
): Promise<TeamMembership> {
  await requireTeamRole(teamId, 'manager')
  const supabase = await createClient()

  const { data: membership, error } = await (supabase as any)
    .from('team_memberships')
    .update({ role })
    .eq('team_id', teamId)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .select()
    .single()

  if (error) {
    console.error('Error updating team member role:', error)
    throw new Error('Failed to update team member role')
  }

  revalidatePath('/settings/admin')
  return membership
}

/**
 * Remove a member from a team (soft delete, manager or org admin)
 */
export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  const { userId: actorId } = await requireTeamRole(teamId, 'manager')
  const supabase = await createClient()

  // Prevent removing self if last manager
  const { data: managers } = await (supabase as any)
    .from('team_memberships')
    .select('user_id')
    .eq('team_id', teamId)
    .eq('role', 'manager')
    .is('deleted_at', null)

  if (managers?.length === 1 && managers[0].user_id === userId) {
    throw new Error('Cannot remove the last manager from a team')
  }

  const { error } = await (supabase as any)
    .from('team_memberships')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: actorId
    })
    .eq('team_id', teamId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error removing team member:', error)
    throw new Error('Failed to remove team member')
  }

  revalidatePath('/settings/admin')
}

/**
 * Switch to a different team (updates cookie)
 */
export async function switchTeam(teamId: string): Promise<void> {
  await requireTeamAccess(teamId)
  await setActiveTeam(teamId)
  revalidatePath('/')
}

/**
 * Re-export setActiveTeam and getActiveTeam for convenience
 */
export { setActiveTeam, getActiveTeam }
