/*
  # Update leads table with proper structure and policies

  1. Table Updates
    - Ensure all required columns exist with correct types
    - Add proper constraints and indexes
    - Update RLS policies

  2. Security
    - Enable RLS with proper policies
    - Add role-based access control
    - Add triggers for updated_at

  3. Sample Data
    - Insert sample leads for testing
*/

-- Ensure leads table has all required columns
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE leads ADD COLUMN custom_fields jsonb DEFAULT '{}';
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can only see their org's leads" ON leads;
DROP POLICY IF EXISTS "Users can insert leads for their org" ON leads;
DROP POLICY IF EXISTS "Users can update their assigned leads" ON leads;
DROP POLICY IF EXISTS "Users can delete their assigned leads" ON leads;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view org leads based on role"
  ON leads
  FOR SELECT
  TO authenticated
  USING (
    CASE 
      WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'Admin' THEN
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
      WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'Manager' THEN
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
      WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'Sales Rep' THEN
        org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND 
        assigned_to = auth.uid()
      ELSE false
    END
  );

CREATE POLICY "Users can insert leads for their org"
  ON leads
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
    assigned_to IN (SELECT id FROM users WHERE org_id = (SELECT org_id FROM users WHERE id = auth.uid()))
  );

CREATE POLICY "Users can update leads based on role"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (
    CASE 
      WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'Admin' THEN
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
      WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'Manager' THEN
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
      WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'Sales Rep' THEN
        org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND 
        assigned_to = auth.uid()
      ELSE false
    END
  );

CREATE POLICY "Users can delete leads based on role"
  ON leads
  FOR DELETE
  TO authenticated
  USING (
    CASE 
      WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'Admin' THEN
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
      WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'Manager' THEN
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
      WHEN (SELECT role FROM users WHERE id = auth.uid()) = 'Sales Rep' THEN
        org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND 
        assigned_to = auth.uid()
      ELSE false
    END
  );

-- Create trigger for leads table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_leads_modtime'
  ) THEN
    CREATE TRIGGER update_leads_modtime 
      BEFORE UPDATE ON leads 
      FOR EACH ROW 
      EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads(org_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Insert sample leads
INSERT INTO leads (id, name, email, phone, status, stage_id, pipeline_id, assigned_to, org_id, custom_fields) VALUES
  (
    'lead-1',
    'Mohammed Yousuf',
    'yousuf@example.com',
    '+911234567890',
    'New',
    'g9j1l3i2-2m6k-4j1j-j2g0-9hg43l65g7i8',
    'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6',
    'f9b2e5c7-7f1d-4c6c-c795-2cb98e10b2d3',
    'org-1',
    '{"industry": "Retail", "source": "LinkedIn", "budget": "$50,000"}'::jsonb
  ),
  (
    'lead-2',
    'Aarav Sinha',
    'aarav@client.com',
    '+911234560987',
    'Qualified',
    'h0k2m4j3-3n7l-4k2k-k3h1-0ih54m76h8j9',
    'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6',
    'e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2',
    'org-1',
    '{"industry": "Technology", "source": "Website", "budget": "$75,000"}'::jsonb
  ),
  (
    'lead-3',
    'Priya Sharma',
    'priya@business.com',
    '+911234567123',
    'Contacted',
    'h0k2m4j3-3n7l-4k2k-k3h1-0ih54m76h8j9',
    'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6',
    'a3c4f6d8-8g2e-4d7d-d8a6-3dc09f21c3e4',
    'org-1',
    '{"industry": "Healthcare", "source": "Referral", "budget": "$100,000"}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;