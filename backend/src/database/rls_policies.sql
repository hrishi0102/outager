-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_services ENABLE ROW LEVEL SECURITY;

-- Profiles policies (users can read all profiles, update their own)
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Organizations policies (members can view their org)
CREATE POLICY "Organization members can view their organization" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_members.organization_id = organizations.id
      AND organization_members.user_id = auth.uid()
    )
  );

-- Public access for status pages (anyone can view services and incidents by org slug)
CREATE POLICY "Public can view services by org slug" ON services
  FOR SELECT USING (true);

CREATE POLICY "Public can view incidents" ON incidents
  FOR SELECT USING (true);

CREATE POLICY "Public can view incident updates" ON incident_updates
  FOR SELECT USING (true);