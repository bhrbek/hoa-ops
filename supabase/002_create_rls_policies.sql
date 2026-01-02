-- =============================================
-- THE JAR - Row Level Security Policies
-- Version: 1.0
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE oems ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE rocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE swarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE commitments ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PROFILES POLICIES
-- =============================================

-- Users can read all profiles (for team views)
CREATE POLICY "Profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =============================================
-- DOMAINS & OEMS POLICIES (Read-only for all)
-- =============================================

CREATE POLICY "Domains are viewable by all authenticated users"
  ON domains FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "OEMs are viewable by all authenticated users"
  ON oems FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage domains/oems
CREATE POLICY "Admins can manage domains"
  ON domains FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage oems"
  ON oems FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- =============================================
-- ENGAGEMENTS POLICIES
-- =============================================

-- Users can view all engagements (for reporting/signals)
CREATE POLICY "Engagements are viewable by authenticated users"
  ON engagements FOR SELECT
  TO authenticated
  USING (true);

-- Users can create their own engagements
CREATE POLICY "Users can create their own engagements"
  ON engagements FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own engagements
CREATE POLICY "Users can update their own engagements"
  ON engagements FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own engagements
CREATE POLICY "Users can delete their own engagements"
  ON engagements FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- ROCKS POLICIES
-- =============================================

-- Everyone can view rocks (for team alignment)
CREATE POLICY "Rocks are viewable by authenticated users"
  ON rocks FOR SELECT
  TO authenticated
  USING (true);

-- Users can create rocks (assigned to themselves)
CREATE POLICY "Users can create rocks"
  ON rocks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Rock owners can update their rocks
CREATE POLICY "Rock owners can update their rocks"
  ON rocks FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Admins can update any rock
CREATE POLICY "Admins can update any rock"
  ON rocks FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Rock owners can delete their rocks
CREATE POLICY "Rock owners can delete their rocks"
  ON rocks FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- =============================================
-- SWARMS POLICIES
-- =============================================

-- Everyone can view swarms
CREATE POLICY "Swarms are viewable by authenticated users"
  ON swarms FOR SELECT
  TO authenticated
  USING (true);

-- Admins can manage swarms (light/extinguish beacons)
CREATE POLICY "Admins can manage swarms"
  ON swarms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Rock owners can create swarms for their rocks
CREATE POLICY "Rock owners can create swarms"
  ON swarms FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM rocks
      WHERE rocks.id = rock_id AND rocks.owner_id = auth.uid()
    )
  );

-- =============================================
-- COMMITMENTS POLICIES
-- =============================================

-- Users can view all commitments (for the board)
CREATE POLICY "Commitments are viewable by authenticated users"
  ON commitments FOR SELECT
  TO authenticated
  USING (true);

-- Users can create their own commitments
CREATE POLICY "Users can create their own commitments"
  ON commitments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own commitments
CREATE POLICY "Users can update their own commitments"
  ON commitments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own commitments
CREATE POLICY "Users can delete their own commitments"
  ON commitments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- ENABLE REALTIME
-- =============================================

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE commitments;
ALTER PUBLICATION supabase_realtime ADD TABLE engagements;
ALTER PUBLICATION supabase_realtime ADD TABLE rocks;
ALTER PUBLICATION supabase_realtime ADD TABLE swarms;
