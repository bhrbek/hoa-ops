# /db - Database Operations

Inspect and manage the Supabase database.

## Usage
```
/db status       # Check migration status
/db tables       # List all tables
/db query        # Run a query
/db push         # Push migrations
/db inspect      # Detailed table stats
```

## Connection Details

- **Project Ref**: pstevmcaxrqalafoyxmy
- **Region**: East US (North Virginia)
- **Dashboard**: https://supabase.com/dashboard/project/pstevmcaxrqalafoyxmy

## Commands

### Check Migration Status
```bash
supabase migration list --linked
```

### Push New Migrations
```bash
supabase db push --linked
```

### List Tables
```bash
supabase inspect db table-sizes --linked
```

### Table Statistics
```bash
supabase inspect db table-stats --linked
```

### Index Sizes
```bash
supabase inspect db index-sizes --linked
```

## REST API Queries

The most reliable way to query programmatically:

```bash
# Get service key
supabase projects api-keys --project-ref pstevmcaxrqalafoyxmy

SERVICE_KEY="<service_role key>"
BASE_URL="https://pstevmcaxrqalafoyxmy.supabase.co"

# Query a table
curl -s "$BASE_URL/rest/v1/rocks?select=id,title,team_id" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY"

# Count rows
curl -s -I "$BASE_URL/rest/v1/rocks?select=id&limit=0" \
  -H "apikey: $SERVICE_KEY" \
  -H "Authorization: Bearer $SERVICE_KEY" \
  -H "Prefer: count=exact" | grep -i content-range
```

## MCP Postgres Queries

Use the postgres MCP server for direct queries:

```sql
-- List tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- Count by table
SELECT 'rocks' as tbl, COUNT(*) FROM rocks WHERE deleted_at IS NULL
UNION ALL
SELECT 'projects', COUNT(*) FROM projects WHERE deleted_at IS NULL
UNION ALL
SELECT 'engagements', COUNT(*) FROM engagements WHERE deleted_at IS NULL;

-- Check RLS policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies WHERE schemaname = 'public';
```

## Migration Files

Location: `supabase/migrations/`

Format: `XXX_description.sql` (e.g., `020_rename_build_signals.sql`)

### Creating a New Migration
```bash
# Create file
touch supabase/migrations/021_my_change.sql

# Edit with SQL
# Then push
supabase db push --linked
```

### If Migration Fails

Mark as applied (if changes already exist):
```bash
supabase migration repair 021 --status applied --linked
```

## Common Issues

| Error | Fix |
|-------|-----|
| "relation already exists" | Mark migration as applied |
| "cannot drop function" | Add CASCADE |
| "uuid_generate_v4() does not exist" | Use `gen_random_uuid()` |
| "cannot change name of input parameter" | Drop function first |

## RLS Debugging

See `/debug-rls` skill for detailed RLS testing.

Quick check:
```sql
-- View policies on a table
SELECT policyname, cmd, pg_get_expr(polqual, polrelid) as using_expr
FROM pg_policy
WHERE polrelid = 'public.rocks'::regclass;
```
