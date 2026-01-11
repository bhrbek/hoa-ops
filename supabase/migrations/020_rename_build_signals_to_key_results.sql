-- Migration: 020_rename_build_signals_to_key_results
-- Purpose: Create RLS policies for key_results table
-- NOTE: The rename is no longer needed as key_results is created directly in migration 001

-- Create RLS policies for key_results (table already exists from migration 001)
DROP POLICY IF EXISTS "key_results_select" ON public.key_results;
DROP POLICY IF EXISTS "key_results_insert" ON public.key_results;
DROP POLICY IF EXISTS "key_results_update" ON public.key_results;
DROP POLICY IF EXISTS "key_results_delete" ON public.key_results;

CREATE POLICY "key_results_select" ON public.key_results FOR SELECT
  TO authenticated
  USING ((deleted_at IS NULL) AND is_team_member(team_id));

CREATE POLICY "key_results_insert" ON public.key_results FOR INSERT
  TO authenticated
  WITH CHECK (is_team_member(team_id));

CREATE POLICY "key_results_update" ON public.key_results FOR UPDATE
  TO authenticated
  USING ((deleted_at IS NULL) AND is_team_member(team_id));

CREATE POLICY "key_results_delete" ON public.key_results FOR DELETE
  TO authenticated
  USING ((is_team_manager(team_id) OR is_org_admin(get_org_from_team(team_id))));

COMMENT ON TABLE public.key_results IS 'Measurable outcomes that define Rock success (OKR Key Results).';
