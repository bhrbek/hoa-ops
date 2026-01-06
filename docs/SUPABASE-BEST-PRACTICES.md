# Supabase Best Practices for Headwaters

This document captures lessons learned from debugging and optimizing the Headwaters codebase.

---

## Query Methods: .single() vs .maybeSingle()

### The Problem

`.single()` throws a PGRST116 error when the query returns 0 rows. This causes server actions to fail silently or throw generic errors.

### The Rule

| Use Case | Method | Reason |
|----------|--------|--------|
| SELECT where record may not exist | `.maybeSingle()` | Returns `null` on 0 rows |
| SELECT by ID (user lookup) | `.maybeSingle()` | User might not exist |
| SELECT to check access | `.maybeSingle()` | RLS might restrict results |
| INSERT returning data | `.single()` | INSERT always returns 1 row |
| UPDATE returning data | `.single()` | UPDATE returns the row |

### Examples

```typescript
// BAD: Throws error if record doesn't exist
const { data } = await supabase
  .from('projects')
  .select('team_id')
  .eq('id', projectId)
  .single()  // PGRST116 if projectId doesn't exist!

// GOOD: Returns null if record doesn't exist
const { data } = await supabase
  .from('projects')
  .select('team_id')
  .eq('id', projectId)
  .maybeSingle()  // Returns null, no error

if (!data) throw new Error('Project not found')
```

### Common Patterns

```typescript
// Pattern 1: Check if entity exists before operation
const { data: project } = await supabase
  .from('projects')
  .select('team_id, owner_id')
  .eq('id', projectId)
  .maybeSingle()

if (!project) throw new Error('Project not found')

// Pattern 2: Check for duplicate before insert
const { data: existing } = await supabase
  .from('engagement_assets')
  .select('id')
  .eq('asset_id', assetId)
  .eq('engagement_id', engagementId)
  .maybeSingle()

if (existing) return // Already linked, skip insert

// Pattern 3: Get related entity for access check
const { data: rock } = await supabase
  .from('rocks')
  .select('team_id')
  .eq('id', rockId)
  .maybeSingle()

if (!rock) throw new Error('Rock not found')
await requireTeamAccess(rock.team_id)
```

---

## Server Action Authorization Patterns

### Standard Access Check Pattern

```typescript
export async function updateProject(projectId: string, data: Partial<Project>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Get entity to check access
  const { data: project } = await supabase
    .from('projects')
    .select('team_id, owner_id')
    .eq('id', projectId)
    .maybeSingle()

  if (!project) throw new Error('Project not found')

  // Authorization: owner OR manager/org_admin
  if (project.owner_id !== user.id) {
    await requireTeamRole(project.team_id, 'manager')
  } else {
    await requireTeamAccess(project.team_id)
  }

  // ... perform update
}
```

### Authorization Helpers

| Helper | Returns | Use When |
|--------|---------|----------|
| `requireTeamAccess(teamId)` | `{ userId, teamId }` | Any team member can access |
| `requireTeamRole(teamId, 'manager')` | `{ userId, teamId }` | Only managers/org_admins |
| `requireOrgAdmin(orgId)` | `void` | Only org admins |
| `getActiveTeam()` | `{ team, org, role, isOrgAdmin }` | Get current user's context |

---

## RLS Policy Pitfalls

### Circular Dependencies

RLS policies that use helper functions can create circular dependencies.

```sql
-- BAD: is_team_member queries team_memberships, creating circular dep
CREATE POLICY "team_memberships_select" ON team_memberships FOR SELECT
  USING (is_team_member(team_id));

-- GOOD: Add escape hatch for user's own records
CREATE POLICY "team_memberships_select" ON team_memberships FOR SELECT
  USING (
    user_id = auth.uid()  -- Users can always read their own memberships
    OR is_team_member(team_id)
    OR is_org_admin(get_org_from_team(team_id))
  );
```

### Column Reference Ambiguity

In subqueries, column names resolve to the innermost scope.

```sql
-- BAD: 'id' refers to team_memberships.id, not teams.id
WHERE tm.team_id = id

-- GOOD: Explicit table reference
WHERE tm.team_id = teams.id
```

### Silent Failures with Nested Selects

Non-existent columns in nested selects return null without error.

```typescript
// If 'slug' doesn't exist on orgs table, org will be null
const { data } = await supabase
  .from('teams')
  .select('*, org:orgs(id, name, slug)')  // slug doesn't exist!

// Always verify columns exist before using
```

---

## Error Handling Patterns

### Server Action Error Template

```typescript
export async function myAction(params: Params): Promise<Result> {
  const supabase = await createClient()

  try {
    // 1. Auth check
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    // 2. Fetch entity with maybeSingle()
    const { data: entity, error: fetchError } = await supabase
      .from('entities')
      .select('*')
      .eq('id', params.id)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching entity:', fetchError)
      throw new Error('Failed to fetch entity')
    }
    if (!entity) throw new Error('Entity not found')

    // 3. Authorization check
    await requireTeamAccess(entity.team_id)

    // 4. Perform operation
    const { data: result, error } = await supabase
      .from('entities')
      .update(params.data)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating entity:', error)
      throw new Error('Failed to update entity')
    }

    // 5. Revalidate and return
    revalidatePath('/relevant-path')
    return result

  } catch (err) {
    // Re-throw known errors, wrap unknown ones
    if (err instanceof Error) throw err
    throw new Error('An unexpected error occurred')
  }
}
```

---

## Performance Patterns

### Batch Loading

```typescript
// BAD: N+1 query pattern
for (const rockId of rockIds) {
  const rock = await getRock(rockId)
  // ...
}

// GOOD: Batch load
const { data: rocks } = await supabase
  .from('rocks')
  .select('*')
  .in('id', rockIds)
```

### Selective Includes

```typescript
// BAD: Loading everything
const { data } = await supabase
  .from('projects')
  .select('*, owner:profiles(*), tasks(*), milestones(*)')

// GOOD: Load only what you need
const { data } = await supabase
  .from('projects')
  .select('id, title, status, owner:profiles(full_name)')
```

---

## Testing Server Actions

### Mock Supabase Client

```typescript
// In test setup
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: mockUser } })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: mockEntity }),
      single: jest.fn().mockResolvedValue({ data: mockEntity }),
    }))
  }))
}))
```

---

## Debugging Checklist

When server actions fail unexpectedly:

1. **Check console for PGRST errors** - PGRST116 = `.single()` on 0 rows
2. **Verify RLS allows access** - Query as postgres to bypass RLS
3. **Check for circular RLS deps** - Policy queries same table
4. **Check nested select columns** - Non-existent columns fail silently
5. **Check auth state** - User might not be authenticated
6. **Check team membership** - User might not be in the team

### Debug Endpoint Pattern

Create a temporary API route to isolate issues:

```typescript
// src/app/api/debug/route.ts (REMOVE IN PRODUCTION)
export async function GET() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const teams = await supabase.from('teams').select('*')
  const memberships = await supabase.from('team_memberships').select('*').eq('user_id', user?.id)

  return Response.json({
    userId: user?.id,
    teamsCount: teams.data?.length,
    membershipsCount: memberships.data?.length,
    teamsError: teams.error,
    membershipsError: memberships.error,
  })
}
```

---

## Quick Reference

| Scenario | Solution |
|----------|----------|
| Query might return 0 rows | Use `.maybeSingle()` |
| Check entity exists before update | Fetch with `.maybeSingle()`, throw if null |
| Authorization check | Use `requireTeamAccess/Role/OrgAdmin` helpers |
| RLS returns empty | Check for circular deps, column refs |
| Nested select returns null | Verify all column names exist |
| Generic 500 error | Add console.error logging, check server logs |
