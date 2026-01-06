-- Fix all RLS circular dependencies
-- Users must be able to read their OWN records to bootstrap access

-- 1. Fix org_admins - users can read their OWN admin status
DROP POLICY IF EXISTS "org_admins_select" ON public.org_admins;

CREATE POLICY "org_admins_select" ON public.org_admins FOR SELECT
  TO authenticated
  USING (
    -- Users can always read their OWN admin records
    user_id = auth.uid()
    -- Or if they're a member of the org
    OR is_org_member(org_id)
  );

-- 2. Fix teams - use subquery instead of helper to avoid circular dependency
DROP POLICY IF EXISTS "teams_select" ON public.teams;

CREATE POLICY "teams_select" ON public.teams FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      -- User is a member of this team (direct subquery avoids helper circular dep)
      EXISTS (
        SELECT 1 FROM public.team_memberships tm
        WHERE tm.team_id = id
        AND tm.user_id = auth.uid()
        AND tm.deleted_at IS NULL
      )
      -- Or user is an org admin (direct subquery)
      OR EXISTS (
        SELECT 1 FROM public.org_admins oa
        WHERE oa.org_id = org_id
        AND oa.user_id = auth.uid()
      )
    )
  );

-- 3. Fix orgs - users can read orgs they belong to
DROP POLICY IF EXISTS "orgs_select" ON public.orgs;

CREATE POLICY "orgs_select" ON public.orgs FOR SELECT
  TO authenticated
  USING (
    -- User is a member of any team in this org
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      JOIN public.teams t ON tm.team_id = t.id
      WHERE t.org_id = orgs.id
      AND tm.user_id = auth.uid()
      AND tm.deleted_at IS NULL
      AND t.deleted_at IS NULL
    )
    -- Or user is an org admin
    OR EXISTS (
      SELECT 1 FROM public.org_admins oa
      WHERE oa.org_id = orgs.id
      AND oa.user_id = auth.uid()
    )
  );
