/*
  # Create pipelines and stages tables

  1. New Tables
    - `pipelines`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `org_id` (text, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `deleted_at` (timestamptz, nullable)

    - `stages`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `pipeline_id` (uuid, foreign key to pipelines)
      - `order_position` (integer, not null)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `deleted_at` (timestamptz, nullable)

  2. Security
    - Enable RLS on both tables
    - Add policies for org-based access
    - Add triggers for updated_at timestamps

  3. Seed Data
    - Insert sample pipeline and stages
*/

-- Create pipelines table
CREATE TABLE IF NOT EXISTS pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  org_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Create stages table
CREATE TABLE IF NOT EXISTS stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  order_position integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  deleted_at timestamptz
);

-- Enable RLS
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE stages ENABLE ROW LEVEL SECURITY;

-- Create policies for pipelines
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'pipelines' AND policyname = 'Users can only see their org pipelines'
  ) THEN
    CREATE POLICY "Users can only see their org pipelines"
      ON pipelines
      FOR SELECT
      TO authenticated
      USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
  END IF;
END $$;

-- Create policies for stages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stages' AND policyname = 'Users can see stages for their org pipelines'
  ) THEN
    CREATE POLICY "Users can see stages for their org pipelines"
      ON stages
      FOR SELECT
      TO authenticated
      USING (pipeline_id IN (
        SELECT id FROM pipelines WHERE org_id = (
          SELECT org_id FROM users WHERE id = auth.uid()
        )
      ));
  END IF;
END $$;

-- Create triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_pipelines_modtime'
  ) THEN
    CREATE TRIGGER update_pipelines_modtime 
      BEFORE UPDATE ON pipelines 
      FOR EACH ROW 
      EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_stages_modtime'
  ) THEN
    CREATE TRIGGER update_stages_modtime 
      BEFORE UPDATE ON stages 
      FOR EACH ROW 
      EXECUTE FUNCTION update_modified_column();
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stages_pipeline_id ON stages(pipeline_id);

-- Insert sample pipeline and stages
INSERT INTO pipelines (id, name, org_id) VALUES
  ('c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 'Sales Pipeline', 'org-1'),
  ('d6f7i9g1-1j5h-4g0g-g1d9-6gf32i54f6h7', 'Marketing Pipeline', 'org-1')
ON CONFLICT (id) DO NOTHING;

INSERT INTO stages (id, name, pipeline_id, order_position) VALUES
  ('g9j1l3i2-2m6k-4j1j-j2g0-9hg43l65g7i8', 'Prospect', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 1),
  ('h0k2m4j3-3n7l-4k2k-k3h1-0ih54m76h8j9', 'Qualified', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 2),
  ('i1l3n5k4-4o8m-4l3l-l4i2-1ji65n87i9k0', 'Demo', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 3),
  ('j2m4o6l5-5p9n-4m4m-m5j3-2kj76o98j0l1', 'Proposal', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 4),
  ('k3n5p7m6-6q0o-4n5n-n6k4-3lk87p09k1m2', 'Closed', 'c5e6h8f0-0i4g-4f9f-f0c8-5fe21h43e5g6', 5)
ON CONFLICT (id) DO NOTHING;