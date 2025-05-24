-- Organizations policies
CREATE POLICY "Enable read access for all users" ON organizations
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Organization members policies  
CREATE POLICY "Enable read for own memberships" ON organization_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for own memberships" ON organization_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Enable read access for all users" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Enable update for users based on id" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Services policies (public read)
CREATE POLICY "Enable read access for all users" ON services
  FOR SELECT USING (true);

-- Incidents policies (public read)
CREATE POLICY "Enable read access for all users" ON incidents
  FOR SELECT USING (true);

-- Incident updates policies (public read)
CREATE POLICY "Enable read access for all users" ON incident_updates
  FOR SELECT USING (true);