-- ============================================
-- HEADWATERS - RLS Policies using Helper Functions
-- Replaces old policies with team/org scoped versions
-- ============================================

-- ============================================
-- DROP OLD POLICIES (if they exist)
-- ============================================

-- Rocks policies
DROP POLICY IF EXISTS "Rocks are viewable by authenticated users" ON public.rocks;
DROP POLICY IF EXISTS "Authenticated users can create rocks" ON public.rocks;
DROP POLICY IF EXISTS "Rock owners can update their rocks" ON public.rocks;
DROP POLICY IF EXISTS "Rock owners can delete their rocks" ON public.rocks;
DROP POLICY IF EXISTS "Service role has full access to rocks" ON public.rocks;

-- Projects policies
DROP POLICY IF EXISTS "Projects are viewable by authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Authenticated users can create projects" ON public.projects;
DROP POLICY IF EXISTS "Project or rock owners can update projects" ON public.projects;
DROP POLICY IF EXISTS "Project or rock owners can delete projects" ON public.projects;
DROP POLICY IF EXISTS "Service role has full access to projects" ON public.projects;

-- Tasks policies
DROP POLICY IF EXISTS "Tasks are viewable by authenticated users" ON public.tasks;
DROP POLICY IF EXISTS "Project owners can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project owners can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Project owners can delete tasks" ON public.tasks;
DROP POLICY IF EXISTS "Service role has full access to tasks" ON public.tasks;

-- Engagements policies
DROP POLICY IF EXISTS "Users can view their own engagements" ON public.engagements;
DROP POLICY IF EXISTS "Users can create their own engagements" ON public.engagements;
DROP POLICY IF EXISTS "Users can update their own engagements" ON public.engagements;
DROP POLICY IF EXISTS "Users can delete their own engagements" ON public.engagements;
DROP POLICY IF EXISTS "Service role has full access to engagements" ON public.engagements;

-- ============================================
-- ORGS - Org members can view, org admins can modify
-- ============================================

ALTER TABLE public.orgs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orgs_select" ON public.orgs FOR SELECT
  TO authenticated
  USING (is_org_member(id) OR is_org_admin(id));

CREATE POLICY "orgs_insert" ON public.orgs FOR INSERT
  TO authenticated
  WITH CHECK (false); -- Orgs created by service_role only

CREATE POLICY "orgs_update" ON public.orgs FOR UPDATE
  TO authenticated
  USING (is_org_admin(id));

-- ============================================
-- TEAMS - Team members can view, org admins can modify
-- ============================================

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "teams_select" ON public.teams FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (is_team_member(id) OR is_org_admin(org_id))
  );

CREATE POLICY "teams_insert" ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(org_id));

CREATE POLICY "teams_update" ON public.teams FOR UPDATE
  TO authenticated
  USING (is_org_admin(org_id) AND deleted_at IS NULL);

CREATE POLICY "teams_delete" ON public.teams FOR DELETE
  TO authenticated
  USING (is_org_admin(org_id));

-- ============================================
-- TEAM_MEMBERSHIPS - Members can view, managers can modify
-- ============================================

ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_memberships_select" ON public.team_memberships FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (is_team_member(team_id) OR is_org_admin(get_org_from_team(team_id)))
  );

CREATE POLICY "team_memberships_insert" ON public.team_memberships FOR INSERT
  TO authenticated
  WITH CHECK (
    is_team_manager(team_id) OR is_org_admin(get_org_from_team(team_id))
  );

CREATE POLICY "team_memberships_update" ON public.team_memberships FOR UPDATE
  TO authenticated
  USING (
    is_team_manager(team_id) OR is_org_admin(get_org_from_team(team_id))
  );

CREATE POLICY "team_memberships_delete" ON public.team_memberships FOR DELETE
  TO authenticated
  USING (
    is_team_manager(team_id) OR is_org_admin(get_org_from_team(team_id))
  );

-- ============================================
-- ORG_ADMINS - Org admins can view/manage
-- ============================================

ALTER TABLE public.org_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_admins_select" ON public.org_admins FOR SELECT
  TO authenticated
  USING (is_org_member(org_id) OR is_org_admin(org_id));

CREATE POLICY "org_admins_insert" ON public.org_admins FOR INSERT
  TO authenticated
  WITH CHECK (is_org_admin(org_id));

CREATE POLICY "org_admins_delete" ON public.org_admins FOR DELETE
  TO authenticated
  USING (is_org_admin(org_id));

-- ============================================
-- ROCKS - Team-scoped
-- ============================================

CREATE POLICY "rocks_select" ON public.rocks FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_team_member(team_id)
  );

CREATE POLICY "rocks_insert" ON public.rocks FOR INSERT
  TO authenticated
  WITH CHECK (is_team_member(team_id));

CREATE POLICY "rocks_update" ON public.rocks FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      auth.uid() = owner_id
      OR is_team_manager(team_id)
      OR is_org_admin(get_org_from_team(team_id))
    )
  );

CREATE POLICY "rocks_delete" ON public.rocks FOR DELETE
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR is_team_manager(team_id)
    OR is_org_admin(get_org_from_team(team_id))
  );

-- ============================================
-- PROJECTS - Team-scoped via rock
-- ============================================

CREATE POLICY "projects_select" ON public.projects FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.rocks r
      WHERE r.id = rock_id
      AND r.deleted_at IS NULL
      AND is_team_member(r.team_id)
    )
  );

CREATE POLICY "projects_insert" ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.rocks r
      WHERE r.id = rock_id
      AND r.deleted_at IS NULL
      AND is_team_member(r.team_id)
    )
  );

CREATE POLICY "projects_update" ON public.projects FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      auth.uid() = owner_id
      OR EXISTS (
        SELECT 1 FROM public.rocks r
        WHERE r.id = rock_id
        AND (is_team_manager(r.team_id) OR is_org_admin(get_org_from_team(r.team_id)))
      )
    )
  );

CREATE POLICY "projects_delete" ON public.projects FOR DELETE
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.rocks r
      WHERE r.id = rock_id
      AND (is_team_manager(r.team_id) OR is_org_admin(get_org_from_team(r.team_id)))
    )
  );

-- ============================================
-- TASKS - Team-scoped via project
-- ============================================

CREATE POLICY "tasks_select" ON public.tasks FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.rocks r ON p.rock_id = r.id
      WHERE p.id = project_id
      AND p.deleted_at IS NULL
      AND r.deleted_at IS NULL
      AND is_team_member(r.team_id)
    )
  );

CREATE POLICY "tasks_insert" ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.rocks r ON p.rock_id = r.id
      WHERE p.id = project_id
      AND is_team_member(r.team_id)
    )
  );

CREATE POLICY "tasks_update" ON public.tasks FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.rocks r ON p.rock_id = r.id
      WHERE p.id = project_id
      AND is_team_member(r.team_id)
    )
  );

CREATE POLICY "tasks_delete" ON public.tasks FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.rocks r ON p.rock_id = r.id
      WHERE p.id = project_id
      AND is_team_member(r.team_id)
    )
  );

-- ============================================
-- ENGAGEMENTS - Team-scoped, any TSA can edit
-- ============================================

CREATE POLICY "engagements_select" ON public.engagements FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_team_member(team_id)
  );

CREATE POLICY "engagements_insert" ON public.engagements FOR INSERT
  TO authenticated
  WITH CHECK (is_team_member(team_id));

-- Any team member can update any engagement (TSA handoff support)
CREATE POLICY "engagements_update" ON public.engagements FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_team_member(team_id)
  );

CREATE POLICY "engagements_delete" ON public.engagements FOR DELETE
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR is_team_manager(team_id)
    OR is_org_admin(get_org_from_team(team_id))
  );

-- ============================================
-- BUILD_SIGNALS - Team-scoped
-- ============================================

CREATE POLICY "build_signals_select" ON public.build_signals FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_team_member(team_id)
  );

CREATE POLICY "build_signals_insert" ON public.build_signals FOR INSERT
  TO authenticated
  WITH CHECK (is_team_member(team_id));

CREATE POLICY "build_signals_update" ON public.build_signals FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_team_member(team_id)
  );

CREATE POLICY "build_signals_delete" ON public.build_signals FOR DELETE
  TO authenticated
  USING (
    is_team_manager(team_id)
    OR is_org_admin(get_org_from_team(team_id))
  );

-- ============================================
-- COMMITMENTS - Team-scoped
-- ============================================

CREATE POLICY "commitments_select" ON public.commitments FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_team_member(team_id)
  );

CREATE POLICY "commitments_insert" ON public.commitments FOR INSERT
  TO authenticated
  WITH CHECK (
    is_team_member(team_id)
    AND auth.uid() = owner_id
  );

-- Only owner can update their own commitments
CREATE POLICY "commitments_update" ON public.commitments FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND auth.uid() = owner_id
  );

CREATE POLICY "commitments_delete" ON public.commitments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR is_team_manager(team_id)
  );

-- ============================================
-- CUSTOMERS - Org-scoped (not team-scoped!)
-- ============================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_select" ON public.customers FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_org_member(org_id)
  );

CREATE POLICY "customers_insert" ON public.customers FOR INSERT
  TO authenticated
  WITH CHECK (is_org_member(org_id));

CREATE POLICY "customers_update" ON public.customers FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_org_member(org_id)
  );

CREATE POLICY "customers_delete" ON public.customers FOR DELETE
  TO authenticated
  USING (is_org_admin(org_id));

-- ============================================
-- ASSETS - Team-scoped
-- ============================================

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "assets_select" ON public.assets FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_team_member(team_id)
  );

CREATE POLICY "assets_insert" ON public.assets FOR INSERT
  TO authenticated
  WITH CHECK (is_team_member(team_id));

CREATE POLICY "assets_update" ON public.assets FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_team_member(team_id)
  );

CREATE POLICY "assets_delete" ON public.assets FOR DELETE
  TO authenticated
  USING (
    is_team_manager(team_id)
    OR is_org_admin(get_org_from_team(team_id))
  );

-- ============================================
-- MILESTONES - Team-scoped via project
-- ============================================

ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "milestones_select" ON public.milestones FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_team_member(team_id)
  );

CREATE POLICY "milestones_insert" ON public.milestones FOR INSERT
  TO authenticated
  WITH CHECK (is_team_member(team_id));

CREATE POLICY "milestones_update" ON public.milestones FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_team_member(team_id)
  );

CREATE POLICY "milestones_delete" ON public.milestones FOR DELETE
  TO authenticated
  USING (
    is_team_manager(team_id)
    OR is_org_admin(get_org_from_team(team_id))
  );

-- ============================================
-- ENABLEMENT_EVENTS - Team-scoped
-- ============================================

ALTER TABLE public.enablement_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enablement_events_select" ON public.enablement_events FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_team_member(team_id)
  );

CREATE POLICY "enablement_events_insert" ON public.enablement_events FOR INSERT
  TO authenticated
  WITH CHECK (is_team_member(team_id));

CREATE POLICY "enablement_events_update" ON public.enablement_events FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_team_member(team_id)
  );

CREATE POLICY "enablement_events_delete" ON public.enablement_events FOR DELETE
  TO authenticated
  USING (
    is_team_manager(team_id)
    OR is_org_admin(get_org_from_team(team_id))
  );

-- ============================================
-- AUDIT_LOG - Org-scoped, read-only for users
-- ============================================

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_log_select" ON public.audit_log FOR SELECT
  TO authenticated
  USING (is_org_admin(org_id));

-- Inserts handled by triggers with service_role
