# /db-inspect - Database Inspection

Quick database exploration and verification.

## Usage
```
/db-inspect [table|query]
```

## Quick Commands

### Table Counts (bypasses RLS)
```bash
PGPASSWORD='kvTnp1OB4mBRma60' /opt/homebrew/opt/libpq/bin/psql \
  "postgresql://postgres:kvTnp1OB4mBRma60@db.pstevmcaxrqalafoyxmy.supabase.co:5432/postgres" \
  -c "SELECT 'rocks' as t, COUNT(*) FROM rocks WHERE deleted_at IS NULL
      UNION ALL SELECT 'projects', COUNT(*) FROM projects WHERE deleted_at IS NULL
      UNION ALL SELECT 'commitments', COUNT(*) FROM commitments WHERE deleted_at IS NULL
      UNION ALL SELECT 'engagements', COUNT(*) FROM engagements WHERE deleted_at IS NULL
      UNION ALL SELECT 'build_signals', COUNT(*) FROM build_signals WHERE deleted_at IS NULL;"
```

### Table Schema
```bash
PGPASSWORD='kvTnp1OB4mBRma60' /opt/homebrew/opt/libpq/bin/psql \
  "postgresql://postgres:kvTnp1OB4mBRma60@db.pstevmcaxrqalafoyxmy.supabase.co:5432/postgres" \
  -c "\d public.[table_name]"
```

### RLS Policies on Table
```bash
PGPASSWORD='kvTnp1OB4mBRma60' /opt/homebrew/opt/libpq/bin/psql \
  "postgresql://postgres:kvTnp1OB4mBRma60@db.pstevmcaxrqalafoyxmy.supabase.co:5432/postgres" \
  -c "SELECT polname, polcmd, pg_get_expr(polqual, polrelid) as policy
      FROM pg_policy
      WHERE polrelid = 'public.[table_name]'::regclass;"
```

### Foreign Keys
```bash
PGPASSWORD='kvTnp1OB4mBRma60' /opt/homebrew/opt/libpq/bin/psql \
  "postgresql://postgres:kvTnp1OB4mBRma60@db.pstevmcaxrqalafoyxmy.supabase.co:5432/postgres" \
  -c "SELECT conname, pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conrelid = 'public.[table_name]'::regclass
      AND contype = 'f';"
```

### Indexes on Table
```bash
PGPASSWORD='kvTnp1OB4mBRma60' /opt/homebrew/opt/libpq/bin/psql \
  "postgresql://postgres:kvTnp1OB4mBRma60@db.pstevmcaxrqalafoyxmy.supabase.co:5432/postgres" \
  -c "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = '[table_name]';"
```

### Functions in Public Schema
```bash
PGPASSWORD='kvTnp1OB4mBRma60' /opt/homebrew/opt/libpq/bin/psql \
  "postgresql://postgres:kvTnp1OB4mBRma60@db.pstevmcaxrqalafoyxmy.supabase.co:5432/postgres" \
  -c "SELECT proname, pg_get_function_arguments(oid) as args
      FROM pg_proc
      WHERE pronamespace = 'public'::regnamespace
      ORDER BY proname;"
```

### Function Definition
```bash
PGPASSWORD='kvTnp1OB4mBRma60' /opt/homebrew/opt/libpq/bin/psql \
  "postgresql://postgres:kvTnp1OB4mBRma60@db.pstevmcaxrqalafoyxmy.supabase.co:5432/postgres" \
  -c "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = '[function_name]';"
```

## Core Tables

| Table | Purpose |
|-------|---------|
| profiles | User profiles (synced from auth.users) |
| orgs | Organizations |
| teams | Teams within orgs |
| team_memberships | User ↔ Team (role: tsa/manager) |
| org_admins | Org admin privileges |
| rocks | Quarterly strategic goals |
| projects | Capability-build efforts under rocks |
| build_signals | Measurable outcomes for rocks |
| commitments | Weekly execution items |
| engagements | Customer interactions (sand) |
| domains | Technology domains |
| oems | Vendor/partner list |

## Connection String
```
postgresql://postgres:kvTnp1OB4mBRma60@db.pstevmcaxrqalafoyxmy.supabase.co:5432/postgres
```
