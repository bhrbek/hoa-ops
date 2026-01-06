'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess, requireTeamRole, getActiveTeam } from './auth'
import type { Asset, AssetStatus } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get all assets for a team
 */
export async function getAssets(teamId: string): Promise<Asset[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('assets')
    .select('*')
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('Error fetching assets:', error)
    throw new Error('Failed to fetch assets')
  }

  return data as Asset[]
}

/**
 * Get assets for the current active team
 */
export async function getTeamAssets(): Promise<Asset[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) throw new Error('No active team')

  return getAssets(activeTeam.team.id)
}

/**
 * Get a single asset
 */
export async function getAsset(assetId: string): Promise<Asset | null> {
  const supabase = await createClient()

  // Use maybeSingle() as asset might not exist
  const { data, error } = await (supabase as any)
    .from('assets')
    .select('*')
    .eq('id', assetId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('Error fetching asset:', error)
    return null
  }

  // Verify team access before returning data
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null
  }

  return data as Asset
}

/**
 * Create a new asset (team member)
 */
export async function createAsset(data: {
  team_id: string
  name: string
  asset_type: string
  description?: string
  status?: AssetStatus
}): Promise<Asset> {
  await requireTeamAccess(data.team_id)
  const supabase = await createClient()

  const { data: asset, error } = await (supabase as any)
    .from('assets')
    .insert({
      team_id: data.team_id,
      name: data.name,
      asset_type: data.asset_type,
      description: data.description,
      status: data.status || 'active'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating asset:', error)
    throw new Error('Failed to create asset')
  }

  revalidatePath('/stream')
  return asset
}

/**
 * Update an asset
 */
export async function updateAsset(
  assetId: string,
  data: Partial<Pick<Asset, 'name' | 'asset_type' | 'description' | 'status'>>
): Promise<Asset> {
  const supabase = await createClient()

  // Get asset's team to check permissions - use maybeSingle()
  const { data: asset } = await (supabase as any)
    .from('assets')
    .select('team_id')
    .eq('id', assetId)
    .maybeSingle()

  if (!asset) throw new Error('Asset not found')

  await requireTeamAccess(asset.team_id)

  const { data: updated, error } = await (supabase as any)
    .from('assets')
    .update(data)
    .eq('id', assetId)
    .select()
    .single()

  if (error) {
    console.error('Error updating asset:', error)
    throw new Error('Failed to update asset')
  }

  revalidatePath('/stream')
  return updated
}

/**
 * Soft delete an asset (manager only)
 */
export async function deleteAsset(assetId: string): Promise<void> {
  const supabase = await createClient()

  // Get asset's team to check permissions - use maybeSingle()
  const { data: asset } = await (supabase as any)
    .from('assets')
    .select('team_id')
    .eq('id', assetId)
    .maybeSingle()

  if (!asset) throw new Error('Asset not found')

  const { userId } = await requireTeamRole(asset.team_id, 'manager')

  const { error } = await (supabase as any)
    .from('assets')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', assetId)

  if (error) {
    console.error('Error deleting asset:', error)
    throw new Error('Failed to delete asset')
  }

  revalidatePath('/stream')
}

/**
 * Link an asset to a project
 */
export async function linkAssetToProject(assetId: string, projectId: string): Promise<void> {
  const supabase = await createClient()

  // Get asset's team to check permissions - use maybeSingle()
  const { data: asset } = await (supabase as any)
    .from('assets')
    .select('team_id')
    .eq('id', assetId)
    .maybeSingle()

  if (!asset) throw new Error('Asset not found')

  await requireTeamAccess(asset.team_id)

  // Check if link already exists - use maybeSingle()
  const { data: existing } = await (supabase as any)
    .from('project_assets')
    .select('id')
    .eq('asset_id', assetId)
    .eq('project_id', projectId)
    .maybeSingle()

  if (existing) return // Already linked

  const { error } = await (supabase as any)
    .from('project_assets')
    .insert({
      asset_id: assetId,
      project_id: projectId
    })

  if (error) {
    console.error('Error linking asset to project:', error)
    throw new Error('Failed to link asset to project')
  }

  revalidatePath('/rocks')
}

/**
 * Unlink an asset from a project
 */
export async function unlinkAssetFromProject(assetId: string, projectId: string): Promise<void> {
  const supabase = await createClient()

  // Get asset's team to check permissions - use maybeSingle()
  const { data: asset } = await (supabase as any)
    .from('assets')
    .select('team_id')
    .eq('id', assetId)
    .maybeSingle()

  if (!asset) throw new Error('Asset not found')

  await requireTeamAccess(asset.team_id)

  const { error } = await (supabase as any)
    .from('project_assets')
    .delete()
    .eq('asset_id', assetId)
    .eq('project_id', projectId)

  if (error) {
    console.error('Error unlinking asset from project:', error)
    throw new Error('Failed to unlink asset from project')
  }

  revalidatePath('/rocks')
}

/**
 * Link an asset to an engagement
 */
export async function linkAssetToEngagement(assetId: string, engagementId: string): Promise<void> {
  const supabase = await createClient()

  // Get asset's team to check permissions - use maybeSingle()
  const { data: asset } = await (supabase as any)
    .from('assets')
    .select('team_id')
    .eq('id', assetId)
    .maybeSingle()

  if (!asset) throw new Error('Asset not found')

  await requireTeamAccess(asset.team_id)

  // Check if link already exists - use maybeSingle()
  const { data: existing } = await (supabase as any)
    .from('engagement_assets')
    .select('id')
    .eq('asset_id', assetId)
    .eq('engagement_id', engagementId)
    .maybeSingle()

  if (existing) return // Already linked

  const { error } = await (supabase as any)
    .from('engagement_assets')
    .insert({
      asset_id: assetId,
      engagement_id: engagementId
    })

  if (error) {
    console.error('Error linking asset to engagement:', error)
    throw new Error('Failed to link asset to engagement')
  }

  revalidatePath('/stream')
}

/**
 * Unlink an asset from an engagement
 */
export async function unlinkAssetFromEngagement(assetId: string, engagementId: string): Promise<void> {
  const supabase = await createClient()

  // Get asset's team to check permissions - use maybeSingle()
  const { data: asset } = await (supabase as any)
    .from('assets')
    .select('team_id')
    .eq('id', assetId)
    .maybeSingle()

  if (!asset) throw new Error('Asset not found')

  await requireTeamAccess(asset.team_id)

  const { error } = await (supabase as any)
    .from('engagement_assets')
    .delete()
    .eq('asset_id', assetId)
    .eq('engagement_id', engagementId)

  if (error) {
    console.error('Error unlinking asset from engagement:', error)
    throw new Error('Failed to unlink asset from engagement')
  }

  revalidatePath('/stream')
}

/**
 * Get assets linked to a project
 */
export async function getProjectAssets(projectId: string): Promise<Asset[]> {
  const supabase = await createClient()

  // Get project to verify team access - use maybeSingle()
  const { data: project } = await (supabase as any)
    .from('projects')
    .select('team_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project) return []

  try {
    await requireTeamAccess(project.team_id)
  } catch {
    return []
  }

  const { data, error } = await (supabase as any)
    .from('project_assets')
    .select('asset:assets(*)')
    .eq('project_id', projectId)

  if (error) {
    console.error('Error fetching project assets:', error)
    return []
  }

  return (data || [])
    .map((d: { asset: Asset }) => d.asset)
    .filter((a: Asset | null) => a && !a.deleted_at)
}

/**
 * Get assets linked to an engagement
 */
export async function getEngagementAssets(engagementId: string): Promise<Asset[]> {
  const supabase = await createClient()

  // Get engagement to verify team access - use maybeSingle()
  const { data: engagement } = await (supabase as any)
    .from('engagements')
    .select('team_id')
    .eq('id', engagementId)
    .maybeSingle()

  if (!engagement) return []

  try {
    await requireTeamAccess(engagement.team_id)
  } catch {
    return []
  }

  const { data, error } = await (supabase as any)
    .from('engagement_assets')
    .select('asset:assets(*)')
    .eq('engagement_id', engagementId)

  if (error) {
    console.error('Error fetching engagement assets:', error)
    return []
  }

  return (data || [])
    .map((d: { asset: Asset }) => d.asset)
    .filter((a: Asset | null) => a && !a.deleted_at)
}
