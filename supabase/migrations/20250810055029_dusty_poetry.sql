/*
  # Create users table with proper structure

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, unique, not null)
      - `role` (text, check constraint for valid roles)
      - `org_id` (text, not null)
      - `last_login` (timestamptz, nullable)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `deleted_at` (timestamptz, nullable for soft delete)

  2. Security
    - Enable RLS on `users` table
    - Add policy for users to read their org's users
    - Add trigger for updated_at timestamp

  3. Seed Data
    - Insert sample users for testing
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('Admin', 'Manager', 'Sales Rep')),
  org_id text NOT NULL,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to see their org's users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can only see their org users'
  ) THEN
    CREATE POLICY "Users can only see their org users"
      ON users
      FOR SELECT
      TO authenticated
      USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_modtime'
  ) THEN
    CREATE TRIGGER update_users_modtime 
      BEFORE UPDATE ON users 
      FOR EACH ROW 
      EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Insert sample users if they don't exist
INSERT INTO users (id, name, email, role, org_id) VALUES
  ('e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2', 'John Smith', 'john.smith@company.com', 'Manager', 'org-1'),
  ('f9b2e5c7-7f1d-4c6c-c795-2cb98e10b2d3', 'Sarah Johnson', 'sarah.johnson@company.com', 'Sales Rep', 'org-1'),
  ('a3c4f6d8-8g2e-4d7d-d8a6-3dc09f21c3e4', 'Mike Wilson', 'mike.wilson@company.com', 'Sales Rep', 'org-1'),
  ('b4d5g7e9-9h3f-4e8e-e9b7-4ed10g32d4f5', 'Emma Davis', 'emma.davis@company.com', 'Admin', 'org-1')
ON CONFLICT (id) DO NOTHING;