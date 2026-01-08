#!/bin/bash
# RLS Debugging Script for Headwaters
# Usage: ./scripts/debug-rls.sh [user_email]

set -e

DB_URL="postgresql://postgres:kvTnp1OB4mBRma60@db.pstevmcaxrqalafoyxmy.supabase.co:5432/postgres"

USER_EMAIL="${1:-hrbekr@wwt.com}"

echo "=== RLS Debug Script ==="
echo "Testing as user: $USER_EMAIL"
echo ""

# Get user ID
USER_ID=$(PGPASSWORD='kvTnp1OB4mBRma60' psql "$DB_URL" -t -c "SELECT id FROM profiles WHERE email = '$USER_EMAIL'" | tr -d ' ')

if [ -z "$USER_ID" ]; then
  echo "ERROR: User not found with email: $USER_EMAIL"
  exit 1
fi

echo "User ID: $USER_ID"
echo ""

# Run RLS simulation
PGPASSWORD='kvTnp1OB4mBRma60' psql "$DB_URL" << EOF
-- Simulate RLS as user
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "$USER_ID"}';

RAISE NOTICE '=== RLS Test Results ===';

SELECT '1. team_memberships' as test, COUNT(*) as count FROM team_memberships WHERE deleted_at IS NULL;
SELECT '2. teams' as test, COUNT(*) as count FROM teams WHERE deleted_at IS NULL;
SELECT '3. orgs' as test, COUNT(*) as count FROM orgs;
SELECT '4. rocks' as test, COUNT(*) as count FROM rocks WHERE deleted_at IS NULL;
SELECT '5. projects' as test, COUNT(*) as count FROM projects WHERE deleted_at IS NULL;
SELECT '6. commitments' as test, COUNT(*) as count FROM commitments WHERE deleted_at IS NULL;
SELECT '7. engagements' as test, COUNT(*) as count FROM engagements WHERE deleted_at IS NULL;
SELECT '8. build_signals' as test, COUNT(*) as count FROM build_signals WHERE deleted_at IS NULL;

SELECT '--- User Team Memberships ---' as info;
SELECT
  t.name as team,
  tm.role,
  o.name as org
FROM team_memberships tm
JOIN teams t ON tm.team_id = t.id
JOIN orgs o ON t.org_id = o.id
WHERE tm.user_id = auth.uid()
AND tm.deleted_at IS NULL;

SELECT '--- Is Org Admin? ---' as info;
SELECT
  o.name as org,
  CASE WHEN oa.id IS NOT NULL THEN 'YES' ELSE 'NO' END as is_admin
FROM orgs o
LEFT JOIN org_admins oa ON o.id = oa.org_id AND oa.user_id = auth.uid();

ROLLBACK;
EOF

echo ""
echo "=== Done ==="
