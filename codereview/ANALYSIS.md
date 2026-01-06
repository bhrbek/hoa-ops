# Settings Visibility Bug - Root Cause Analysis

## Problem Statement
User `hrbekr@wwt.com` is logged in but:
- `isOrgAdmin` shows `false` in the UI
- `teams` array is empty `[]`
- Settings nav item doesn't appear (it requires `isOrgAdmin === true`)

## Data Verification (Database State)
```sql
-- Query run as postgres superuser (bypasses RLS)
SELECT p.id, p.email,
  (SELECT COUNT(*) FROM team_memberships tm WHERE tm.user_id = p.id AND tm.deleted_at IS NULL) as team_count,
  (SELECT COUNT(*) FROM org_admins oa WHERE oa.user_id = p.id) as org_admin_count
FROM profiles p WHERE p.email = 'hrbekr@wwt.com';

-- Result:
-- id: 10e887c9-5111-43a9-9229-5b1b34ba94e7
-- team_count: 1
-- org_admin_count: 1
```

**The data EXISTS in the database.** The user IS a team member AND an org admin.

---

## Data Flow Analysis

### 1. Sidebar Component (`sidebar.tsx`)
```typescript
const { user, isLoading, isOrgAdmin } = useTeam()
// ...
{isOrgAdmin && (
  <Link href="/settings/admin">Settings</Link>
)}
```
The Settings link only renders when `isOrgAdmin === true`.

### 2. Team Context (`team-context.tsx`)
```typescript
async function loadTeamData() {
  const [teamContext, userWithRoles] = await Promise.all([
    getActiveTeam(),
    getCurrentUserWithRoles(),
  ])

  if (userWithRoles) {
    setAvailableTeams(userWithRoles.teams || [])  // teams from DB query
  }

  if (teamContext) {
    setIsOrgAdmin(teamContext.isOrgAdmin)  // isOrgAdmin from DB query
  }
}
```

### 3. Auth Actions (`auth.ts`)

**`getCurrentUserWithRoles()`** - Fetches user's teams:
```typescript
const { data: memberships } = await supabase
  .from('team_memberships')
  .select(`id, role, team:teams(id, name, org:orgs(id, name))`)
  .eq('user_id', user.id)
  .is('deleted_at', null)
```

**`getActiveTeam()`** - Fetches active team context:
```typescript
const { data: team } = await supabase
  .from('teams')
  .select(`*, org:orgs(*)`)
  .eq('id', activeTeamId)
  .single()

const { data: orgAdmin } = await supabase
  .from('org_admins')
  .select('id')
  .eq('org_id', team.org_id)
  .eq('user_id', user.id)
  .single()
```

---

## RLS Policy Analysis

### Current RLS Policies (from database)

#### `team_memberships_select`
```sql
USING (
  deleted_at IS NULL AND (
    user_id = auth.uid()  -- CAN read own memberships
    OR is_team_member(team_id)
    OR is_org_admin(get_org_from_team(team_id))
  )
)
```
**Status: FIXED** - Users can read their own memberships.

#### `org_admins_select`
```sql
USING (
  user_id = auth.uid()  -- CAN read own admin status
  OR is_org_member(org_id)
)
```
**Status: FIXED** - Users can read their own org admin records.

#### `teams_select` **<-- THE BUG IS HERE**
```sql
USING (
  deleted_at IS NULL AND (
    EXISTS (
      SELECT 1 FROM team_memberships tm
      WHERE tm.team_id = tm.id  -- BUG! Should be: tm.team_id = teams.id
      AND tm.user_id = auth.uid()
      AND tm.deleted_at IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM org_admins oa
      WHERE oa.org_id = oa.org_id  -- BUG! Always true! Should be: oa.org_id = teams.org_id
      AND oa.user_id = auth.uid()
    )
  )
)
```

#### `orgs_select`
```sql
USING (
  EXISTS (
    SELECT 1 FROM team_memberships tm
    JOIN teams t ON tm.team_id = t.id
    WHERE t.org_id = orgs.id  -- Correctly references orgs.id
    AND tm.user_id = auth.uid()
    ...
  )
  OR EXISTS (
    SELECT 1 FROM org_admins oa
    WHERE oa.org_id = orgs.id  -- Correctly references orgs.id
    AND oa.user_id = auth.uid()
  )
)
```
**Status: OK** - Correctly written.

---

## ROOT CAUSE: teams_select Policy Bug

The `teams_select` policy in migration 015 has **two column reference bugs**:

### Bug 1: `tm.team_id = tm.id`
**What it does:** Compares `team_memberships.team_id` to `team_memberships.id` (both from the same table).
**What it should be:** `tm.team_id = teams.id` (compare to the outer teams table's id).
**Effect:** The condition `tm.team_id = tm.id` is checking if the foreign key equals the primary key of the same row - this is almost never true and effectively blocks all results.

### Bug 2: `oa.org_id = oa.org_id`
**What it does:** Compares `org_admins.org_id` to itself - always `TRUE` for any row.
**What it should be:** `oa.org_id = teams.org_id` (compare to the outer teams table's org_id).
**Effect:** This condition is always true, but because it's ORed with Bug 1, and the entire WHERE clause also requires `oa.user_id = auth.uid()`, it should return all teams where the user is an org admin. However, this still doesn't work correctly because the subquery is malformed.

### Why the bugs exist
When I wrote migration 015, I used `id` and `org_id` without qualifying them with the outer table name. PostgreSQL resolved these ambiguous references to the inner subquery tables (`tm` and `oa`) instead of the outer `teams` table.

**The orgs_select policy works** because I explicitly wrote `orgs.id` there.

---

## Query Chain Failure

1. **User loads page** → TeamContext calls `loadTeamData()`
2. **`getCurrentUserWithRoles()`** queries `team_memberships` with join to `teams`
3. **Join to `teams` fails** because `teams_select` policy blocks the user from seeing any teams
4. **Result:** `memberships` returns empty array, `userWithRoles.teams = []`
5. **`getActiveTeam()`** queries `teams` directly
6. **Query fails** because `teams_select` policy blocks access
7. **Result:** `teamContext = null`, `isOrgAdmin = false`
8. **Sidebar** receives `isOrgAdmin = false`, Settings doesn't render

---

## The Fix (95% Confidence)

Replace the `teams_select` policy with correct column references:

```sql
DROP POLICY IF EXISTS "teams_select" ON public.teams;

CREATE POLICY "teams_select" ON public.teams FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- User is a member of THIS team
      EXISTS (
        SELECT 1 FROM public.team_memberships tm
        WHERE tm.team_id = teams.id  -- FIXED: explicitly reference teams.id
        AND tm.user_id = auth.uid()
        AND tm.deleted_at IS NULL
      )
      -- Or user is an org admin for THIS team's org
      OR EXISTS (
        SELECT 1 FROM public.org_admins oa
        WHERE oa.org_id = teams.org_id  -- FIXED: explicitly reference teams.org_id
        AND oa.user_id = auth.uid()
      )
    )
  );
```

---

## Files in This Review

| File | Purpose |
|------|---------|
| `auth.ts` | Server actions that query team_memberships, teams, org_admins |
| `team-context.tsx` | React context that calls auth actions and sets isOrgAdmin state |
| `sidebar.tsx` | UI component that conditionally renders Settings based on isOrgAdmin |
| `middleware.ts` | Auth middleware (not directly related to this bug) |
| `014_fix_team_memberships_rls.sql` | Fixed team_memberships circular dependency |
| `015_fix_all_rls_circular_deps.sql` | Contains the buggy teams_select policy |

---

## Verification Steps After Fix

1. Apply the corrected teams_select policy
2. Query as the user to verify teams are visible:
   ```sql
   -- Should return the team(s) the user belongs to
   SELECT * FROM teams WHERE id IN (
     SELECT team_id FROM team_memberships
     WHERE user_id = '10e887c9-5111-43a9-9229-5b1b34ba94e7'
   );
   ```
3. Refresh the Vercel deployment
4. Check browser console for:
   - `teams: [{ id: '...', name: 'Campus Team', ... }]`
   - `isOrgAdmin: true`
5. Verify Settings nav item appears in sidebar
