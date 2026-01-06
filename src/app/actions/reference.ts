'use server'

import { createClient } from '@/lib/supabase/server'
import type { Domain, OEM, Profile } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

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
