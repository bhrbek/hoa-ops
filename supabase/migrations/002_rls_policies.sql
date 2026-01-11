-- ============================================
-- HEADWATERS - Initial RLS Policies (LEGACY)
-- NOTE: These are basic policies. Team-scoped policies
-- are set up in migrations 007+ which override these.
-- ============================================

-- Basic profile policies
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Reference data (read-only for authenticated users)
create policy "Domains are viewable by authenticated users"
  on public.domains for select
  to authenticated
  using (true);

create policy "OEMs are viewable by authenticated users"
  on public.oems for select
  to authenticated
  using (true);

create policy "Activity types are viewable by authenticated users"
  on public.activity_types for select
  to authenticated
  using (true);

-- Note: Team-scoped policies for rocks, projects, engagements, etc.
-- are created in migration 007_create_rls_policies.sql
