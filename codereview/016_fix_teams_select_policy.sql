-- Migration 016: Fix teams_select policy column references
--
-- ROOT CAUSE: Migration 015 had ambiguous column names that PostgreSQL
-- resolved incorrectly:
--   - tm.team_id = tm.id (wrong - compares to itself)
--   - oa.org_id = oa.org_id (wrong - always true)
--
-- FIX: Explicitly reference the outer teams table columns

DROP POLICY IF EXISTS "teams_select" ON public.teams;

CREATE POLICY "teams_select" ON public.teams FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- User is a member of THIS team (teams.id, not tm.id)
      EXISTS (
        SELECT 1 FROM public.team_memberships tm
        WHERE tm.team_id = teams.id
        AND tm.user_id = auth.uid()
        AND tm.deleted_at IS NULL
      )
      -- Or user is an org admin for THIS team's org (teams.org_id, not oa.org_id)
      OR EXISTS (
        SELECT 1 FROM public.org_admins oa
        WHERE oa.org_id = teams.org_id
        AND oa.user_id = auth.uid()
      )
    )
  );
