# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# HEADWATERS – SYSTEM CONTRACT

An Enterprise Operating System (EOS-inspired) application for Pre-Sales Technical Solutions Architect (TSA) organizations.

**This system IS:**
- A strategy execution system (Rocks & Projects)
- A business observability system (Engagement intelligence)
- A capacity-constrained operating model

**This system is NOT:** A CRM, task manager, customer delivery tracker, or gamified productivity tool.

Failure to respect these constraints is a functional bug.

---

## BUILD & DEVELOPMENT COMMANDS

```bash
# Development
npm run dev              # Start dev server (Next.js 16 with Turbopack)
npm run build            # Production build
npm run start            # Start production server

# Testing
npm run test             # Watch mode
npm run test:run         # Single run (CI)
npm run test:coverage    # With coverage
npm run test -- <file>   # Run specific test file

# Code Quality
npm run lint             # ESLint
npx tsc --noEmit         # TypeScript check

# Database (Supabase)
supabase migration list --linked   # Check migration status
supabase db push --linked          # Push migrations
supabase inspect db table-stats --linked  # Table stats
```

---

## AI DEVELOPMENT REQUIREMENTS (NON-NEGOTIABLE)

### 95% Confidence Rule

**Before making any code change, you MUST be 95% confident that:**
1. You understand the root cause of the issue
2. Your proposed fix addresses the root cause, not symptoms
3. The fix will not introduce new issues
4. You have reviewed all relevant documentation

**If confidence is below 95%:**
1. Stop and investigate further
2. Read relevant files and documentation
3. Trace through the code path
4. Check database schema and RLS policies
5. Create debug endpoints or add logging if needed
6. Only proceed when confidence reaches 95%

**Do NOT:**
- Make speculative changes
- Fix symptoms instead of root causes
- Skip reviewing existing documentation
- Make cascading changes without understanding dependencies

---

## CORE PHILOSOPHY (NON-NEGOTIABLE)

### 1. Engagements Are Sand
- Engagements are ever-present and unavoidable.
- Engagements are NOT strategic.
- Engagements NEVER affect Rock health.
- Engagements exist to observe business reality and trends.

### 2. Rocks Represent Capability Creation
- A Rock is a quarterly commitment to create or materially improve a capability.
- Every Rock MUST define a Perfect Outcome (max 3 sentences).
- Rock success is binary: the capability exists or it does not.

### 3. Rock Health Comes ONLY From Key Results
- Rock health is derived from Key Results (measurable outcomes).
- Revenue, GP, engagement count, or velocity MUST NEVER change Rock health.
- A Rock with missed Key Results is unhealthy, regardless of business performance.

### 4. Projects Are Internal Capability-Build Efforts
- Projects are not customer delivery.
- Projects exist to produce the Rock's Perfect Outcome.
- Projects MUST have:
  - Owner
  - Timeline
  - Milestones
  - Status

### 5. Commitments Drive Weekly Execution
- Commitments MUST link to a Project (required)
- Commitments MUST link to a Key Result (required)
- Commitments NEVER link to Engagements
- Finishable in ≤7 days with binary "Done means..." definition

### 6. Capacity Physics Is Enforced
- 20% of weekly capacity is reserved for Water (admin/internal noise).
- This allocation is fixed and cannot be configured away.
- The UI must visually enforce capacity limits.

---

## UI PRINCIPLES

- Visual clarity over density
- No dark mode
- No gamification
- No vanity metrics
- Professional, clean, "field guide" aesthetic ("Glacier Modern")

---

## REPORTING SEPARATION

There are two distinct lenses that MUST NOT be merged:

### Strategy Execution Lens
- Rocks
- Key Results
- Projects
- Commitments
- Capacity (Headwaters)

### Business Observability Lens
- Engagement trends
- OEM involvement and pairings
- Domains and innovation themes
- Influenced revenue and GP
- Velocity and deal shape

Do NOT infer strategy success from business outcomes inside Rock logic.

---

## MULTI-TEAM ARCHITECTURE (HEADWATERS)

### Hierarchy
- Organizations contain Teams
- Teams contain: Rocks, Projects, Engagements, Commitments, Assets
- Customers are ORG-SCOPED (shared across all teams in org)

### Roles
- **Org Admin:** Full access to all teams, manage org settings
- **Manager:** Manage team, create Rocks, set Beacons
- **TSA:** Log engagements, manage commitments, edit any team engagement

### Soft Delete Only
All primary tables use soft delete (`deleted_at`, `deleted_by`). No hard deletes.

---

## SUPABASE CLI WORKFLOW

### Project Details
- **Project Ref:** pstevmcaxrqalafoyxmy
- **Region:** East US (North Virginia)

### Check if Linked
```bash
supabase projects list
```
Look for `●` next to "Headwaters".

### Running Migrations

Check status:
```bash
supabase migration list --linked
```

Push new migrations:
```bash
supabase db push --linked
```

### If Old Migrations Fail (tables already exist)
Mark them as applied:
```bash
supabase migration repair 001 002 003 --status applied --linked
```

### Common Issues

1. **"relation already exists"** - Mark migration as applied:
   ```bash
   supabase migration repair XXX --status applied --linked
   ```

2. **"cannot change name of input parameter"** - Drop function first:
   ```sql
   DROP FUNCTION IF EXISTS function_name(param_types) CASCADE;
   ```

3. **"uuid_generate_v4() does not exist"** - Use `gen_random_uuid()` instead

4. **"cannot drop function because other objects depend on it"** - Add CASCADE:
   ```sql
   DROP FUNCTION IF EXISTS function_name(uuid) CASCADE;
   ```

### Inspecting the Database
```bash
supabase inspect db table-stats --linked
```

### Programmatic Database Access (REST API)

The most reliable way to query the database programmatically is via the Supabase REST API:

```bash
# Get API keys
supabase projects api-keys --project-ref pstevmcaxrqalafoyxmy

# Service role key (full access, bypasses RLS)
SERVICE_KEY="<service_role key from above>"
BASE_URL="https://pstevmcaxrqalafoyxmy.supabase.co"

# Query a table
curl -s "$BASE_URL/rest/v1/rocks?select=id,title,team_id" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY"

# Count rows in a table
curl -s -I "$BASE_URL/rest/v1/rocks?select=id&limit=0" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Prefer: count=exact" | grep -i content-range

# Call an RPC function
curl -s "$BASE_URL/rest/v1/rpc/is_team_member" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"check_team_id": "uuid-here"}'

# Insert data
curl -s "$BASE_URL/rest/v1/rocks" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{"team_id": "uuid", "title": "Test Rock", ...}'
```

**Important:** Service role key bypasses RLS policies. Use anon key to test RLS behavior.

### DO NOT USE
- `psql` direct connection (often fails with pooler issues)
- `supabase db execute` (command doesn't exist)

### Migration File Naming
Format: `XXX_description.sql` where XXX is 3-digit number (001, 002, etc.)

---

## FAILURE MODES TO PREVENT

- Treating engagement volume as progress
- Allowing Rocks without Key Results
- Allowing Commitments without Project + Key Result links
- Allowing revenue metrics to influence Rock health
- Overbooking capacity beyond the Jar
- Hard deleting any primary table records
- Making Customers team-scoped (they are org-scoped!)

If unsure, default to enforcing discipline over flexibility.

---

## CURRENT ARCHITECTURE

### Key Directories
```
src/
├── app/                    # Next.js App Router pages
│   ├── actions/           # Server actions (Phase 3)
│   ├── auth/              # Auth callback
│   ├── climb/             # Strategy execution (Rocks/Projects)
│   ├── commitment-board/  # Weekly commitments
│   ├── login/             # Authentication
│   ├── reports/           # Business observability
│   └── stream/            # Engagements
├── components/
│   ├── climb/             # Rock/Project dialogs
│   ├── shell/             # Layout (sidebar, app-shell, team-selector)
│   ├── stream/            # Engagement drawer, asset selector
│   └── ui/                # shadcn/ui components
├── contexts/
│   └── team-context.tsx   # Team switching, user roles
├── lib/
│   └── supabase/          # Supabase client (client/server/middleware)
└── types/
    └── supabase.ts        # All TypeScript types
```

### Key Imports for UI Components
```typescript
// Team context (provides active team, user, members)
import { useTeam } from "@/contexts/team-context"

// Server actions
import { getActiveTeam, getCurrentUserWithRoles } from '@/app/actions/auth'
import { getTeamMembers, switchTeam } from '@/app/actions/teams'
import { getActiveRocks } from '@/app/actions/rocks'
import { getActiveEngagements } from '@/app/actions/engagements'
import { getAssets } from '@/app/actions/assets'
```

### UI Routes
| Route | View | Purpose |
|-------|------|---------|
| `/` | Vista | Dashboard overview |
| `/stream` | Stream | Engagement logging |
| `/rocks` | Rocks | Rocks & Projects |
| `/commitment-board` | Commitments | Weekly execution |
| `/reports` | Reports | Business observability |
| `/settings/admin` | Admin Settings | Manage domains, OEMs (org admin only) |
| `/login` | Login | Authentication |

### Team Context Provides
```typescript
{
  activeTeam: Team | null
  activeOrg: Org | null
  currentRole: TeamRole | null  // 'manager' | 'tsa'
  isOrgAdmin: boolean
  user: Profile & { email: string } | null
  teamMembers: TeamMembershipWithUser[]
  availableTeams: (Team & { role, org })[]
  switchTeam: (teamId) => Promise<void>
  refreshTeamData: () => Promise<void>
}
```

---

## DEVELOPMENT NOTES

### Versioning
- Version format: `YYYYMMDD-vN` (e.g., `20260106-v6`)
- Version is stored in `/VERSION` file at project root
- **Update VERSION file before each commit/push**
- Version is displayed in bottom-right corner of the app (click to copy)
- `next.config.ts` reads VERSION and injects as `NEXT_PUBLIC_APP_VERSION`

### Admin Configuration
Org admins can configure system reference data at `/settings/admin`:

| Data Type | Configurable | Notes |
|-----------|--------------|-------|
| Domains | Yes | Technology domains (Cloud, Security, etc.) with color badges |
| OEMs | Yes | Vendor/partner list (Cisco, AWS, etc.) |
| Activity Types | No | System-defined: Workshop, Demo, POC, Advisory |

**Server Actions for Admin:**
```typescript
// Domains
import { createDomain, updateDomain, deleteDomain } from '@/app/actions/reference'

// OEMs
import { createOEM, updateOEM, deleteOEM } from '@/app/actions/reference'
```

### User Setup (First-Time)

New users must be added to a team before they can access the app:

1. User signs up at `/login` (creates auth user + profile via trigger)
2. Admin runs setup script to add them to org/team:

```bash
./scripts/setup-admin.sh user@email.com
```

This script:
- Looks up the user's profile
- Adds them as org admin (Headwaters org)
- Adds them as team manager (Campus Team)

### Authentication Flow

1. **Middleware** (`middleware.ts`) checks auth on every request
2. Unauthenticated users → redirect to `/login`
3. Authenticated users without team membership → stuck (must run setup script)
4. Authenticated users with team → full app access

**Important**: The middleware is self-contained (no imports from `@/lib/supabase/middleware`). This is required for Next.js 16 Turbopack compatibility.

### Database Migrations

Current migration files (001-024). Key migrations:

| Migration | Purpose |
|-----------|---------|
| 001-003 | Base tables, RLS policies, seed data |
| 004 | RLS helper functions (`is_org_admin`, `is_team_member`, etc.) |
| 005-006 | Key results table, commitment model redesign |
| 007-009 | Team-scoped RLS policies and fixes |
| 010-013 | Junction table RLS, function security, profile trigger |
| 014-016 | Fix RLS circular dependencies and column references |
| 017-019 | Activity types, audit log RLS, security warnings |
| 020 | Rename `build_signals` → `key_results` |
| 021-022 | Commitments FK, performance indexes |
| 023-024 | Storage bucket, security issue fixes |

**To push new migrations:**
```bash
supabase db push --linked
```

**Next migration number:** 025


### Known Issue: Turbopack Middleware

Next.js 16 Turbopack (dev mode) does not execute middleware. Auth redirects only work in production.

**Workaround for development:**
- Run `npm run build && npm run start` to test with middleware
- Or manually navigate to /login

**Production works correctly** - Vercel deployments will have proper auth.

---

## RLS POLICY BEST PRACTICES (LESSONS LEARNED)

These rules were learned from debugging circular dependency and column reference bugs in migrations 014-016.

### 1. Always Add Self-Access Escape Hatch

When a policy on table X uses a helper function that queries table X, users can't bootstrap access.

**BAD:**
```sql
CREATE POLICY "team_memberships_select" ON team_memberships FOR SELECT
  USING (is_team_member(team_id));  -- is_team_member queries team_memberships!
```

**GOOD:**
```sql
CREATE POLICY "team_memberships_select" ON team_memberships FOR SELECT
  USING (
    user_id = auth.uid()  -- Escape hatch: users can always read OWN records
    OR is_team_member(team_id)
    OR is_org_admin(get_org_from_team(team_id))
  );
```

### 2. Always Use Explicit Table References in Subqueries

PostgreSQL resolves ambiguous column names to the innermost scope. In a subquery, `id` refers to the subquery's table, not the outer table.

**BAD:**
```sql
-- This compares tm.team_id to tm.id (same table - wrong!)
WHERE tm.team_id = id
```

**GOOD:**
```sql
-- Explicitly reference the outer table
WHERE tm.team_id = teams.id
```

### 3. Test RLS with Simulated User Context

```bash
PGPASSWORD='xxx' psql "connection_string" -c "
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{\"sub\": \"user-uuid-here\"}';
SELECT * FROM teams WHERE deleted_at IS NULL;
"
```

### 4. Supabase Nested Selects Fail Silently

If a column doesn't exist in a nested select, the entire select returns empty/null without error:

```typescript
// If 'slug' column doesn't exist on orgs table, this returns null for org
const { data } = await supabase
  .from('teams')
  .select('*, org:orgs(id, name, slug)')  // slug doesn't exist!
```

**Always verify column names exist** before adding them to nested selects.

### 5. Use maybeSingle() Instead of single()

`.single()` throws an error on 0 rows. `.maybeSingle()` returns null.

**BAD:**
```typescript
const { data } = await supabase.from('org_admins')
  .select('id').eq('user_id', userId).single()  // Throws on 0 rows!
```

**GOOD:**
```typescript
const { data } = await supabase.from('org_admins')
  .select('id').eq('user_id', userId).maybeSingle()  // Returns null on 0 rows
```

### 6. Explicit FK Hints for Ambiguous Relationships (PGRST201)

When a table has multiple FKs pointing to the same table, PostgREST cannot infer which relationship to use and returns error `PGRST201: Could not embed because more than one relationship was found`.

**Example Problem:**
```typescript
// rocks table has BOTH owner_id AND deleted_by pointing to profiles
.select('*, owner:profiles(*)')  // FAILS - ambiguous!
```

**Solution - Use explicit FK hint:**
```typescript
.select('*, owner:profiles!rocks_owner_id_fkey(*)')  // Works!
```

**Tables requiring explicit FK hints:**

| Table | Field | FK Hint |
|-------|-------|---------|
| rocks | owner | `profiles!rocks_owner_id_fkey` |
| projects | owner | `profiles!projects_owner_id_fkey` |
| team_memberships | user | `profiles!team_memberships_user_id_fkey` |
| org_admins | user | `profiles!org_admins_user_id_fkey` |
| commitments | owner | `profiles!commitments_owner_id_fkey` |
| engagements | owner | `profiles!engagements_owner_id_fkey` |

**Why this happens:** Soft delete pattern adds `deleted_by` FK to profiles alongside the primary FK (owner_id, user_id).

### 7. RLS Debugging Checklist

When RLS queries return empty unexpectedly:

1. **Verify data exists** (query as postgres bypassing RLS)
2. **Check for circular dependencies** (policy uses function that queries same table)
3. **Check column references** (subqueries may reference wrong table)
4. **Check nested selects** (non-existent columns fail silently)
5. **Check for .single() vs .maybeSingle()** (single() throws on 0 rows)
6. **Check for PGRST201** (ambiguous FK - use explicit FK hints)
7. **Create debug endpoint** to isolate server action vs RLS issues

---

## TESTING

### Test Stack
- **Vitest** - Test runner (React 19 + Next.js compatible)
- **@testing-library/react** - Component testing
- **@testing-library/user-event** - User interaction simulation
- **jsdom** - DOM environment

### Running Tests

```bash
npm run test          # Watch mode (development)
npm run test:run      # Single run (CI)
npm run test:coverage # With coverage report
```

### When to Run Tests

**ALWAYS run tests before:**
- Committing changes to modal/dialog components
- Modifying form validation logic
- Changing server action integrations
- Refactoring UI components with user interactions

**Test commands for specific files:**
```bash
npm run test -- engagement-drawer    # Run engagement drawer tests
npm run test -- create-rock-dialog   # Run rock dialog tests
npm run test:run                     # Run all tests once
```

### Test File Locations

| Component | Test File |
|-----------|-----------|
| EngagementDrawer | `src/components/stream/__tests__/engagement-drawer.test.tsx` |
| CreateRockDialog | `src/components/climb/__tests__/create-rock-dialog.test.tsx` |
| CreateProjectDialog | `src/components/climb/__tests__/create-project-dialog.test.tsx` |
| CreateCommitmentDialog | `src/components/commitment/__tests__/create-commitment-dialog.test.tsx` |

### Key Test Infrastructure

| File | Purpose |
|------|---------|
| `vitest.config.ts` | Test runner configuration |
| `src/test/setup.ts` | Global mocks (Next.js, Sonner, ResizeObserver, etc.) |
| `src/test/test-utils.tsx` | Custom render with providers, mock factories |
| `docs/TESTABILITY-ISSUES.md` | Known limitations and workarounds |

### Known Limitation: Radix UI Select in jsdom

Radix UI Select components don't expose proper `role="option"` in jsdom. Dropdown option selection cannot be tested reliably.

**Workaround:** Test that select triggers exist and have default values. Skip testing dropdown option selection.

```typescript
// DON'T DO THIS (won't work):
await user.click(screen.getByRole('combobox', { name: /owner/i }))
await user.click(screen.getByText('Test User'))

// DO THIS INSTEAD:
// Verify the selector trigger exists
const ownerTrigger = document.getElementById('rock-owner')
expect(ownerTrigger).toBeInTheDocument()
```

**For full dropdown interaction testing, use E2E tests (Playwright/Cypress).**

### Writing Modal Component Tests

Modal components should test:
1. **Open/Close behavior** - Cancel, X button, Escape key
2. **Form fields presence** - All inputs/selects are rendered
3. **Form validation** - Required fields, disabled submit button
4. **Accessibility** - Dialog role, labels, focus trap
5. **Clean unmount** - No errors on unmount

**Template:**
```typescript
describe('MyDialog', () => {
  describe('Modal Open/Close Behavior', () => { /* ... */ })
  describe('Form Fields', () => { /* ... */ })
  describe('Form Validation', () => { /* ... */ })
  describe('Accessibility', () => { /* ... */ })
  describe('Clean Unmount', () => { /* ... */ })
})
```

### Mock Data Factories

Use `src/test/test-utils.tsx` mock factories for consistent test data:

```typescript
import {
  createMockEngagement,
  createMockRock,
  createMockProject,
  createMockKeyResult
} from '@/test/test-utils'

const mockRock = createMockRock({
  id: 'rock-1',
  title: 'Custom Title'
})
```

### TeamContext in Tests

Provide custom team context through the render options:

```typescript
render(<MyComponent />, {
  teamContext: {
    teamMembers: [/* custom members */],
    isOrgAdmin: true,
    isLoading: false,
  },
})
```

---

## SESSION CONTINUITY & MCP SERVERS

### Start of Session Checklist

At the start of each Claude Code session, review:

1. **This file (CLAUDE.md)** - System contract, architecture, patterns
2. **docs/TASKS.md** - Current task backlog and progress
3. **VERSION file** - Current version number
4. **Git status** - Uncommitted changes, current branch

### Installed MCP Servers

These MCP servers are configured for this project:

| Server | Purpose | Usage |
|--------|---------|-------|
| `postgres` | Direct Supabase DB access | Query tables, check RLS, debug data |
| `github` | GitHub integration | PR management, issues, code search |
| `filesystem` | File access | Read/write files in ~/Documents |
| `memory` | Persistent knowledge | Remember context across sessions |

**Check MCP status:**
```bash
claude mcp list
```

**Add new MCP server:**
```bash
claude mcp add <name> -- <command>
```

### Available Skills & Commands

Skills and commands are documented workflows in `.claude/skills/` and `.claude/commands/`.

**Commands** (user-invocable via `/`):

| Command | Purpose | Description |
|---------|---------|-------------|
| `/ship` | Version, commit, push | Bumps VERSION, runs tests/build, commits, pushes |
| `/review` | Production readiness review | Principal Engineer code review persona |

**Skills** (documented workflows):

| Skill | Purpose | Command |
|-------|---------|---------|
| `/test` | Run modal and functional tests | `npm run test:run` |
| `/build` | Build and verify | `npm run build` |
| `/lint` | Code quality checks | `npm run lint` |
| `/typecheck` | TypeScript checking | `npx tsc --noEmit` |
| `/db` | Database operations | `supabase db push --linked` |
| `/db-inspect` | Database exploration | See skill for queries |
| `/debug-rls` | RLS permission debugging | `./scripts/debug-rls.sh` |
| `/check-deploy` | Verify deployment status | `./scripts/check-deploy.sh` |
| `/commit` | Safe git commits | See skill for checklist |
| `/pr` | Create pull requests | `gh pr create` |
| `/startup` | Session initialization | Load memory + check state |
| `/migration` | Database migration guide | See skill for steps |
| `/new-dialog` | Dialog component template | See skill for pattern |
| `/new-action` | Server action template | See skill for pattern |
| `/confidence-check` | 95% confidence checklist | See skill for checklist |

### Automatic Skill Triggers

When these events occur, run the corresponding skill:

| Event | Run Skill | Why |
|-------|-----------|-----|
| Session start | `/startup` | Load memory graph, check version, review tasks |
| Before commit | `/test`, `/build` | Ensure code works before committing |
| After schema change | `/typecheck` | Catch type errors from renamed/removed columns |
| Permission errors | `/debug-rls` | Diagnose RLS policy issues |
| Before PR | `/review` | Production readiness check |
| After migration | `/db` | Verify migration applied correctly |
| Build failures | `/typecheck` | Isolate TypeScript vs runtime errors |

### Pre-Commit Checklist (Automated)

Before every commit, run this sequence:
```bash
npm run lint && npm run build && npm run test:run
```

If any step fails, fix before committing.

### Task Tracking

**Primary task file:** `docs/TASKS.md`

This file contains:
- Current sprint/phase tasks
- Completed work log
- Known issues and blockers
- Future roadmap items

**Always update TASKS.md when:**
- Starting a new feature
- Completing a task
- Discovering bugs/blockers
- Making architectural decisions

### Project Status

**Headwaters** is a strategy execution system for TSA organizations. All core features implemented (Phases 0-14 complete).

**Terminology (OKR alignment):**
- **Rock** = Objective (quarterly strategic commitment)
- **Key Result** = Measurable outcome that indicates Rock success

**For detailed task history and future roadmap, see `docs/TASKS.md`.**

### Quick State Check Commands

```bash
# Current version
cat VERSION

# Git status
git status --short

# Recent commits
git log --oneline -5

# Check if deployment is current
curl -s https://thejar.vercel.app/api/debug | jq '.serverActions.getActiveRocks'

# Database quick check (use supabase projects api-keys to get credentials)
# See SUPABASE CLI WORKFLOW section for REST API queries
```

### Resuming Work

When resuming an interrupted session:

1. Read the last few git commits to understand recent changes
2. Check `docs/TASKS.md` for current progress
3. Review any open TODO items in the code (`grep -r "TODO" src/`)
4. Check Vercel deployment status if testing production
