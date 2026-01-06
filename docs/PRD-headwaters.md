# PRD: Headwaters Multi-Team Architecture

**Product:** The Jar
**Feature:** Headwaters (Multi-Team Support)
**Version:** 2.0
**Date:** January 2026
**Status:** In Development

---

## Executive Summary

Headwaters extends The Jar from a single-team tool to a multi-organization, multi-team platform. This enables enterprise deployment where multiple TSA teams can operate independently while sharing org-level resources like customers.

### Goals

1. Support multiple teams within an organization
2. Enable team-level data isolation with org-level sharing where appropriate
3. Implement role-based access control (Org Admin, Manager, TSA)
4. Add Build Signals for execution tracking
5. Fix the Commitments model to require Project + Build Signal links

### Non-Goals

- Cross-org data sharing
- Public/external user access
- Gamification or competitive features

---

## Problem Statement

### Current State

The Jar currently operates as a single-team tool where:
- All users see all data
- No organizational hierarchy
- Commitments can link to engagements (incorrect model)
- No measurable execution tracking (Build Signals missing)

### Pain Points

1. **No team isolation:** Enterprise customers need separate teams
2. **No shared customers:** Customer data duplicated across users
3. **Commitments are vague:** No required link to measurable outcomes
4. **No execution visibility:** Leadership can't see what's actually being built

### Desired State

- Organizations contain multiple teams
- Teams are isolated but share org-level customers
- Commitments require Project + Build Signal (measurable outcomes)
- Clear role hierarchy: Org Admin > Manager > TSA

---

## User Personas

### Org Admin

**Who:** Director of Pre-Sales, VP of Solutions
**Goals:**
- Oversee multiple TSA teams
- Manage org-wide customer list
- View aggregate metrics across teams
**Permissions:**
- Full access to all teams in org
- Manage org settings and admins
- Create/edit customers

### Team Manager

**Who:** TSA Team Lead, Solutions Manager
**Goals:**
- Manage team's rocks and strategic priorities
- Track team execution via Build Signals
- Coordinate team capacity
**Permissions:**
- Full access to team data
- Manage team membership
- Create rocks and build signals
- Light beacons for team focus

### TSA (Technical Solutions Architect)

**Who:** Individual contributor TSA
**Goals:**
- Log engagements efficiently
- Track weekly commitments
- Advance build signals through project work
**Permissions:**
- Create/edit own engagements and commitments
- Edit ANY engagement in their team (handoff support)
- View team rocks, projects, build signals

---

## Feature Requirements

### P0: Must Have

#### 1. Organization & Team Hierarchy

| Requirement | Description |
|-------------|-------------|
| Org creation | System creates orgs (no self-service initially) |
| Team creation | Org admins can create teams |
| Team membership | Users belong to one or more teams |
| Role assignment | Assign manager or tsa role per team |

#### 2. RLS Helper Functions

| Function | Purpose |
|----------|---------|
| `is_org_admin(org_id)` | Check if user is org admin |
| `is_org_member(org_id)` | Check if user belongs to any team in org |
| `is_team_member(team_id)` | Check if user is team member |
| `is_team_manager(team_id)` | Check if user is team manager |

**Critical:** These functions MUST be created before any RLS policies.

#### 3. Build Signals

| Field | Type | Required |
|-------|------|----------|
| team_id | UUID | Yes |
| rock_id | UUID | Yes |
| title | Text | Yes |
| target_value | Numeric | No |
| current_value | Numeric | Default 0 |
| unit | Text | No |
| status | Enum | Default 'not_started' |
| due_date | Date | No |

**Status values:** not_started, in_progress, achieved, missed

#### 4. Commitments Model Fix

| Change | Before | After |
|--------|--------|-------|
| Project link | Optional | **Required** |
| Build Signal link | N/A | **Required** |
| Definition of done | N/A | **Required** (text) |
| Status | Boolean (completed) | Enum (planned/done/blocked/slipped) |
| Week reference | date | week_of (Monday) |
| User reference | user_id | owner_id |
| Engagement link | Optional | **Removed** |
| Hours value | Optional | **Removed** |
| Type column | Enum | **Removed** |

#### 5. Soft Delete

All primary tables must have:
- `deleted_at TIMESTAMPTZ DEFAULT NULL`
- `deleted_by UUID REFERENCES profiles(id)`

Query pattern: `WHERE deleted_at IS NULL`

#### 6. Team Context

- Cookie-based active team: `hw_active_team`
- Team selector in sidebar
- Middleware validates team access
- Falls back to first available team

### P1: Should Have

#### 7. Shared Engagement Editing

- Any TSA can edit any engagement in their team
- Track `owner_id` (creator) and `last_edited_by`
- Support territory handoffs and vacation coverage

#### 8. Org-Scoped Customers

- Customers belong to org, not team
- All teams in org can reference same customers
- Prevents duplicate customer entries

#### 9. Assets Table

| Field | Description |
|-------|-------------|
| team_id | Owning team |
| name | Asset name |
| asset_type | demo, deck, whitepaper, video, etc. |
| url | Link to asset |
| status | active, archived |

Link assets to engagements to track which materials drive revenue.

### P2: Nice to Have

#### 10. Enablement Events

Replace swarms table with enablement_events for tracking:
- Training sessions
- Workshops
- Conferences
- Team learning events

#### 11. Milestones

Project-level milestones for tracking progress:
- Due date
- Status (pending, completed, missed)
- Completed date

#### 12. Audit Logging

Track changes across org:
- Actor, entity, action
- Before/after JSON
- Timestamp

---

## Technical Requirements

### Database Migrations

| Order | File | Purpose |
|-------|------|---------|
| 1 | 004_create_helper_functions.sql | RLS helper functions (MUST BE FIRST) |
| 2 | 005_create_build_signals.sql | Build signals table |
| 3 | 006_fix_commitments_table.sql | ALTER commitments structure |
| 4 | 007_create_rls_policies.sql | All RLS policies using helpers |
| 5 | 008_deprecate_swarms.sql | Soft-delete swarms, migrate to enablement_events |

**Critical:** Migrations must run in order. Helper functions before policies.

### Server Actions

#### New Actions

| File | Functions |
|------|-----------|
| auth.ts | getCurrentUserWithRoles, requireTeamAccess, requireOrgAdmin |
| teams.ts | getTeams, createTeam, getTeamMembers, setActiveTeam |
| orgs.ts | getOrg, updateOrg, getOrgAdmins |
| customers.ts | getCustomers, createCustomer, updateCustomer |
| build-signals.ts | getBuildSignals, createBuildSignal, updateProgress |
| commitments.ts | getCommitments, createCommitment, carryCommitment |
| assets.ts | getAssets, createAsset, linkAssetToEngagement |

#### Updated Actions

| File | Changes |
|------|---------|
| rocks.ts | Add team_id filter, soft delete, deleted_at IS NULL |
| projects.ts | Inherit team_id from rock, soft delete |
| engagements.ts | Team-scoped, TSA can edit any, customer_id support |

### UI Components

#### New Components

| Component | Purpose |
|-----------|---------|
| TeamProvider | React context for team state |
| TeamSelector | Dropdown for switching teams |
| AssetSelector | Multi-select for engagement assets |

#### Updated Components

| Component | Changes |
|-----------|---------|
| Sidebar | Add TeamSelector, use TeamContext |
| Engagement Drawer | Add assets section, show creator/editor |
| Create Rock Dialog | Use team members from context |

---

## UX Specifications

### Team Switching

1. User clicks team name in sidebar
2. Dropdown shows available teams
3. Selecting team sets `hw_active_team` cookie
4. Page refreshes with new team context
5. All data filters to selected team

### Commitment Creation

1. User selects week (shows Monday date)
2. User selects Project (required dropdown)
3. User selects Build Signal (required dropdown, filtered by rock from project)
4. User enters "Done means..." (required text)
5. Status defaults to "planned"

### Commitment Carryover

When week ends with uncommitted work:
1. System prompts for each "planned" commitment
2. User chooses: Carry / Split / Convert to Issue / Drop
3. "Carry" creates copy in next week
4. "Split" opens dialog to break into smaller items
5. "Drop" soft-deletes the commitment

### Engagement Handoff

1. TSA A creates engagement (owner_id = A)
2. TSA B edits engagement (last_edited_by = B)
3. UI shows "Created by A, edited by B"
4. No permission error - team members can edit any team engagement

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Team data isolation | 100% - no cross-team data leakage |
| Commitment completion rate | Track done vs slipped per team |
| Build Signal progress | % of signals on track |
| Engagement attribution | % linked to customers |

---

## Rollout Plan

### Phase 1: Database (Week 1)

1. Create helper functions
2. Create build_signals table
3. Fix commitments table
4. Create RLS policies
5. Deprecate swarms

### Phase 2: Backend (Week 2)

1. New server actions (auth, teams, orgs)
2. Update existing actions (rocks, projects, engagements)
3. Add commitments actions with carryover logic

### Phase 3: Frontend (Week 3)

1. TeamContext provider
2. TeamSelector component
3. Update sidebar and dialogs
4. Commitment board updates

### Phase 4: Testing (Week 4)

1. RLS policy testing with different roles
2. Team switching validation
3. Commitment flow testing
4. Engagement handoff testing

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| RLS policy errors | Data leakage | Extensive testing with multiple user roles |
| Migration failures | Broken app | Run migrations in dev first, have rollback plan |
| Cookie not set | Wrong team context | Fallback to first available team |
| Build Signal orphans | Invalid commitments | Validate rock still exists when creating signal |

---

## Open Questions

1. **Team switching notification:** Should we show a toast when team changes?
2. **Default team:** Should users have a "preferred" team saved in profile?
3. **Cross-team visibility:** Should org admins see a unified view across teams?
4. **Commitment templates:** Should common commitment patterns be saveable?

---

## Appendix

### A. Commitment Status Flow

```
planned → done (success)
planned → blocked (needs escalation)
planned → slipped (carried/split/dropped)
```

### B. Build Signal Status Flow

```
not_started → in_progress (work begun)
in_progress → achieved (target met)
in_progress → missed (deadline passed without target)
```

### C. Entity Relationships

```
Org (1) ──── (n) Teams
Org (1) ──── (n) Customers
Org (1) ──── (n) OrgAdmins

Team (1) ──── (n) TeamMemberships
Team (1) ──── (n) Rocks
Team (1) ──── (n) Engagements
Team (1) ──── (n) Assets

Rock (1) ──── (n) Projects
Rock (1) ──── (n) BuildSignals

Project (1) ──── (n) Milestones
Project (1) ──── (n) Commitments

Commitment (n) ──── (1) Project
Commitment (n) ──── (1) BuildSignal
Commitment (n) ──── (1) Owner (Profile)
```

---

## Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product | | | |
| Engineering | | | |
| Design | | | |
