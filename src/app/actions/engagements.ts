'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Engagement, EngagementWithRelations } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getEngagements(options?: {
  limit?: number
  offset?: number
  rockId?: string
}): Promise<EngagementWithRelations[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let query = (supabase as any)
    .from('engagements')
    .select(`
      *,
      rock:rocks(id, title),
      domains:engagement_domains(domain:domains(*)),
      oems:engagement_oems(oem:oems(*))
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (options?.rockId) {
    query = query.eq('rock_id', options.rockId)
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

export async function createEngagement(data: {
  customer_name: string
  date?: string
  activity_type: 'Workshop' | 'Demo' | 'POC' | 'Advisory'
  revenue_impact?: number
  gp_impact?: number
  notes?: string
  rock_id?: string
  domain_ids?: string[]
  oem_ids?: string[]
}): Promise<Engagement> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Create engagement
  const { data: engagement, error } = await (supabase as any)
    .from('engagements')
    .insert({
      user_id: user.id,
      customer_name: data.customer_name,
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
  revalidatePath('/climb')
  return engagement
}

export async function updateEngagement(
  engagementId: string,
  data: Partial<Pick<Engagement, 'customer_name' | 'date' | 'activity_type' | 'revenue_impact' | 'gp_impact' | 'notes' | 'rock_id'>>
): Promise<Engagement> {
  const supabase = await createClient()

  const { data: engagement, error } = await (supabase as any)
    .from('engagements')
    .update(data)
    .eq('id', engagementId)
    .select()
    .single()

  if (error) {
    console.error('Error updating engagement:', error)
    throw new Error('Failed to update engagement')
  }

  revalidatePath('/stream')
  revalidatePath('/')
  revalidatePath('/climb')
  return engagement
}

export async function deleteEngagement(engagementId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('engagements')
    .delete()
    .eq('id', engagementId)

  if (error) {
    console.error('Error deleting engagement:', error)
    throw new Error('Failed to delete engagement')
  }

  revalidatePath('/stream')
  revalidatePath('/')
  revalidatePath('/climb')
}

export async function getEngagementStats(): Promise<{
  totalRevenue: number
  totalGP: number
  engagementCount: number
  workshopCount: number
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await (supabase as any)
    .from('engagements')
    .select('revenue_impact, gp_impact, activity_type')
    .eq('user_id', user.id)

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

export async function getOEMBuyingPatterns(limit = 10): Promise<{
  oem1_name: string
  oem2_name: string
  pair_count: number
}[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .rpc('get_oem_buying_patterns', { limit_count: limit })

  if (error) {
    console.error('Error fetching OEM patterns:', error)
    return []
  }

  return data
}
