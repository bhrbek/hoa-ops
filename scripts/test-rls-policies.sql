-- ============================================
-- THE JAR - RLS Policy Testing Script
-- Run this in Supabase Dashboard SQL Editor
-- ============================================
--
-- This script tests RLS policies by simulating different user contexts.
-- IMPORTANT: Run each section separately and verify results.
--
-- Prerequisites:
-- 1. At least 2 orgs with teams
-- 2. Users with different roles (org_admin, manager, tsa)
-- 3. Sample data in rocks, projects, engagements, commitments

-- ============================================
-- SETUP: Find test users and data
-- ============================================

-- Find users with different roles for testing
SELECT
  p.id as user_id,
  p.full_name,
  p.email,
  CASE WHEN oa.id IS NOT NULL THEN 'org_admin' ELSE NULL END as org_admin_of,
  tm.role as team_role,
  t.name as team_name,
  o.name as org_name
FROM profiles p
LEFT JOIN org_admins oa ON p.id = oa.user_id
LEFT JOIN team_memberships tm ON p.id = tm.user_id AND tm.deleted_at IS NULL
LEFT JOIN teams t ON tm.team_id = t.id
LEFT JOIN orgs o ON t.org_id = o.id
ORDER BY p.full_name, t.name;

-- Find sample data for testing
SELECT 'rocks' as entity, COUNT(*) as count FROM rocks WHERE deleted_at IS NULL
UNION ALL
SELECT 'projects', COUNT(*) FROM projects WHERE deleted_at IS NULL
UNION ALL
SELECT 'engagements', COUNT(*) FROM engagements WHERE deleted_at IS NULL
UNION ALL
SELECT 'commitments', COUNT(*) FROM commitments WHERE deleted_at IS NULL
UNION ALL
SELECT 'customers', COUNT(*) FROM customers WHERE deleted_at IS NULL;

-- ============================================
-- TEST 1: Team Member can see own team's rocks
-- ============================================
-- Replace USER_ID with an actual user ID from above

/*
-- Run as specific user (replace with actual UUID)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "USER_ID_HERE"}';

SELECT id, title, team_id FROM rocks WHERE deleted_at IS NULL LIMIT 5;

RESET ROLE;
*/

-- ============================================
-- TEST 2: Team Member CANNOT see other team's rocks
-- ============================================
-- This should return 0 rows for rocks not in user's team

/*
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "USER_ID_HERE"}';

-- Try to select a rock from a team the user is NOT in
SELECT * FROM rocks WHERE team_id = 'OTHER_TEAM_ID_HERE';

RESET ROLE;
*/

-- ============================================
-- TEST 3: Org Admin can see all teams in org
-- ============================================

/*
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "ORG_ADMIN_USER_ID"}';

-- Should see all teams in their org
SELECT t.id, t.name, o.name as org_name
FROM teams t
JOIN orgs o ON t.org_id = o.id
WHERE t.deleted_at IS NULL;

RESET ROLE;
*/

-- ============================================
-- TEST 4: Commitment owner-only update policy
-- ============================================
-- Non-owner should NOT be able to update

/*
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "NON_OWNER_USER_ID"}';

-- Try to update a commitment owned by someone else
-- This should fail or return 0 rows affected
UPDATE commitments
SET notes = 'Attempted update by non-owner'
WHERE id = 'COMMITMENT_ID_OWNED_BY_SOMEONE_ELSE'
RETURNING id;

RESET ROLE;
*/

-- ============================================
-- TEST 5: Engagement team-wide edit (TSA handoff)
-- ============================================
-- Any team member should be able to update any engagement in their team

/*
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "TSA_USER_ID"}';

-- Update an engagement owned by someone else in same team
UPDATE engagements
SET notes = 'Updated by teammate for handoff'
WHERE id = 'ENGAGEMENT_ID_IN_SAME_TEAM'
AND team_id = 'TSA_TEAM_ID'
RETURNING id, owner_id;

RESET ROLE;
*/

-- ============================================
-- TEST 6: Customer org-scoped visibility
-- ============================================
-- Users can only see customers in their org

/*
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "USER_ID"}';

-- Should only return customers from user's org
SELECT c.id, c.name, c.org_id, o.name as org_name
FROM customers c
JOIN orgs o ON c.org_id = o.id
WHERE c.deleted_at IS NULL;

RESET ROLE;
*/

-- ============================================
-- TEST 7: Soft delete visibility
-- ============================================
-- Soft-deleted records should NOT be visible

-- First, check if any soft-deleted records exist
SELECT
  'rocks' as table_name,
  COUNT(*) FILTER (WHERE deleted_at IS NULL) as visible,
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL) as soft_deleted
FROM rocks
UNION ALL
SELECT 'projects',
  COUNT(*) FILTER (WHERE deleted_at IS NULL),
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)
FROM projects
UNION ALL
SELECT 'engagements',
  COUNT(*) FILTER (WHERE deleted_at IS NULL),
  COUNT(*) FILTER (WHERE deleted_at IS NOT NULL)
FROM engagements;

-- ============================================
-- TEST 8: Helper function behavior
-- ============================================

-- Test with actual team/org IDs from your data
-- Replace with real UUIDs

/*
-- Get a real team ID
SELECT id as team_id, name, org_id FROM teams LIMIT 1;

-- Test is_team_member (will return false without auth context)
SELECT public.is_team_member('TEAM_ID_HERE'::uuid);

-- Test is_org_admin
SELECT public.is_org_admin('ORG_ID_HERE'::uuid);

-- Test get_org_from_team
SELECT public.get_org_from_team('TEAM_ID_HERE'::uuid);
*/

-- ============================================
-- CROSS-TENANT ISOLATION TESTS
-- ============================================

-- These are the critical security tests.
-- For each test, replace UUIDs with actual values from your data.

-- Test A: User in Org A cannot see Org B customers
/*
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "USER_IN_ORG_A"}';

SELECT COUNT(*) as should_be_zero
FROM customers
WHERE org_id = 'ORG_B_ID'
AND deleted_at IS NULL;

RESET ROLE;
*/

-- Test B: User in Team A cannot see Team B rocks
/*
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "USER_IN_TEAM_A"}';

SELECT COUNT(*) as should_be_zero
FROM rocks
WHERE team_id = 'TEAM_B_ID'
AND deleted_at IS NULL;

RESET ROLE;
*/

-- Test C: User in Team A cannot update Team B engagement
/*
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "USER_IN_TEAM_A"}';

UPDATE engagements
SET notes = 'Cross-team update attempt'
WHERE team_id = 'TEAM_B_ID'
RETURNING id;
-- Should return 0 rows

RESET ROLE;
*/

-- ============================================
-- QUICK POLICY SUMMARY
-- ============================================

SELECT
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual LIKE '%is_team_member%' THEN 'team-scoped'
    WHEN qual LIKE '%is_org_member%' THEN 'org-scoped'
    WHEN qual LIKE '%is_org_admin%' THEN 'org-admin-only'
    WHEN qual LIKE '%owner_id%' THEN 'owner-only'
    ELSE 'other'
  END as scope_type
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('rocks', 'projects', 'engagements', 'commitments', 'customers')
ORDER BY tablename, cmd;

-- ============================================
-- INSTRUCTIONS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'RLS POLICY TESTING INSTRUCTIONS';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE '1. Run the SETUP queries first to find test users/data';
  RAISE NOTICE '2. Replace placeholder UUIDs in each test with real values';
  RAISE NOTICE '3. Uncomment and run each TEST section individually';
  RAISE NOTICE '4. Verify expected behavior:';
  RAISE NOTICE '   - Team members see only their team data';
  RAISE NOTICE '   - Org admins see all teams in their org';
  RAISE NOTICE '   - Cross-tenant queries return 0 rows';
  RAISE NOTICE '   - Owner-only updates fail for non-owners';
  RAISE NOTICE '   - Soft-deleted records are hidden';
  RAISE NOTICE '';
  RAISE NOTICE 'CRITICAL: Run cross-tenant tests (A, B, C) to verify isolation!';
  RAISE NOTICE '============================================';
END $$;
