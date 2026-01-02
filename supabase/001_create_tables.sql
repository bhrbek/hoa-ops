-- =============================================
-- THE JAR - Database Schema
-- Version: 1.0 (Signal & Swarm Release)
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  capacity_hours INTEGER DEFAULT 40 NOT NULL,
  timezone TEXT DEFAULT 'America/New_York' NOT NULL,
  role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('admin', 'user')),
  notification_enabled BOOLEAN DEFAULT false NOT NULL,
  notification_time TEXT DEFAULT '09:00' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger to auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 2. DOMAINS TABLE (lookup)
-- =============================================
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  color TEXT,
  active BOOLEAN DEFAULT true NOT NULL
);

-- Seed default domains
INSERT INTO domains (name, color, active) VALUES
  ('Wi-Fi', '#3b82f6', true),
  ('SD-WAN', '#8b5cf6', true),
  ('Security', '#ef4444', true),
  ('Switching', '#22c55e', true),
  ('Cloud', '#06b6d4', true),
  ('Data Center', '#f59e0b', true),
  ('Collaboration', '#ec4899', true),
  ('IoT', '#84cc16', true),
  ('Logistics & Supply Chain', '#f97316', true)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 3. OEMS TABLE (lookup)
-- =============================================
CREATE TABLE IF NOT EXISTS oems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  active BOOLEAN DEFAULT true NOT NULL
);

-- Seed default OEMs
INSERT INTO oems (name, active) VALUES
  ('Cisco', true),
  ('Aruba', true),
  ('Juniper', true),
  ('Palo Alto', true),
  ('Fortinet', true),
  ('Meraki', true),
  ('Arista', true)
ON CONFLICT (name) DO NOTHING;

-- =============================================
-- 4. ENGAGEMENTS TABLE (The Sensor Log)
-- =============================================
CREATE TABLE IF NOT EXISTS engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  internal_req_id TEXT,
  domains TEXT[] DEFAULT '{}' NOT NULL,
  oems TEXT[] DEFAULT '{}' NOT NULL,
  themes TEXT[] DEFAULT '{}' NOT NULL,
  is_strategic_signal BOOLEAN DEFAULT false NOT NULL,
  signal_context TEXT,
  estimated_effort NUMERIC DEFAULT 0 NOT NULL,
  priority TEXT DEFAULT 'Medium' NOT NULL CHECK (priority IN ('High', 'Medium', 'Low')),
  status TEXT DEFAULT 'Lead' NOT NULL CHECK (status IN ('Lead', 'Active', 'Closed', 'Archived')),
  revenue_amt NUMERIC DEFAULT 0 NOT NULL,
  next_steps TEXT,
  notes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_engagements_user_id ON engagements(user_id);
CREATE INDEX IF NOT EXISTS idx_engagements_status ON engagements(status);
CREATE INDEX IF NOT EXISTS idx_engagements_signal ON engagements(is_strategic_signal);
CREATE INDEX IF NOT EXISTS idx_engagements_created ON engagements(created_at);

-- =============================================
-- 5. ROCKS TABLE (Strategic Goals)
-- =============================================
CREATE TABLE IF NOT EXISTS rocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  perfect_outcome TEXT NOT NULL,
  worst_outcome TEXT NOT NULL,
  status TEXT DEFAULT 'Active' NOT NULL CHECK (status IN ('Active', 'Completed', 'Shelved')),
  progress INTEGER DEFAULT 0 NOT NULL CHECK (progress >= 0 AND progress <= 100),
  swarm_day TEXT CHECK (swarm_day IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', NULL)),
  start_date DATE,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_rocks_owner ON rocks(owner_id);
CREATE INDEX IF NOT EXISTS idx_rocks_status ON rocks(status);

-- =============================================
-- 6. SWARMS TABLE (The Beacon)
-- =============================================
CREATE TABLE IF NOT EXISTS swarms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rock_id UUID NOT NULL REFERENCES rocks(id) ON DELETE CASCADE,
  swarm_date DATE NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_swarms_date ON swarms(swarm_date);
CREATE INDEX IF NOT EXISTS idx_swarms_active ON swarms(active);
CREATE INDEX IF NOT EXISTS idx_swarms_rock ON swarms(rock_id);

-- =============================================
-- 7. COMMITMENTS TABLE (The Board Blocks)
-- =============================================
CREATE TABLE IF NOT EXISTS commitments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Rock', 'Pebble', 'Sand')),
  description TEXT NOT NULL,
  hours_value NUMERIC DEFAULT 0 NOT NULL,
  rock_id UUID REFERENCES rocks(id) ON DELETE SET NULL,
  engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL,
  completed BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_commitments_user ON commitments(user_id);
CREATE INDEX IF NOT EXISTS idx_commitments_date ON commitments(date);
CREATE INDEX IF NOT EXISTS idx_commitments_type ON commitments(type);

-- =============================================
-- 8. AUTO-UPDATE TIMESTAMPS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_timestamp
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_engagements_timestamp
  BEFORE UPDATE ON engagements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_rocks_timestamp
  BEFORE UPDATE ON rocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_commitments_timestamp
  BEFORE UPDATE ON commitments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
