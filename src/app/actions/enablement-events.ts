'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess, getActiveTeam } from './auth'
import type { EnablementEvent } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get all enablement events for a team
 */
export async function getEnablementEvents(teamId: string): Promise<EnablementEvent[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('enablement_events')
    .select('*')
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .order('event_date', { ascending: false })

  if (error) {
    console.error('Error fetching enablement events:', error)
    throw new Error('Failed to fetch enablement events')
  }

  return data as EnablementEvent[]
}

/**
 * Get enablement events for active team
 */
export async function getActiveEnablementEvents(): Promise<EnablementEvent[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) throw new Error('No active team')

  return getEnablementEvents(activeTeam.team.id)
}

/**
 * Get upcoming enablement events for a team
 */
export async function getUpcomingEnablementEvents(teamId: string, days = 30): Promise<EnablementEvent[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + days)

  const { data, error } = await (supabase as any)
    .from('enablement_events')
    .select('*')
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .gte('event_date', today)
    .lte('event_date', futureDate.toISOString().split('T')[0])
    .order('event_date', { ascending: true })

  if (error) {
    console.error('Error fetching upcoming events:', error)
    return []
  }

  return data as EnablementEvent[]
}

/**
 * Get a single enablement event
 */
export async function getEnablementEvent(eventId: string): Promise<EnablementEvent | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('enablement_events')
    .select('*')
    .eq('id', eventId)
    .is('deleted_at', null)
    .single()

  if (error) {
    console.error('Error fetching enablement event:', error)
    return null
  }

  return data as EnablementEvent
}

/**
 * Create a new enablement event
 */
export async function createEnablementEvent(data: {
  team_id: string
  event_type: string
  title: string
  description?: string
  event_date: string
  location?: string
  capacity?: number
  attendee_count?: number
}): Promise<EnablementEvent> {
  await requireTeamAccess(data.team_id)
  const supabase = await createClient()

  const { data: event, error } = await (supabase as any)
    .from('enablement_events')
    .insert({
      team_id: data.team_id,
      event_type: data.event_type,
      title: data.title,
      description: data.description,
      event_date: data.event_date,
      location: data.location,
      capacity: data.capacity,
      attendee_count: data.attendee_count || 0
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating enablement event:', error)
    throw new Error('Failed to create enablement event')
  }

  revalidatePath('/stream')
  return event
}

/**
 * Update an enablement event
 */
export async function updateEnablementEvent(
  eventId: string,
  data: Partial<Pick<EnablementEvent, 'event_type' | 'title' | 'description' | 'event_date' | 'location' | 'capacity' | 'attendee_count'>>
): Promise<EnablementEvent> {
  const supabase = await createClient()

  // Get event's team to check access
  const { data: event } = await (supabase as any)
    .from('enablement_events')
    .select('team_id')
    .eq('id', eventId)
    .single()

  if (!event) throw new Error('Enablement event not found')

  await requireTeamAccess(event.team_id)

  const { data: updated, error } = await (supabase as any)
    .from('enablement_events')
    .update(data)
    .eq('id', eventId)
    .select()
    .single()

  if (error) {
    console.error('Error updating enablement event:', error)
    throw new Error('Failed to update enablement event')
  }

  revalidatePath('/stream')
  return updated
}

/**
 * Update attendee count for an enablement event
 */
export async function updateEnablementEventAttendees(
  eventId: string,
  attendeeCount: number
): Promise<EnablementEvent> {
  return updateEnablementEvent(eventId, { attendee_count: attendeeCount })
}

/**
 * Soft delete an enablement event
 */
export async function deleteEnablementEvent(eventId: string): Promise<void> {
  const supabase = await createClient()

  // Get event's team to check access
  const { data: event } = await (supabase as any)
    .from('enablement_events')
    .select('team_id')
    .eq('id', eventId)
    .single()

  if (!event) throw new Error('Enablement event not found')

  const { userId } = await requireTeamAccess(event.team_id)

  const { error } = await (supabase as any)
    .from('enablement_events')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId
    })
    .eq('id', eventId)

  if (error) {
    console.error('Error deleting enablement event:', error)
    throw new Error('Failed to delete enablement event')
  }

  revalidatePath('/stream')
}

/**
 * Get enablement events by type for a team
 */
export async function getEnablementEventsByType(
  teamId: string,
  eventType: string
): Promise<EnablementEvent[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('enablement_events')
    .select('*')
    .eq('team_id', teamId)
    .eq('event_type', eventType)
    .is('deleted_at', null)
    .order('event_date', { ascending: false })

  if (error) {
    console.error('Error fetching events by type:', error)
    return []
  }

  return data as EnablementEvent[]
}
