'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess, getActiveTeam } from './auth'
import type { Engagement, EngagementWithRelations, ActivityType } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get engagements for a team (team-scoped, not user-scoped)
 */
export async function getEngagements(
  teamId: string,
  options?: {
    limit?: number
    offset?: number
    rockId?: string
    customerId?: string
  }
): Promise<EngagementWithRelations[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  let query = (supabase as any)
    .from('engagements')
    .select(`
      *,
      owner:profiles!engagements_owner_id_fkey(*),
      rock:rocks(id, title),
      customer:customers(id, name),
      domains:engagement_domains(domain:domains(*)),
      oems:engagement_oems(oem:oems(*))
    `)
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .order('date', { ascending: false })

  if (options?.rockId) {
    query = query.eq('rock_id', options.rockId)
  }

  if (options?.customerId) {
    query = query.eq('customer_id', options.customerId)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching engagements:', error)
    throw new Error('Failed to fetch engagements')
  }

  // Transform the nested data
  return (data || []).map((engagement: Record<string, unknown>) => {
    const { domains, oems, ...rest } = engagement
    return {
      ...rest,
      domains: Array.isArray(domains)
        ? domains.map((d: { domain: unknown }) => d.domain)
        : [],
      oems: Array.isArray(oems)
        ? oems.map((o: { oem: unknown }) => o.oem)
        : [],
    }
  }) as EngagementWithRelations[]
}

/**
 * Get engagements for the active team
 */
export async function getActiveEngagements(options?: {
  limit?: number
  offset?: number
  rockId?: string
}): Promise<EngagementWithRelations[]> {
  console.log('[getActiveEngagements] Starting with options:', options)

  const activeTeam = await getActiveTeam()
  console.log('[getActiveEngagements] Active team:', activeTeam?.team?.id)

  if (!activeTeam?.team?.id) {
    console.log('[getActiveEngagements] No active team, returning empty')
    return []
  }

  return getEngagements(activeTeam.team.id, options)
}

/**
 * Get a single engagement
 */
export async function getEngagement(engagementId: string): Promise<EngagementWithRelations | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('engagements')
    .select(`
      *,
      owner:profiles!engagements_owner_id_fkey(*),
      rock:rocks(id, title),
      customer:customers(id, name),
      domains:engagement_domains(domain:domains(*)),
      oems:engagement_oems(oem:oems(*))
    `)
    .eq('id', engagementId)
    .is('deleted_at', null)
    .single()

  if (error || !data) {
    console.error('Error fetching engagement:', error)
    return null
  }

  // Verify team access before returning data
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null  // User doesn't have access
  }

  const { domains, oems, ...rest } = data
  return {
    ...rest,
    domains: Array.isArray(domains)
      ? domains.map((d: { domain: unknown }) => d.domain)
      : [],
    oems: Array.isArray(oems)
      ? oems.map((o: { oem: unknown }) => o.oem)
      : [],
  } as EngagementWithRelations
}

/**
 * Create a new engagement
 * TSAs can create engagements in their team
 */
export async function createEngagement(data: {
  team_id: string
  customer_name?: string
  customer_id?: string
  date?: string
  activity_type: ActivityType
  revenue_impact?: number
  gp_impact?: number
  notes?: string
  rock_id?: string
  domain_ids?: string[]
  oem_ids?: string[]
}): Promise<Engagement> {
  const { userId } = await requireTeamAccess(data.team_id)
  const supabase = await createClient()

  // Create engagement
  const { data: engagement, error } = await (supabase as any)
    .from('engagements')
    .insert({
      team_id: data.team_id,
      owner_id: userId,
      customer_name: data.customer_name,
      customer_id: data.customer_id,
      date: data.date || new Date().toISOString().split('T')[0],
      activity_type: data.activity_type,
      revenue_impact: data.revenue_impact || 0,
      gp_impact: data.gp_impact || 0,
      notes: data.notes,
      rock_id: data.rock_id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating engagement:', error)
    throw new Error('Failed to create engagement')
  }

  // Add domain relations
  if (data.domain_ids && data.domain_ids.length > 0) {
    const domainInserts = data.domain_ids.map((domain_id) => ({
      engagement_id: engagement.id,
      domain_id,
    }))
    await (supabase as any).from('engagement_domains').insert(domainInserts)
  }

  // Add OEM relations
  if (data.oem_ids && data.oem_ids.length > 0) {
    const oemInserts = data.oem_ids.map((oem_id) => ({
      engagement_id: engagement.id,
      oem_id,
    }))
    await (supabase as any).from('engagement_oems').insert(oemInserts)
  }

  revalidatePath('/stream')
  revalidatePath('/')
  revalidatePath('/rocks')
  return engagement
}

/**
 * Update an engagement
 * TSAs can edit ANY engagement in their team (handoff support)
 */
export async function updateEngagement(
  engagementId: string,
  data: Partial<Pick<Engagement, 'customer_name' | 'customer_id' | 'date' | 'activity_type' | 'revenue_impact' | 'gp_impact' | 'notes' | 'rock_id'>> & {
    domain_ids?: string[]
    oem_ids?: string[]
  }
): Promise<Engagement> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get engagement's team to check access - use maybeSingle() as engagement might not exist
  const { data: engagement } = await (supabase as any)
    .from('engagements')
    .select('team_id')
    .eq('id', engagementId)
    .maybeSingle()

  if (!engagement) throw new Error('Engagement not found')

  // Any team member can edit (handoff support)
  await requireTeamAccess(engagement.team_id)

  const { domain_ids, oem_ids, ...updateData } = data

  // Track who edited
  const updatePayload = {
    ...updateData,
    last_edited_by: user.id,
    last_edited_at: new Date().toISOString()
  }

  const { data: updated, error } = await (supabase as any)
    .from('engagements')
    .update(updatePayload)
    .eq('id', engagementId)
    .select()
    .single()

  if (error) {
    console.error('Error updating engagement:', error)
    throw new Error('Failed to update engagement')
  }

  // Update domain relations if provided
  if (domain_ids !== undefined) {
    await (supabase as any)
      .from('engagement_domains')
      .delete()
      .eq('engagement_id', engagementId)

    if (domain_ids.length > 0) {
      const domainInserts = domain_ids.map((domain_id) => ({
        engagement_id: engagementId,
        domain_id,
      }))
      await (supabase as any).from('engagement_domains').insert(domainInserts)
    }
  }

  // Update OEM relations if provided
  if (oem_ids !== undefined) {
    await (supabase as any)
      .from('engagement_oems')
      .delete()
      .eq('engagement_id', engagementId)

    if (oem_ids.length > 0) {
      const oemInserts = oem_ids.map((oem_id) => ({
        engagement_id: engagementId,
        oem_id,
      }))
      await (supabase as any).from('engagement_oems').insert(oemInserts)
    }
  }

  revalidatePath('/stream')
  revalidatePath('/')
  revalidatePath('/rocks')
  return updated
}

/**
 * Soft delete an engagement
 */
export async function deleteEngagement(engagementId: string): Promise<void> {
  const supabase = await createClient()

  // Get engagement's team to check access - use maybeSingle() as engagement might not exist
  const { data: engagement } = await (supabase as any)
    .from('engagements')
    .select('team_id')
    .eq('id', engagementId)
    .maybeSingle()

  if (!engagement) throw new Error('Engagement not found')

  const { userId } = await requireTeamAccess(engagement.team_id)

  const { error } = await (supabase as any)
    .from('engagements')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', engagementId)

  if (error) {
    console.error('Error deleting engagement:', error)
    throw new Error('Failed to delete engagement')
  }

  revalidatePath('/stream')
  revalidatePath('/')
  revalidatePath('/rocks')
}

/**
 * Get engagement stats for a team
 */
export async function getEngagementStats(teamId: string): Promise<{
  totalRevenue: number
  totalGP: number
  engagementCount: number
  workshopCount: number
}> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('engagements')
    .select('revenue_impact, gp_impact, activity_type')
    .eq('team_id', teamId)
    .is('deleted_at', null)

  if (error) {
    console.error('Error fetching engagement stats:', error)
    throw new Error('Failed to fetch engagement stats')
  }

  return {
    totalRevenue: data.reduce((sum: number, e: { revenue_impact?: number }) => sum + (e.revenue_impact || 0), 0),
    totalGP: data.reduce((sum: number, e: { gp_impact?: number }) => sum + (e.gp_impact || 0), 0),
    engagementCount: data.length,
    workshopCount: data.filter((e: { activity_type: string }) => e.activity_type === 'Workshop').length,
  }
}

/**
 * Get active team's engagement stats
 */
export async function getActiveEngagementStats(): Promise<{
  totalRevenue: number
  totalGP: number
  engagementCount: number
  workshopCount: number
}> {
  console.log('[getActiveEngagementStats] Starting')

  const activeTeam = await getActiveTeam()
  console.log('[getActiveEngagementStats] Active team:', activeTeam?.team?.id)

  if (!activeTeam?.team?.id) {
    console.log('[getActiveEngagementStats] No active team, returning zeros')
    return { totalRevenue: 0, totalGP: 0, engagementCount: 0, workshopCount: 0 }
  }

  return getEngagementStats(activeTeam.team.id)
}

/**
 * Get OEM buying patterns (scoped to active team)
 */
export async function getOEMBuyingPatterns(limit = 10): Promise<{
  oem1_name: string
  oem2_name: string
  pair_count: number
}[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) return []

  const supabase = await createClient()

  // Note: The RPC function should be updated to accept team_id parameter
  // For now, we filter client-side by getting team engagements
  // TODO: Update the RPC function to accept team_id for better performance
  const { data, error } = await (supabase as any)
    .rpc('get_oem_buying_patterns', {
      limit_count: limit,
      filter_team_id: activeTeam.team.id
    })

  if (error) {
    // Fallback if RPC doesn't support team_id yet
    console.error('Error fetching OEM patterns:', error)
    return []
  }

  return data || []
}

/**
 * Get engagements by activity type
 */
export async function getEngagementsByType(
  teamId: string,
  activityType: ActivityType
): Promise<EngagementWithRelations[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('engagements')
    .select(`
      *,
      owner:profiles!engagements_owner_id_fkey(*),
      rock:rocks(id, title),
      customer:customers(id, name),
      domains:engagement_domains(domain:domains(*)),
      oems:engagement_oems(oem:oems(*))
    `)
    .eq('team_id', teamId)
    .eq('activity_type', activityType)
    .is('deleted_at', null)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error fetching engagements by type:', error)
    return []
  }

  return (data || []).map((engagement: Record<string, unknown>) => {
    const { domains, oems, ...rest } = engagement
    return {
      ...rest,
      domains: Array.isArray(domains)
        ? domains.map((d: { domain: unknown }) => d.domain)
        : [],
      oems: Array.isArray(oems)
        ? oems.map((o: { oem: unknown }) => o.oem)
        : [],
    }
  }) as EngagementWithRelations[]
}
