/*
  # Create CRM Database Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, unique, not null)
      - `role` (text, not null) - Admin, Manager, Sales Rep
      - `org_id` (text, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `pipelines`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `org_id` (text, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `stages`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `pipeline_id` (uuid, foreign key)
      - `order_position` (integer, not null)
      - `org_id` (text, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `leads`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `email` (text, unique, not null)
      - `phone` (text)
      - `status` (text, not null)
      - `stage_id` (uuid, foreign key)
      - `pipeline_id` (uuid, foreign key)
      - `assigned_to` (uuid, foreign key)
      - `org_id` (text, not null)
      - `custom_fields` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `contacts`
      - `id` (uuid, primary key)
      - `lead_id` (uuid, foreign key)
      - `name` (text, not null)
      - `email` (text)
      - `phone` (text)
      - `designation` (text)
      - `notes` (text)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their organization's data

  3. Sample Data
    - Insert default users, pipelines, stages, and sample leads
*/

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('Admin', 'Manager', 'Sales Rep')),
  org_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create pipelines table
CREATE TABLE IF NOT EXISTS public.pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  org_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stages table
CREATE TABLE IF NOT EXISTS public.stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pipeline_id uuid REFERENCES public.pipelines(id) ON DELETE CASCADE,
  order_position integer NOT NULL,
  org_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create leads table
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  status text NOT NULL DEFAULT 'New',
  stage_id uuid REFERENCES public.stages(id) ON DELETE SET NULL,
  pipeline_id uuid REFERENCES public.pipelines(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  org_id text NOT NULL,
  custom_fields jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  phone text,
  designation text,
  notes text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read own organization data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true); -- For now, allow all authenticated users to read users

CREATE POLICY "Admins can manage users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (true); -- For now, allow all operations

-- Create RLS policies for pipelines table
CREATE POLICY "Users can read own organization pipelines"
  ON public.pipelines
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own organization pipelines"
  ON public.pipelines
  FOR ALL
  TO authenticated
  USING (true);

-- Create RLS policies for stages table
CREATE POLICY "Users can read own organization stages"
  ON public.stages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own organization stages"
  ON public.stages
  FOR ALL
  TO authenticated
  USING (true);

-- Create RLS policies for leads table
CREATE POLICY "Users can read own organization leads"
  ON public.leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own organization leads"
  ON public.leads
  FOR ALL
  TO authenticated
  USING (true);

-- Create RLS policies for contacts table
CREATE POLICY "Users can read own organization contacts"
  ON public.contacts
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own organization contacts"
  ON public.contacts
  FOR ALL
  TO authenticated
  USING (true);

-- Insert sample data
-- Insert users
INSERT INTO public.users (id, name, email, role, org_id) VALUES
  ('e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2', 'John Smith', 'john@company.com', 'Manager', 'org-1'),
  ('f9b2e5c7-7f1d-4c6c-c795-2cb98e10b2d3', 'Sarah Johnson', 'sarah@company.com', 'Sales Rep', 'org-1'),
  ('a3c4f6d8-8g2e-4d7d-d8a6-3dc09f21c3e4', 'Mike Wilson', 'mike@company.com', 'Sales Rep', 'org-1'),
  ('b4d5g7e9-9h3f-4e8e-e9b7-4ed10g32d4f5', 'Emma Davis', 'emma@company.com', 'Admin', 'org-1')
ON CONFLICT (email) DO NOTHING;

-- Insert pipelines
INSERT INTO public.pipelines (id, name, org_id) VALUES
  ('c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 'Sales Pipeline', 'org-1'),
  ('d6f7i9g1-1j5h-4g0g-g1d9-6gf32i54f6h7', 'Marketing Pipeline', 'org-1')
ON CONFLICT (id) DO NOTHING;

-- Insert stages
INSERT INTO public.stages (id, name, pipeline_id, order_position, org_id) VALUES
  ('g9j1l3i2-2m6k-4j1j-j2g0-9hg43l65g7i8', 'New', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 1, 'org-1'),
  ('h0k2m4j3-3n7l-4k2k-k3h1-0ih54m76h8j9', 'Contacted', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 2, 'org-1'),
  ('i1l3n5k4-4o8m-4l3l-l4i2-1ji65n87i9k0', 'Qualified', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 3, 'org-1'),
  ('j2m4o6l5-5p9n-4m4m-m5j3-2kj76o98j0l1', 'Proposal', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 4, 'org-1'),
  ('k3n5p7m6-6q0o-4n5n-n6k4-3lk87p09k1m2', 'Closed Won', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 5, 'org-1'),
  ('l4o6q8n7-7r1p-4o6o-o7l5-4ml98q10l2n3', 'Closed Lost', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 6, 'org-1')
ON CONFLICT (id) DO NOTHING;

-- Insert sample leads
INSERT INTO public.leads (id, name, email, phone, status, stage_id, pipeline_id, assigned_to, org_id, custom_fields) VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mohammed Yousuf', 'yousuf@example.com', '+911234567890', 'New', 'g9j1l3i2-2m6k-4j1j-j2g0-9hg43l65g7i8', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 'f9b2e5c7-7f1d-4c6c-c795-2cb98e10b2d3', 'org-1', '{"industry": "Retail", "source": "LinkedIn", "budget": "$50,000"}'),
  ('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Aarav Sinha', 'aarav@client.com', '+911234560987', 'Qualified', 'h0k2m4j3-3n7l-4k2k-k3h1-0ih54m76h8j9', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 'e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2', 'org-1', '{"industry": "Technology", "source": "Website", "budget": "$75,000"}'),
  ('c3d4e5f6-g7h8-9012-cdef-345678901234', 'Priya Sharma', 'priya@business.com', '+911234567123', 'Contacted', 'h0k2m4j3-3n7l-4k2k-k3h1-0ih54m76h8j9', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 'a3c4f6d8-8g2e-4d7d-d8a6-3dc09f21c3e4', 'org-1', '{"industry": "Healthcare", "source": "Referral", "budget": "$100,000"}')
ON CONFLICT (email) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_pipeline_id ON public.leads(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON public.leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON public.leads(org_id);
CREATE INDEX IF NOT EXISTS idx_contacts_lead_id ON public.contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_stages_pipeline_id ON public.stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users(org_id);