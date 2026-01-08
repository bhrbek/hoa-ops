# /new-action - Generate Server Action

Create a new server action with proper auth checks.

## Usage
```
/new-action [EntityName]
```
Example: `/new-action Milestone`

## Generated File
- `src/app/actions/[entities].ts`

## Pattern Template

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireTeamAccess, requireTeamRole, getActiveTeam } from './auth'
import type { [Entity], [Entity]WithRelations } from '@/types/supabase'

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Get [entities] for a team
 */
export async function get[Entities](teamId: string): Promise<[Entity]WithRelations[]> {
  await requireTeamAccess(teamId)
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('[entities]')
    .select(`
      *,
      owner:profiles![entities]_owner_id_fkey(*)
    `)
    .eq('team_id', teamId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching [entities]:', error)
    throw new Error('Failed to fetch [entities]')
  }

  return data as [Entity]WithRelations[]
}

/**
 * Get [entities] for active team
 */
export async function getActive[Entities](): Promise<[Entity]WithRelations[]> {
  const activeTeam = await getActiveTeam()
  if (!activeTeam) return []
  return get[Entities](activeTeam.team.id)
}

/**
 * Get a single [entity]
 */
export async function get[Entity]([entity]Id: string): Promise<[Entity]WithRelations | null> {
  const supabase = await createClient()

  const { data, error } = await (supabase as any)
    .from('[entities]')
    .select('*, owner:profiles![entities]_owner_id_fkey(*)')
    .eq('id', [entity]Id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error || !data) return null

  // Verify team access
  try {
    await requireTeamAccess(data.team_id)
  } catch {
    return null
  }

  return data as [Entity]WithRelations
}

/**
 * Create a new [entity]
 */
export async function create[Entity](data: {
  team_id: string
  // ... fields
}): Promise<[Entity]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  await requireTeamAccess(data.team_id)

  const { data: [entity], error } = await (supabase as any)
    .from('[entities]')
    .insert({
      ...data,
      owner_id: user.id,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating [entity]:', error)
    throw new Error('Failed to create [entity]')
  }

  revalidatePath('/[route]')
  return [entity]
}

/**
 * Update an [entity]
 */
export async function update[Entity](
  [entity]Id: string,
  data: Partial<[Entity]>
): Promise<[Entity]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get [entity] to check permissions
  const { data: existing } = await (supabase as any)
    .from('[entities]')
    .select('owner_id, team_id')
    .eq('id', [entity]Id)
    .maybeSingle()

  if (!existing) throw new Error('[Entity] not found')

  // Check authorization: owner, manager, or org admin
  if (existing.owner_id !== user.id) {
    await requireTeamRole(existing.team_id, 'manager')
  }

  const { data: updated, error } = await (supabase as any)
    .from('[entities]')
    .update(data)
    .eq('id', [entity]Id)
    .select()
    .single()

  if (error) {
    console.error('Error updating [entity]:', error)
    throw new Error('Failed to update [entity]')
  }

  revalidatePath('/[route]')
  return updated
}

/**
 * Delete an [entity] (soft delete)
 */
export async function delete[Entity]([entity]Id: string): Promise<void> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get [entity] to check permissions
  const { data: existing } = await (supabase as any)
    .from('[entities]')
    .select('owner_id, team_id')
    .eq('id', [entity]Id)
    .maybeSingle()

  if (!existing) throw new Error('[Entity] not found')

  // Check authorization
  if (existing.owner_id !== user.id) {
    await requireTeamRole(existing.team_id, 'manager')
  }

  const { error } = await (supabase as any)
    .from('[entities]')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id
    })
    .eq('id', [entity]Id)

  if (error) {
    console.error('Error deleting [entity]:', error)
    throw new Error('Failed to delete [entity]')
  }

  revalidatePath('/[route]')
}
```

## Key Patterns

1. **requireTeamAccess()** for read operations
2. **requireTeamRole()** for manager-only operations
3. **maybeSingle()** instead of single() (avoids 0-row errors)
4. **Explicit FK hints** for profiles: `profiles![table]_owner_id_fkey`
5. **Soft delete** with deleted_at/deleted_by
6. **revalidatePath()** after mutations

## Auth Helpers
- `requireTeamAccess(teamId)` - User must be team member or org admin
- `requireTeamRole(teamId, 'manager')` - User must be manager or org admin
- `requireOrgAdmin(orgId)` - User must be org admin
- `getActiveTeam()` - Get current team from cookie

## Existing Examples
- `src/app/actions/rocks.ts`
- `src/app/actions/projects.ts`
- `src/app/actions/commitments.ts`
