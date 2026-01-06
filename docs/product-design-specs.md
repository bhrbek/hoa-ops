# Product Design Specification: "The Jar"

**Version:** 2.0 (Headwaters Multi-Team Release)
**Use:** Internal Tool (Pre-Sales/Advisory Ops)

---

## 1. Executive Summary

"The Jar" is a Strategic Operating System designed for high-performing Pre-Sales and Advisory teams. Unlike traditional Project Management tools (which focus on task completion), The Jar focuses on **Capacity Physics** and **Strategic Signaling**.

### The Core Philosophy

1. **Finite Capacity:** Work is treated physically (Rocks, Pebbles, Sand). We acknowledge that 20% of capacity is lost to "Water" (Admin/Whirlwind).
2. **Signal & Swarm:** We do not micromanage schedules. We use "Signals" (Data from client engagements) to identify trends, and "Beacons" to organize "Swarms" (Team focus time) around strategic goals.
3. **Autonomy:** The tool visualizes capacity (The Shield) to empower users to say "No" to low-value work when they are full.

### Headwaters: Multi-Team Architecture

Headwaters extends The Jar to support multiple teams within an organization:
- **Organizations** contain multiple **Teams**
- Teams are isolated but share org-level resources (Customers)
- Role-based access: Org Admin, Team Manager, TSA
- Cookie-based active team switching

---

## 2. System Architecture

### 2.1 Technology Stack

- **Frontend Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS + Shadcn UI (Radix Primitives)
- **Backend / Database:** Supabase (PostgreSQL)
- **Authentication:** Supabase Auth via Azure AD (Microsoft Entra ID)
- **Email/Notifications:** Resend (Transactional Email)
- **Cron/Automation:** Vercel Cron Jobs (for Daily Sediment Checks)
- **Hosting:** Vercel (Frontend & Edge Functions)

### 2.2 Security & Compliance

- **Authentication:** Users must sign in via Corporate Microsoft Credentials (SSO). No generic email/password sign-ups.
- **RBAC (Role-Based Access Control):**
  - **Org Admin:** Can manage all teams, org settings, org-scoped customers
  - **Manager:** Can manage team, create Rocks, set Swarm Beacons
  - **TSA:** Can log Engagements, manage Commitments, edit any team engagement
- **Row Level Security (RLS):** Enabled on all Supabase tables using helper functions. Users can only access data within their team scope.

---

## 3. The Jar Mental Model

### The Jar Metaphor

| Element | Represents | Scope |
|---------|------------|-------|
| **Rocks** | Quarterly strategic priorities | Team |
| **Projects** | Work that supports Rocks | Team |
| **Sand** | Engagements (customer interactions) | Team |
| **Water** | Admin/Whirlwind (automatic 20%) | User |

### Signal Types

| Signal Type | Purpose | Source |
|-------------|---------|--------|
| **Build Signals** | Execution truth - measurable outcomes | Rock-level metrics |
| **Impact Signals** | Business results - revenue, GP | Engagement roll-ups |

**Key Principle:** Engagements (sand) do NOT affect Rock health. They feed Impact Signals only.

---

## 4. Multi-Team Data Model (Headwaters)

### Hierarchy

```
Organization (Org)
├── Org Admins (can manage all teams)
├── Customers (org-scoped, shared across teams)
└── Teams
    ├── Team Members
    │   ├── Managers (can manage team)
    │   └── TSAs (can work within team)
    └── Team Data
        ├── Rocks
        ├── Projects
        ├── Tasks
        ├── Engagements
        ├── Commitments
        ├── Build Signals
        ├── Assets
        ├── Milestones
        └── Enablement Events
```

### Scope Rules

| Entity | Scope | Notes |
|--------|-------|-------|
| Customers | **Org-scoped** | Shared across all teams in org |
| Assets | Team-scoped | Reusable materials owned by team |
| Engagements | Team-scoped | TSAs can edit ANY engagement in their team |
| Rocks/Projects | Team-scoped | Owned by team, visible to team members |
| Commitments | Team-scoped | Weekly work items per TSA |
| Audit Log | Org-scoped | Tracks changes across all teams |

### Role Permissions

| Role | Scope | Permissions |
|------|-------|-------------|
| Org Admin | Organization | Full access to all teams, manage org settings |
| Manager | Team | Full access to team data, manage team members |
| TSA | Team | CRUD on team data, edit any team engagement |

---

## 5. Core Tables (Schema)

### 5.1 Rocks (Strategic Goals)

```sql
rocks
├── id (UUID PK)
├── team_id (FK → teams) -- Required
├── title (TEXT)
├── description (TEXT)
├── perfect_outcome (TEXT)
├── worst_outcome (TEXT)
├── status (ENUM: active, completed, archived)
├── owner_id (FK → profiles)
├── quarter (TEXT) -- e.g., "Q1 2026"
├── created_at, deleted_at, deleted_by
```

### 5.2 Build Signals (Execution Truth)

```sql
build_signals
├── id (UUID PK)
├── team_id (FK → teams)
├── rock_id (FK → rocks) -- Required
├── title (TEXT) -- e.g., "Launch MVP to 3 customers"
├── description (TEXT)
├── target_value (NUMERIC) -- optional quantitative target
├── current_value (NUMERIC DEFAULT 0)
├── unit (TEXT) -- e.g., "customers", "deployments", "%"
├── status (ENUM: not_started, in_progress, achieved, missed)
├── due_date (DATE)
├── created_at, deleted_at, deleted_by
```

### 5.3 Commitments (Weekly Execution)

```sql
commitments
├── id (UUID PK)
├── team_id (FK → teams)
├── owner_id (FK → profiles) -- Required
├── week_of (DATE) -- Monday of week, Required
├── project_id (FK → projects) -- Required
├── build_signal_id (FK → build_signals) -- Required
├── rock_id (FK → rocks) -- Derived from project
├── definition_of_done (TEXT) -- Required: "Done means..."
├── status (ENUM: planned, done, blocked, slipped)
├── notes (TEXT)
├── completed_at (TIMESTAMPTZ)
├── created_at, deleted_at, deleted_by
```

### 5.4 Engagements (The Sensor Log)

```sql
engagements
├── id (UUID PK)
├── team_id (FK → teams) -- Required
├── owner_id (FK → profiles) -- Creator
├── customer_id (FK → customers)
├── customer_name (TEXT) -- Legacy, migrate to customer_id
├── date (DATE)
├── activity_type (ENUM: Workshop, Demo, POC, Advisory)
├── revenue_impact (NUMERIC)
├── gp_impact (NUMERIC)
├── notes (TEXT)
├── rock_id (FK → rocks) -- Optional link
├── last_edited_by (FK → profiles)
├── last_edited_at (TIMESTAMPTZ)
├── created_at, deleted_at, deleted_by
```

### 5.5 Customers (Org-Scoped)

```sql
customers
├── id (UUID PK)
├── org_id (FK → orgs) -- Required, NOT team_id
├── name (TEXT)
├── vertical (TEXT)
├── status (ENUM: active, churned, prospect)
├── created_at, deleted_at, deleted_by
```

---

## 6. RLS Helper Functions

All RLS policies use these helper functions (MUST exist before policies):

```sql
is_org_admin(org_id)     -- Check if user is org admin
is_org_member(org_id)    -- Check if user is in any team in org
is_team_member(team_id)  -- Check if user is team member
is_team_manager(team_id) -- Check if user is team manager
get_org_from_team(team_id) -- Utility to get org from team
```

### Policy Patterns

```sql
-- Team-scoped data
SELECT WHERE is_team_member(team_id) AND deleted_at IS NULL

-- Org-scoped data (customers)
SELECT WHERE is_org_member(org_id) AND deleted_at IS NULL
```

---

## 7. Commitment Model

### Philosophy

Commitments are the unit of weekly execution accountability. They answer:
> "What project did you move, and which build signal did you advance?"

### Requirements

1. **Project link required** - gives structure, ownership, timeline
2. **Build Signal link required** - ensures measurable progress
3. **Finishable in ≤7 days** - weekly cadence, binary outcome
4. **Definition of done required** - "Done means..." statement

### Carryover Rules

When a commitment slips (not done by end of week):

| Action | Description |
|--------|-------------|
| **Carry** | Same scope, move to next week |
| **Split** | Break into smaller commitments |
| **Convert to Issue** | Blocked/needs decision - escalate |
| **Drop** | No longer relevant - remove |

### What Commitments Are NOT

- ❌ Tasks (tasks are sand-level detail)
- ❌ Time tracking (no hours_value)
- ❌ Engagement links (never link to engagements)
- ❌ Open-ended work (must have binary done/not-done)

---

## 8. Design System & UX Principles

**Visual Identity:** "Glacier Modern"

- **Palette:** White canvas, Slate borders, Emerald success
- **Typography:** Geist Mono for data/headers, Inter for prose
- **Components:** High density, squared corners (rounded-sm), visible borders

### The "Physics" Logic (Global Rules)

1. **The Water Rule:** The system automatically calculates `User Capacity * 0.8`. (e.g., 40h → 32h real capacity).
2. **The Shield:** If SUM(Commitments.hours) for a week > Real Capacity, the UI overlays a Blue Shield Icon on the user's avatar. This is a visual "Do Not Disturb."
3. **The Beacon:** If a swarm exists for a specific date, that column in the Commitment Board glows Amber.

---

## 9. View Specifications

### View A: The App Shell (Navigation)

- **Sidebar (Left):** Dark Mode (Slate-950)
  - **Header:** Icon (Mountain) + "THE JAR"
  - **Team Selector:** Dropdown for switching active team
  - **Nav:** Vista, Stream, Climb, Commitment Board, Reports
  - **Footer:** User Profile, "Jar Gauge" (utilization %)

### View B: Vista (Dashboard)

- **Layout:** Bento Grid (4 Quadrants)
- **Q1:** Swarm Status / Active Beacon
- **Q2:** My Capacity (stacked bar)
- **Q3:** Sensor Feed (strategic signals)
- **Q4:** My Sediment (checklist)

### View C: The Stream (Engagements)

- **Main View:** Data Table (Customer, Revenue, Next Step)
- **Interaction:** Clicking row opens Right Slide-Over
- **Slide-Over:** Customer header, Domain/OEM tags, Asset selector, Notes

### View D: The Climb (Rocks & Projects)

- **Layout:** Accordion Rocks with Projects nested
- **Rock Card:** Title, Build Signals, Owner, Health indicator
- **Project:** Milestones, Evidence locker

### View E: Commitment Board

- **Layout:** Matrix (Rows = Users, Columns = Mon-Fri)
- **Header Controls:** "Light the Beacon" (Manager only)
- **Blocks:** Drag-and-drop commitments
- **Logic:** Overloaded cells turn red, Shield appears on avatar

---

## 10. Shared Engagement Editing

### TSA Handoff Model

Within a team, any TSA can edit any engagement. This supports:
- Territory handoffs
- Collaborative customer work
- Vacation coverage
- Knowledge sharing

### Tracking

- `owner_id` - Original creator
- `last_edited_by` - Most recent editor
- `last_edited_at` - When last edited

---

## 11. Soft Delete Pattern

All primary tables use soft delete:

```sql
deleted_at TIMESTAMPTZ DEFAULT NULL
deleted_by UUID REFERENCES profiles(id)
```

Query pattern: `WHERE deleted_at IS NULL`

**No hard deletes on primary tables.**

---

## 12. Reporting

### Available Reports

1. **Revenue by Asset** - Which assets drive revenue
2. **OEM Buying Patterns** - Pair analysis
3. **Domain Trends** - Industry focus areas
4. **Team Metrics** - Per-team roll-ups

### UI Principles

- Professional, analytical presentation
- NO leaderboards, scores, or badges
- NO gamification
- Focus on insights, not competition

---

## 13. Guardrails (Non-Negotiable)

1. **Soft delete only** - No hard deletes on primary tables
2. **Customers are org-scoped** - NOT team-scoped
3. **TSAs can edit any team engagement** - Handoff support
4. **No gamification** - No badges, scores, leaderboards
5. **No WIG/lead/lag terminology** - Use Jar metaphor
6. **Commitments require Project + Build Signal** - No exceptions
7. **Engagements don't affect Rock health** - Impact Signals only
8. **Helper functions before policies** - Migration order matters

---

## 14. Automation & Notifications

### The "Morning Sediment Check"

- **Goal:** Deliver status without requiring a login
- **Trigger:** Vercel Cron Job runs daily (e.g., 8:45 AM UTC)
- **Logic:**
  1. Query commitments for the user for Today
  2. Check swarms for Today
  3. Generate ICS Calendar File attachment
- **Delivery:** Sent via Resend API to user's corporate email

### Beacon Alert

- **Trigger:** Manager clicks "Light the Beacon"
- **Delivery:** In-app toast + Email: "Beacon Lit: Swarm on 'Wi-Fi 7' this Tuesday PM."

---

## 15. Cookie-Based Team Context

### Active Team

- **Cookie:** `hw_active_team`
- Set on team switch
- Validated on each request via middleware
- Falls back to first available team

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2025 | Initial Signal & Swarm Release |
| 2.0 | Jan 2026 | Headwaters Multi-Team Architecture |
