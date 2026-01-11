-- Fix function search_path security warnings
-- Setting search_path to empty string prevents search path injection attacks

-- Helper functions used by RLS policies
ALTER FUNCTION public.is_team_member(check_team_id uuid) SET search_path = '';
ALTER FUNCTION public.is_team_manager(check_team_id uuid) SET search_path = '';
ALTER FUNCTION public.is_org_admin(check_org_id uuid) SET search_path = '';
ALTER FUNCTION public.is_org_member(check_org_id uuid) SET search_path = '';
ALTER FUNCTION public.get_org_from_team(check_team_id uuid) SET search_path = '';

-- Trigger functions
ALTER FUNCTION public.handle_updated_at() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- Business logic functions
ALTER FUNCTION public.calculate_rock_progress(rock_uuid uuid) SET search_path = '';
ALTER FUNCTION public.get_oem_buying_patterns(limit_count integer) SET search_path = '';
