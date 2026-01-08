-- Add missing FK constraint for commitments.owner_id -> profiles.id
-- This was missing from the original schema and causes PGRST200 errors
-- when using explicit FK hints in Supabase queries

ALTER TABLE public.commitments
ADD CONSTRAINT commitments_owner_id_fkey
FOREIGN KEY (owner_id) REFERENCES public.profiles(id);

-- Add comment
COMMENT ON CONSTRAINT commitments_owner_id_fkey ON public.commitments IS 'FK to profiles for commitment owner';
