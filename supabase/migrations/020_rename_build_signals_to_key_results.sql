-- Migration: 020_rename_build_signals_to_key_results
-- Purpose: Rename build_signals table to key_results (terminology change)

-- Step 1: Rename the table
ALTER TABLE public.build_signals RENAME TO key_results;

-- Step 2: Rename the column in commitments table
ALTER TABLE public.commitments RENAME COLUMN build_signal_id TO key_result_id;

-- Step 3: Rename indexes
ALTER INDEX IF EXISTS idx_build_signals_deleted RENAME TO idx_key_results_deleted;
ALTER INDEX IF EXISTS idx_build_signals_rock RENAME TO idx_key_results_rock;
ALTER INDEX IF EXISTS idx_build_signals_status RENAME TO idx_key_results_status;
ALTER INDEX IF EXISTS idx_build_signals_team RENAME TO idx_key_results_team;

-- Step 4: Rename constraints (PostgreSQL auto-renames some, but let's be explicit)
ALTER TABLE public.key_results RENAME CONSTRAINT build_signals_pkey TO key_results_pkey;
ALTER TABLE public.key_results RENAME CONSTRAINT build_signals_status_check TO key_results_status_check;
ALTER TABLE public.key_results RENAME CONSTRAINT build_signals_deleted_by_fkey TO key_results_deleted_by_fkey;
ALTER TABLE public.key_results RENAME CONSTRAINT build_signals_rock_id_fkey TO key_results_rock_id_fkey;
ALTER TABLE public.key_results RENAME CONSTRAINT build_signals_team_id_fkey TO key_results_team_id_fkey;

-- Step 5: Rename FK constraint in commitments
ALTER TABLE public.commitments RENAME CONSTRAINT commitments_build_signal_id_fkey TO commitments_key_result_id_fkey;

-- Step 6: Drop and recreate RLS policies with new names
DROP POLICY IF EXISTS "build_signals_delete" ON public.key_results;
DROP POLICY IF EXISTS "build_signals_insert" ON public.key_results;
DROP POLICY IF EXISTS "build_signals_select" ON public.key_results;
DROP POLICY IF EXISTS "build_signals_update" ON public.key_results;

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

-- Step 7: Add comment explaining the rename
COMMENT ON TABLE public.key_results IS 'Measurable outcomes that define Rock success. Formerly called build_signals.';
