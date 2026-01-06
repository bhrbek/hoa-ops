-- Enable RLS on junction tables that were missing it
-- These tables link entities but still need RLS for security

-- ============================================
-- domain_oems (linking domains and OEMs)
-- ============================================
ALTER TABLE public.domain_oems ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "domain_oems_select" ON public.domain_oems;
DROP POLICY IF EXISTS "domain_oems_insert" ON public.domain_oems;
DROP POLICY IF EXISTS "domain_oems_delete" ON public.domain_oems;

CREATE POLICY "domain_oems_select" ON public.domain_oems
  FOR SELECT USING (true);

CREATE POLICY "domain_oems_insert" ON public.domain_oems
  FOR INSERT WITH CHECK (true);

CREATE POLICY "domain_oems_delete" ON public.domain_oems
  FOR DELETE USING (true);

-- ============================================
-- engagement_tags (linking engagements and tags)
-- ============================================
ALTER TABLE public.engagement_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "engagement_tags_select" ON public.engagement_tags;
DROP POLICY IF EXISTS "engagement_tags_insert" ON public.engagement_tags;
DROP POLICY IF EXISTS "engagement_tags_delete" ON public.engagement_tags;

CREATE POLICY "engagement_tags_select" ON public.engagement_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_tags.engagement_id
      AND public.is_team_member(e.team_id)
    )
  );

CREATE POLICY "engagement_tags_insert" ON public.engagement_tags
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_tags.engagement_id
      AND public.is_team_member(e.team_id)
    )
  );

CREATE POLICY "engagement_tags_delete" ON public.engagement_tags
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_tags.engagement_id
      AND public.is_team_member(e.team_id)
    )
  );

-- ============================================
-- themes (reference data)
-- ============================================
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "themes_select" ON public.themes;
DROP POLICY IF EXISTS "themes_insert" ON public.themes;
DROP POLICY IF EXISTS "themes_update" ON public.themes;
DROP POLICY IF EXISTS "themes_delete" ON public.themes;

CREATE POLICY "themes_select" ON public.themes
  FOR SELECT USING (true);

CREATE POLICY "themes_insert" ON public.themes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "themes_update" ON public.themes
  FOR UPDATE USING (true);

CREATE POLICY "themes_delete" ON public.themes
  FOR DELETE USING (true);

-- ============================================
-- engagement_assets (linking engagements and assets)
-- ============================================
ALTER TABLE public.engagement_assets ENABLE ROW LEVEL SECURITY;

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
-- project_assets (linking projects and assets)
-- ============================================
ALTER TABLE public.project_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_assets_select" ON public.project_assets;
DROP POLICY IF EXISTS "project_assets_insert" ON public.project_assets;
DROP POLICY IF EXISTS "project_assets_delete" ON public.project_assets;

CREATE POLICY "project_assets_select" ON public.project_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_assets.project_id
      AND public.is_team_member(p.team_id)
    )
  );

CREATE POLICY "project_assets_insert" ON public.project_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_assets.project_id
      AND public.is_team_member(p.team_id)
    )
  );

CREATE POLICY "project_assets_delete" ON public.project_assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_assets.project_id
      AND public.is_team_member(p.team_id)
    )
  );
