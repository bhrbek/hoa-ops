# Headwaters Migration - Implementation Tasks

## Status Legend
- [ ] Not started
- [x] Completed
- [~] In progress

---

## Phase 0: Documentation

- [x] Create `docs/TASKS.md` (this file)
- [x] Update `docs/product-design-specs.md` with Headwaters multi-team specs
- [x] Create `docs/PRD-headwaters.md` - Product Requirements Document

---

## Phase 1: Database Migrations

### 1.1 Helper Functions (MUST BE FIRST)
- [x] Create `supabase/migrations/004_create_helper_functions.sql`
  - [x] `is_org_admin(check_org_id uuid)` - Check if user is org admin
  - [x] `is_org_member(check_org_id uuid)` - Check if user belongs to any team in org
  - [x] `is_team_member(check_team_id uuid)` - Check if user is team member
  - [x] `is_team_manager(check_team_id uuid)` - Check if user is team manager
  - [x] `get_org_from_team(check_team_id uuid)` - Get org_id from team_id
- [x] Run migration in Supabase

### 1.2 Build Signals Table
- [x] Create `supabase/migrations/005_create_build_signals.sql`
  - [x] Table with: team_id, rock_id, title, description, target_value, current_value, unit, status, due_date
  - [x] Indexes for team_id, rock_id, status
  - [x] Soft delete columns (deleted_at, deleted_by)
- [x] Run migration in Supabase

### 1.3 Fix Commitments Table
- [x] Create `supabase/migrations/006_fix_commitments_table.sql`
  - [x] Add `project_id` (required FK to projects)
  - [x] Add `build_signal_id` (required FK to build_signals)
  - [x] Add `definition_of_done` (required text)
  - [x] Change `completed` boolean to `status` enum (planned/done/blocked/slipped)
  - [x] Rename `date` to `week_of`
  - [x] Rename `user_id` to `owner_id`
  - [x] Drop `engagement_id` link (never link commitments to engagements)
  - [x] Drop `type` column (no longer needed)
  - [x] Drop `hours_value` column (use project estimated_hours instead)
- [x] Run migration in Supabase

### 1.4 RLS Policies
- [x] Create `supabase/migrations/007_create_rls_policies.sql`
  - [x] Drop existing policies that don't use helpers
  - [x] Create policies for: orgs, teams, team_memberships, org_admins
  - [x] Create policies for: rocks, projects, tasks, engagements (team-scoped)
  - [x] Create policies for: customers (org-scoped)
  - [x] Create policies for: assets, milestones, build_signals, commitments
  - [x] Create policies for: enablement_events
  - [x] All policies use helper functions
  - [x] No WITH CHECK on SELECT or DELETE
- [x] Run migration in Supabase

### 1.5 Deprecate Swarms
- [x] Create `supabase/migrations/008_deprecate_swarms.sql`
  - [x] Add soft delete columns to swarms if not present
  - [x] Migrate any swarms data to enablement_events
  - [x] Soft-delete all swarms records
- [x] Run migration in Supabase

---

## Phase 2: TypeScript Types

- [x] Update `src/types/supabase.ts`
  - [x] Add Org, Team, TeamMembership, OrgAdmin types
  - [x] Add Customer type (org-scoped)
  - [x] Add Asset type
  - [x] Add Milestone type
  - [x] Add BuildSignal type
  - [x] Add Commitment type (with new structure)
  - [x] Add EnablementEvent type
  - [x] Add AuditLog type
  - [x] Update Rock, Project, Task, Engagement with team_id, deleted_at, deleted_by

---

## Phase 3: Server Actions

### 3.1 New Action Files
- [x] Create `src/app/actions/auth.ts`
  - [x] `getCurrentUserWithRoles()` - Get user with org/team roles
  - [x] `requireTeamAccess(teamId)` - Throw if no access
  - [x] `requireTeamRole(teamId, role)` - Throw if not role
  - [x] `requireOrgAdmin(orgId)` - Throw if not org admin
- [x] Create `src/app/actions/teams.ts`
  - [x] `getTeams(orgId)` - List teams in org
  - [x] `createTeam(data)` - Create team (org admin only)
  - [x] `updateTeam(teamId, data)` - Update team
  - [x] `deleteTeam(teamId)` - Soft delete team
  - [x] `getTeamMembers(teamId)` - List members
  - [x] `addTeamMember(teamId, userId, role)` - Add member
  - [x] `removeTeamMember(teamId, userId)` - Remove member
  - [x] `setActiveTeam(teamId)` - Set cookie
  - [x] `getActiveTeam()` - Get from cookie
- [x] Create `src/app/actions/orgs.ts`
  - [x] `getOrg(orgId)` - Get org details
  - [x] `updateOrg(orgId, data)` - Update org
  - [x] `getOrgAdmins(orgId)` - List org admins
  - [x] `addOrgAdmin(orgId, userId)` - Add org admin
  - [x] `removeOrgAdmin(orgId, userId)` - Remove org admin
- [x] Create `src/app/actions/customers.ts`
  - [x] `getCustomers(orgId)` - List org customers
  - [x] `createCustomer(data)` - Create customer
  - [x] `updateCustomer(customerId, data)` - Update customer
  - [x] `deleteCustomer(customerId)` - Soft delete
- [x] Create `src/app/actions/assets.ts`
  - [x] `getAssets(teamId)` - List team assets
  - [x] `createAsset(data)` - Create asset
  - [x] `updateAsset(assetId, data)` - Update asset
  - [x] `deleteAsset(assetId)` - Soft delete
  - [x] `linkAssetToProject(assetId, projectId)` - Link
  - [x] `linkAssetToEngagement(assetId, engagementId)` - Link
- [x] Create `src/app/actions/milestones.ts`
  - [x] `getMilestones(projectId)` - List project milestones
  - [x] `createMilestone(data)` - Create milestone
  - [x] `updateMilestone(milestoneId, data)` - Update
  - [x] `deleteMilestone(milestoneId)` - Soft delete
  - [x] `completeMilestone(milestoneId)` - Mark complete
- [x] Create `src/app/actions/build-signals.ts`
  - [x] `getBuildSignals(rockId)` - List rock's build signals
  - [x] `createBuildSignal(data)` - Create build signal
  - [x] `updateBuildSignal(signalId, data)` - Update
  - [x] `updateBuildSignalProgress(signalId, currentValue)` - Update progress
  - [x] `deleteBuildSignal(signalId)` - Soft delete
- [x] Create `src/app/actions/enablement-events.ts`
  - [x] `getEnablementEvents(teamId)` - List team events
  - [x] `createEnablementEvent(data)` - Create event
  - [x] `updateEnablementEvent(eventId, data)` - Update
  - [x] `deleteEnablementEvent(eventId)` - Soft delete
- [x] Create `src/app/actions/commitments.ts`
  - [x] `getCommitments(teamId, weekOf?)` - List commitments
  - [x] `getMyCommitments(weekOf?)` - List current user's commitments
  - [x] `createCommitment(data)` - Create commitment
  - [x] `updateCommitment(commitmentId, data)` - Update (owner only)
  - [x] `markCommitmentDone(commitmentId)` - Mark done
  - [x] `carryCommitment(commitmentId, nextWeek)` - Carry to next week
  - [x] `splitCommitment(commitmentId, newCommitments[])` - Split
  - [x] `dropCommitment(commitmentId)` - Soft delete

### 3.2 Update Existing Actions
- [x] Update `src/app/actions/rocks.ts`
  - [x] Add team_id filter to all queries
  - [x] Add `deleted_at IS NULL` filter
  - [x] Change delete to soft delete
  - [x] Add role checks
- [x] Update `src/app/actions/projects.ts`
  - [x] Add team_id filter (inherit from rock)
  - [x] Add soft delete
  - [x] Add `deleted_at IS NULL` filter
- [x] Update `src/app/actions/engagements.ts`
  - [x] Change to team-scoped visibility
  - [x] Allow TSA to edit any team engagement
  - [x] Add customer_id support
  - [x] Add asset linkage
  - [x] Track last_edited_by/last_edited_at
  - [x] Soft delete only
- [x] Update `src/app/actions/reference.ts`
  - [x] Add team profile helpers
  - [x] Filter customers by org

---

## Phase 4: UI Components

### 4.1 New Components
- [x] Create `src/contexts/team-context.tsx`
  - [x] TeamProvider with state
  - [x] useTeam() hook
  - [x] Active team from cookie
  - [x] Team switching logic
- [x] Create `src/components/shell/team-selector.tsx`
  - [x] Dropdown for team selection
  - [x] Show current team name
  - [x] List available teams
  - [x] Switch team action
- [x] Create `src/components/stream/asset-selector.tsx`
  - [x] Multi-select for assets
  - [x] Badge-based selection
  - [x] Search/filter
- [x] Create `src/components/ui/popover.tsx`
  - [x] Radix UI popover for asset selector

### 4.2 Update Existing Components
- [x] Update `src/components/shell/sidebar.tsx`
  - [x] Add TeamSelector below logo
  - [x] Remove hardcoded user data
  - [x] Use TeamContext
  - [x] Add nav items for Reports and Commitment Board
- [x] Update `src/components/shell/app-shell.tsx`
  - [x] Wrap with TeamProvider
- [x] Update `src/components/stream/engagement-drawer.tsx`
  - [x] Add "Assets Used" section
  - [x] Filter rocks by team
  - [x] Show creator/last editor
  - [x] Fetch domains/OEMs/rocks from server
- [x] Update `src/components/climb/create-rock-dialog.tsx`
  - [x] Use team members from context
  - [x] Add team_id to payload
  - [x] Add worst_outcome field
- [x] Update `src/components/climb/create-project-dialog.tsx`
  - [x] Use team members from context
  - [x] Accept rocks as prop (filtered by team)

### 4.3 Update Pages
- [x] Update `src/app/page.tsx` (Vista)
  - [x] Add useTeam() hook
  - [x] Show team name in header
  - [x] Add Link import for navigation
- [x] Update `src/app/stream/page.tsx`
  - [x] Add useTeam() hook
  - [x] Show team name in header
- [x] Update `src/app/climb/page.tsx`
  - [x] Add useTeam() hook
  - [x] Show team name in header
  - [x] Updated description to mention Build Signals

### 4.4 New Pages
- [x] Create `/reports` route
  - [x] Revenue by asset report
  - [x] OEM pairs analysis
  - [x] Domain trends
  - [x] Tabbed interface
- [x] Create `/commitment-board` route
  - [x] Weekly commitment board with matrix view
  - [x] Week navigation
  - [x] Status indicators (planned/done/blocked/slipped)
  - [x] Capacity warnings (Shield Up)
  - [x] Legend and rules reminder

---

## Phase 5: Testing & Verification

### 5.1 Database Verification
- [x] Verify all required tables exist (via `supabase inspect db table-stats`)
- [x] Verify indexes created (via `supabase inspect db index-sizes`)
- [x] Create SQL verification script (`scripts/verify-database.sql`)
- [x] Type-check server actions (all Phase 3 code passes)
- [x] Fix TypeScript type mismatches

### 5.2 Manual Testing (Run in Supabase Dashboard)
- [ ] Test helper functions in Supabase SQL editor
- [ ] Test RLS policies with different user roles
- [ ] Test soft delete behavior
- [ ] Verify no cross-team data leakage

### 5.3 Integration Testing (After UI)
- [ ] Test team switching
- [ ] Test commitment creation/carryover
- [ ] Test engagement shared editing

---

## Notes

### Guardrails (Non-Negotiable)
- Soft delete only - no hard deletes
- Customers are org-scoped
- TSAs can edit any engagement in their team
- Commitments: Project + Build Signal required
- No gamification, badges, scores
- Helper functions before policies

### Key Decisions
- Cookie-based active team storage (`hw_active_team`)
- Role enum: `manager` | `tsa`
- Commitment status: `planned` | `done` | `blocked` | `slipped`
- Build signal status: `not_started` | `in_progress` | `achieved` | `missed`

### Phase 4 Notes
- **COMPLETED**: All UI components now use the `UserWithRoles` type correctly with `user.teams`
- The context provides:
  - `activeTeam`, `activeOrg`, `currentRole`, `isOrgAdmin`
  - `user` (Profile with email)
  - `teamMembers` (TeamMembershipWithUser[])
  - `availableTeams` with role and org info
  - `switchTeam()` and `refreshTeamData()` actions
- New pages added to sidebar navigation:
  - `/reports` - Business observability (revenue by asset, OEM pairs, domain trends)
  - `/commitment-board` - Weekly commitment matrix view
- **NPM Package Added**: `@radix-ui/react-popover` for asset selector

### Testing Scripts
- `scripts/verify-database.sql` - Run in Supabase Dashboard SQL Editor
- `scripts/test-database.ts` - Run with `npx tsx scripts/test-database.ts` (needs env vars)
