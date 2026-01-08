# /debug-rls - RLS Permission Debugging

Test Row Level Security policies for a specific user.

## Usage
```
/debug-rls [email]
```

## What it does
1. Looks up user by email (default: hrbekr@wwt.com)
2. Simulates RLS as that user
3. Tests access to all major tables
4. Shows team memberships and org admin status

## Script
Run: `./scripts/debug-rls.sh [email]`

## Common Issues Diagnosed
- User can't see their data → Check team_memberships
- Empty nested selects → Check RLS on joined tables
- Circular dependency → Check for self-referencing policies

## Quick Manual Check
```sql
BEGIN;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "USER_UUID"}';
SELECT * FROM rocks WHERE deleted_at IS NULL;
ROLLBACK;
```
