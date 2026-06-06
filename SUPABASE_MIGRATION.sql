-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Clean relational schema with snake_case columns for production healthcare data

-- Clean up previous attempts safely
DROP TABLE IF EXISTS visits CASCADE;
DROP TABLE IF EXISTS patients CASCADE;

-- 1. Create Patients Base Table
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  state TEXT,
  week INTEGER NOT NULL,
  anc_week INTEGER,
  gravidity INTEGER,
  scd TEXT NOT NULL DEFAULT 'AA',
  hiv TEXT NOT NULL DEFAULT 'Negative',
  malaria TEXT NOT NULL DEFAULT '0',
  iptp_doses TEXT NOT NULL DEFAULT '0',
  htn TEXT NOT NULL DEFAULT '0',
  multiple TEXT NOT NULL DEFAULT '0',
  facility TEXT NOT NULL DEFAULT '1',
  multiparity TEXT NOT NULL DEFAULT '0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Visits Relational Table
CREATE TABLE visits (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  week INTEGER,
  sbp INTEGER NOT NULL,
  dbp INTEGER NOT NULL,
  hr INTEGER,
  bs NUMERIC,
  temp NUMERIC,
  weight NUMERIC,
  notes TEXT,
  oedema TEXT,
  protein TEXT,
  risk_composite INTEGER,
  risk_colour TEXT,
  risk_priority TEXT,
  risk_pph INTEGER,
  risk_pre INTEGER,
  risk_ptl INTEGER,
  risk_drivers TEXT,
  engine_result JSONB,
  scored_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Security Config (Bypasses RLS blocks on testing)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read patients" ON patients FOR SELECT USING (true);
CREATE POLICY "Allow anon insert patients" ON patients FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update patients" ON patients FOR UPDATE USING (true);

CREATE POLICY "Allow anon read visits" ON visits FOR SELECT USING (true);
CREATE POLICY "Allow anon insert visits" ON visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update visits" ON visits FOR UPDATE USING (true);

-- 4. Enable Real-Time Publications
ALTER PUBLICATION supabase_realtime ADD TABLE patients;
ALTER PUBLICATION supabase_realtime ADD TABLE visits;
