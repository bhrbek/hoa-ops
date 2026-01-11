'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess, getActiveTeam } from './auth'
import type { VendorBid, BidCategory, VendorBidWithCategories, BidStatus } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get all bids for a project
 */
export async function getProjectBids(projectId: string): Promise<VendorBidWithCategories[]> {
  const supabase = await createClient()

  // Get project's team to check access
  const { data: project } = await (supabase as any)
    .from('projects')
    .select('team_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project) throw new Error('Project not found')

  await requireTeamAccess(project.team_id)

  const { data, error } = await (supabase as any)
    .from('vendor_bids')
    .select(`
      *,
      vendor:vendors(id, name, specialty, contact_name, contact_phone, contact_email),
      categories:bid_categories(*)
    `)
    .eq('project_id', projectId)
    .is('deleted_at', null)
    .order('bid_date', { ascending: false })

  if (error) {
    console.error('Error fetching project bids:', error)
    throw new Error('Failed to fetch project bids')
  }

  return data as VendorBidWithCategories[]
}

/**
 * Get a single bid with categories
 */
export async function getBid(bidId: string): Promise<VendorBidWithCategories | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('vendor_bids')
    .select(`
      *,
      vendor:vendors(id, name, specialty, contact_name, contact_phone, contact_email),
      categories:bid_categories(*),
      project:projects(id, title, team_id)
    `)
    .eq('id', bidId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('Error fetching bid:', error)
    return null
  }

  // Verify team access
  try {
    await requireTeamAccess(data.project.team_id)
  } catch {
    return null
  }

  return data as VendorBidWithCategories
}

/**
 * Create a new vendor bid
 */
export async function createBid(data: {
  project_id: string
  vendor_id: string
  total_amount: number
  bid_date?: string
  notes?: string
  document_url?: string
  categories?: Array<{
    category_name: string
    amount: number
    notes?: string
  }>
}): Promise<VendorBid> {
  const supabase = await createClient()

  // Get project's team to check access
  const { data: project } = await (supabase as any)
    .from('projects')
    .select('team_id')
    .eq('id', data.project_id)
    .maybeSingle()

  if (!project) throw new Error('Project not found')

  await requireTeamAccess(project.team_id)

  // Create the bid
  const { data: bid, error } = await (supabase as any)
    .from('vendor_bids')
    .insert({
      project_id: data.project_id,
      vendor_id: data.vendor_id,
      total_amount: data.total_amount,
      bid_date: data.bid_date || new Date().toISOString().split('T')[0],
      status: 'submitted',
      notes: data.notes,
      document_url: data.document_url,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating bid:', error)
    throw new Error('Failed to create bid')
  }

  // Create bid categories if provided
  if (data.categories && data.categories.length > 0) {
    const categoryInserts = data.categories.map(cat => ({
      bid_id: bid.id,
      category_name: cat.category_name,
      amount: cat.amount,
      notes: cat.notes,
    }))

    const { error: catError } = await (supabase as any)
      .from('bid_categories')
      .insert(categoryInserts)

    if (catError) {
      console.error('Error creating bid categories:', catError)
      // Don't fail the whole operation, bid was created
    }
  }

  revalidatePath('/priorities')
  revalidatePath('/rocks')
  return bid
}

/**
 * Update a vendor bid
 */
export async function updateBid(
  bidId: string,
  data: Partial<Pick<VendorBid,
    | 'total_amount'
    | 'bid_date'
    | 'notes'
    | 'document_url'
  >> & {
    categories?: Array<{
      id?: string
      category_name: string
      amount: number
      notes?: string
    }>
  }
): Promise<VendorBid> {
  const supabase = await createClient()

  // Get bid's project to check access
  const { data: bid } = await (supabase as any)
    .from('vendor_bids')
    .select('project_id, project:projects(team_id)')
    .eq('id', bidId)
    .maybeSingle()

  if (!bid) throw new Error('Bid not found')

  await requireTeamAccess(bid.project.team_id)

  const { categories, ...updateData } = data

  const { data: updated, error } = await (supabase as any)
    .from('vendor_bids')
    .update({
      ...updateData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', bidId)
    .select()
    .single()

  if (error) {
    console.error('Error updating bid:', error)
    throw new Error('Failed to update bid')
  }

  // Update categories if provided
  if (categories !== undefined) {
    // Delete existing categories
    await (supabase as any)
      .from('bid_categories')
      .delete()
      .eq('bid_id', bidId)

    // Insert new categories
    if (categories.length > 0) {
      const categoryInserts = categories.map(cat => ({
        bid_id: bidId,
        category_name: cat.category_name,
        amount: cat.amount,
        notes: cat.notes,
      }))

      await (supabase as any)
        .from('bid_categories')
        .insert(categoryInserts)
    }
  }

  revalidatePath('/priorities')
  revalidatePath('/rocks')
  return updated
}

/**
 * Select a winning bid for a project
 */
export async function selectWinningBid(bidId: string): Promise<VendorBid> {
  const supabase = await createClient()

  // Get bid's project to check access and update other bids
  const { data: bid } = await (supabase as any)
    .from('vendor_bids')
    .select('project_id, project:projects(team_id)')
    .eq('id', bidId)
    .maybeSingle()

  if (!bid) throw new Error('Bid not found')

  await requireTeamAccess(bid.project.team_id)

  // Mark all other bids for this project as rejected
  await (supabase as any)
    .from('vendor_bids')
    .update({ status: 'rejected' })
    .eq('project_id', bid.project_id)
    .neq('id', bidId)
    .is('deleted_at', null)

  // Mark this bid as selected
  const { data: updated, error } = await (supabase as any)
    .from('vendor_bids')
    .update({
      status: 'selected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bidId)
    .select()
    .single()

  if (error) {
    console.error('Error selecting winning bid:', error)
    throw new Error('Failed to select winning bid')
  }

  revalidatePath('/priorities')
  revalidatePath('/rocks')
  return updated
}

/**
 * Reject a bid
 */
export async function rejectBid(bidId: string): Promise<VendorBid> {
  const supabase = await createClient()

  const { data: bid } = await (supabase as any)
    .from('vendor_bids')
    .select('project:projects(team_id)')
    .eq('id', bidId)
    .maybeSingle()

  if (!bid) throw new Error('Bid not found')

  await requireTeamAccess(bid.project.team_id)

  const { data: updated, error } = await (supabase as any)
    .from('vendor_bids')
    .update({
      status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bidId)
    .select()
    .single()

  if (error) {
    console.error('Error rejecting bid:', error)
    throw new Error('Failed to reject bid')
  }

  revalidatePath('/priorities')
  revalidatePath('/rocks')
  return updated
}

/**
 * Soft delete a bid
 */
export async function deleteBid(bidId: string): Promise<void> {
  const supabase = await createClient()

  const { data: bid } = await (supabase as any)
    .from('vendor_bids')
    .select('project:projects(team_id)')
    .eq('id', bidId)
    .maybeSingle()

  if (!bid) throw new Error('Bid not found')

  const { userId } = await requireTeamAccess(bid.project.team_id)

  const { error } = await (supabase as any)
    .from('vendor_bids')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq('id', bidId)

  if (error) {
    console.error('Error deleting bid:', error)
    throw new Error('Failed to delete bid')
  }

  revalidatePath('/priorities')
  revalidatePath('/rocks')
}

/**
 * Get bids from a specific vendor
 */
export async function getVendorBids(vendorId: string): Promise<VendorBidWithCategories[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) throw new Error('No active team')

  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('vendor_bids')
    .select(`
      *,
      vendor:vendors(id, name, specialty),
      categories:bid_categories(*),
      project:projects!inner(id, title, team_id)
    `)
    .eq('vendor_id', vendorId)
    .eq('project.team_id', activeTeam.team.id)
    .is('deleted_at', null)
    .order('bid_date', { ascending: false })

  if (error) {
    console.error('Error fetching vendor bids:', error)
    return []
  }

  return data as VendorBidWithCategories[]
}

/**
 * Compare bids for a project (side-by-side category comparison)
 */
export async function compareBids(projectId: string): Promise<{
  vendors: Array<{ id: string; name: string; totalAmount: number; status: BidStatus }>
  categories: Array<{
    categoryName: string
    amounts: Record<string, number>  // vendor_id -> amount
  }>
}> {
  const bids = await getProjectBids(projectId)

  const vendors = bids.map(bid => ({
    id: bid.vendor_id,
    name: bid.vendor?.name || 'Unknown',
    totalAmount: bid.total_amount,
    status: bid.status as BidStatus,
  }))

  // Collect all unique category names
  const categoryNames = new Set<string>()
  for (const bid of bids) {
    for (const cat of bid.categories || []) {
      categoryNames.add(cat.category_name)
    }
  }

  // Build category comparison
  const categories = Array.from(categoryNames).map(categoryName => {
    const amounts: Record<string, number> = {}
    for (const bid of bids) {
      const cat = bid.categories?.find(c => c.category_name === categoryName)
      amounts[bid.vendor_id] = cat?.amount || 0
    }
    return { categoryName, amounts }
  })

  return { vendors, categories }
}

/**
 * Get the selected/winning bid for a project
 */
export async function getSelectedBid(projectId: string): Promise<VendorBidWithCategories | null> {
  const supabase = await createClient()

  const { data: project } = await (supabase as any)
    .from('projects')
    .select('team_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project) throw new Error('Project not found')

  await requireTeamAccess(project.team_id)

  const { data, error } = await (supabase as any)
    .from('vendor_bids')
    .select(`
      *,
      vendor:vendors(id, name, specialty, contact_name, contact_phone, contact_email),
      categories:bid_categories(*)
    `)
    .eq('project_id', projectId)
    .eq('status', 'selected')
    .is('deleted_at', null)
    .maybeSingle()

  if (error) {
    console.error('Error fetching selected bid:', error)
    return null
  }

  return data as VendorBidWithCategories | null
}
