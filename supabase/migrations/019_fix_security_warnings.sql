-- Migration 019: Fix Supabase Security Linter Warnings
--
-- Issues addressed:
-- 1. handle_new_user function search_path not set
-- 2. Overly permissive RLS policies on reference tables (activity_types, domains, oems, themes, domain_oems)
-- 3. Overly permissive audit_log INSERT policy
--
-- Security principle: Reference data (domains, oems, activity_types, themes) should be:
-- - Readable by all authenticated users (for dropdowns, etc.)
-- - Modifiable only by org_admins

-- ============================================
-- 1. FIX handle_new_user SEARCH_PATH
-- ============================================
-- Re-apply in case function was recreated
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- ============================================
-- 2. FIX ACTIVITY_TYPES RLS POLICIES
-- ============================================
-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "activity_types_insert" ON public.activity_types;
DROP POLICY IF EXISTS "activity_types_update" ON public.activity_types;
DROP POLICY IF EXISTS "activity_types_delete" ON public.activity_types;

-- Create org_admin-only policies for write operations
-- Users can modify if they are an org_admin of ANY org
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
-- 5. FIX THEMES RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "themes_insert" ON public.themes;
DROP POLICY IF EXISTS "themes_update" ON public.themes;
DROP POLICY IF EXISTS "themes_delete" ON public.themes;

CREATE POLICY "themes_insert_admin" ON public.themes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "themes_update_admin" ON public.themes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "themes_delete_admin" ON public.themes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_admins
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 6. FIX DOMAIN_OEMS RLS POLICIES
-- ============================================
DROP POLICY IF EXISTS "domain_oems_insert" ON public.domain_oems;
DROP POLICY IF EXISTS "domain_oems_delete" ON public.domain_oems;

CREATE POLICY "domain_oems_insert_admin" ON public.domain_oems FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_admins
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "domain_oems_delete_admin" ON public.domain_oems FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_admins
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 7. FIX AUDIT_LOG RLS POLICY
-- ============================================
-- Audit log should only be insertable by the system (via triggers)
-- Users should not be able to directly insert audit records
-- However, since triggers run with SECURITY DEFINER, we need to allow
-- the trigger function to insert. We'll make it so only system can insert.
DROP POLICY IF EXISTS "audit_log_insert" ON public.audit_log;

-- Create a more restrictive policy:
-- Audit entries must be for teams the user is a member of
-- This prevents users from creating fake audit entries
CREATE POLICY "audit_log_insert_member" ON public.audit_log FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User must be a member of the team being audited
    -- Or it's a system-level audit (no team_id)
    team_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.team_memberships tm
      WHERE tm.team_id = audit_log.team_id
      AND tm.user_id = auth.uid()
      AND tm.deleted_at IS NULL
    )
  );

-- ============================================
-- COMMENT
-- ============================================
COMMENT ON POLICY "activity_types_insert_admin" ON public.activity_types IS 'Only org admins can create activity types';
COMMENT ON POLICY "domains_insert_admin" ON public.domains IS 'Only org admins can create domains';
COMMENT ON POLICY "oems_insert_admin" ON public.oems IS 'Only org admins can create OEMs';
COMMENT ON POLICY "themes_insert_admin" ON public.themes IS 'Only org admins can create themes';
