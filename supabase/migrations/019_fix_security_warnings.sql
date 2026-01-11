-- Migration 019: Fix Supabase Security Linter Warnings
--
-- Issues addressed:
-- 1. handle_new_user function search_path not set
-- 2. Overly permissive RLS policies on reference tables (activity_types, domains, oems)
-- 3. Overly permissive audit_log INSERT policy

-- ============================================
-- 1. FIX handle_new_user SEARCH_PATH
-- ============================================
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- ============================================
-- 2. FIX ACTIVITY_TYPES RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "activity_types_insert" ON public.activity_types;
DROP POLICY IF EXISTS "activity_types_update" ON public.activity_types;
DROP POLICY IF EXISTS "activity_types_delete" ON public.activity_types;

CREATE POLICY "activity_types_insert_admin" ON public.activity_types FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "activity_types_update_admin" ON public.activity_types FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "activity_types_delete_admin" ON public.activity_types FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_admins
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 3. FIX DOMAINS RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "domains_insert" ON public.domains;
DROP POLICY IF EXISTS "domains_update" ON public.domains;
DROP POLICY IF EXISTS "domains_delete" ON public.domains;

CREATE POLICY "domains_insert_admin" ON public.domains FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "domains_update_admin" ON public.domains FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "domains_delete_admin" ON public.domains FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_admins
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 4. FIX OEMS RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "oems_insert" ON public.oems;
DROP POLICY IF EXISTS "oems_update" ON public.oems;
DROP POLICY IF EXISTS "oems_delete" ON public.oems;

CREATE POLICY "oems_insert_admin" ON public.oems FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "oems_update_admin" ON public.oems FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "oems_delete_admin" ON public.oems FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_admins
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 5. FIX AUDIT_LOG RLS POLICY
-- ============================================
DROP POLICY IF EXISTS "audit_log_insert" ON public.audit_log;

CREATE POLICY "audit_log_insert_member" ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    team_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = audit_log.team_id
      AND tm.user_id = auth.uid()
      AND tm.deleted_at IS NULL
    )
  );

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON POLICY "activity_types_insert_admin" ON public.activity_types IS 'Only org admins can create activity types';
COMMENT ON POLICY "domains_insert_admin" ON public.domains IS 'Only org admins can create domains';
COMMENT ON POLICY "oems_insert_admin" ON public.oems IS 'Only org admins can create OEMs';
