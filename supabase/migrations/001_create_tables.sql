-- ============================================
-- HEADWATERS - Complete Database Schema
-- Strategic Operating System for TSAs
-- ============================================

-- Note: Using gen_random_uuid() which is built into PostgreSQL 13+

-- ============================================
-- 1. USER PROFILES (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text not null,
  email text not null,
  avatar_url text,
  capacity_hours integer default 40,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 2. ORGANIZATION HIERARCHY
-- ============================================

-- Organizations (top-level tenant)
create table public.orgs (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  created_at timestamptz default now()
);

-- Teams (belong to organizations)
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);

-- Team Memberships (users belong to teams with roles)
create table public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'tsa' check (role in ('manager', 'tsa')),
  created_at timestamptz default now(),
  deleted_at timestamptz,
  unique(team_id, user_id)
);

-- Org Admins (users with org-level admin access)
create table public.org_admins (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  unique(org_id, user_id)
);

-- ============================================
-- 3. REFERENCE DATA
-- ============================================

-- Technology Domains (Cloud, Security, Network, etc.)
create table public.domains (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  color text default 'default',
  created_at timestamptz default now()
);

-- OEMs / Vendors (Cisco, AWS, Palo Alto, etc.)
create table public.oems (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  logo_url text,
  created_at timestamptz default now()
);

-- Activity Types (Workshop, Demo, POC, Advisory, etc.)
create table public.activity_types (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  description text,
  color text default 'default',
  display_order integer default 0,
  created_at timestamptz default now()
);

-- ============================================
-- 4. CUSTOMERS (Org-scoped)
-- ============================================

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  vertical text,
  status text default 'active' check (status in ('active', 'churned', 'prospect')),
  created_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);

-- ============================================
-- 5. STRATEGY (Rocks, Projects, Key Results)
-- ============================================

-- Rocks: Quarterly Strategic Goals (Team-scoped)
create table public.rocks (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  title text not null,
  owner_id uuid references public.profiles(id) on delete set null,
  quarter text not null default 'Q1 2026',
  status text not null default 'On Track' check (status in ('On Track', 'At Risk', 'Off Track', 'Done')),
  perfect_outcome text not null,
  worst_outcome text,
  progress_override integer check (progress_override >= 0 and progress_override <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);

-- Key Results: Measurable outcomes for Rocks
create table public.key_results (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  rock_id uuid not null references public.rocks(id) on delete cascade,
  title text not null,
  description text,
  target_value numeric,
  current_value numeric default 0,
  unit text,
  status text default 'not_started' check (status in ('not_started', 'in_progress', 'achieved', 'missed')),
  due_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);

-- Projects: Supporting projects under Rocks
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id) on delete cascade,
  rock_id uuid references public.rocks(id) on delete cascade not null,
  title text not null,
  owner_id uuid references public.profiles(id) on delete set null,
  start_date date,
  end_date date,
  status text not null default 'Active' check (status in ('Active', 'Done', 'Blocked')),
  estimated_hours integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);

-- Milestones: Project milestones
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  due_date date,
  status text default 'pending' check (status in ('pending', 'completed', 'missed')),
  completed_at timestamptz,
  created_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);

-- Tasks: Small tasks under Projects
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  completed boolean default false,
  due_date date,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);

-- Commitments: Weekly execution commitments
create table public.commitments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  week_of date not null,
  project_id uuid not null references public.projects(id) on delete cascade,
  key_result_id uuid not null references public.key_results(id) on delete cascade,
  rock_id uuid references public.rocks(id) on delete set null,
  definition_of_done text not null,
  status text not null default 'planned' check (status in ('planned', 'done', 'blocked', 'slipped')),
  notes text,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);

-- ============================================
-- 6. ENGAGEMENTS (Field Activity)
-- ============================================

create table public.engagements (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  date date not null default current_date,
  activity_type text not null,
  revenue_impact numeric(12,2) default 0,
  gp_impact numeric(12,2) default 0,
  notes text,
  rock_id uuid references public.rocks(id) on delete set null,
  last_edited_by uuid references public.profiles(id),
  last_edited_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);

-- ============================================
-- 7. ASSETS (Reusable content)
-- ============================================

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  name text not null,
  asset_type text not null,
  description text,
  url text,
  status text default 'active' check (status in ('active', 'archived')),
  created_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);

-- ============================================
-- 8. ENABLEMENT EVENTS
-- ============================================

create table public.enablement_events (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  event_type text not null,
  title text not null,
  description text,
  event_date date,
  location text,
  capacity integer,
  attendee_count integer default 0,
  created_at timestamptz default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id)
);

-- ============================================
-- 9. AUDIT LOG
-- ============================================

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  actor_user_id uuid not null references public.profiles(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz default now()
);

-- ============================================
-- 10. JUNCTION TABLES (Many-to-Many)
-- ============================================

-- Engagement <-> Domains
create table public.engagement_domains (
  engagement_id uuid references public.engagements(id) on delete cascade,
  domain_id uuid references public.domains(id) on delete cascade,
  primary key (engagement_id, domain_id)
);

-- Engagement <-> OEMs
create table public.engagement_oems (
  engagement_id uuid references public.engagements(id) on delete cascade,
  oem_id uuid references public.oems(id) on delete cascade,
  primary key (engagement_id, oem_id)
);

-- Engagement <-> Assets
create table public.engagement_assets (
  engagement_id uuid references public.engagements(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete cascade,
  primary key (engagement_id, asset_id)
);

-- Project <-> Assets
create table public.project_assets (
  project_id uuid references public.projects(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete cascade,
  primary key (project_id, asset_id)
);

-- Enablement Event <-> Assets
create table public.enablement_event_assets (
  enablement_event_id uuid references public.enablement_events(id) on delete cascade,
  asset_id uuid references public.assets(id) on delete cascade,
  primary key (enablement_event_id, asset_id)
);

-- ============================================
-- 11. INDEXES FOR PERFORMANCE
-- ============================================

-- Team hierarchy
create index idx_teams_org on public.teams(org_id);
create index idx_team_memberships_team on public.team_memberships(team_id);
create index idx_team_memberships_user on public.team_memberships(user_id);
create index idx_org_admins_org on public.org_admins(org_id);
create index idx_org_admins_user on public.org_admins(user_id);

-- Customers
create index idx_customers_org on public.customers(org_id);

-- Rocks and strategy
create index idx_rocks_team on public.rocks(team_id);
create index idx_rocks_owner on public.rocks(owner_id);
create index idx_rocks_quarter on public.rocks(quarter);
create index idx_rocks_status on public.rocks(status);

-- Key Results
create index idx_key_results_team on public.key_results(team_id);
create index idx_key_results_rock on public.key_results(rock_id);

-- Projects
create index idx_projects_team on public.projects(team_id);
create index idx_projects_rock on public.projects(rock_id);
create index idx_projects_owner on public.projects(owner_id);
create index idx_projects_status on public.projects(status);

-- Milestones
create index idx_milestones_team on public.milestones(team_id);
create index idx_milestones_project on public.milestones(project_id);

-- Tasks
create index idx_tasks_project on public.tasks(project_id);
create index idx_tasks_completed on public.tasks(completed);

-- Commitments
create index idx_commitments_team on public.commitments(team_id);
create index idx_commitments_owner on public.commitments(owner_id);
create index idx_commitments_week on public.commitments(week_of);
create index idx_commitments_project on public.commitments(project_id);
create index idx_commitments_key_result on public.commitments(key_result_id);

-- Engagements
create index idx_engagements_team on public.engagements(team_id);
create index idx_engagements_owner on public.engagements(owner_id);
create index idx_engagements_date on public.engagements(date);
create index idx_engagements_rock on public.engagements(rock_id);
create index idx_engagements_customer on public.engagements(customer_name);

-- Assets
create index idx_assets_team on public.assets(team_id);

-- Enablement Events
create index idx_enablement_events_team on public.enablement_events(team_id);

-- Audit Log
create index idx_audit_log_org on public.audit_log(org_id);
create index idx_audit_log_team on public.audit_log(team_id);
create index idx_audit_log_entity on public.audit_log(entity_type, entity_id);

-- ============================================
-- 12. FUNCTIONS
-- ============================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.rocks
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.key_results
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.projects
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.tasks
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.commitments
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.engagements
  for each row execute function public.handle_updated_at();

-- Auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Calculate Rock progress from Projects
create or replace function public.calculate_rock_progress(rock_uuid uuid)
returns integer as $$
declare
  total_projects integer;
  done_projects integer;
  rock_override integer;
begin
  select progress_override into rock_override from public.rocks where id = rock_uuid;
  if rock_override is not null then
    return rock_override;
  end if;

  select count(*) into total_projects from public.projects where rock_id = rock_uuid and deleted_at is null;
  if total_projects = 0 then
    return 0;
  end if;

  select count(*) into done_projects from public.projects where rock_id = rock_uuid and status = 'Done' and deleted_at is null;
  return round((done_projects::numeric / total_projects::numeric) * 100);
end;
$$ language plpgsql;

-- Get OEM buying patterns (pairs that appear together)
create or replace function public.get_oem_buying_patterns(limit_count integer default 10)
returns table (
  oem1_name text,
  oem2_name text,
  pair_count bigint
) as $$
begin
  return query
  select
    o1.name as oem1_name,
    o2.name as oem2_name,
    count(*) as pair_count
  from public.engagement_oems eo1
  join public.engagement_oems eo2 on eo1.engagement_id = eo2.engagement_id and eo1.oem_id < eo2.oem_id
  join public.oems o1 on eo1.oem_id = o1.id
  join public.oems o2 on eo2.oem_id = o2.id
  group by o1.name, o2.name
  order by pair_count desc
  limit limit_count;
end;
$$ language plpgsql;

-- ============================================
-- 13. ENABLE RLS ON ALL TABLES
-- ============================================

alter table public.profiles enable row level security;
alter table public.orgs enable row level security;
alter table public.teams enable row level security;
alter table public.team_memberships enable row level security;
alter table public.org_admins enable row level security;
alter table public.domains enable row level security;
alter table public.oems enable row level security;
alter table public.activity_types enable row level security;
alter table public.customers enable row level security;
alter table public.rocks enable row level security;
alter table public.key_results enable row level security;
alter table public.projects enable row level security;
alter table public.milestones enable row level security;
alter table public.tasks enable row level security;
alter table public.commitments enable row level security;
alter table public.engagements enable row level security;
alter table public.assets enable row level security;
alter table public.enablement_events enable row level security;
alter table public.audit_log enable row level security;
alter table public.engagement_domains enable row level security;
alter table public.engagement_oems enable row level security;
alter table public.engagement_assets enable row level security;
alter table public.project_assets enable row level security;
alter table public.enablement_event_assets enable row level security;
