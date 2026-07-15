-- =========================================================
-- PUPOUS PDTS - PostgreSQL Database Schema (pgAdmin version)
-- Project   : PUPOUS Document Tracking System (PDTS)
-- Version   : 1.1.0
-- Authors   : BCGPS | PUPOUS-BSITOUMN 2-3
-- =========================================================
-- USAGE: Run this directly in pgAdmin Query Tool
--        while connected to pup_ous_pdts database
-- =========================================================

-- 1. Purposes lookup table (shared reference for SUBMISSIONS and
--    CHECKLIST_TEMPLATES so the two tables can't drift out of sync)
CREATE TABLE IF NOT EXISTS purposes (
  name TEXT PRIMARY KEY
);

INSERT INTO purposes (name) VALUES
  ('Admission - Graduation'),
  ('Admission - Bachelor'),
  ('Masteral'),
  ('Comprehensive Exam'),
  ('Deficiency')
ON CONFLICT (name) DO NOTHING;

-- 2. Users table
CREATE TABLE IF NOT EXISTS users (
  username    TEXT        PRIMARY KEY,
  full_name   TEXT        NOT NULL,
  role        TEXT        NOT NULL CHECK (role IN ('Head Admin', 'Registrar Officer')),
  email       TEXT        NOT NULL UNIQUE,
  avatar_url  TEXT,
  password    TEXT,
  created_at  TIMESTAMP   DEFAULT NOW()
);

-- 3. Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id                        TEXT      PRIMARY KEY,
  timestamp                 TEXT      NOT NULL,
  date_string               TEXT      NOT NULL,
  purpose                   TEXT      NOT NULL REFERENCES purposes(name),
  student_name              TEXT      NOT NULL  DEFAULT '',
  student_first_name        TEXT      NOT NULL  DEFAULT '',
  student_middle_name       TEXT,
  student_last_name         TEXT      NOT NULL  DEFAULT '',
  student_email             TEXT      NOT NULL,
  contact_number            TEXT      NOT NULL,
  delivery_method           TEXT      NOT NULL,
  courier_tracking_number   TEXT,
  documents                 JSONB     NOT NULL,
  remarks                   TEXT,
  notified                  BOOLEAN   NOT NULL  DEFAULT FALSE,
  notification_timestamp    TEXT,
  created_at                TIMESTAMP DEFAULT NOW()
);

-- 4. Simulated emails table
CREATE TABLE IF NOT EXISTS simulated_emails (
  id              TEXT        PRIMARY KEY,
  submission_id   TEXT        NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  recipient_email TEXT        NOT NULL,
  recipient_name  TEXT        NOT NULL,
  subject         TEXT        NOT NULL,
  body_html       TEXT        NOT NULL,
  timestamp       TEXT        NOT NULL,
  created_at      TIMESTAMP   DEFAULT NOW()
);

-- 5. Audit logs table
-- "user" stores the acting staff member's USERNAME (not full_name) and is
-- a real foreign key into users -- an account cannot be deleted while it
-- still has audit history, preserving non-repudiation.
CREATE TABLE IF NOT EXISTS audit_logs (
  id          TEXT        PRIMARY KEY,
  timestamp   TEXT        NOT NULL,
  "user"      TEXT        NOT NULL REFERENCES users(username),
  role        TEXT        NOT NULL,
  action      TEXT        NOT NULL CHECK (action IN ('CREATE', 'DELETE', 'UPDATE', 'IMPORT', 'EXPORT', 'RESET')),
  details     TEXT        NOT NULL,
  target_id   TEXT,
  created_at  TIMESTAMP   DEFAULT NOW()
);

-- 6. Checklist templates table
CREATE TABLE IF NOT EXISTS checklist_templates (
  id          TEXT        PRIMARY KEY,
  purpose     TEXT        NOT NULL REFERENCES purposes(name),
  name        TEXT        NOT NULL,
  required    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMP   DEFAULT NOW()
);

-- 7. Email template config table
-- Singleton config row for the admin-customizable email subject/body
-- template, always accessed/written as id = 1.
CREATE TABLE IF NOT EXISTS email_template_config (
  id              SERIAL    PRIMARY KEY CHECK (id = 1),
  subject_format  TEXT      NOT NULL,
  body_format     TEXT,
  updated_at      TIMESTAMP DEFAULT NOW()
);

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_submissions_timestamp       ON submissions(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_date_string     ON submissions(date_string);
CREATE INDEX IF NOT EXISTS idx_submissions_purpose         ON submissions(purpose);
CREATE INDEX IF NOT EXISTS idx_submissions_student_email   ON submissions(student_email);
CREATE INDEX IF NOT EXISTS idx_simulated_emails_timestamp  ON simulated_emails(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp        ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user             ON audit_logs("user");
CREATE INDEX IF NOT EXISTS idx_checklist_purpose           ON checklist_templates(purpose);

-- 9. Verify tables created
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
