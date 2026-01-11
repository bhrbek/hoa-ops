'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveTeam } from './auth'
import type { Vendor, VendorWithProjects, VendorWithBids } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

// Note: Basic CRUD operations (createVendor, updateVendor, deleteVendor, getVendors)
// are in reference.ts for consistency with other reference data (domains, activity types)
// This file contains vendor-specific operations

/**
 * Get a vendor with their project history
 */
export async function getVendorWithProjects(vendorId: string): Promise<VendorWithProjects | null> {
  const supabase = await createClient()
  const activeTeam = await getActiveTeam()

  if (!activeTeam) return null

  const { data: vendor, error } = await (supabase as any)
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !vendor) {
    if (error) console.error('Error fetching vendor:', error)
    return null
  }

  // Get milestones assigned to this vendor in the current team
  const { data: milestones } = await (supabase as any)
    .from('milestones')
    .select(`
      id,
      title,
      status,
      due_date,
      budgeted_cost,
      actual_cost,
      project:projects!inner(id, title, team_id)
    `)
    .eq('vendor_id', vendorId)
    .eq('project.team_id', activeTeam.team.id)
    .is('deleted_at', null)
    .order('due_date', { ascending: false })

  // Get bids from this vendor for the current team's projects
  const { data: bids } = await (supabase as any)
    .from('vendor_bids')
    .select(`
      id,
      total_amount,
      status,
      bid_date,
      project:projects!inner(id, title, team_id)
    `)
    .eq('vendor_id', vendorId)
    .eq('project.team_id', activeTeam.team.id)
    .is('deleted_at', null)
    .order('bid_date', { ascending: false })

  // Calculate stats
  const completedMilestones = (milestones || []).filter(
    (m: { status: string }) => m.status === 'completed'
  )
  const totalBudgeted = (milestones || []).reduce(
    (sum: number, m: { budgeted_cost?: number }) => sum + (m.budgeted_cost || 0), 0
  )
  const totalActual = (milestones || []).reduce(
    (sum: number, m: { actual_cost?: number }) => sum + (m.actual_cost || 0), 0
  )
  const wonBids = (bids || []).filter(
    (b: { status: string }) => b.status === 'selected'
  )

  return {
    ...vendor,
    milestones: milestones || [],
    bids: bids || [],
    stats: {
      totalMilestones: (milestones || []).length,
      completedMilestones: completedMilestones.length,
      totalBudgeted,
      totalActual,
      totalBids: (bids || []).length,
      wonBids: wonBids.length,
    }
  } as VendorWithProjects
}

/**
 * Get a vendor with their bid history
 */
export async function getVendorWithBids(vendorId: string): Promise<VendorWithBids | null> {
  const supabase = await createClient()
  const activeTeam = await getActiveTeam()

  if (!activeTeam) return null

  const { data: vendor, error } = await (supabase as any)
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !vendor) {
    if (error) console.error('Error fetching vendor:', error)
    return null
  }

  // Get all bids with categories
  const { data: bids } = await (supabase as any)
    .from('vendor_bids')
    .select(`
      *,
      categories:bid_categories(*),
      project:projects!inner(id, title, team_id, status)
    `)
    .eq('vendor_id', vendorId)
    .eq('project.team_id', activeTeam.team.id)
    .is('deleted_at', null)
    .order('bid_date', { ascending: false })

  return {
    ...vendor,
    bids: bids || [],
  } as VendorWithBids
}

/**
 * Get all vendors with their current workload
 */
export async function getVendorsWithWorkload(): Promise<Array<Vendor & {
  activeMilestones: number
  pendingBids: number
  totalCommitted: number
}>> {
  const supabase = await createClient()
  const activeTeam = await getActiveTeam()

  if (!activeTeam) return []

  // Get all vendors
  const { data: vendors, error } = await (supabase as any)
    .from('vendors')
    .select('*')
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('Error fetching vendors:', error)
    return []
  }

  // Get active milestones per vendor
  const { data: milestones } = await (supabase as any)
    .from('milestones')
    .select(`
      vendor_id,
      budgeted_cost,
      project:projects!inner(team_id)
    `)
    .eq('project.team_id', activeTeam.team.id)
    .is('deleted_at', null)
    .neq('status', 'completed')

  // Get pending bids per vendor
  const { data: bids } = await (supabase as any)
    .from('vendor_bids')
    .select(`
      vendor_id,
      project:projects!inner(team_id)
    `)
    .eq('project.team_id', activeTeam.team.id)
    .eq('status', 'submitted')
    .is('deleted_at', null)

  // Calculate workload per vendor
  return (vendors || []).map((vendor: Vendor) => {
    const vendorMilestones = (milestones || []).filter(
      (m: { vendor_id: string }) => m.vendor_id === vendor.id
    )
    const vendorBids = (bids || []).filter(
      (b: { vendor_id: string }) => b.vendor_id === vendor.id
    )
    const totalCommitted = vendorMilestones.reduce(
      (sum: number, m: { budgeted_cost?: number }) => sum + (m.budgeted_cost || 0), 0
    )

    return {
      ...vendor,
      activeMilestones: vendorMilestones.length,
      pendingBids: vendorBids.length,
      totalCommitted,
    }
  })
}

/**
 * Search vendors by name or specialty
 */
export async function searchVendors(query: string): Promise<Vendor[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('vendors')
    .select('*')
    .or(`name.ilike.%${query}%,specialty.ilike.%${query}%,contact_name.ilike.%${query}%`)
    .is('deleted_at', null)
    .order('name')
    .limit(20)

  if (error) {
    console.error('Error searching vendors:', error)
    return []
  }

  return data as Vendor[]
}

/**
 * Get vendors by specialty
 */
export async function getVendorsBySpecialty(specialty: string): Promise<Vendor[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('vendors')
    .select('*')
    .ilike('specialty', `%${specialty}%`)
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('Error fetching vendors by specialty:', error)
    return []
  }

  return data as Vendor[]
}

/**
 * Get vendor performance summary
 */
export async function getVendorPerformance(vendorId: string): Promise<{
  vendorId: string
  vendorName: string
  projectsCompleted: number
  projectsInProgress: number
  totalBudgeted: number
  totalActual: number
  budgetVariance: number
  onTimeDeliveryRate: number
  bidSuccessRate: number
}> {
  const supabase = await createClient()
  const activeTeam = await getActiveTeam()

  if (!activeTeam) {
    throw new Error('No active team')
  }

  // Get vendor info
  const { data: vendor } = await (supabase as any)
    .from('vendors')
    .select('id, name')
    .eq('id', vendorId)
    .maybeSingle()

  if (!vendor) throw new Error('Vendor not found')

  // Get all milestones for this vendor in current team
  const { data: milestones } = await (supabase as any)
    .from('milestones')
    .select(`
      id,
      status,
      due_date,
      completed_at,
      budgeted_cost,
      actual_cost,
      project:projects!inner(team_id)
    `)
    .eq('vendor_id', vendorId)
    .eq('project.team_id', activeTeam.team.id)
    .is('deleted_at', null)

  // Get all bids for this vendor in current team
  const { data: bids } = await (supabase as any)
    .from('vendor_bids')
    .select(`
      id,
      status,
      project:projects!inner(team_id)
    `)
    .eq('vendor_id', vendorId)
    .eq('project.team_id', activeTeam.team.id)
    .is('deleted_at', null)

  const allMilestones = milestones || []
  const allBids = bids || []

  const completed = allMilestones.filter((m: { status: string }) => m.status === 'completed')
  const inProgress = allMilestones.filter((m: { status: string }) => m.status !== 'completed')

  const totalBudgeted = allMilestones.reduce(
    (sum: number, m: { budgeted_cost?: number }) => sum + (m.budgeted_cost || 0), 0
  )
  const totalActual = allMilestones.reduce(
    (sum: number, m: { actual_cost?: number }) => sum + (m.actual_cost || 0), 0
  )

  // Calculate on-time delivery rate
  const onTimeMilestones = completed.filter((m: { due_date: string; completed_at: string }) => {
    if (!m.due_date || !m.completed_at) return true // Assume on-time if no dates
    return new Date(m.completed_at) <= new Date(m.due_date)
  })
  const onTimeRate = completed.length > 0
    ? (onTimeMilestones.length / completed.length) * 100
    : 100

  // Calculate bid success rate
  const wonBids = allBids.filter((b: { status: string }) => b.status === 'selected')
  const decidedBids = allBids.filter((b: { status: string }) =>
    b.status === 'selected' || b.status === 'rejected'
  )
  const bidSuccessRate = decidedBids.length > 0
    ? (wonBids.length / decidedBids.length) * 100
    : 0

  return {
    vendorId: vendor.id,
    vendorName: vendor.name,
    projectsCompleted: completed.length,
    projectsInProgress: inProgress.length,
    totalBudgeted,
    totalActual,
    budgetVariance: totalBudgeted - totalActual,
    onTimeDeliveryRate: onTimeRate,
    bidSuccessRate,
  }
}

/**
 * Get all vendor specialties (for filtering/categorization)
 */
export async function getVendorSpecialties(): Promise<string[]> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('vendors')
    .select('specialty')
    .is('deleted_at', null)
    .not('specialty', 'is', null)

  if (error) {
    console.error('Error fetching vendor specialties:', error)
    return []
  }

  // Get unique specialties
  const specialties = new Set<string>()
  for (const vendor of data || []) {
    if (vendor.specialty) {
      specialties.add(vendor.specialty)
    }
  }

  return Array.from(specialties).sort()
}
