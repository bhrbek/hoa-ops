-- Enable RLS on junction tables that were missing it
-- These tables link entities but still need RLS for security

-- ============================================
-- engagement_domains
-- ============================================
DROP POLICY IF EXISTS "engagement_domains_select" ON public.engagement_domains;
DROP POLICY IF EXISTS "engagement_domains_insert" ON public.engagement_domains;
DROP POLICY IF EXISTS "engagement_domains_delete" ON public.engagement_domains;

CREATE POLICY "engagement_domains_select" ON public.engagement_domains
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_domains.engagement_id
      AND public.is_team_member(e.team_id)
    )
  );

CREATE POLICY "engagement_domains_insert" ON public.engagement_domains
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_domains.engagement_id
      AND public.is_team_member(e.team_id)
    )
  );

CREATE POLICY "engagement_domains_delete" ON public.engagement_domains
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_domains.engagement_id
      AND public.is_team_member(e.team_id)
    )
  );

-- ============================================
-- engagement_oems
-- ============================================
DROP POLICY IF EXISTS "engagement_oems_select" ON public.engagement_oems;
DROP POLICY IF EXISTS "engagement_oems_insert" ON public.engagement_oems;
DROP POLICY IF EXISTS "engagement_oems_delete" ON public.engagement_oems;

CREATE POLICY "engagement_oems_select" ON public.engagement_oems
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_oems.engagement_id
      AND public.is_team_member(e.team_id)
    )
  );

CREATE POLICY "engagement_oems_insert" ON public.engagement_oems
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_oems.engagement_id
      AND public.is_team_member(e.team_id)
    )
  );

CREATE POLICY "engagement_oems_delete" ON public.engagement_oems
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_oems.engagement_id
      AND public.is_team_member(e.team_id)
    )
  );

-- ============================================
-- engagement_assets
-- ============================================
DROP POLICY IF EXISTS "engagement_assets_select" ON public.engagement_assets;
DROP POLICY IF EXISTS "engagement_assets_insert" ON public.engagement_assets;
DROP POLICY IF EXISTS "engagement_assets_delete" ON public.engagement_assets;

CREATE POLICY "engagement_assets_select" ON public.engagement_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_assets.engagement_id
      AND public.is_team_member(e.team_id)
    )
  );

CREATE POLICY "engagement_assets_insert" ON public.engagement_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_assets.engagement_id
      AND public.is_team_member(e.team_id)
    )
  );

CREATE POLICY "engagement_assets_delete" ON public.engagement_assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_assets.engagement_id
      AND public.is_team_member(e.team_id)
    )
  );

-- ============================================
-- project_assets
-- ============================================
DROP POLICY IF EXISTS "project_assets_select" ON public.project_assets;
DROP POLICY IF EXISTS "project_assets_insert" ON public.project_assets;
DROP POLICY IF EXISTS "project_assets_delete" ON public.project_assets;

CREATE POLICY "project_assets_select" ON public.project_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.rocks r ON p.rock_id = r.id
      WHERE p.id = project_assets.project_id
      AND public.is_team_member(r.team_id)
    )
  );

CREATE POLICY "project_assets_insert" ON public.project_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.rocks r ON p.rock_id = r.id
      WHERE p.id = project_assets.project_id
      AND public.is_team_member(r.team_id)
    )
  );

CREATE POLICY "project_assets_delete" ON public.project_assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      JOIN public.rocks r ON p.rock_id = r.id
      WHERE p.id = project_assets.project_id
      AND public.is_team_member(r.team_id)
    )
  );

-- ============================================
-- enablement_event_assets
-- ============================================
DROP POLICY IF EXISTS "enablement_event_assets_select" ON public.enablement_event_assets;
DROP POLICY IF EXISTS "enablement_event_assets_insert" ON public.enablement_event_assets;
DROP POLICY IF EXISTS "enablement_event_assets_delete" ON public.enablement_event_assets;

CREATE POLICY "enablement_event_assets_select" ON public.enablement_event_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enablement_events ee
      WHERE ee.id = enablement_event_assets.enablement_event_id
      AND public.is_team_member(ee.team_id)
    )
  );

CREATE POLICY "enablement_event_assets_insert" ON public.enablement_event_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enablement_events ee
      WHERE ee.id = enablement_event_assets.enablement_event_id
      AND public.is_team_member(ee.team_id)
    )
  );

CREATE POLICY "enablement_event_assets_delete" ON public.enablement_event_assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.enablement_events ee
      WHERE ee.id = enablement_event_assets.enablement_event_id
      AND public.is_team_member(ee.team_id)
    )
  );
