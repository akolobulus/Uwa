-- ─────────────────────────────────────────────────────────────────────────────
-- Nurture AI — Mother Side DB Migration
-- Run this in your Supabase SQL editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  scheduled_at  TIMESTAMPTZ NOT NULL,
  type          TEXT NOT NULL DEFAULT 'ANC',
  location      TEXT,
  clinician     TEXT,
  notes         TEXT,
  status        TEXT NOT NULL DEFAULT 'scheduled',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Symptom logs
CREATE TABLE IF NOT EXISTS symptom_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id       TEXT REFERENCES patients(id) ON DELETE CASCADE,
  session_id       TEXT,
  raw_input        TEXT NOT NULL,
  symptoms         TEXT[] DEFAULT '{}',
  severity         TEXT NOT NULL DEFAULT 'low',
  ai_analysis      TEXT,
  action_taken     TEXT,
  flagged          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Doctor on duty
CREATE TABLE IF NOT EXISTS doctor_on_duty (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT NOT NULL,
  phone_number   TEXT NOT NULL,
  specialty      TEXT NOT NULL DEFAULT 'Obstetrics',
  facility       TEXT NOT NULL DEFAULT '1',
  shift_start    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shift_end      TIMESTAMPTZ,
  is_active      BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ambulance requests
CREATE TABLE IF NOT EXISTS ambulance_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id    TEXT REFERENCES patients(id) ON DELETE CASCADE,
  latitude      NUMERIC(10, 7),
  longitude     NUMERIC(10, 7),
  address       TEXT,
  symptoms      TEXT,
  severity      TEXT NOT NULL DEFAULT 'high',
  status        TEXT NOT NULL DEFAULT 'requested',
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status  ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_patient ON symptom_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_symptom_logs_flagged ON symptom_logs(flagged);
CREATE INDEX IF NOT EXISTS idx_doctor_on_duty_active ON doctor_on_duty(is_active);
CREATE INDEX IF NOT EXISTS idx_ambulance_patient     ON ambulance_requests(patient_id);

-- RLS
ALTER TABLE appointments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptom_logs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_on_duty      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ambulance_requests  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_appointments"       ON appointments       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_symptom_logs"       ON symptom_logs       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_doctor_on_duty"     ON doctor_on_duty     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ambulance_requests" ON ambulance_requests FOR ALL USING (true) WITH CHECK (true);