-- Fix RLS circular dependency on team_memberships
-- Users need to see their own memberships to bootstrap team context

DROP POLICY IF EXISTS team_memberships_select ON team_memberships;
CREATE POLICY team_memberships_select ON team_memberships
  FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      user_id = auth.uid()  -- Can always see your own memberships
      OR is_team_member(team_id)
      OR is_org_admin(get_org_from_team(team_id))
    )
  );
