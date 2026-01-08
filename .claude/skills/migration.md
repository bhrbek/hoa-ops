# /migration - Database Migration Helper

Create, apply, and troubleshoot database migrations.

## Usage
```
/migration [create|apply|status|repair]
```

## Creating a Migration

### 1. Find Next Number
```bash
ls -la supabase/migrations/ | tail -5
```

### 2. Create File
```bash
touch supabase/migrations/XXX_description.sql
```

### 3. Migration Template
```sql
-- Migration: XXX_description
-- Purpose: [What this migration does]

-- [Your SQL here]

-- Example: Add column
ALTER TABLE public.rocks ADD COLUMN IF NOT EXISTS new_field TEXT;

-- Example: Create table
CREATE TABLE IF NOT EXISTS public.new_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.profiles(id)
);

-- Example: Add RLS
ALTER TABLE public.new_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "new_table_select" ON public.new_table FOR SELECT
  TO authenticated
  USING (
    deleted_at IS NULL
    AND is_team_member(team_id)
  );

-- Example: Create function
CREATE OR REPLACE FUNCTION public.my_function(param_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.some_table WHERE id = param_id
  );
END;
$$;
```

## Applying Migrations

### Direct Apply (Recommended)
```bash
PGPASSWORD='kvTnp1OB4mBRma60' /opt/homebrew/opt/libpq/bin/psql \
  "postgresql://postgres:kvTnp1OB4mBRma60@db.pstevmcaxrqalafoyxmy.supabase.co:5432/postgres" \
  -f supabase/migrations/XXX_description.sql
```

### Via Supabase CLI
```bash
supabase db push
```

## Common Errors & Fixes

### "relation already exists"
Table/index already created. Mark as applied:
```bash
supabase migration repair XXX --status applied --linked
```

### "cannot change name of input parameter"
Function signature changed. Drop first:
```sql
DROP FUNCTION IF EXISTS function_name(param_types) CASCADE;
```

### "uuid_generate_v4() does not exist"
Use `gen_random_uuid()` instead.

### "policy already exists"
```sql
DROP POLICY IF EXISTS "policy_name" ON public.table_name;
CREATE POLICY "policy_name" ON public.table_name ...;
```

### "cannot drop function because other objects depend on it"
```sql
DROP FUNCTION IF EXISTS function_name(uuid) CASCADE;
```

## Migration Status
```bash
supabase migration list --linked
```

## Best Practices

1. **Always use IF NOT EXISTS / IF EXISTS** for idempotency
2. **Set search_path = ''** on all functions for security
3. **Add RLS policies** for any new table
4. **Include self-access escape hatch** in RLS to avoid circular deps
5. **Use explicit FK hints** in queries when table has multiple FKs to same table
6. **Test migration** on a fresh database copy first if possible

## Current Migrations

| # | File | Purpose |
|---|------|---------|
| 001 | create_tables.sql | Base tables + profile trigger |
| 002 | rls_policies.sql | Initial RLS policies |
| 003 | seed_data.sql | Reference data |
| 004 | create_helper_functions.sql | RLS helper functions |
| 005 | create_build_signals.sql | Build signals table |
| 006 | fix_commitments_table.sql | Commitment model redesign |
| 007 | create_rls_policies.sql | Team-scoped RLS policies |
| 008 | deprecate_swarms.sql | Deprecate swarms → enablement_events |
| 009-016 | fix_*.sql | Various RLS fixes |
| 017+ | ... | Later migrations |
