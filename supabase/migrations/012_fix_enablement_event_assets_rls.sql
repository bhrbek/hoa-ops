-- Add RLS policies for enablement_event_assets junction table
-- This table links enablement events to assets

-- Team members can read enablement event assets for their team
CREATE POLICY "enablement_event_assets_select" ON public.enablement_event_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.enablement_events ee
      WHERE ee.id = enablement_event_assets.event_id
      AND public.is_team_member(ee.team_id)
    )
  );

-- Team members can manage enablement event assets
CREATE POLICY "enablement_event_assets_insert" ON public.enablement_event_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.enablement_events ee
      WHERE ee.id = enablement_event_assets.event_id
      AND public.is_team_member(ee.team_id)
    )
  );

CREATE POLICY "enablement_event_assets_delete" ON public.enablement_event_assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.enablement_events ee
      WHERE ee.id = enablement_event_assets.event_id
      AND public.is_team_member(ee.team_id)
    )
  );
