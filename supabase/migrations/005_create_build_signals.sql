-- ============================================
-- HEADWATERS - Build Signals Table
-- Measurable outcomes that track execution truth
-- ============================================

-- Ensure uuid extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create build_signals table
CREATE TABLE IF NOT EXISTS public.build_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  rock_id uuid NOT NULL REFERENCES public.rocks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  target_value numeric,
  current_value numeric DEFAULT 0,
  unit text,
  status text NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'achieved', 'missed')),
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.profiles(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_build_signals_team ON public.build_signals(team_id);
CREATE INDEX IF NOT EXISTS idx_build_signals_rock ON public.build_signals(rock_id);
CREATE INDEX IF NOT EXISTS idx_build_signals_status ON public.build_signals(status);
CREATE INDEX IF NOT EXISTS idx_build_signals_deleted ON public.build_signals(deleted_at) WHERE deleted_at IS NULL;

-- Add updated_at trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.build_signals;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.build_signals
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.build_signals ENABLE ROW LEVEL SECURITY;

-- Add comment
COMMENT ON TABLE public.build_signals IS 'Measurable outcomes per Rock that track execution truth. Each rock should have 1-3 build signals.';
COMMENT ON COLUMN public.build_signals.target_value IS 'Optional quantitative target (e.g., 3 customers, 100% coverage)';
COMMENT ON COLUMN public.build_signals.current_value IS 'Current progress toward target_value';
COMMENT ON COLUMN public.build_signals.unit IS 'Unit of measurement (e.g., customers, deployments, %)';
COMMENT ON COLUMN public.build_signals.status IS 'not_started -> in_progress -> achieved OR missed';
