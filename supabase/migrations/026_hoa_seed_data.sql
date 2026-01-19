-- ============================================
-- HOA-OPS Seed Data
-- Creates initial org, team (committee), and sets up the first user
-- ============================================

-- First, ensure the profile exists for the user
-- (The trigger may have failed or this is a fresh database)
INSERT INTO public.profiles (id, email, full_name)
VALUES ('d1c886b6-1b86-4ea5-8f29-db70110250c5', 'bhrbek@gmail.com', 'Board Admin')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(profiles.full_name, EXCLUDED.full_name);

-- Create the HOA Organization
INSERT INTO public.orgs (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Sample HOA Community')
ON CONFLICT (id) DO NOTHING;

-- Create the Board of Directors team (primary governing body)
INSERT INTO public.teams (id, org_id, name, description)
VALUES ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-000000000001', 'Board of Directors', 'The governing body of the HOA')
ON CONFLICT (id) DO NOTHING;

-- Add user as org admin
INSERT INTO public.org_admins (org_id, user_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'd1c886b6-1b86-4ea5-8f29-db70110250c5')
ON CONFLICT DO NOTHING;

-- Add user as team manager (Board member)
INSERT INTO public.team_memberships (team_id, user_id, role)
VALUES ('00000000-0000-0000-0000-000000000010', 'd1c886b6-1b86-4ea5-8f29-db70110250c5', 'manager')
ON CONFLICT DO NOTHING;

-- Create some sample committees (additional teams)
INSERT INTO public.teams (id, org_id, name, description)
VALUES
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000001', 'Architectural Review', 'Reviews and approves exterior modifications'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000001', 'Landscape Committee', 'Oversees common area landscaping and improvements'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000001', 'Finance Committee', 'Reviews budgets and financial matters'),
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000001', 'Social Committee', 'Plans community events and activities')
ON CONFLICT (id) DO NOTHING;

-- Create sample vendors
INSERT INTO public.vendors (id, name, specialty, contact_name, contact_email)
VALUES
  ('00000000-0000-0000-0000-000000000100', 'Green Thumb Landscaping', 'Landscaping', 'Mike Green', 'mike@greenthumb.example'),
  ('00000000-0000-0000-0000-000000000101', 'Quick Fix Plumbing', 'Plumbing', 'Sarah Fix', 'sarah@quickfix.example'),
  ('00000000-0000-0000-0000-000000000102', 'Bright Spark Electric', 'Electrical', 'Tom Spark', 'tom@brightspark.example'),
  ('00000000-0000-0000-0000-000000000103', 'Pool Pros', 'Pool Maintenance', 'Lisa Pool', 'lisa@poolpros.example'),
  ('00000000-0000-0000-0000-000000000104', 'SecureGate Systems', 'Security', 'Bob Gate', 'bob@securegate.example')
ON CONFLICT (id) DO NOTHING;

-- Create sample domains (issue categories for HOA)
-- Note: domains has unique constraint on name, so we use ON CONFLICT (name)
INSERT INTO public.domains (name, color)
VALUES
  ('Common Areas', 'blue'),
  ('Parking', 'slate'),
  ('Pool/Amenities', 'cyan'),
  ('Landscaping', 'green'),
  ('Architectural', 'amber'),
  ('Noise Complaint', 'orange'),
  ('Pets/Animals', 'purple')
ON CONFLICT (name) DO NOTHING;
