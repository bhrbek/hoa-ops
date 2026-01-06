-- ============================================
-- THE JAR - Database Verification Script
-- Run this in Supabase Dashboard SQL Editor
-- ============================================

-- ============================================
-- 1. VERIFY HELPER FUNCTIONS EXIST
-- ============================================

DO $$
DECLARE
  fn_count int;
BEGIN
  SELECT COUNT(*) INTO fn_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN (
    'is_org_admin',
    'is_org_member',
    'is_team_member',
    'is_team_manager',
    'get_org_from_team',
    'handle_updated_at',
    'calculate_rock_progress',
    'get_oem_buying_patterns'
  );

  IF fn_count >= 5 THEN
    RAISE NOTICE '✅ Helper functions exist: % found', fn_count;
  ELSE
    RAISE WARNING '❌ Missing helper functions! Only % found', fn_count;
  END IF;
END $$;

-- List actual functions
SELECT proname as function_name,
       pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN (
  'is_org_admin',
  'is_org_member',
  'is_team_member',
  'is_team_manager',
  'get_org_from_team'
)
ORDER BY proname;

-- ============================================
-- 2. VERIFY TABLE STRUCTURES
-- ============================================

-- Check build_signals columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'build_signals'
ORDER BY ordinal_position;

-- Check commitments columns (verify new structure)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'commitments'
ORDER BY ordinal_position;

-- ============================================
-- 3. VERIFY SOFT DELETE COLUMNS
-- ============================================

SELECT
  table_name,
  MAX(CASE WHEN column_name = 'deleted_at' THEN 'YES' ELSE 'NO' END) as has_deleted_at,
  MAX(CASE WHEN column_name = 'deleted_by' THEN 'YES' ELSE 'NO' END) as has_deleted_by
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN (
  'rocks', 'projects', 'tasks', 'engagements',
  'customers', 'assets', 'milestones', 'build_signals',
  'commitments', 'teams', 'team_memberships', 'enablement_events'
)
GROUP BY table_name
ORDER BY table_name;

-- ============================================
-- 4. VERIFY RLS IS ENABLED
-- ============================================

SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'orgs', 'teams', 'team_memberships', 'org_admins',
  'rocks', 'projects', 'tasks', 'engagements',
  'customers', 'assets', 'milestones', 'build_signals',
  'commitments', 'enablement_events'
)
ORDER BY tablename;

-- ============================================
-- 5. VERIFY RLS POLICIES EXIST
-- ============================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  qual IS NOT NULL as has_using,
  with_check IS NOT NULL as has_with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 6. VERIFY CHECK CONSTRAINTS
-- ============================================

-- Build signal status constraint
SELECT conname, consrc
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'build_signals'
AND c.contype = 'c';

-- Commitment status constraint
SELECT conname, consrc
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'commitments'
AND c.contype = 'c';

-- ============================================
-- 7. VERIFY FOREIGN KEY RELATIONSHIPS
-- ============================================

SELECT
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name AS to_table,
  ccu.column_name AS to_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
AND tc.table_name IN ('build_signals', 'commitments')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- 8. VERIFY INDEXES EXIST
-- ============================================

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('build_signals', 'commitments', 'rocks', 'projects', 'engagements', 'customers')
ORDER BY tablename, indexname;

-- ============================================
-- 9. DATA INTEGRITY CHECKS
-- ============================================

-- Check for rocks without team_id
SELECT 'rocks_missing_team_id' as check_name, COUNT(*) as count
FROM public.rocks WHERE team_id IS NULL;

-- Check for projects without team_id
SELECT 'projects_missing_team_id' as check_name, COUNT(*) as count
FROM public.projects WHERE team_id IS NULL;

-- Check for engagements without team_id
SELECT 'engagements_missing_team_id' as check_name, COUNT(*) as count
FROM public.engagements WHERE team_id IS NULL;

-- Check customers are org-scoped (not team-scoped)
SELECT 'customers_missing_org_id' as check_name, COUNT(*) as count
FROM public.customers WHERE org_id IS NULL;

-- ============================================
-- 10. TEST HELPER FUNCTIONS (if user exists)
-- ============================================

-- These will return false since we're running as service role
-- In production, test with actual authenticated users

-- Test is_org_admin with a fake UUID (should return false or error gracefully)
SELECT public.is_org_admin('00000000-0000-0000-0000-000000000000'::uuid) as is_org_admin_result;

-- Test is_team_member with a fake UUID
SELECT public.is_team_member('00000000-0000-0000-0000-000000000000'::uuid) as is_team_member_result;

-- Test get_org_from_team with a fake UUID (should return NULL)
SELECT public.get_org_from_team('00000000-0000-0000-0000-000000000000'::uuid) as org_from_team_result;

-- ============================================
-- SUMMARY
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'VERIFICATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Review the results above to confirm:';
  RAISE NOTICE '1. All helper functions exist';
  RAISE NOTICE '2. build_signals and commitments have correct columns';
  RAISE NOTICE '3. All tables have deleted_at/deleted_by columns';
  RAISE NOTICE '4. RLS is enabled on all required tables';
  RAISE NOTICE '5. RLS policies exist';
  RAISE NOTICE '6. Check constraints are in place';
  RAISE NOTICE '7. Foreign keys are correct';
  RAISE NOTICE '8. Indexes exist for performance';
  RAISE NOTICE '9. No orphaned data (missing team_id/org_id)';
  RAISE NOTICE '============================================';
END $$;
