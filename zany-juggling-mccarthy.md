# Headwaters → HOA Operations Fork: Planning Document

## Executive Summary

Fork the Headwaters TSA app to create an **HOA Operations Management System** with:

- **Priorities** (renamed from Rocks): Annual board priorities with quarterly goals
- **Projects**: Enhanced with budget tracking, vendor bids, approval workflow
- **Milestones**: Vendor assignments, costs, hand-off dependencies
- **Issues**: Administrative tasks with priority, assignee, recurrence
- **Signals**: Evidence/observations that justify priorities
- **Vendors**: Contact info, bid history, project assignments
- **Documents**: Supabase Storage + external links

**Estimated effort**: ~25-35 hours (increased with new features)
**Recommended approach**: Fork to new repository, clean rebrand

---

## Current Domain Model Summary

The Headwaters app is built around this hierarchy:
```
Org (company)
└── Team (department/group)
    ├── Rocks (quarterly strategic objectives)
    │   ├── Key Results (measurable outcomes)
    │   └── Projects (work to achieve the Rock)
    │       ├── Milestones (checkpoints)
    │       └── Tasks (granular work)
    ├── Commitments (weekly execution, links Project + Key Result)
    └── Engagements (field activities - "the sand", observability only)
```

**Key Design Principles in Current System:**
1. Engagements are "sand" - observable but NOT strategic
2. Rock health = Key Results only, never revenue/activity volume
3. Commitments MUST link to both a Project AND Key Result
4. Soft delete everywhere (audit trail)
5. 20% capacity reserved for "water" (admin overhead)

---

## HOA Use Case Requirements (Initial Understanding)

### Projects (Strategic Work)
- **Budget tracking**: Each project has a budget, track actual vs planned
- **Vendor management**: Multiple vendor bids, vendor selection
- **Milestones with hand-offs**: Sprinkler guy → Landscaper → Sod guy → City
- **Cost per vendor/milestone**: Track what each vendor costs
- **Timeline health**: On track, late, ahead
- **Approval stages**: Board approval workflow

### Issues/Needs/Tasks ("The Sand")
- Administrative tasks: "Get an HOA attorney", "Reconcile bank statement"
- Communication tasks: "Send note about boating rules"
- Recurring or one-off operational items
- Not tied to strategic projects

---

## Proposed Domain Mapping

| Current (TSA) | HOA Equivalent | Notes |
|---------------|----------------|-------|
| Org | HOA | Single org (your HOA) |
| Team | Committee? | Landscaping, Finance, Social, or just one team? |
| Rock | Annual Priority? | Or remove this layer entirely |
| Project | HOA Project | Enhanced with budget/vendors |
| Key Result | Project Success Criteria? | Or remove |
| Milestone | Vendor Milestone | Enhanced with vendor, cost, hand-off tracking |
| Commitment | Action Item | Weekly board/committee action items |
| Engagement | Issue/Need/Task | The administrative sand |
| Customer | Homeowner? Vendor? | Clarification needed |
| OEM | Vendor | Landscaper, Plumber, Attorney, etc. |
| Domain | Category | Landscaping, Finance, Legal, Social, Maintenance |

---

## User Requirements (Clarified)

### Team Structure
- **Board of Directors**: Runs overall HOA, has final approval authority
- **Committees**: Propose projects/solutions, execute approved work
- **Workflow**: Committee proposes → Board approves → Committee executes
- **Implementation**: Multi-team with approval hierarchy (Board is "org admin" level, Committees are "teams")

### Strategic Layer (Rocks → Annual Priorities)
- Keep the Rock concept as "Annual Priorities" or "Board Initiatives"
- Still track signals/evidence to justify priorities and measure outcomes
- Quarterly/yearly goal structure preserved

### Vendor Bid Tracking
- **Category-level** tracking (e.g., "Softscape: $15,000", "Sprinklers: $8,000")
- NOT line-item level (not tracking flowers vs grass seed)
- Focus on **outcomes** not micromanaging vendors
- Compare bids at category level across vendors

### Administrative Work Hierarchy
- **Issues**: Things that need attention (elevated from signals/tickets)
- **Tasks**: Specific action items to complete
- **Action Items**: Board/committee meeting action items
- **Tickets**: External integration (from separate app), can be promoted to Issues

**Flow**: Signal/Ticket → Issue (if needs action) → Task (if assigned) → Action Item (if board-level)

---

## Schema Changes Needed (Detailed)

### 1. Rename OEMs → Vendors
```sql
-- Rename table and add HOA-specific fields
ALTER TABLE oems RENAME TO vendors;
ALTER TABLE vendors ADD COLUMN contact_name TEXT;
ALTER TABLE vendors ADD COLUMN contact_phone TEXT;
ALTER TABLE vendors ADD COLUMN contact_email TEXT;
ALTER TABLE vendors ADD COLUMN specialty TEXT; -- "Landscaping", "Plumbing", etc.
```

### 2. Enhanced Projects (Budget + Approval)
```sql
ALTER TABLE projects ADD COLUMN budget_amount NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN actual_cost NUMERIC DEFAULT 0;
ALTER TABLE projects ADD COLUMN approval_status TEXT DEFAULT 'proposed';
-- approval_status: 'proposed', 'board_review', 'approved', 'in_progress', 'completed', 'rejected'
ALTER TABLE projects ADD COLUMN approved_by UUID REFERENCES profiles(id);
ALTER TABLE projects ADD COLUMN approved_at TIMESTAMPTZ;
ALTER TABLE projects ADD COLUMN proposing_committee_id UUID REFERENCES teams(id);
```

### 3. Enhanced Milestones (Vendor + Cost + Handoffs)
```sql
ALTER TABLE milestones ADD COLUMN vendor_id UUID REFERENCES vendors(id);
ALTER TABLE milestones ADD COLUMN budgeted_cost NUMERIC DEFAULT 0;
ALTER TABLE milestones ADD COLUMN actual_cost NUMERIC DEFAULT 0;
ALTER TABLE milestones ADD COLUMN depends_on_id UUID REFERENCES milestones(id);
-- depends_on_id creates the hand-off chain: sprinkler → landscaper → sod → city
```

### 4. Vendor Bids (New Table)
```sql
CREATE TABLE vendor_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) NOT NULL,
  vendor_id UUID REFERENCES vendors(id) NOT NULL,
  total_amount NUMERIC NOT NULL,
  bid_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'submitted', -- 'submitted', 'selected', 'rejected'
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id)
);

-- Bid categories (softscape, sprinklers, etc.)
CREATE TABLE bid_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID REFERENCES vendor_bids(id) NOT NULL,
  category_name TEXT NOT NULL, -- "Softscape", "Irrigation", "Labor"
  amount NUMERIC NOT NULL,
  notes TEXT
);
```

### 5. Issues (Repurpose Engagements)
```sql
-- Rename engagements → issues
ALTER TABLE engagements RENAME TO issues;
ALTER TABLE issues RENAME COLUMN activity_type TO issue_type;
-- issue_type: 'issue', 'task', 'action_item'
ALTER TABLE issues ADD COLUMN priority TEXT DEFAULT 'medium'; -- 'low', 'medium', 'high', 'urgent'
ALTER TABLE issues ADD COLUMN assigned_to UUID REFERENCES profiles(id);
ALTER TABLE issues ADD COLUMN due_date DATE;
ALTER TABLE issues ADD COLUMN source TEXT; -- 'manual', 'ticket', 'signal'
ALTER TABLE issues ADD COLUMN source_id TEXT; -- external ticket ID if from integration
-- Remove revenue_impact, gp_impact (not needed for HOA)
ALTER TABLE issues DROP COLUMN revenue_impact;
ALTER TABLE issues DROP COLUMN gp_impact;
```

### 6. Signals (Keep for Evidence/Trends)
```sql
-- Keep engagement-like tracking for "why we're doing this"
CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  owner_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  signal_type TEXT, -- 'homeowner_complaint', 'inspection_finding', 'board_observation', 'vendor_recommendation'
  priority_id UUID REFERENCES rocks(id), -- links to annual priority
  issue_id UUID REFERENCES issues(id), -- can be promoted to issue
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id)
);
```

---

## Terminology Mapping

| Current Term | HOA Term | Notes |
|--------------|----------|-------|
| Rock | Priority | "2026 Board Priorities" |
| Key Result | Success Criteria | Measurable outcomes for priorities |
| Project | Project | Same name, enhanced with budget/approval |
| Milestone | Milestone | Same, enhanced with vendor/cost/handoff |
| Commitment | Action Item | Weekly board/committee commitments |
| Engagement | Issue | Repurposed for administrative tasks |
| OEM | Vendor | Landscaper, plumber, attorney, etc. |
| Domain | Category | Landscaping, Finance, Legal, etc. |
| Customer | (remove or → Homeowner?) | TBD - may not need |
| TSA | Member | Committee/board member |
| Manager | Chair | Committee chair |
| Org Admin | Board Admin | Board-level admin access |

---

## UI Changes Needed

### Route Renaming
| Current | HOA | Purpose |
|---------|-----|---------|
| `/` (Vista) | `/` (Dashboard) | Overview of priorities, projects, issues |
| `/rocks` | `/priorities` | Annual priorities and projects |
| `/stream` | `/issues` | Issue/task/action item management |
| `/commitment-board` | `/action-items` | Weekly action items |
| `/reports` | `/reports` | Budget reports, signal trends |
| `/settings/admin` | `/settings/admin` | Vendors, categories, etc. |

### New Views Needed
1. **Project Detail**: Budget tracking, bid comparison, approval workflow, milestone timeline
2. **Vendor Management**: `/settings/vendors` - vendor list, contact info, project history
3. **Bid Comparison**: Side-by-side category comparison for project bids
4. **Budget Dashboard**: Spending vs budget across all projects
5. **Milestone Timeline**: Visual hand-off chain (Gantt-style or dependency graph)
6. **Signal Log**: Evidence/observations that justify priorities

### Enhanced Components
1. **Project Card**: Add budget bar (spent/remaining), approval badge, vendor count
2. **Milestone Card**: Add vendor assignment, cost, dependency arrow
3. **Issue Card**: Add priority badge, assignee, due date, source indicator

---

## Files to Modify (Detailed)

### Phase 1: Database & Types
| File | Changes |
|------|---------|
| `supabase/migrations/025_hoa_schema.sql` | All schema changes above |
| `src/types/supabase.ts` | Update all type definitions |
| `CLAUDE.md` | Update domain documentation |

### Phase 2: Server Actions
| File | Changes |
|------|---------|
| `src/app/actions/projects.ts` | Add budget, approval, bid functions |
| `src/app/actions/milestones.ts` | Add vendor, cost, dependency functions |
| `src/app/actions/vendors.ts` | New - CRUD for vendors |
| `src/app/actions/bids.ts` | New - bid management |
| `src/app/actions/issues.ts` | Rename from engagements, add priority/assignment |
| `src/app/actions/signals.ts` | New - signal tracking |
| `src/app/actions/reference.ts` | Rename OEM functions to vendor |

### Phase 3: UI - Routes & Pages
| Current Path | New Path | Changes |
|--------------|----------|---------|
| `src/app/rocks/` | `src/app/priorities/` | Rename, add budget/approval UI |
| `src/app/stream/` | `src/app/issues/` | Rename, add priority/assignee |
| `src/app/commitment-board/` | `src/app/action-items/` | Rename, update terminology |

### Phase 4: UI - Components
| Component | Changes |
|-----------|---------|
| `src/components/climb/` | Rename to `priorities/`, update terminology |
| `src/components/stream/` | Rename to `issues/`, add priority/assignee fields |
| `src/components/commitment/` | Rename to `action-items/` |
| New: `src/components/vendors/` | Vendor management components |
| New: `src/components/bids/` | Bid comparison components |
| New: `src/components/budget/` | Budget tracking components |

### Phase 5: Global Search & Replace
- "Rock" → "Priority" (except where it's a variable name)
- "Engagement" → "Issue"
- "OEM" → "Vendor"
- "TSA" → "Member"
- "Commitment" → "Action Item" (in UI only)

---

## Implementation Strategy

### Option A: Fork & Rebrand (Recommended)
1. Fork repo to new `hoa-ops` repository
2. Apply all schema migrations
3. Rename files and routes
4. Global terminology replacement
5. Build new features (bids, budget, etc.)

**Pros**: Clean break, no backward compatibility concerns
**Cons**: Lose upstream updates from Headwaters

### Option B: Feature Flags
1. Add `APP_MODE` environment variable ('tsa' | 'hoa')
2. Conditionally render terminology and features
3. Keep both schemas in parallel

**Pros**: Can maintain both versions
**Cons**: Complexity, divergence over time

### Recommendation: **Option A** - Clean fork is simpler for a different domain.

---

## Verification Plan

1. **Schema Migration**: Run migration, verify tables created
2. **Type Check**: `npx tsc --noEmit` passes
3. **Test Suite**: Update mocks, all tests pass
4. **Manual Testing**:
   - Create a priority with projects
   - Add vendor bids with categories
   - Select winning bid, assign to milestones
   - Track budget spent vs remaining
   - Create issues, assign, mark complete
   - Log signals and promote to issues

---

## Estimated Effort

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Schema & Types | 3-4 hours | None |
| Server Actions (core) | 4-6 hours | Schema |
| Route Renaming & Terminology | 2-3 hours | None |
| Component Updates | 4-6 hours | Server Actions |
| Bids & Budget Features | 4-6 hours | Components |
| Recurring Tasks | 2-3 hours | Issues |
| Document Management | 2-3 hours | Storage |
| Testing & Polish | 3-4 hours | All above |
| **Total** | **~25-35 hours** | |

---

## Additional Requirements (Clarified)

### Property Tracking
- Optional property/address linking for issues and signals
- Add `property_address` or `lot_number` field
- Not required, but nice for filtering "all issues at 123 Oak St"

### Recurring Tasks
- Template-based recurring tasks
- Define template: "Reconcile bank statement", monthly, assign to Treasurer
- Auto-generate issues on schedule or prompt to create

### Document Storage
- **Both options supported**:
  - Upload to Supabase Storage (already configured)
  - Link to external URLs (Google Drive, Dropbox)
- Bid documents, contracts, photos all supported

---

## Additional Schema for New Requirements

```sql
-- Property tracking (optional field on issues and signals)
ALTER TABLE issues ADD COLUMN property_address TEXT;
ALTER TABLE issues ADD COLUMN lot_number TEXT;
ALTER TABLE signals ADD COLUMN property_address TEXT;
ALTER TABLE signals ADD COLUMN lot_number TEXT;

-- Recurring task templates
CREATE TABLE issue_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  issue_type TEXT DEFAULT 'task',
  priority TEXT DEFAULT 'medium',
  default_assignee_id UUID REFERENCES profiles(id),
  recurrence_rule TEXT, -- 'monthly', 'quarterly', 'yearly', or cron expression
  next_due_date DATE,
  category_id UUID REFERENCES domains(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id)
);

-- Document attachments (for bids, projects, issues)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) NOT NULL,
  uploaded_by UUID REFERENCES profiles(id) NOT NULL,
  name TEXT NOT NULL,
  storage_type TEXT NOT NULL, -- 'supabase' or 'external'
  storage_path TEXT, -- Supabase Storage path
  external_url TEXT, -- External link (Google Drive, etc.)
  mime_type TEXT,
  file_size INTEGER,
  -- Polymorphic attachment
  entity_type TEXT NOT NULL, -- 'bid', 'project', 'issue', 'milestone'
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES profiles(id)
);
```

