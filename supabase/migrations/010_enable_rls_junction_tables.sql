-- Enable RLS on junction tables that were missing it
-- These tables link entities but still need RLS for security

-- ============================================
-- domain_oems (linking domains and OEMs)
-- ============================================
ALTER TABLE public.domain_oems ENABLE ROW LEVEL SECURITY;

-- Anyone can read domain-OEM mappings (reference data)
CREATE POLICY "domain_oems_select" ON public.domain_oems
  FOR SELECT USING (true);

-- Org admins can manage domain-OEM mappings
CREATE POLICY "domain_oems_insert" ON public.domain_oems
  FOR INSERT WITH CHECK (true); -- Controlled by server actions

CREATE POLICY "domain_oems_delete" ON public.domain_oems
  FOR DELETE USING (true); -- Controlled by server actions

-- ============================================
-- engagement_tags (linking engagements and tags)
-- ============================================
ALTER TABLE public.engagement_tags ENABLE ROW LEVEL SECURITY;

-- Team members can read engagement tags for their team's engagements
CREATE POLICY "engagement_tags_select" ON public.engagement_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_tags.engagement_id
      AND public.is_team_member(e.team_id)
    )
  );

-- Team members can manage engagement tags for their team
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

-- Anyone can read themes (reference data)
CREATE POLICY "themes_select" ON public.themes
  FOR SELECT USING (true);

-- Only service role can manage themes
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

-- Team members can read engagement-asset links for their team
CREATE POLICY "engagement_assets_select" ON public.engagement_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.engagements e
      WHERE e.id = engagement_assets.engagement_id
      AND public.is_team_member(e.team_id)
    )
  );

-- Team members can manage engagement-asset links
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

-- Team members can read project-asset links for their team
CREATE POLICY "project_assets_select" ON public.project_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_assets.project_id
      AND public.is_team_member(p.team_id)
    )
  );

-- Team members can manage project-asset links
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
