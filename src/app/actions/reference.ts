'use server'

import { createClient } from '@/lib/supabase/server'
import { getActiveTeam } from './auth'
import { getTeamMembers } from './teams'
import type { Domain, OEM, Profile, Customer } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get all domains (reference data, not team-scoped)
 */
export async function getDomains(): Promise<Domain[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('domains')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching domains:', error)
    throw new Error('Failed to fetch domains')
  }

  return data
}

/**
 * Get all OEMs (reference data, not team-scoped)
 */
export async function getOEMs(): Promise<OEM[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('oems')
    .select('*')
    .order('name')

  if (error) {
    console.error('Error fetching OEMs:', error)
    throw new Error('Failed to fetch OEMs')
  }

  return data
}

/**
 * Get profiles in the current user's org (for admin purposes)
 * Scoped to org to prevent cross-tenant enumeration
 */
export async function getProfiles(): Promise<Profile[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) return []

  const supabase = await createClient()

  // Get profiles that are members of teams in the same org
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select(`
      *,
      team_memberships!inner(
        team:teams!inner(org_id)
      )
    `)
    .eq('team_memberships.team.org_id', activeTeam.org.id)
    .order('full_name')

  if (error) {
    console.error('Error fetching profiles:', error)
    throw new Error('Failed to fetch profiles')
  }

  // Dedupe profiles (user may be in multiple teams)
  const seen = new Set<string>()
  return (data || []).filter((p: Profile) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

/**
 * Get team members as profiles (for dropdowns/selectors)
 */
export async function getTeamProfiles(teamId: string): Promise<Profile[]> {
  const members = await getTeamMembers(teamId)
  return members.map(m => m.user)
}

/**
 * Get active team's members as profiles
 */
export async function getActiveTeamProfiles(): Promise<Profile[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) return []

  return getTeamProfiles(activeTeam.team.id)
}

/**
 * Get current user's profile
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching current profile:', error)
    return null
  }

  return data
}

/**
 * Update current user's profile
 */
export async function updateProfile(data: {
  full_name?: string
  avatar_url?: string
  capacity_hours?: number
}): Promise<Profile> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile, error } = await (supabase as any)
    .from('profiles')
    .update(data)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    console.error('Error updating profile:', error)
    throw new Error('Failed to update profile')
  }

  return profile
}

/**
 * Get customers for an org (org-scoped, NOT team-scoped)
 */
export async function getOrgCustomers(orgId: string): Promise<Customer[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('customers')
    .select('*')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('Error fetching customers:', error)
    return []
  }

  return data as Customer[]
}

/**
 * Get customers for active team's org
 */
export async function getActiveOrgCustomers(): Promise<Customer[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) return []

  return getOrgCustomers(activeTeam.org.id)
}

/**
 * Search profiles by name (scoped to current user's org)
 */
export async function searchProfiles(query: string): Promise<Profile[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) return []

  const supabase = await createClient()

  // Search profiles within the same org only
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select(`
      *,
      team_memberships!inner(
        team:teams!inner(org_id)
      )
    `)
    .eq('team_memberships.team.org_id', activeTeam.org.id)
    .ilike('full_name', `%${query}%`)
    .order('full_name')
    .limit(20)

  if (error) {
    console.error('Error searching profiles:', error)
    return []
  }

  // Dedupe profiles
  const seen = new Set<string>()
  return (data || []).filter((p: Profile) => {
    if (seen.has(p.id)) return false
    seen.add(p.id)
    return true
  })
}

/**
 * Get quarters available for the active team
 */
export async function getQuarters(): Promise<string[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) return ['Q1 2026']

  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('rocks')
    .select('quarter')
    .eq('team_id', activeTeam.team.id)
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching quarters:', error)
    return ['Q1 2026']
  }

  const quarters = data.map((r: { quarter: string }) => r.quarter) as string[]
  const uniqueQuarters = [...new Set(quarters)]
  return uniqueQuarters.length > 0 ? uniqueQuarters.sort().reverse() : ['Q1 2026']
}

// ============================================
// ADMIN: Domain Management
// ============================================

/**
 * Create a new domain (org admin only)
 */
export async function createDomain(data: {
  name: string
  color?: string
}): Promise<Domain> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam?.isOrgAdmin) {
    throw new Error('Access denied: org admin required')
  }

  const supabase = await createClient()

  const { data: domain, error } = await (supabase as any)
    .from('domains')
    .insert({
      name: data.name,
      color: data.color || 'default',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating domain:', error)
    throw new Error('Failed to create domain')
  }

  return domain
}

/**
 * Update a domain (org admin only)
 */
export async function updateDomain(
  domainId: string,
  data: { name?: string; color?: string }
): Promise<Domain> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam?.isOrgAdmin) {
    throw new Error('Access denied: org admin required')
  }

  const supabase = await createClient()

  const { data: domain, error } = await (supabase as any)
    .from('domains')
    .update(data)
    .eq('id', domainId)
    .select()
    .single()

  if (error) {
    console.error('Error updating domain:', error)
    throw new Error('Failed to update domain')
  }

  return domain
}

/**
 * Delete a domain (org admin only)
 */
export async function deleteDomain(domainId: string): Promise<void> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam?.isOrgAdmin) {
    throw new Error('Access denied: org admin required')
  }

  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('domains')
    .delete()
    .eq('id', domainId)

  if (error) {
    console.error('Error deleting domain:', error)
    throw new Error('Failed to delete domain')
  }
}

// ============================================
// ADMIN: OEM Management
// ============================================

/**
 * Create a new OEM (org admin only)
 */
export async function createOEM(data: {
  name: string
  logo_url?: string
}): Promise<OEM> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam?.isOrgAdmin) {
    throw new Error('Access denied: org admin required')
  }

  const supabase = await createClient()

  const { data: oem, error } = await (supabase as any)
    .from('oems')
    .insert({
      name: data.name,
      logo_url: data.logo_url || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating OEM:', error)
    throw new Error('Failed to create OEM')
  }

  return oem
}

/**
 * Update an OEM (org admin only)
 */
export async function updateOEM(
  oemId: string,
  data: { name?: string; logo_url?: string }
): Promise<OEM> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam?.isOrgAdmin) {
    throw new Error('Access denied: org admin required')
  }

  const supabase = await createClient()

  const { data: oem, error } = await (supabase as any)
    .from('oems')
    .update(data)
    .eq('id', oemId)
    .select()
    .single()

  if (error) {
    console.error('Error updating OEM:', error)
    throw new Error('Failed to update OEM')
  }

  return oem
}

/**
 * Delete an OEM (org admin only)
 */
export async function deleteOEM(oemId: string): Promise<void> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam?.isOrgAdmin) {
    throw new Error('Access denied: org admin required')
  }

  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('oems')
    .delete()
    .eq('id', oemId)

  if (error) {
    console.error('Error deleting OEM:', error)
    throw new Error('Failed to delete OEM')
  }
}
