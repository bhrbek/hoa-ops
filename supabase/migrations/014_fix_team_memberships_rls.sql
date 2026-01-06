-- Fix circular dependency in team_memberships RLS policy
-- Users must be able to read their OWN membership to bootstrap access

DROP POLICY IF EXISTS "team_memberships_select" ON public.team_memberships;

CREATE POLICY "team_memberships_select" ON public.team_memberships FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- Users can always read their OWN memberships
      user_id = auth.uid()
      -- Or if they're already a team member (for viewing other members)
      OR is_team_member(team_id)
      -- Or if they're an org admin
      OR is_org_admin(get_org_from_team(team_id))
    )
  );
