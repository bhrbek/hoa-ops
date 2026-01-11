-- ============================================
-- HEADWATERS - Security Fixes (Code Review 2026-01-11)
--
-- P1 Issues Fixed:
-- 1. commitments_update RLS policy - allow manager/org_admin
-- 2. Add soft delete columns to reference tables (domains, oems, activity_types)
-- ============================================

-- ============================================
-- FIX 1: Commitments Update Policy
-- Server action allows managers/org_admins to update team member commitments
-- but RLS was blocking them. Align RLS with server action logic.
-- ============================================

DROP POLICY IF EXISTS "commitments_update" ON public.commitments;

CREATE POLICY "commitments_update" ON public.commitments FOR UPDATE
  TO authenticated
  USING (
    deleted_at IS NULL
    AND (
      auth.uid() = owner_id
      OR is_team_manager(team_id)
      OR is_org_admin(get_org_from_team(team_id))
    )
  );

-- ============================================
-- FIX 2: Add soft delete columns to reference tables
-- CLAUDE.md specifies "Soft delete only - no hard deletes"
-- These tables were missing deleted_at/deleted_by columns
-- ============================================

-- Domains
ALTER TABLE public.domains
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) DEFAULT NULL;

-- OEMs
ALTER TABLE public.oems
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) DEFAULT NULL;

-- Activity Types
ALTER TABLE public.activity_types
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES public.profiles(id) DEFAULT NULL;

-- ============================================
-- Update RLS policies to respect soft delete on reference tables
-- ============================================

-- Domains - update select policy to exclude soft-deleted
DROP POLICY IF EXISTS "Domains are viewable by authenticated users" ON public.domains;
DROP POLICY IF EXISTS "domains_select" ON public.domains;

CREATE POLICY "domains_select" ON public.domains FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- OEMs - update select policy to exclude soft-deleted
DROP POLICY IF EXISTS "OEMs are viewable by authenticated users" ON public.oems;
DROP POLICY IF EXISTS "oems_select" ON public.oems;

CREATE POLICY "oems_select" ON public.oems FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Activity Types - update select policy to exclude soft-deleted
DROP POLICY IF EXISTS "activity_types_select" ON public.activity_types;

CREATE POLICY "activity_types_select" ON public.activity_types FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- ============================================
-- Create indexes for soft delete queries
-- ============================================

CREATE INDEX IF NOT EXISTS idx_domains_deleted ON public.domains(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_oems_deleted ON public.oems(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_activity_types_deleted ON public.activity_types(deleted_at) WHERE deleted_at IS NULL;
