-- Performance indexes for team-scoped queries
-- All indexes use partial index on deleted_at IS NULL for soft-delete filtering

-- ============================================
-- B1: Team-Scoped Indexes (Critical)
-- ============================================

-- Core strategy tables
CREATE INDEX IF NOT EXISTS idx_rocks_team ON public.rocks(team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_team ON public.projects(team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_team ON public.tasks(team_id) WHERE deleted_at IS NULL;

-- Observability tables
CREATE INDEX IF NOT EXISTS idx_engagements_team ON public.engagements(team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_milestones_team ON public.milestones(team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_enablement_events_team ON public.enablement_events(team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_assets_team ON public.assets(team_id) WHERE deleted_at IS NULL;

-- Multi-tenancy tables
CREATE INDEX IF NOT EXISTS idx_team_memberships_team ON public.team_memberships(team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_team_memberships_user ON public.team_memberships(user_id) WHERE deleted_at IS NULL;

-- ============================================
-- B2: Composite Indexes for Common Filters
-- ============================================

-- Rocks: team + quarter (common filter combo)
CREATE INDEX IF NOT EXISTS idx_rocks_team_quarter ON public.rocks(team_id, quarter) WHERE deleted_at IS NULL;

-- Rocks: team + status
CREATE INDEX IF NOT EXISTS idx_rocks_team_status ON public.rocks(team_id, status) WHERE deleted_at IS NULL;

-- Projects: team + status
CREATE INDEX IF NOT EXISTS idx_projects_team_status ON public.projects(team_id, status) WHERE deleted_at IS NULL;

-- Commitments: team + week_of (weekly board queries)
CREATE INDEX IF NOT EXISTS idx_commitments_team_week ON public.commitments(team_id, week_of) WHERE deleted_at IS NULL;

-- Milestones: team + due_date (date range queries)
CREATE INDEX IF NOT EXISTS idx_milestones_team_duedate ON public.milestones(team_id, due_date) WHERE deleted_at IS NULL;

-- Enablement Events: team + event_date (date range queries)
CREATE INDEX IF NOT EXISTS idx_enablement_events_team_date ON public.enablement_events(team_id, event_date) WHERE deleted_at IS NULL;

-- Engagements: team + date (activity stream)
CREATE INDEX IF NOT EXISTS idx_engagements_team_date ON public.engagements(team_id, date) WHERE deleted_at IS NULL;

-- ============================================
-- B3: Foreign Key Indexes
-- ============================================

-- Milestones -> Projects
CREATE INDEX IF NOT EXISTS idx_milestones_project ON public.milestones(project_id);

-- Junction tables for assets
CREATE INDEX IF NOT EXISTS idx_engagement_assets_asset ON public.engagement_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_engagement_assets_engagement ON public.engagement_assets(engagement_id);
CREATE INDEX IF NOT EXISTS idx_project_assets_asset ON public.project_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_project_assets_project ON public.project_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_enablement_event_assets_event ON public.enablement_event_assets(event_id);
CREATE INDEX IF NOT EXISTS idx_enablement_event_assets_asset ON public.enablement_event_assets(asset_id);

-- ============================================
-- B4: Org-Scoped Indexes
-- ============================================

-- Customers: org_id (org-scoped queries)
CREATE INDEX IF NOT EXISTS idx_customers_org ON public.customers(org_id) WHERE deleted_at IS NULL;

-- ============================================
-- B5: Stats Aggregation RPC
-- ============================================

-- Replace JavaScript aggregation with database-level aggregation
CREATE OR REPLACE FUNCTION public.get_engagement_stats(p_team_id uuid)
RETURNS TABLE (
  total_revenue numeric,
  total_gp numeric,
  engagement_count bigint,
  workshop_count bigint
) AS $$
  SELECT
    COALESCE(SUM(revenue_impact), 0)::numeric,
    COALESCE(SUM(gp_impact), 0)::numeric,
    COUNT(*)::bigint,
    COUNT(*) FILTER (WHERE activity_type = 'Workshop')::bigint
  FROM public.engagements
  WHERE team_id = p_team_id AND deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = '';

-- ============================================
-- B6: Update OEM Buying Patterns to support team filter
-- ============================================

-- Drop and recreate with team_id parameter
DROP FUNCTION IF EXISTS public.get_oem_buying_patterns(integer);

CREATE OR REPLACE FUNCTION public.get_oem_buying_patterns(
  limit_count integer DEFAULT 10,
  filter_team_id uuid DEFAULT NULL
)
RETURNS TABLE (
  oem1_name text,
  oem2_name text,
  pair_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    o1.name as oem1_name,
    o2.name as oem2_name,
    count(*)::bigint as pair_count
  FROM public.engagement_oems eo1
  JOIN public.engagement_oems eo2
    ON eo1.engagement_id = eo2.engagement_id
    AND eo1.oem_id < eo2.oem_id
  JOIN public.oems o1 ON eo1.oem_id = o1.id
  JOIN public.oems o2 ON eo2.oem_id = o2.id
  JOIN public.engagements e ON eo1.engagement_id = e.id
  WHERE e.deleted_at IS NULL
    AND (filter_team_id IS NULL OR e.team_id = filter_team_id)
  GROUP BY o1.name, o2.name
  ORDER BY pair_count DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
