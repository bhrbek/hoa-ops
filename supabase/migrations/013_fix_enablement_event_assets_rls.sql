-- Migration: 013_fix_enablement_event_assets_rls (LEGACY)
-- NOTE: This migration is a no-op. RLS policies for enablement_event_assets
-- are now created in migration 010_enable_rls_junction_tables.sql

-- No-op: policies already created in migration 010
SELECT 1;
