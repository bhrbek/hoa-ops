-- ============================================
-- HEADWATERS - Row Level Security Policies
-- Security is paramount!
-- ============================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.domains enable row level security;
alter table public.oems enable row level security;
alter table public.rocks enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.engagements enable row level security;
alter table public.engagement_domains enable row level security;
alter table public.engagement_oems enable row level security;

-- ============================================
-- PROFILES
-- ============================================

-- Users can read all profiles (for owner dropdowns, avatars, etc.)
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- Users can only update their own profile
create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================
-- REFERENCE DATA (Domains, OEMs)
-- Read-only for authenticated users
-- ============================================

create policy "Domains are viewable by authenticated users"
  on public.domains for select
  to authenticated
  using (true);

create policy "OEMs are viewable by authenticated users"
  on public.oems for select
  to authenticated
  using (true);

-- Only allow inserts via service role (admin)
create policy "Domains can be created by service role"
  on public.domains for insert
  to service_role
  with check (true);

create policy "OEMs can be created by service role"
  on public.oems for insert
  to service_role
  with check (true);

-- ============================================
-- ROCKS
-- All authenticated users can view and create
-- Only owner can update/delete
-- ============================================

create policy "Rocks are viewable by authenticated users"
  on public.rocks for select
  to authenticated
  using (true);

create policy "Authenticated users can create rocks"
  on public.rocks for insert
  to authenticated
  with check (auth.uid() = owner_id);

create policy "Rock owners can update their rocks"
  on public.rocks for update
  to authenticated
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Rock owners can delete their rocks"
  on public.rocks for delete
  to authenticated
  using (auth.uid() = owner_id);

-- ============================================
-- PROJECTS
-- All authenticated users can view
-- Only owner or rock owner can modify
-- ============================================

create policy "Projects are viewable by authenticated users"
  on public.projects for select
  to authenticated
  using (true);

create policy "Authenticated users can create projects"
  on public.projects for insert
  to authenticated
  with check (
    auth.uid() = owner_id
    or auth.uid() = (select owner_id from public.rocks where id = rock_id)
  );

create policy "Project or rock owners can update projects"
  on public.projects for update
  to authenticated
  using (
    auth.uid() = owner_id
    or auth.uid() = (select owner_id from public.rocks where id = rock_id)
  );

create policy "Project or rock owners can delete projects"
  on public.projects for delete
  to authenticated
  using (
    auth.uid() = owner_id
    or auth.uid() = (select owner_id from public.rocks where id = rock_id)
  );

-- ============================================
-- TASKS
-- All authenticated users can view
-- Only project owner can modify
-- ============================================

create policy "Tasks are viewable by authenticated users"
  on public.tasks for select
  to authenticated
  using (true);

create policy "Project owners can create tasks"
  on public.tasks for insert
  to authenticated
  with check (
    auth.uid() = (select owner_id from public.projects where id = project_id)
  );

create policy "Project owners can update tasks"
  on public.tasks for update
  to authenticated
  using (
    auth.uid() = (select owner_id from public.projects where id = project_id)
  );

create policy "Project owners can delete tasks"
  on public.tasks for delete
  to authenticated
  using (
    auth.uid() = (select owner_id from public.projects where id = project_id)
  );

-- ============================================
-- ENGAGEMENTS
-- Users can only see and manage their own engagements
-- ============================================

create policy "Users can view their own engagements"
  on public.engagements for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their own engagements"
  on public.engagements for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own engagements"
  on public.engagements for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own engagements"
  on public.engagements for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================
-- ENGAGEMENT JUNCTIONS
-- Follow engagement ownership rules
-- ============================================

create policy "Users can view their engagement domains"
  on public.engagement_domains for select
  to authenticated
  using (
    engagement_id in (select id from public.engagements where user_id = auth.uid())
  );

create policy "Users can manage their engagement domains"
  on public.engagement_domains for insert
  to authenticated
  with check (
    engagement_id in (select id from public.engagements where user_id = auth.uid())
  );

create policy "Users can delete their engagement domains"
  on public.engagement_domains for delete
  to authenticated
  using (
    engagement_id in (select id from public.engagements where user_id = auth.uid())
  );

create policy "Users can view their engagement OEMs"
  on public.engagement_oems for select
  to authenticated
  using (
    engagement_id in (select id from public.engagements where user_id = auth.uid())
  );

create policy "Users can manage their engagement OEMs"
  on public.engagement_oems for insert
  to authenticated
  with check (
    engagement_id in (select id from public.engagements where user_id = auth.uid())
  );

create policy "Users can delete their engagement OEMs"
  on public.engagement_oems for delete
  to authenticated
  using (
    engagement_id in (select id from public.engagements where user_id = auth.uid())
  );

-- ============================================
-- ADMIN OVERRIDE POLICIES
-- Service role bypasses all RLS
-- ============================================

-- Note: service_role automatically bypasses RLS
-- These are explicitly defined for clarity

create policy "Service role has full access to profiles"
  on public.profiles for all
  to service_role
  using (true)
  with check (true);

create policy "Service role has full access to rocks"
  on public.rocks for all
  to service_role
  using (true)
  with check (true);

create policy "Service role has full access to projects"
  on public.projects for all
  to service_role
  using (true)
  with check (true);

create policy "Service role has full access to tasks"
  on public.tasks for all
  to service_role
  using (true)
  with check (true);

create policy "Service role has full access to engagements"
  on public.engagements for all
  to service_role
  using (true)
  with check (true);
