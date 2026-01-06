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
 * Get all profiles (for admin purposes)
 */
export async function getProfiles(): Promise<Profile[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .order('full_name')

  if (error) {
    console.error('Error fetching profiles:', error)
    throw new Error('Failed to fetch profiles')
  }

  return data
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
 * Search profiles by name
 */
export async function searchProfiles(query: string): Promise<Profile[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('*')
    .ilike('full_name', `%${query}%`)
    .order('full_name')
    .limit(20)

  if (error) {
    console.error('Error searching profiles:', error)
    return []
  }

  return data
}

/**
 * Get quarters available in the system
 */
export async function getQuarters(): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('rocks')
    .select('quarter')
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching quarters:', error)
    return ['Q1 2026']
  }

  const quarters = data.map((r: { quarter: string }) => r.quarter) as string[]
  const uniqueQuarters = [...new Set(quarters)]
  return uniqueQuarters.sort().reverse()
}
