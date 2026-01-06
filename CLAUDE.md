# HEADWATERS – SYSTEM CONTRACT FOR CLAUDE

You are building an Enterprise Operating System (EOS-inspired) application for a Pre-Sales Technical Solutions Architect (TSA) organization.

This system is NOT:
- A CRM
- A task manager
- A customer delivery tracker
- A gamified productivity tool

This system IS:
- A strategy execution system (Rocks & Projects)
- A business observability system (Engagement intelligence)
- A capacity-constrained operating model

Failure to respect these constraints is a functional bug.

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

### 3. Rock Health Comes ONLY From Build Signals
- Rock health is derived from Build Signals (measurable outcomes).
- Revenue, GP, engagement count, or velocity MUST NEVER change Rock health.
- A Rock with missed Build Signals is unhealthy, regardless of business performance.

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
- Commitments MUST link to a Build Signal (required)
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
- Build Signals
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
- Allowing Rocks without Build Signals
- Allowing Commitments without Project + Build Signal links
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

### Git Commit Guidelines
- NEVER add "Generated with Claude Code" or similar attribution to commits
- NEVER add "Co-Authored-By: Claude" or any AI co-author attribution
- Commit messages should describe the changes, not who/what made them

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

Current migration files (in order):

| Migration | Purpose |
|-----------|---------|
| 001_create_tables.sql | Base tables + profile trigger |
| 002_rls_policies.sql | Initial RLS policies |
| 003_seed_data.sql | Reference data |
| 004_create_helper_functions.sql | RLS helper functions |
| 005_create_build_signals.sql | Build signals table |
| 006_fix_commitments_table.sql | Commitment model redesign |
| 007_create_rls_policies.sql | Team-scoped RLS policies |
| 008_deprecate_swarms.sql | Deprecate swarms → enablement_events |
| 009_fix_rls_policies.sql | Fix commitment policies |
| 010_enable_rls_junction_tables.sql | RLS for junction tables |
| 011_fix_function_search_paths.sql | Security: search_path on functions |
| 012_fix_profile_trigger.sql | Profile auto-creation trigger |
| 013_fix_enablement_event_assets_rls.sql | RLS for enablement_event_assets |

**To push new migrations:**
```bash
supabase db push
```
