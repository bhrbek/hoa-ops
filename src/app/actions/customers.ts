'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireOrgAdmin, getActiveTeam } from './auth'
import type { Customer, CustomerStatus } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get all customers in an org (must be member of that org)
 */
export async function getCustomers(orgId: string): Promise<Customer[]> {
  // Verify caller belongs to this org
  const activeTeam = await getActiveTeam()
  if (!activeTeam || activeTeam.org.id !== orgId) {
    throw new Error('Access denied: not a member of this org')
  }

  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('customers')
    .select('*')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('name')

  if (error) {
    console.error('Error fetching customers:', error)
    throw new Error('Failed to fetch customers')
  }

  return data as Customer[]
}

/**
 * Get customers for the current active team's org
 */
export async function getTeamCustomers(): Promise<Customer[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) throw new Error('No active team')

  return getCustomers(activeTeam.org.id)
}

/**
 * Get a single customer
 */
export async function getCustomer(customerId: string): Promise<Customer | null> {
  const supabase = await createClient()

  // Use maybeSingle() as customer might not exist
  const { data, error } = await (supabase as any)
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error('Error fetching customer:', error)
    return null
  }

  // Verify user is in the same org as the customer
  const activeTeam = await getActiveTeam()
  if (!activeTeam || activeTeam.org.id !== data.org_id) {
    return null
  }

  return data as Customer
}

/**
 * Create a new customer (org admin only)
 */
export async function createCustomer(data: {
  org_id: string
  name: string
  vertical?: string
  status?: CustomerStatus
}): Promise<Customer> {
  await requireOrgAdmin(data.org_id)
  const supabase = await createClient()

  const { data: customer, error } = await (supabase as any)
    .from('customers')
    .insert({
      org_id: data.org_id,
      name: data.name,
      vertical: data.vertical,
      status: data.status || 'active'
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating customer:', error)
    throw new Error('Failed to create customer')
  }

  revalidatePath('/stream')
  revalidatePath('/settings/admin')
  return customer
}

/**
 * Update a customer (org admin only)
 */
export async function updateCustomer(
  customerId: string,
  data: Partial<Pick<Customer, 'name' | 'vertical' | 'status'>>
): Promise<Customer> {
  const supabase = await createClient()

  // Get customer's org to check permissions - use maybeSingle() as customer might not exist
  const { data: customer } = await (supabase as any)
    .from('customers')
    .select('org_id')
    .eq('id', customerId)
    .maybeSingle()

  if (!customer) throw new Error('Customer not found')

  await requireOrgAdmin(customer.org_id)

  const { data: updated, error } = await (supabase as any)
    .from('customers')
    .update(data)
    .eq('id', customerId)
    .select()
    .single()

  if (error) {
    console.error('Error updating customer:', error)
    throw new Error('Failed to update customer')
  }

  revalidatePath('/stream')
  revalidatePath('/settings/admin')
  return updated
}

/**
 * Soft delete a customer (org admin only)
 */
export async function deleteCustomer(customerId: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get customer's org to check permissions - use maybeSingle() as customer might not exist
  const { data: customer } = await (supabase as any)
    .from('customers')
    .select('org_id')
    .eq('id', customerId)
    .maybeSingle()

  if (!customer) throw new Error('Customer not found')

  await requireOrgAdmin(customer.org_id)

  const { error } = await (supabase as any)
    .from('customers')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id
    })
    .eq('id', customerId)

  if (error) {
    console.error('Error deleting customer:', error)
    throw new Error('Failed to delete customer')
  }

  revalidatePath('/stream')
  revalidatePath('/settings/admin')
}

/**
 * Search customers by name (must be member of that org)
 */
export async function searchCustomers(orgId: string, query: string): Promise<Customer[]> {
  // Verify caller belongs to this org
  const activeTeam = await getActiveTeam()
  if (!activeTeam || activeTeam.org.id !== orgId) {
    return []
  }

  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('customers')
    .select('*')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .ilike('name', `%${query}%`)
    .order('name')
    .limit(20)

  if (error) {
    console.error('Error searching customers:', error)
    return []
  }

  return data as Customer[]
}
