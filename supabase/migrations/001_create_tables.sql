-- ============================================
-- THE JAR - Database Schema
-- Strategic Operating System for TSAs
-- ============================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

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
-- 2. REFERENCE DATA
-- ============================================

-- Technology Domains (Cloud, Security, Network, etc.)
create table public.domains (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  color text default 'default', -- For UI badge styling
  created_at timestamptz default now()
);

-- OEMs / Vendors (Cisco, AWS, Palo Alto, etc.)
create table public.oems (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null,
  logo_url text,
  created_at timestamptz default now()
);

-- ============================================
-- 3. STRATEGY (The Mountain)
-- ============================================

-- Rocks: Quarterly Strategic Goals
create table public.rocks (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  owner_id uuid references public.profiles(id) on delete set null,
  quarter text not null default 'Q1 2026',
  status text not null default 'On Track' check (status in ('On Track', 'At Risk', 'Off Track', 'Done')),
  perfect_outcome text not null,
  worst_outcome text,
  progress_override integer check (progress_override >= 0 and progress_override <= 100),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Projects (Pebbles): Supporting projects under Rocks
create table public.projects (
  id uuid primary key default uuid_generate_v4(),
  rock_id uuid references public.rocks(id) on delete cascade not null,
  title text not null,
  owner_id uuid references public.profiles(id) on delete set null,
  start_date date,
  end_date date,
  status text not null default 'Active' check (status in ('Active', 'Done', 'Blocked')),
  estimated_hours integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Tasks (Sand): Small tasks under Projects
create table public.tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references public.projects(id) on delete cascade not null,
  title text not null,
  completed boolean default false,
  due_date date,
  priority text default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 4. INTELLIGENCE (The River)
-- ============================================

-- Engagements: Field activity logs
create table public.engagements (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete set null not null,
  customer_name text not null,
  date date not null default current_date,
  activity_type text not null check (activity_type in ('Workshop', 'Demo', 'POC', 'Advisory')),
  revenue_impact numeric(12,2) default 0,
  gp_impact numeric(12,2) default 0,
  notes text,
  -- The "Evidence" Link: connects engagement to a Rock
  rock_id uuid references public.rocks(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 5. JUNCTION TABLES (Many-to-Many)
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

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================

create index idx_rocks_owner on public.rocks(owner_id);
create index idx_rocks_quarter on public.rocks(quarter);
create index idx_rocks_status on public.rocks(status);

create index idx_projects_rock on public.projects(rock_id);
create index idx_projects_owner on public.projects(owner_id);
create index idx_projects_status on public.projects(status);

create index idx_tasks_project on public.tasks(project_id);
create index idx_tasks_completed on public.tasks(completed);

create index idx_engagements_user on public.engagements(user_id);
create index idx_engagements_date on public.engagements(date);
create index idx_engagements_rock on public.engagements(rock_id);
create index idx_engagements_customer on public.engagements(customer_name);

-- ============================================
-- 7. FUNCTIONS
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

create trigger set_updated_at before update on public.projects
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.tasks
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
  );
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
  -- Check for manual override first
  select progress_override into rock_override from public.rocks where id = rock_uuid;
  if rock_override is not null then
    return rock_override;
  end if;

  -- Calculate from projects
  select count(*) into total_projects from public.projects where rock_id = rock_uuid;
  if total_projects = 0 then
    return 0;
  end if;

  select count(*) into done_projects from public.projects where rock_id = rock_uuid and status = 'Done';
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
