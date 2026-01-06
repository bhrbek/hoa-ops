-- ============================================
-- HEADWATERS - RLS Helper Functions
-- MUST RUN BEFORE ANY RLS POLICIES THAT USE THESE
-- ============================================

-- Drop existing functions if they exist (CASCADE to drop dependent policies)
-- Policies will be recreated in 007_create_rls_policies.sql
DROP FUNCTION IF EXISTS public.is_org_admin(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_org_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_team_member(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_team_manager(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_org_from_team(uuid) CASCADE;

-- Check if user is an org admin
CREATE OR REPLACE FUNCTION public.is_org_admin(check_org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_admins
    WHERE org_id = check_org_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is a member of any team in the org
CREATE OR REPLACE FUNCTION public.is_org_member(check_org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_memberships tm
    JOIN public.teams t ON tm.team_id = t.id
    WHERE t.org_id = check_org_id
    AND tm.user_id = auth.uid()
    AND tm.deleted_at IS NULL
    AND t.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is a member of the specific team
CREATE OR REPLACE FUNCTION public.is_team_member(check_team_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_memberships
    WHERE team_id = check_team_id
    AND user_id = auth.uid()
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user is a manager of the specific team
CREATE OR REPLACE FUNCTION public.is_team_manager(check_team_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.team_memberships
    WHERE team_id = check_team_id
    AND user_id = auth.uid()
    AND role = 'manager'
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Utility: Get org_id from team_id
CREATE OR REPLACE FUNCTION public.get_org_from_team(check_team_id uuid)
RETURNS uuid AS $$
  SELECT org_id FROM public.teams WHERE id = check_team_id AND deleted_at IS NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.is_org_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_team_manager(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_from_team(uuid) TO authenticated;
