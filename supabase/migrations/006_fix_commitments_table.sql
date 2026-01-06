-- ============================================
-- THE JAR - Fix Commitments Table Structure
-- Commitments require: Project + Build Signal
-- ============================================

-- First, check if commitments table exists and handle accordingly
DO $$
BEGIN
  -- If commitments table doesn't exist, create it fresh
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commitments' AND table_schema = 'public') THEN
    CREATE TABLE public.commitments (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
      owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      week_of date NOT NULL,
      project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
      build_signal_id uuid NOT NULL REFERENCES public.build_signals(id) ON DELETE CASCADE,
      rock_id uuid REFERENCES public.rocks(id) ON DELETE SET NULL,
      definition_of_done text NOT NULL,
      status text NOT NULL DEFAULT 'planned'
        CHECK (status IN ('planned', 'done', 'blocked', 'slipped')),
      notes text,
      completed_at timestamptz,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      deleted_at timestamptz,
      deleted_by uuid REFERENCES public.profiles(id)
    );

    RAISE NOTICE 'Created commitments table fresh';
  ELSE
    -- Table exists, alter it
    RAISE NOTICE 'Altering existing commitments table';

    -- Add team_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'team_id') THEN
      ALTER TABLE public.commitments ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE;
    END IF;

    -- Rename user_id to owner_id if user_id exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'user_id') THEN
      ALTER TABLE public.commitments RENAME COLUMN user_id TO owner_id;
    END IF;

    -- Add owner_id if not exists (in case neither user_id nor owner_id existed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'owner_id') THEN
      ALTER TABLE public.commitments ADD COLUMN owner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    -- Rename date to week_of if date exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'date') THEN
      ALTER TABLE public.commitments RENAME COLUMN date TO week_of;
    END IF;

    -- Add week_of if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'week_of') THEN
      ALTER TABLE public.commitments ADD COLUMN week_of date;
    END IF;

    -- Add project_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'project_id') THEN
      ALTER TABLE public.commitments ADD COLUMN project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE;
    END IF;

    -- Add build_signal_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'build_signal_id') THEN
      ALTER TABLE public.commitments ADD COLUMN build_signal_id uuid REFERENCES public.build_signals(id) ON DELETE CASCADE;
    END IF;

    -- Add rock_id if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'rock_id') THEN
      ALTER TABLE public.commitments ADD COLUMN rock_id uuid REFERENCES public.rocks(id) ON DELETE SET NULL;
    END IF;

    -- Add definition_of_done if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'definition_of_done') THEN
      ALTER TABLE public.commitments ADD COLUMN definition_of_done text;
    END IF;

    -- Handle status column - convert from completed boolean if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'completed' AND data_type = 'boolean') THEN
      -- Add new status column
      ALTER TABLE public.commitments ADD COLUMN status text DEFAULT 'planned';
      -- Migrate data: completed=true -> 'done', completed=false -> 'planned'
      UPDATE public.commitments SET status = CASE WHEN completed = true THEN 'done' ELSE 'planned' END;
      -- Drop old completed column
      ALTER TABLE public.commitments DROP COLUMN completed;
    END IF;

    -- Add status if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'status') THEN
      ALTER TABLE public.commitments ADD COLUMN status text DEFAULT 'planned';
    END IF;

    -- Add notes if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'notes') THEN
      ALTER TABLE public.commitments ADD COLUMN notes text;
    END IF;

    -- Add completed_at if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'completed_at') THEN
      ALTER TABLE public.commitments ADD COLUMN completed_at timestamptz;
    END IF;

    -- Add soft delete columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'deleted_at') THEN
      ALTER TABLE public.commitments ADD COLUMN deleted_at timestamptz;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'deleted_by') THEN
      ALTER TABLE public.commitments ADD COLUMN deleted_by uuid REFERENCES public.profiles(id);
    END IF;

    -- Drop deprecated columns
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'engagement_id') THEN
      ALTER TABLE public.commitments DROP COLUMN engagement_id;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'type') THEN
      ALTER TABLE public.commitments DROP COLUMN type;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'commitments' AND column_name = 'hours_value') THEN
      ALTER TABLE public.commitments DROP COLUMN hours_value;
    END IF;
  END IF;
END $$;

-- Add check constraint for status (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'commitments_status_check'
  ) THEN
    ALTER TABLE public.commitments
      ADD CONSTRAINT commitments_status_check
      CHECK (status IN ('planned', 'done', 'blocked', 'slipped'));
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_commitments_team ON public.commitments(team_id);
CREATE INDEX IF NOT EXISTS idx_commitments_owner ON public.commitments(owner_id);
CREATE INDEX IF NOT EXISTS idx_commitments_week ON public.commitments(week_of);
CREATE INDEX IF NOT EXISTS idx_commitments_project ON public.commitments(project_id);
CREATE INDEX IF NOT EXISTS idx_commitments_build_signal ON public.commitments(build_signal_id);
CREATE INDEX IF NOT EXISTS idx_commitments_status ON public.commitments(status);
CREATE INDEX IF NOT EXISTS idx_commitments_deleted ON public.commitments(deleted_at) WHERE deleted_at IS NULL;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.commitments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.commitments
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.commitments ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE public.commitments IS 'Weekly commitments that must link to a Project AND a Build Signal. Finishable in ≤7 days.';
COMMENT ON COLUMN public.commitments.week_of IS 'Monday of the commitment week';
COMMENT ON COLUMN public.commitments.project_id IS 'Required: Which project does this advance?';
COMMENT ON COLUMN public.commitments.build_signal_id IS 'Required: Which measurable outcome does this advance?';
COMMENT ON COLUMN public.commitments.definition_of_done IS 'Required: "Done means..." - must be binary checkable';
COMMENT ON COLUMN public.commitments.status IS 'planned -> done (success) OR blocked/slipped (needs action)';
