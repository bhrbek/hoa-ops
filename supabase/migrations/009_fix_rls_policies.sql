-- Migration: 009_fix_rls_policies.sql
-- Purpose: Security fixes for commitment RLS policies (Phase 6)
--
-- Fixes:
-- A1: Add org_admin bypass to commitment delete policy
-- A2: Allow team managers (and org_admin) to update commitments

-- A1: Fix commitment delete policy - add org_admin bypass
DROP POLICY IF EXISTS "commitments_delete" ON public.commitments;
CREATE POLICY "commitments_delete" ON public.commitments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR is_team_manager(team_id)
    OR is_org_admin(get_org_from_team(team_id))
  );

-- A2: Fix commitment update policy - allow managers and org_admins
DROP POLICY IF EXISTS "commitments_update" ON public.commitments;
CREATE POLICY "commitments_update" ON public.commitments FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      auth.uid() = owner_id
      OR is_team_manager(team_id)
      OR is_org_admin(get_org_from_team(team_id))
    )
  )
  WITH CHECK (
    deleted_at IS NULL
    AND (
      auth.uid() = owner_id
      OR is_team_manager(team_id)
      OR is_org_admin(get_org_from_team(team_id))
    )
  );
