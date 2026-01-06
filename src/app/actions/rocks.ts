'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Rock, RockWithProjects, RockWithEvidence } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getRocks(quarter?: string): Promise<RockWithProjects[]> {
  const supabase = await createClient()

  let query = (supabase as any)
    .from('rocks')
    .select(`
      *,
      owner:profiles(*),
      projects(*)
    `)
    .order('created_at', { ascending: false })

  if (quarter) {
    query = query.eq('quarter', quarter)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching rocks:', error)
    throw new Error('Failed to fetch rocks')
  }

  return data as RockWithProjects[]
}

export async function getRockWithEvidence(rockId: string): Promise<RockWithEvidence | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('rocks')
    .select(`
      *,
      owner:profiles(*),
      projects(*),
      evidence:engagements(*)
    `)
    .eq('id', rockId)
    .single()

  if (error) {
    console.error('Error fetching rock:', error)
    return null
  }

  return data as RockWithEvidence
}

export async function createRock(data: {
  title: string
  perfect_outcome: string
  worst_outcome?: string
  quarter?: string
}): Promise<Rock> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: rock, error } = await (supabase as any)
    .from('rocks')
    .insert({
      title: data.title,
      perfect_outcome: data.perfect_outcome,
      worst_outcome: data.worst_outcome,
      quarter: data.quarter || 'Q1 2026',
      owner_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating rock:', error)
    throw new Error('Failed to create rock')
  }

  revalidatePath('/climb')
  revalidatePath('/')
  return rock
}

export async function updateRock(
  rockId: string,
  data: Partial<Pick<Rock, 'title' | 'status' | 'perfect_outcome' | 'worst_outcome' | 'progress_override'>>
): Promise<Rock> {
  const supabase = await createClient()

  const { data: rock, error } = await (supabase as any)
    .from('rocks')
    .update(data)
    .eq('id', rockId)
    .select()
    .single()

  if (error) {
    console.error('Error updating rock:', error)
    throw new Error('Failed to update rock')
  }

  revalidatePath('/climb')
  revalidatePath('/')
  return rock
}

export async function deleteRock(rockId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await (supabase as any)
    .from('rocks')
    .delete()
    .eq('id', rockId)

  if (error) {
    console.error('Error deleting rock:', error)
    throw new Error('Failed to delete rock')
  }

  revalidatePath('/climb')
  revalidatePath('/')
}

export async function calculateRockProgress(rockId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .rpc('calculate_rock_progress', { rock_uuid: rockId })

  if (error) {
    console.error('Error calculating rock progress:', error)
    return 0
  }

  return data
}
