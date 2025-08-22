/*
  # Complete CRM Database Schema Setup

  This migration creates the complete database schema for the CRM application including:
  1. Drop existing tables and functions
  2. Create helper functions for triggers
  3. Create all tables with proper relationships
  4. Set up Row Level Security (RLS)
  5. Create policies for data access
  6. Insert sample data for testing

  ## Tables Created:
  - `users` - Application users with roles
  - `pipelines` - Sales pipelines per organization
  - `stages` - Pipeline stages with ordering
  - `leads` - Lead records with custom fields
  - `contacts` - Contact records linked to leads

  ## Security:
  - RLS enabled on all tables
  - Policies for role-based access control
  - Triggers for data validation and timestamps
*/

-- Drop existing tables in correct order (respecting foreign key constraints)
DROP TABLE IF EXISTS contacts CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS stages CASCADE;
DROP TABLE IF EXISTS pipelines CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_modified_column() CASCADE;
DROP FUNCTION IF EXISTS prevent_update_deleted() CASCADE;
DROP FUNCTION IF EXISTS validate_org_id() CASCADE;

-- Create helper functions for triggers
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION prevent_update_deleted()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.deleted_at IS NOT NULL THEN
        RAISE EXCEPTION 'Cannot update deleted record';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION validate_org_id()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate that org_id is not empty
    IF NEW.org_id IS NULL OR trim(NEW.org_id) = '' THEN
        RAISE EXCEPTION 'org_id cannot be null or empty';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    role text NOT NULL,
    org_id text NOT NULL,
    last_login timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    
    -- Constraints
    CONSTRAINT valid_name CHECK (length(trim(name)) > 0),
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT users_role_check CHECK (role = ANY (ARRAY['Admin'::text, 'Manager'::text, 'Sales Rep'::text])),
    CONSTRAINT unique_email_per_org UNIQUE (email, org_id)
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users USING btree (org_id);

-- Create triggers for users
CREATE TRIGGER update_users_modtime
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER prevent_users_update_when_deleted
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION prevent_update_deleted();

-- Create pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    org_id text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    
    -- Constraints
    CONSTRAINT valid_pipeline_name CHECK (length(trim(name)) > 0),
    CONSTRAINT unique_pipeline_name_per_org UNIQUE (name, org_id)
);

-- Create indexes for pipelines
CREATE INDEX IF NOT EXISTS idx_pipelines_org_id ON pipelines USING btree (org_id);

-- Create triggers for pipelines
CREATE TRIGGER update_pipelines_modtime
    BEFORE UPDATE ON pipelines
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER prevent_pipelines_update_when_deleted
    BEFORE UPDATE ON pipelines
    FOR EACH ROW
    EXECUTE FUNCTION prevent_update_deleted();

-- Create stages table
CREATE TABLE IF NOT EXISTS stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    pipeline_id uuid NOT NULL,
    order_position integer NOT NULL,
    org_id text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    
    -- Constraints
    CONSTRAINT valid_stage_name CHECK (length(trim(name)) > 0),
    CONSTRAINT valid_order CHECK (order_position > 0),
    CONSTRAINT unique_stage_name_per_pipeline UNIQUE (name, pipeline_id),
    
    -- Foreign keys
    CONSTRAINT stages_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES pipelines(id) ON DELETE CASCADE
);

-- Create indexes for stages
CREATE INDEX IF NOT EXISTS idx_stages_pipeline_id ON stages USING btree (pipeline_id);
CREATE INDEX IF NOT EXISTS idx_stages_org_id ON stages USING btree (org_id);

-- Create triggers for stages
CREATE TRIGGER update_stages_modtime
    BEFORE UPDATE ON stages
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER prevent_stages_update_when_deleted
    BEFORE UPDATE ON stages
    FOR EACH ROW
    EXECUTE FUNCTION prevent_update_deleted();

CREATE TRIGGER validate_stages_org_id
    BEFORE INSERT OR UPDATE ON stages
    FOR EACH ROW
    EXECUTE FUNCTION validate_org_id();

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    status text NOT NULL DEFAULT 'New',
    stage_id uuid NOT NULL,
    pipeline_id uuid NOT NULL,
    assigned_to uuid,
    org_id text NOT NULL,
    custom_fields jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    
    -- Constraints
    CONSTRAINT valid_lead_name CHECK (length(trim(name)) > 0),
    CONSTRAINT valid_lead_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT leads_status_check CHECK (status = ANY (ARRAY['New'::text, 'Contacted'::text, 'Qualified'::text, 'Lost'::text, 'Won'::text])),
    CONSTRAINT unique_lead_email_per_org UNIQUE (email, org_id),
    
    -- Foreign keys
    CONSTRAINT leads_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES stages(id),
    CONSTRAINT leads_pipeline_id_fkey FOREIGN KEY (pipeline_id) REFERENCES pipelines(id),
    CONSTRAINT leads_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Create indexes for leads
CREATE INDEX IF NOT EXISTS idx_leads_org_id ON leads USING btree (org_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads USING btree (status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads USING btree (assigned_to);

-- Create triggers for leads
CREATE TRIGGER update_leads_modtime
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER prevent_leads_update_when_deleted
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION prevent_update_deleted();

CREATE TRIGGER validate_leads_org_id
    BEFORE INSERT OR UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION validate_org_id();

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id uuid NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    designation text,
    notes text,
    created_by uuid,
    org_id text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    deleted_at timestamptz,
    
    -- Constraints
    CONSTRAINT valid_contact_name CHECK (length(trim(name)) > 0),
    CONSTRAINT valid_contact_email CHECK ((email IS NULL) OR (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')),
    
    -- Foreign keys
    CONSTRAINT contacts_lead_id_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    CONSTRAINT contacts_created_by_fkey FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create indexes for contacts
CREATE INDEX IF NOT EXISTS idx_contacts_lead_id ON contacts USING btree (lead_id);
CREATE INDEX IF NOT EXISTS idx_contacts_org_id ON contacts USING btree (org_id);

-- Create triggers for contacts
CREATE TRIGGER update_contacts_modtime
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER prevent_contacts_update_when_deleted
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION prevent_update_deleted();

CREATE TRIGGER validate_contacts_org_id
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION validate_org_id();

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can read own organization data"
    ON users
    FOR SELECT
    TO authenticated
    USING (org_id = current_setting('app.current_org_id', true));

CREATE POLICY "Admins can manage all users in org"
    ON users
    FOR ALL
    TO authenticated
    USING (
        org_id = current_setting('app.current_org_id', true) AND
        current_setting('app.current_user_role', true) = 'Admin'
    );

CREATE POLICY "Managers can read all users in org"
    ON users
    FOR SELECT
    TO authenticated
    USING (
        org_id = current_setting('app.current_org_id', true) AND
        current_setting('app.current_user_role', true) IN ('Admin', 'Manager')
    );

-- Create RLS policies for pipelines table
CREATE POLICY "Users can read own organization pipelines"
    ON pipelines
    FOR SELECT
    TO authenticated
    USING (org_id = current_setting('app.current_org_id', true));

CREATE POLICY "Admins and Managers can manage pipelines"
    ON pipelines
    FOR ALL
    TO authenticated
    USING (
        org_id = current_setting('app.current_org_id', true) AND
        current_setting('app.current_user_role', true) IN ('Admin', 'Manager')
    );

-- Create RLS policies for stages table
CREATE POLICY "Users can read own organization stages"
    ON stages
    FOR SELECT
    TO authenticated
    USING (org_id = current_setting('app.current_org_id', true));

CREATE POLICY "Admins and Managers can manage stages"
    ON stages
    FOR ALL
    TO authenticated
    USING (
        org_id = current_setting('app.current_org_id', true) AND
        current_setting('app.current_user_role', true) IN ('Admin', 'Manager')
    );

-- Create RLS policies for leads table
CREATE POLICY "Users can read own organization leads"
    ON leads
    FOR SELECT
    TO authenticated
    USING (
        org_id = current_setting('app.current_org_id', true) AND
        (
            current_setting('app.current_user_role', true) IN ('Admin', 'Manager') OR
            assigned_to::text = current_setting('app.current_user_id', true)
        )
    );

CREATE POLICY "Users can create leads in own organization"
    ON leads
    FOR INSERT
    TO authenticated
    WITH CHECK (org_id = current_setting('app.current_org_id', true));

CREATE POLICY "Users can update own leads or admins/managers can update all"
    ON leads
    FOR UPDATE
    TO authenticated
    USING (
        org_id = current_setting('app.current_org_id', true) AND
        (
            current_setting('app.current_user_role', true) IN ('Admin', 'Manager') OR
            assigned_to::text = current_setting('app.current_user_id', true)
        )
    );

CREATE POLICY "Admins and assigned users can delete leads"
    ON leads
    FOR DELETE
    TO authenticated
    USING (
        org_id = current_setting('app.current_org_id', true) AND
        (
            current_setting('app.current_user_role', true) = 'Admin' OR
            assigned_to::text = current_setting('app.current_user_id', true)
        )
    );

-- Create RLS policies for contacts table
CREATE POLICY "Users can read contacts for accessible leads"
    ON contacts
    FOR SELECT
    TO authenticated
    USING (
        org_id = current_setting('app.current_org_id', true) AND
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = contacts.lead_id 
            AND (
                current_setting('app.current_user_role', true) IN ('Admin', 'Manager') OR
                leads.assigned_to::text = current_setting('app.current_user_id', true)
            )
        )
    );

CREATE POLICY "Users can create contacts for accessible leads"
    ON contacts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        org_id = current_setting('app.current_org_id', true) AND
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = contacts.lead_id 
            AND (
                current_setting('app.current_user_role', true) IN ('Admin', 'Manager') OR
                leads.assigned_to::text = current_setting('app.current_user_id', true)
            )
        )
    );

CREATE POLICY "Users can update contacts for accessible leads"
    ON contacts
    FOR UPDATE
    TO authenticated
    USING (
        org_id = current_setting('app.current_org_id', true) AND
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = contacts.lead_id 
            AND (
                current_setting('app.current_user_role', true) IN ('Admin', 'Manager') OR
                leads.assigned_to::text = current_setting('app.current_user_id', true)
            )
        )
    );

CREATE POLICY "Users can delete contacts for accessible leads"
    ON contacts
    FOR DELETE
    TO authenticated
    USING (
        org_id = current_setting('app.current_org_id', true) AND
        EXISTS (
            SELECT 1 FROM leads 
            WHERE leads.id = contacts.lead_id 
            AND (
                current_setting('app.current_user_role', true) IN ('Admin', 'Manager') OR
                leads.assigned_to::text = current_setting('app.current_user_id', true)
            )
        )
    );

-- Insert sample data for testing
-- Insert sample users
INSERT INTO users (id, name, email, role, org_id) VALUES
    ('e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2', 'John Smith', 'john.smith@company.com', 'Manager', 'org-1'),
    ('f9b2e5c7-7f1d-4c6c-c795-2cb98e10b2d3', 'Sarah Johnson', 'sarah.johnson@company.com', 'Sales Rep', 'org-1'),
    ('a3c4f6d8-8g2e-4d7d-d8a6-3dc09f21c3e4', 'Mike Wilson', 'mike.wilson@company.com', 'Sales Rep', 'org-1'),
    ('b4d5g7e9-9h3f-4e8e-e9b7-4ed10g32d4f5', 'Emma Davis', 'emma.davis@company.com', 'Admin', 'org-1')
ON CONFLICT (email, org_id) DO NOTHING;

-- Insert sample pipelines
INSERT INTO pipelines (id, name, org_id) VALUES
    ('c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 'Sales Pipeline', 'org-1'),
    ('d6f7i9g1-1j5h-4g0g-g1d9-6gf32i54f6h7', 'Marketing Pipeline', 'org-1')
ON CONFLICT (name, org_id) DO NOTHING;

-- Insert sample stages
INSERT INTO stages (id, name, pipeline_id, order_position, org_id) VALUES
    ('g9j1l3i2-2m6k-4j1j-j2g0-9hg43l65g7i8', 'New', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 1, 'org-1'),
    ('h0k2m4j3-3n7l-4k2k-k3h1-0ih54m76h8j9', 'Contacted', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 2, 'org-1'),
    ('i1l3n5k4-4o8m-4l3l-l4i2-1ji65n87i9k0', 'Qualified', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 3, 'org-1'),
    ('j2m4o6l5-5p9n-4m4m-m5j3-2kj76o98j0l1', 'Proposal', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 4, 'org-1'),
    ('k3n5p7m6-6q0o-4n5n-n6k4-3lk87p09k1m2', 'Closed Won', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 5, 'org-1'),
    ('l4o6q8n7-7r1p-4o6o-o7l5-4ml98q10l2n3', 'Closed Lost', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 6, 'org-1'),
    -- Marketing pipeline stages
    ('m5p7r9o8-8s2q-4p7p-p8m6-5nm09r21m3o4', 'Lead', 'd6f7i9g1-1j5h-4g0g-g1d9-6gf32i54f6h7', 1, 'org-1'),
    ('n6q8s0p9-9t3r-4q8q-q9n7-6on10s32n4p5', 'MQL', 'd6f7i9g1-1j5h-4g0g-g1d9-6gf32i54f6h7', 2, 'org-1'),
    ('o7r9t1q0-0u4s-4r9r-r0o8-7po21t43o5q6', 'SQL', 'd6f7i9g1-1j5h-4g0g-g1d9-6gf32i54f6h7', 3, 'org-1')
ON CONFLICT (name, pipeline_id) DO NOTHING;

-- Insert sample leads
INSERT INTO leads (id, name, email, phone, status, stage_id, pipeline_id, assigned_to, org_id, custom_fields) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mohammed Yousuf', 'yousuf@example.com', '+911234567890', 'New', 'g9j1l3i2-2m6k-4j1j-j2g0-9hg43l65g7i8', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 'f9b2e5c7-7f1d-4c6c-c795-2cb98e10b2d3', 'org-1', '{"industry": "Retail", "source": "LinkedIn", "budget": "$50,000"}'),
    ('b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Aarav Sinha', 'aarav@client.com', '+911234560987', 'Qualified', 'i1l3n5k4-4o8m-4l3l-l4i2-1ji65n87i9k0', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 'e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2', 'org-1', '{"industry": "Technology", "source": "Website", "budget": "$75,000"}'),
    ('c3d4e5f6-g7h8-9012-cdef-345678901234', 'Priya Sharma', 'priya@business.com', '+911234567123', 'Contacted', 'h0k2m4j3-3n7l-4k2k-k3h1-0ih54m76h8j9', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 'a3c4f6d8-8g2e-4d7d-d8a6-3dc09f21c3e4', 'org-1', '{"industry": "Healthcare", "source": "Referral", "budget": "$100,000"}')
ON CONFLICT (email, org_id) DO NOTHING;

-- Insert sample contacts
INSERT INTO contacts (id, lead_id, name, email, phone, designation, notes, created_by, org_id) VALUES
    ('x1y2z3a4-b5c6-7890-wxyz-ab1234567890', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Mohammed Yousuf', 'yousuf@example.com', '+911234567890', 'Business Owner', 'Primary decision maker', 'f9b2e5c7-7f1d-4c6c-c795-2cb98e10b2d3', 'org-1'),
    ('y2z3a4b5-c6d7-8901-xyza-bc2345678901', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Aarav Sinha', 'aarav@client.com', '+911234560987', 'IT Manager', 'Technical evaluator', 'e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2', 'org-1'),
    ('z3a4b5c6-d7e8-9012-yzab-cd3456789012', 'b2c3d4e5-f6g7-8901-bcde-f23456789012', 'Rohit Kumar', 'rohit@client.com', '+911234560988', 'CTO', 'Final approver for technical decisions', 'e8a1d4a6-6e0c-4b5b-b684-1ba87d09a1c2', 'org-1')
ON CONFLICT DO NOTHING;