-- Migration 017: Add activity_types table and fix RLS policies on reference tables
-- Activity types are configurable like domains and OEMs

-- ============================================
-- 1. CREATE ACTIVITY TYPES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.activity_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  color text DEFAULT 'default',
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies for activity_types (same pattern as domains/oems)
CREATE POLICY "activity_types_select" ON public.activity_types FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "activity_types_insert" ON public.activity_types FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "activity_types_update" ON public.activity_types FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "activity_types_delete" ON public.activity_types FOR DELETE
  TO authenticated
  USING (true);

-- Seed default activity types
INSERT INTO public.activity_types (name, description, display_order) VALUES
  ('Workshop', 'Hands-on technical workshop or training session', 1),
  ('Demo', 'Product demonstration or proof of value', 2),
  ('POC', 'Proof of concept implementation', 3),
  ('Advisory', 'Strategic advisory or consulting session', 4)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. FIX DOMAINS RLS POLICIES
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Domains can be created by service role" ON public.domains;
DROP POLICY IF EXISTS "Domains are viewable by authenticated users" ON public.domains;

-- Create proper policies
CREATE POLICY "domains_select" ON public.domains FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "domains_insert" ON public.domains FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "domains_update" ON public.domains FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "domains_delete" ON public.domains FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- 3. FIX OEMS RLS POLICIES (if needed)
-- ============================================

-- Check and add policies for oems table
DO $$
BEGIN
  -- Drop old policies if they exist
  DROP POLICY IF EXISTS "OEMs are viewable by authenticated users" ON public.oems;
  DROP POLICY IF EXISTS "OEMs can be created by service role" ON public.oems;

  -- Create new policies
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'oems_select' AND polrelid = 'public.oems'::regclass) THEN
    CREATE POLICY "oems_select" ON public.oems FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'oems_insert' AND polrelid = 'public.oems'::regclass) THEN
    CREATE POLICY "oems_insert" ON public.oems FOR INSERT TO authenticated WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'oems_update' AND polrelid = 'public.oems'::regclass) THEN
    CREATE POLICY "oems_update" ON public.oems FOR UPDATE TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'oems_delete' AND polrelid = 'public.oems'::regclass) THEN
    CREATE POLICY "oems_delete" ON public.oems FOR DELETE TO authenticated USING (true);
  END IF;
END $$;

-- ============================================
-- 4. ADD INDEX FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_activity_types_display_order ON public.activity_types(display_order);
