/*
  # Update contacts table with proper structure and policies

  1. Table Updates
    - Ensure all required columns exist with correct types
    - Add proper constraints and indexes
    - Update RLS policies

  2. Security
    - Enable RLS with proper policies
    - Add role-based access control
    - Add triggers for updated_at

  3. Sample Data
    - Insert sample contacts for testing
*/

-- Enable RLS if not already enabled
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view contacts for their leads" ON contacts;
DROP POLICY IF EXISTS "Users can insert contacts for their leads" ON contacts;
DROP POLICY IF EXISTS "Users can update contacts for their leads" ON contacts;
DROP POLICY IF EXISTS "Users can delete contacts for their leads" ON contacts;

-- Create comprehensive RLS policies for contacts
CREATE POLICY "Users can view contacts for accessible leads"
  ON contacts
  FOR SELECT
  TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE
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
    )
  );

CREATE POLICY "Users can insert contacts for accessible leads"
  ON contacts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    lead_id IN (
      SELECT id FROM leads WHERE
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
    )
  );

CREATE POLICY "Users can update contacts for accessible leads"
  ON contacts
  FOR UPDATE
  TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE
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
    )
  );

CREATE POLICY "Users can delete contacts for accessible leads"
  ON contacts
  FOR DELETE
  TO authenticated
  USING (
    lead_id IN (
      SELECT id FROM leads WHERE
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
    )
  );

-- Create trigger for contacts table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contacts_modtime'
  ) THEN
    CREATE TRIGGER update_contacts_modtime 
      BEFORE UPDATE ON contacts 
      FOR EACH ROW 
      EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_lead_id ON contacts(lead_id);

-- Insert sample contacts
INSERT INTO contacts (id, lead_id, name, email, phone, designation, notes, created_by) VALUES
  (
    'contact-1',
    'lead-1',
    'Mohammed Yousuf',
    'yousuf@example.com',
    '+911234567890',
    'Business Owner',
    'Primary decision maker',
    'f9b2e5c7-7f1d-4c6c-c795-2cb98e10b2d3'
  ),
  (
    'contact-2',
    'lead-2',
    'Aarav Sinha',
    'aarav@client.com',
    '+911234560987',
    'IT Manager',
    'Technical evaluator',
    'e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2'
  ),
  (
    'contact-3',
    'lead-2',
    'Rohit Kumar',
    'rohit@client.com',
    '+911234560988',
    'CTO',
    'Final approver for technical decisions',
    'e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2'
  )
ON CONFLICT (id) DO NOTHING;