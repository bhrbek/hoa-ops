'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from './auth'
import type { Org, OrgAdmin, Profile } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get an org by ID
 */
export async function getOrg(orgId: string): Promise<Org | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('orgs')
    .select('*')
    .eq('id', orgId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Error fetching org:', error)
    return null
  }

  return data as Org
}

/**
 * Get orgs that current user has access to
 */
export async function getUserOrgs(): Promise<Org[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get orgs from team memberships
  const { data: fromTeams } = await (supabase as any)
    .from('team_memberships')
    .select(`
      team:teams(org:orgs(*))
    `)
    .eq('user_id', user.id)
    .is('deleted_at', null)

  // Get orgs from admin role
  const { data: fromAdmin } = await (supabase as any)
    .from('org_admins')
    .select('org:orgs(*)')
    .eq('user_id', user.id)

  // Combine and dedupe
  const orgsMap = new Map<string, Org>()

  for (const item of fromTeams || []) {
    const org = item.team?.org
    if (org && !orgsMap.has(org.id)) {
      orgsMap.set(org.id, org)
    }
  }

  for (const item of fromAdmin || []) {
    const org = item.org
    if (org && !orgsMap.has(org.id)) {
      orgsMap.set(org.id, org)
    }
  }

  return Array.from(orgsMap.values())
}

/**
 * Update an org (org admin only)
 */
export async function updateOrg(
  orgId: string,
  data: Partial<Pick<Org, 'name' | 'slug'>>
): Promise<Org> {
  await requireOrgAdmin(orgId)
  const supabase = await createClient()

  const { data: org, error } = await (supabase as any)
    .from('orgs')
    .update(data)
    .eq('id', orgId)
    .select()
    .single()

  if (error) {
    console.error('Error updating org:', error)
    throw new Error('Failed to update org')
  }

  revalidatePath('/settings/admin')
  return org
}

/**
 * Get org admins
 */
export async function getOrgAdmins(orgId: string): Promise<(OrgAdmin & { user: Profile })[]> {
  await requireOrgAdmin(orgId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('org_admins')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('org_id', orgId)
    .order('created_at')

  if (error) {
    console.error('Error fetching org admins:', error)
    throw new Error('Failed to fetch org admins')
  }

  return data as (OrgAdmin & { user: Profile })[]
}

/**
 * Add an org admin (org admin only)
 */
export async function addOrgAdmin(orgId: string, userId: string): Promise<OrgAdmin> {
  await requireOrgAdmin(orgId)
  const supabase = await createClient()

  // Check if already admin
  const { data: existing } = await (supabase as any)
    .from('org_admins')
    .select('id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    throw new Error('User is already an org admin')
  }

  const { data: admin, error } = await (supabase as any)
    .from('org_admins')
    .insert({
      org_id: orgId,
      user_id: userId
    })
    .select()
    .single()

  if (error) {
    console.error('Error adding org admin:', error)
    throw new Error('Failed to add org admin')
  }

  revalidatePath('/settings/admin')
  return admin
}

/**
 * Remove an org admin (org admin only)
 */
export async function removeOrgAdmin(orgId: string, userId: string): Promise<void> {
  await requireOrgAdmin(orgId)
  const supabase = await createClient()

  // Prevent removing last admin
  const { data: admins } = await (supabase as any)
    .from('org_admins')
    .select('user_id')
    .eq('org_id', orgId)

  if (admins?.length === 1) {
    throw new Error('Cannot remove the last org admin')
  }

  const { error } = await (supabase as any)
    .from('org_admins')
    .delete()
    .eq('org_id', orgId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error removing org admin:', error)
    throw new Error('Failed to remove org admin')
  }

  revalidatePath('/settings/admin')
}
