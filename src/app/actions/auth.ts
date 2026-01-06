'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import type {
  Profile,
  Team,
  Org,
  TeamRole,
  TeamMembership,
  UserWithRoles,
  ActiveTeamContext
} from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

const ACTIVE_TEAM_COOKIE = 'hw_active_team'

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<Profile | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return profile
}

/**
 * Get the current user with all their org/team roles
 */
export async function getCurrentUserWithRoles(): Promise<UserWithRoles | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get profile
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  // Get team memberships with team and org info
  const { data: memberships } = await (supabase as any)
    .from('team_memberships')
    .select(`
      id,
      role,
      team:teams(
        id,
        name,
        description,
        org:orgs(id, name)
      )
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  // Get orgs where user is admin
  const { data: adminOrgs } = await (supabase as any)
    .from('org_admins')
    .select(`
      org:orgs(id, name)
    `)
    .eq('user_id', user.id)

  // Build teams array with roles
  const teams = (memberships || []).map((m: any) => ({
    ...m.team,
    role: m.role as TeamRole,
    org: m.team?.org
  }))

  // Build orgs where user is admin
  const orgsAdmin = (adminOrgs || [])
    .map((a: any) => a.org)
    .filter(Boolean)

  return {
    ...profile,
    teams,
    orgsAdmin
  }
}

/**
 * Get the active team from cookie, with full context
 */
export async function getActiveTeam(): Promise<ActiveTeamContext | null> {
  const cookieStore = await cookies()
  const activeTeamId = cookieStore.get(ACTIVE_TEAM_COOKIE)?.value

  if (!activeTeamId) {
    // Try to get the first team the user belongs to
    const userWithRoles = await getCurrentUserWithRoles()
    if (!userWithRoles || userWithRoles.teams.length === 0) {
      return null
    }

    const firstTeam = userWithRoles.teams[0]
    // Set this as the active team
    await setActiveTeam(firstTeam.id)

    return {
      team: firstTeam as Team,
      org: firstTeam.org as Org,
      role: firstTeam.role,
      isOrgAdmin: userWithRoles.orgsAdmin.some((o: Org) => o.id === firstTeam.org?.id)
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get team with org
  const { data: team } = await (supabase as any)
    .from('teams')
    .select(`
      *,
      org:orgs(*)
    `)
    .eq('id', activeTeamId)
    .is('deleted_at', null)
    .single()

  if (!team) return null

  // Get user's role in this team
  const { data: membership } = await (supabase as any)
    .from('team_memberships')
    .select('role')
    .eq('team_id', activeTeamId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  if (!membership) return null

  // Check if user is org admin
  // Use maybeSingle() instead of single() - single() errors on 0 rows
  const { data: orgAdmin } = await (supabase as any)
    .from('org_admins')
    .select('id')
    .eq('org_id', team.org_id)
    .eq('user_id', user.id)
    .maybeSingle()

  return {
    team: team as Team,
    org: team.org as Org,
    role: membership.role as TeamRole,
    isOrgAdmin: !!orgAdmin
  }
}

/**
 * Set the active team (stored in cookie)
 * Validates user has access before setting
 */
export async function setActiveTeam(teamId: string): Promise<void> {
  // Validate user has access to this team before setting cookie
  await requireTeamAccess(teamId)

  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_TEAM_COOKIE, teamId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365 // 1 year
  })
}

/**
 * Require user to have access to a team. Throws if no access.
 */
export async function requireTeamAccess(teamId: string): Promise<{
  userId: string
  role: TeamRole
  isOrgAdmin: boolean
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Check team membership
  const { data: membership } = await (supabase as any)
    .from('team_memberships')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .single()

  // Get team's org to check org admin status
  const { data: team } = await (supabase as any)
    .from('teams')
    .select('org_id')
    .eq('id', teamId)
    .single()

  if (!team) throw new Error('Team not found')

  // Check if org admin - use maybeSingle() to avoid error on 0 rows
  const { data: orgAdmin } = await (supabase as any)
    .from('org_admins')
    .select('id')
    .eq('org_id', team.org_id)
    .eq('user_id', user.id)
    .maybeSingle()

  const isOrgAdmin = !!orgAdmin

  // User must be either team member or org admin
  if (!membership && !isOrgAdmin) {
    throw new Error('Access denied: not a member of this team')
  }

  return {
    userId: user.id,
    role: membership?.role || 'tsa', // Org admins get tsa role if not explicit member
    isOrgAdmin
  }
}

/**
 * Require user to have a specific role in a team. Throws if not.
 */
export async function requireTeamRole(teamId: string, requiredRole: TeamRole): Promise<{
  userId: string
  role: TeamRole
  isOrgAdmin: boolean
}> {
  const access = await requireTeamAccess(teamId)

  // Org admins bypass role checks
  if (access.isOrgAdmin) return access

  // Manager role includes tsa privileges
  if (requiredRole === 'tsa') return access

  // Must be manager
  if (access.role !== 'manager') {
    throw new Error(`Access denied: requires ${requiredRole} role`)
  }

  return access
}

/**
 * Require user to be an org admin. Throws if not.
 */
export async function requireOrgAdmin(orgId: string): Promise<{ userId: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Use maybeSingle() to avoid error on 0 rows (RLS might also block)
  const { data: orgAdmin } = await (supabase as any)
    .from('org_admins')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!orgAdmin) {
    throw new Error('Access denied: org admin required')
  }

  return { userId: user.id }
}

/**
 * Check if current user can edit an engagement (TSA can edit any team engagement)
 */
export async function canEditEngagement(engagementId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  // Get engagement's team
  const { data: engagement } = await (supabase as any)
    .from('engagements')
    .select('team_id')
    .eq('id', engagementId)
    .is('deleted_at', null)
    .single()

  if (!engagement) return false

  // Check team access - any team member can edit
  try {
    await requireTeamAccess(engagement.team_id)
    return true
  } catch {
    return false
  }
}

/**
 * Get all teams for current user
 */
export async function getUserTeams(): Promise<(Team & { role: TeamRole; org: Org })[]> {
  const userWithRoles = await getCurrentUserWithRoles()
  if (!userWithRoles) return []

  return userWithRoles.teams
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Clear active team cookie
  const cookieStore = await cookies()
  cookieStore.delete(ACTIVE_TEAM_COOKIE)
}
