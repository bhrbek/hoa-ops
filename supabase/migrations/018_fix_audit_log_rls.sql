-- Fix audit_log RLS policies
-- The audit_row_change trigger needs INSERT permission to write audit entries

-- Add INSERT policy for audit_log
CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT TO authenticated
  WITH CHECK (true);
