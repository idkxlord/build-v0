/*
  # Fix RLS policies for application access

  This migration creates RLS policies to allow the application to access data using the anonymous key.
  
  ## Changes Made
  1. Create policies for `users` table to allow SELECT operations
  2. Create policies for `pipelines` table to allow SELECT operations  
  3. Create policies for `stages` table to allow SELECT operations
  4. Create policies for `leads` table to allow SELECT, INSERT, UPDATE, DELETE operations
  5. Create policies for `contacts` table to allow SELECT, INSERT, UPDATE, DELETE operations

  ## Security Notes
  - These policies allow anonymous access for development/demo purposes
  - In production, these should be restricted based on authentication and organization membership
*/

-- Enable RLS on all tables (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow anonymous read access to users" ON users;
DROP POLICY IF EXISTS "Allow anonymous read access to pipelines" ON pipelines;
DROP POLICY IF EXISTS "Allow anonymous read access to stages" ON stages;
DROP POLICY IF EXISTS "Allow anonymous full access to leads" ON leads;
DROP POLICY IF EXISTS "Allow anonymous full access to contacts" ON contacts;

-- Users table policies
CREATE POLICY "Allow anonymous read access to users"
  ON users
  FOR SELECT
  TO anon
  USING (true);

-- Pipelines table policies
CREATE POLICY "Allow anonymous read access to pipelines"
  ON pipelines
  FOR SELECT
  TO anon
  USING (true);

-- Stages table policies
CREATE POLICY "Allow anonymous read access to stages"
  ON stages
  FOR SELECT
  TO anon
  USING (true);

-- Leads table policies (full CRUD access for demo purposes)
CREATE POLICY "Allow anonymous full access to leads"
  ON leads
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Contacts table policies (full CRUD access for demo purposes)
CREATE POLICY "Allow anonymous full access to contacts"
  ON contacts
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);