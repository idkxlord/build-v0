/*
  # Fix Supabase permissions and RLS policies

  This migration resolves the "permission denied for schema public" errors by:
  
  1. Security Setup
     - Enable RLS on all tables if not already enabled
     - Grant necessary permissions to anon and authenticated roles
     - Create policies for anon role to read data (for development/testing)
     - Create policies for authenticated users with proper access control

  2. Tables Affected
     - `users` - Allow anon to read for user assignments, authenticated users can read all
     - `leads` - Allow anon to read for development, authenticated users with role-based access
     - `pipelines` - Allow anon to read, authenticated users with org-based access
     - `stages` - Allow anon to read, authenticated users with org-based access
     - `contacts` - Allow anon to read, authenticated users with lead-based access

  Note: The anon policies are permissive for development. In production, 
  consider removing anon access and requiring authentication.
*/

-- Grant basic permissions to anon role for reading data
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- Grant permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow anon read access to users" ON users;
DROP POLICY IF EXISTS "Allow anon read access to pipelines" ON pipelines;
DROP POLICY IF EXISTS "Allow anon read access to stages" ON stages;
DROP POLICY IF EXISTS "Allow anon read access to leads" ON leads;
DROP POLICY IF EXISTS "Allow anon read access to contacts" ON contacts;

DROP POLICY IF EXISTS "Authenticated users can read all users" ON users;
DROP POLICY IF EXISTS "Authenticated users can manage users in their org" ON users;
DROP POLICY IF EXISTS "Authenticated users can read pipelines in their org" ON pipelines;
DROP POLICY IF EXISTS "Authenticated users can manage pipelines in their org" ON pipelines;
DROP POLICY IF EXISTS "Authenticated users can read stages in their org" ON stages;
DROP POLICY IF EXISTS "Authenticated users can manage stages in their org" ON stages;
DROP POLICY IF EXISTS "Authenticated users can read leads based on role" ON leads;
DROP POLICY IF EXISTS "Authenticated users can manage leads based on role" ON leads;
DROP POLICY IF EXISTS "Authenticated users can read contacts in their org" ON contacts;
DROP POLICY IF EXISTS "Authenticated users can manage contacts in their org" ON contacts;

-- Users table policies
CREATE POLICY "Allow anon read access to users"
  ON users
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can manage users in their org"
  ON users
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'org_id' = org_id)
  WITH CHECK (auth.jwt() ->> 'org_id' = org_id);

-- Pipelines table policies
CREATE POLICY "Allow anon read access to pipelines"
  ON pipelines
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can read pipelines in their org"
  ON pipelines
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'org_id' = org_id);

CREATE POLICY "Authenticated users can manage pipelines in their org"
  ON pipelines
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'org_id' = org_id)
  WITH CHECK (auth.jwt() ->> 'org_id' = org_id);

-- Stages table policies
CREATE POLICY "Allow anon read access to stages"
  ON stages
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can read stages in their org"
  ON stages
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'org_id' = org_id);

CREATE POLICY "Authenticated users can manage stages in their org"
  ON stages
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'org_id' = org_id)
  WITH CHECK (auth.jwt() ->> 'org_id' = org_id);

-- Leads table policies
CREATE POLICY "Allow anon read access to leads"
  ON leads
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can read leads based on role"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    auth.jwt() ->> 'org_id' = org_id AND
    (
      auth.jwt() ->> 'role' IN ('Admin', 'Manager') OR
      (auth.jwt() ->> 'role' = 'Sales Rep' AND assigned_to::text = auth.uid()::text)
    )
  );

CREATE POLICY "Authenticated users can manage leads based on role"
  ON leads
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'org_id' = org_id AND
    (
      auth.jwt() ->> 'role' IN ('Admin', 'Manager') OR
      (auth.jwt() ->> 'role' = 'Sales Rep' AND assigned_to::text = auth.uid()::text)
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'org_id' = org_id AND
    (
      auth.jwt() ->> 'role' IN ('Admin', 'Manager') OR
      (auth.jwt() ->> 'role' = 'Sales Rep' AND assigned_to::text = auth.uid()::text)
    )
  );

-- Contacts table policies
CREATE POLICY "Allow anon read access to contacts"
  ON contacts
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can read contacts in their org"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'org_id' = org_id);

CREATE POLICY "Authenticated users can manage contacts in their org"
  ON contacts
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'org_id' = org_id)
  WITH CHECK (auth.jwt() ->> 'org_id' = org_id);

-- Grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;