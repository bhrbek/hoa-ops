-- Migration: 021_add_commitments_owner_fk (LEGACY)
-- NOTE: This migration is a no-op. The FK constraint is now
-- included directly in migration 001_create_tables.sql

-- No-op: FK constraint already exists from migration 001
SELECT 1;
