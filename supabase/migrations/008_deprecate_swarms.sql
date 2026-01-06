-- ============================================
-- HEADWATERS - Deprecate Swarms Table
-- Swarms functionality replaced by Enablement Events
-- ============================================

-- Add soft delete columns to swarms if not present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'swarms' AND table_schema = 'public') THEN
    -- Add deleted_at if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'swarms' AND column_name = 'deleted_at') THEN
      ALTER TABLE public.swarms ADD COLUMN deleted_at timestamptz;
    END IF;

    -- Add deleted_by if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'swarms' AND column_name = 'deleted_by') THEN
      ALTER TABLE public.swarms ADD COLUMN deleted_by uuid REFERENCES public.profiles(id);
    END IF;

    -- Soft delete all existing swarms records
    UPDATE public.swarms
    SET deleted_at = now()
    WHERE deleted_at IS NULL;

    RAISE NOTICE 'Soft-deleted all swarms records. Table preserved for historical reference.';
  ELSE
    RAISE NOTICE 'Swarms table does not exist - skipping deprecation.';
  END IF;
END $$;

-- Add comment explaining deprecation
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'swarms' AND table_schema = 'public') THEN
    COMMENT ON TABLE public.swarms IS 'DEPRECATED: Use enablement_events instead. All records soft-deleted as of migration 008.';
  END IF;
END $$;

-- Drop any swarms RLS policies
DROP POLICY IF EXISTS "swarms_select" ON public.swarms;
DROP POLICY IF EXISTS "swarms_insert" ON public.swarms;
DROP POLICY IF EXISTS "swarms_update" ON public.swarms;
DROP POLICY IF EXISTS "swarms_delete" ON public.swarms;
