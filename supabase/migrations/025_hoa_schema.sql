-- ============================================
-- HOA-OPS Schema Transformation
-- Transform Headwaters TSA app into HOA Operations Management
-- ============================================

-- ============================================
-- 1. RENAME OEMs → VENDORS (with enhanced fields)
-- ============================================

-- Rename the table
ALTER TABLE public.oems RENAME TO vendors;

-- Add HOA-specific vendor fields
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS specialty TEXT; -- "Landscaping", "Plumbing", etc.
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS notes TEXT;

-- Rename junction table
ALTER TABLE public.engagement_oems RENAME TO engagement_vendors;
ALTER TABLE public.engagement_vendors RENAME COLUMN oem_id TO vendor_id;

-- Update RLS policies for vendors
DROP POLICY IF EXISTS "OEMs are viewable by authenticated users" ON public.vendors;
DROP POLICY IF EXISTS "oems_insert_admin" ON public.vendors;
DROP POLICY IF EXISTS "oems_update_admin" ON public.vendors;
DROP POLICY IF EXISTS "oems_delete_admin" ON public.vendors;

CREATE POLICY "vendors_select" ON public.vendors FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "vendors_insert_admin" ON public.vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.org_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "vendors_update_admin" ON public.vendors FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.org_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "vendors_delete_admin" ON public.vendors FOR DELETE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.org_admins WHERE user_id = auth.uid())
  );

-- ============================================
-- 2. ENHANCED PROJECTS (Budget + Approval Workflow)
-- ============================================

ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS budget_amount NUMERIC DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS actual_cost NUMERIC DEFAULT 0;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'proposed'
  CHECK (approval_status IN ('proposed', 'board_review', 'approved', 'in_progress', 'completed', 'rejected'));
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS proposing_committee_id UUID REFERENCES public.teams(id);
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS description TEXT;

-- ============================================
-- 3. ENHANCED MILESTONES (Vendor + Cost + Handoffs)
-- ============================================

ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES public.vendors(id);
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS budgeted_cost NUMERIC DEFAULT 0;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS actual_cost NUMERIC DEFAULT 0;
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS depends_on_id UUID REFERENCES public.milestones(id);
ALTER TABLE public.milestones ADD COLUMN IF NOT EXISTS notes TEXT;

-- Index for dependency chain queries
CREATE INDEX IF NOT EXISTS idx_milestones_depends_on ON public.milestones(depends_on_id);
CREATE INDEX IF NOT EXISTS idx_milestones_vendor ON public.milestones(vendor_id);

-- ============================================
-- 4. VENDOR BIDS (New Tables)
-- ============================================

CREATE TABLE IF NOT EXISTS public.vendor_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  total_amount NUMERIC NOT NULL,
  bid_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'selected', 'rejected')),
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id)
);

-- Bid categories (line items within a bid)
CREATE TABLE IF NOT EXISTS public.bid_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES public.vendor_bids(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL, -- "Softscape", "Irrigation", "Labor", etc.
  amount NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for vendor_bids
CREATE INDEX IF NOT EXISTS idx_vendor_bids_team ON public.vendor_bids(team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_vendor_bids_project ON public.vendor_bids(project_id);
CREATE INDEX IF NOT EXISTS idx_vendor_bids_vendor ON public.vendor_bids(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bid_categories_bid ON public.bid_categories(bid_id);

-- Enable RLS
ALTER TABLE public.vendor_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_categories ENABLE ROW LEVEL SECURITY;

-- RLS for vendor_bids
CREATE POLICY "vendor_bids_select" ON public.vendor_bids FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL AND is_team_member(team_id));

CREATE POLICY "vendor_bids_insert" ON public.vendor_bids FOR INSERT
  TO authenticated
  WITH CHECK (is_team_member(team_id));

CREATE POLICY "vendor_bids_update" ON public.vendor_bids FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL AND is_team_member(team_id));

CREATE POLICY "vendor_bids_delete" ON public.vendor_bids FOR DELETE
  TO authenticated
  USING (is_team_manager(team_id) OR is_org_admin(get_org_from_team(team_id)));

-- RLS for bid_categories (through bid)
CREATE POLICY "bid_categories_select" ON public.bid_categories FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_bids vb
      WHERE vb.id = bid_categories.bid_id
      AND vb.deleted_at IS NULL
      AND is_team_member(vb.team_id)
    )
  );

CREATE POLICY "bid_categories_insert" ON public.bid_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vendor_bids vb
      WHERE vb.id = bid_categories.bid_id
      AND is_team_member(vb.team_id)
    )
  );

CREATE POLICY "bid_categories_update" ON public.bid_categories FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_bids vb
      WHERE vb.id = bid_categories.bid_id
      AND is_team_member(vb.team_id)
    )
  );

CREATE POLICY "bid_categories_delete" ON public.bid_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vendor_bids vb
      WHERE vb.id = bid_categories.bid_id
      AND (is_team_manager(vb.team_id) OR is_org_admin(get_org_from_team(vb.team_id)))
    )
  );

-- Trigger for updated_at on vendor_bids
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.vendor_bids
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. TRANSFORM ENGAGEMENTS → ISSUES
-- ============================================

-- Rename table
ALTER TABLE public.engagements RENAME TO issues;

-- Rename activity_type to issue_type
ALTER TABLE public.issues RENAME COLUMN activity_type TO issue_type;

-- Add HOA-specific issue fields
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'
  CHECK (priority IN ('low', 'medium', 'high', 'urgent'));
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id);
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual'
  CHECK (source IN ('manual', 'ticket', 'signal'));
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS source_id TEXT; -- External ticket ID
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS property_address TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS lot_number TEXT;
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'
  CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));
ALTER TABLE public.issues ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Drop TSA-specific columns (if they exist)
ALTER TABLE public.issues DROP COLUMN IF EXISTS revenue_impact;
ALTER TABLE public.issues DROP COLUMN IF EXISTS gp_impact;

-- Rename junction table
ALTER TABLE public.engagement_vendors RENAME TO issue_vendors;
ALTER TABLE public.issue_vendors RENAME COLUMN engagement_id TO issue_id;

ALTER TABLE public.engagement_domains RENAME TO issue_domains;
ALTER TABLE public.issue_domains RENAME COLUMN engagement_id TO issue_id;

ALTER TABLE public.engagement_assets RENAME TO issue_assets;
ALTER TABLE public.issue_assets RENAME COLUMN engagement_id TO issue_id;

-- Update indexes
DROP INDEX IF EXISTS idx_engagements_team;
DROP INDEX IF EXISTS idx_engagements_team_date;
CREATE INDEX IF NOT EXISTS idx_issues_team ON public.issues(team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_team_date ON public.issues(team_id, date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_assigned ON public.issues(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_priority ON public.issues(priority) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issues_status ON public.issues(status) WHERE deleted_at IS NULL;

-- Update RLS policies for issues
DROP POLICY IF EXISTS "engagements_select" ON public.issues;
DROP POLICY IF EXISTS "engagements_insert" ON public.issues;
DROP POLICY IF EXISTS "engagements_update" ON public.issues;
DROP POLICY IF EXISTS "engagements_delete" ON public.issues;

CREATE POLICY "issues_select" ON public.issues FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL AND is_team_member(team_id));

CREATE POLICY "issues_insert" ON public.issues FOR INSERT
  TO authenticated
  WITH CHECK (is_team_member(team_id));

CREATE POLICY "issues_update" ON public.issues FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL AND is_team_member(team_id));

CREATE POLICY "issues_delete" ON public.issues FOR DELETE
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR is_team_manager(team_id)
    OR is_org_admin(get_org_from_team(team_id))
  );

-- Update RLS for renamed junction tables
DROP POLICY IF EXISTS "engagement_oems_select" ON public.issue_vendors;
DROP POLICY IF EXISTS "engagement_oems_insert" ON public.issue_vendors;
DROP POLICY IF EXISTS "engagement_oems_delete" ON public.issue_vendors;

CREATE POLICY "issue_vendors_select" ON public.issue_vendors FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_vendors.issue_id
      AND is_team_member(i.team_id)
    )
  );

CREATE POLICY "issue_vendors_insert" ON public.issue_vendors FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_vendors.issue_id
      AND is_team_member(i.team_id)
    )
  );

CREATE POLICY "issue_vendors_delete" ON public.issue_vendors FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_vendors.issue_id
      AND is_team_member(i.team_id)
    )
  );

-- Update RLS for issue_domains
DROP POLICY IF EXISTS "engagement_domains_select" ON public.issue_domains;
DROP POLICY IF EXISTS "engagement_domains_insert" ON public.issue_domains;
DROP POLICY IF EXISTS "engagement_domains_delete" ON public.issue_domains;

CREATE POLICY "issue_domains_select" ON public.issue_domains FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_domains.issue_id
      AND is_team_member(i.team_id)
    )
  );

CREATE POLICY "issue_domains_insert" ON public.issue_domains FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_domains.issue_id
      AND is_team_member(i.team_id)
    )
  );

CREATE POLICY "issue_domains_delete" ON public.issue_domains FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_domains.issue_id
      AND is_team_member(i.team_id)
    )
  );

-- Update RLS for issue_assets
DROP POLICY IF EXISTS "engagement_assets_select" ON public.issue_assets;
DROP POLICY IF EXISTS "engagement_assets_insert" ON public.issue_assets;
DROP POLICY IF EXISTS "engagement_assets_delete" ON public.issue_assets;

CREATE POLICY "issue_assets_select" ON public.issue_assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_assets.issue_id
      AND is_team_member(i.team_id)
    )
  );

CREATE POLICY "issue_assets_insert" ON public.issue_assets FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_assets.issue_id
      AND is_team_member(i.team_id)
    )
  );

CREATE POLICY "issue_assets_delete" ON public.issue_assets FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.issues i
      WHERE i.id = issue_assets.issue_id
      AND is_team_member(i.team_id)
    )
  );

-- ============================================
-- 6. SIGNALS (Evidence/Observations)
-- ============================================

CREATE TABLE IF NOT EXISTS public.signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  signal_type TEXT CHECK (signal_type IN (
    'homeowner_complaint',
    'inspection_finding',
    'board_observation',
    'vendor_recommendation',
    'maintenance_need',
    'safety_concern',
    'other'
  )),
  priority_id UUID REFERENCES public.rocks(id), -- Links to annual priority
  issue_id UUID REFERENCES public.issues(id), -- If promoted to issue
  property_address TEXT,
  lot_number TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signals_team ON public.signals(team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_signals_priority ON public.signals(priority_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_signals_issue ON public.signals(issue_id);
CREATE INDEX IF NOT EXISTS idx_signals_type ON public.signals(signal_type) WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signals_select" ON public.signals FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL AND is_team_member(team_id));

CREATE POLICY "signals_insert" ON public.signals FOR INSERT
  TO authenticated
  WITH CHECK (is_team_member(team_id));

CREATE POLICY "signals_update" ON public.signals FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL AND is_team_member(team_id));

CREATE POLICY "signals_delete" ON public.signals FOR DELETE
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR is_team_manager(team_id)
    OR is_org_admin(get_org_from_team(team_id))
  );

-- Trigger for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 7. ISSUE TEMPLATES (Recurring Tasks)
-- ============================================

CREATE TABLE IF NOT EXISTS public.issue_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  issue_type TEXT DEFAULT 'task',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  default_assignee_id UUID REFERENCES public.profiles(id),
  recurrence_rule TEXT, -- 'weekly', 'monthly', 'quarterly', 'yearly'
  next_due_date DATE,
  category_id UUID REFERENCES public.domains(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_issue_templates_team ON public.issue_templates(team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_issue_templates_next_due ON public.issue_templates(next_due_date) WHERE deleted_at IS NULL AND is_active = true;

-- Enable RLS
ALTER TABLE public.issue_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "issue_templates_select" ON public.issue_templates FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL AND is_team_member(team_id));

CREATE POLICY "issue_templates_insert" ON public.issue_templates FOR INSERT
  TO authenticated
  WITH CHECK (is_team_member(team_id));

CREATE POLICY "issue_templates_update" ON public.issue_templates FOR UPDATE
  TO authenticated
  USING (deleted_at IS NULL AND is_team_member(team_id));

CREATE POLICY "issue_templates_delete" ON public.issue_templates FOR DELETE
  TO authenticated
  USING (is_team_manager(team_id) OR is_org_admin(get_org_from_team(team_id)));

-- Trigger for updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.issue_templates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 8. DOCUMENTS (Attachments)
-- ============================================

CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  description TEXT,
  storage_type TEXT NOT NULL CHECK (storage_type IN ('supabase', 'external')),
  storage_path TEXT, -- Supabase Storage path
  external_url TEXT, -- External link (Google Drive, Dropbox, etc.)
  mime_type TEXT,
  file_size INTEGER,
  -- Polymorphic attachment
  entity_type TEXT NOT NULL CHECK (entity_type IN ('bid', 'project', 'issue', 'milestone', 'signal', 'vendor')),
  entity_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_documents_team ON public.documents(team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_entity ON public.documents(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_select" ON public.documents FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL AND is_team_member(team_id));

CREATE POLICY "documents_insert" ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (is_team_member(team_id));

CREATE POLICY "documents_update" ON public.documents FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (auth.uid() = uploaded_by OR is_team_manager(team_id) OR is_org_admin(get_org_from_team(team_id)))
  );

CREATE POLICY "documents_delete" ON public.documents FOR DELETE
  TO authenticated
  USING (
    auth.uid() = uploaded_by
    OR is_team_manager(team_id)
    OR is_org_admin(get_org_from_team(team_id))
  );

-- ============================================
-- 9. UPDATE TERMINOLOGY IN DOMAINS (Reference Data)
-- ============================================

-- Rename domains to categories in the UI (table stays as domains for compatibility)
COMMENT ON TABLE public.domains IS 'Categories for HOA operations (Landscaping, Finance, Legal, Maintenance, Social, etc.)';

-- ============================================
-- 10. RENAME ROCKS → PRIORITIES
-- ============================================

-- Note: We keep the table name as 'rocks' for code compatibility but add a comment
-- The UI will display "Priorities" but the backend uses "rocks"
COMMENT ON TABLE public.rocks IS 'Annual Priorities (Board Initiatives) - displayed as "Priorities" in HOA UI';

-- Add HOA-specific fields to priorities (rocks)
ALTER TABLE public.rocks ADD COLUMN IF NOT EXISTS fiscal_year TEXT; -- "2026", "2025"
ALTER TABLE public.rocks ADD COLUMN IF NOT EXISTS priority_type TEXT DEFAULT 'strategic'
  CHECK (priority_type IN ('strategic', 'operational', 'compliance', 'community'));

-- ============================================
-- 11. RENAME KEY_RESULTS → SUCCESS_CRITERIA
-- ============================================

-- Keep table as key_results for compatibility, add comment
COMMENT ON TABLE public.key_results IS 'Success Criteria - measurable outcomes for Priorities';

-- ============================================
-- 12. RENAME COMMITMENTS → ACTION_ITEMS
-- ============================================

-- Keep table as commitments for compatibility, add comment
COMMENT ON TABLE public.commitments IS 'Action Items - weekly board/committee execution items';

-- ============================================
-- 13. UPDATE ACTIVITY_TYPES FOR HOA
-- ============================================

-- Clear old TSA activity types and add HOA ones
DELETE FROM public.activity_types;

INSERT INTO public.activity_types (name, description, color, display_order) VALUES
  ('Issue', 'General issue or concern', 'red', 1),
  ('Task', 'Specific action item to complete', 'blue', 2),
  ('Action Item', 'Board/committee meeting action item', 'purple', 3),
  ('Maintenance Request', 'Property maintenance request', 'orange', 4),
  ('Violation', 'HOA rule violation', 'red', 5),
  ('Inquiry', 'Homeowner inquiry or question', 'green', 6);

-- ============================================
-- 14. HELPER FUNCTIONS FOR HOA
-- ============================================

-- Get project budget summary
CREATE OR REPLACE FUNCTION public.get_project_budget_summary(p_project_id uuid)
RETURNS TABLE (
  budget_amount numeric,
  actual_cost numeric,
  remaining_budget numeric,
  milestone_budgeted numeric,
  milestone_actual numeric,
  bid_count bigint,
  selected_bid_amount numeric
) AS $$
  SELECT
    p.budget_amount,
    p.actual_cost,
    (p.budget_amount - p.actual_cost) as remaining_budget,
    COALESCE(SUM(m.budgeted_cost), 0) as milestone_budgeted,
    COALESCE(SUM(m.actual_cost), 0) as milestone_actual,
    (SELECT COUNT(*) FROM public.vendor_bids vb WHERE vb.project_id = p.id AND vb.deleted_at IS NULL) as bid_count,
    (SELECT vb.total_amount FROM public.vendor_bids vb WHERE vb.project_id = p.id AND vb.status = 'selected' AND vb.deleted_at IS NULL LIMIT 1) as selected_bid_amount
  FROM public.projects p
  LEFT JOIN public.milestones m ON m.project_id = p.id AND m.deleted_at IS NULL
  WHERE p.id = p_project_id
  GROUP BY p.id, p.budget_amount, p.actual_cost;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = '';

-- Get milestone dependency chain
CREATE OR REPLACE FUNCTION public.get_milestone_chain(p_milestone_id uuid)
RETURNS TABLE (
  id uuid,
  title text,
  vendor_name text,
  due_date date,
  status text,
  depth integer
) AS $$
  WITH RECURSIVE chain AS (
    -- Start with the given milestone
    SELECT m.id, m.title, v.name as vendor_name, m.due_date, m.status, 0 as depth
    FROM public.milestones m
    LEFT JOIN public.vendors v ON m.vendor_id = v.id
    WHERE m.id = p_milestone_id

    UNION ALL

    -- Find milestones that depend on previous ones
    SELECT m.id, m.title, v.name, m.due_date, m.status, c.depth + 1
    FROM public.milestones m
    LEFT JOIN public.vendors v ON m.vendor_id = v.id
    JOIN chain c ON m.depends_on_id = c.id
    WHERE m.deleted_at IS NULL
  )
  SELECT * FROM chain ORDER BY depth;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = '';

-- Get issue stats for team
CREATE OR REPLACE FUNCTION public.get_issue_stats(p_team_id uuid)
RETURNS TABLE (
  total_count bigint,
  open_count bigint,
  in_progress_count bigint,
  resolved_count bigint,
  urgent_count bigint,
  overdue_count bigint
) AS $$
  SELECT
    COUNT(*)::bigint as total_count,
    COUNT(*) FILTER (WHERE status = 'open')::bigint as open_count,
    COUNT(*) FILTER (WHERE status = 'in_progress')::bigint as in_progress_count,
    COUNT(*) FILTER (WHERE status IN ('resolved', 'closed'))::bigint as resolved_count,
    COUNT(*) FILTER (WHERE priority = 'urgent' AND status NOT IN ('resolved', 'closed'))::bigint as urgent_count,
    COUNT(*) FILTER (WHERE due_date < CURRENT_DATE AND status NOT IN ('resolved', 'closed'))::bigint as overdue_count
  FROM public.issues
  WHERE team_id = p_team_id AND deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = '';

-- ============================================
-- 15. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.vendors IS 'Vendors/contractors for HOA projects (landscaping, plumbing, legal, etc.)';
COMMENT ON TABLE public.vendor_bids IS 'Vendor bids for projects with category-level cost breakdown';
COMMENT ON TABLE public.bid_categories IS 'Line items within a vendor bid (softscape, irrigation, labor, etc.)';
COMMENT ON TABLE public.issues IS 'Administrative issues, tasks, and action items (replaced engagements)';
COMMENT ON TABLE public.signals IS 'Evidence and observations that justify priorities (complaints, findings, etc.)';
COMMENT ON TABLE public.issue_templates IS 'Templates for recurring tasks (monthly reconciliation, quarterly inspections, etc.)';
COMMENT ON TABLE public.documents IS 'File attachments for bids, projects, issues, milestones, and vendors';
