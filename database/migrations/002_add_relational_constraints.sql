-- =========================================================
-- PUPOUS PDTS - Migration 002
-- Description : Add missing relational integrity between tables.
--   - Introduces a `purposes` lookup table shared by SUBMISSIONS
--     and CHECKLIST_TEMPLATES (previously two disconnected
--     free-text columns that could silently drift out of sync).
--   - Adds a foreign key from AUDIT_LOGS."user" to USERS.username
--     (the column had been storing inconsistent full-name /
--     free-text values from a buggy code path).
--   - Adds CHECK constraints on USERS.role and AUDIT_LOGS.action
--     to enforce the application's known valid enum values.
-- Authors     : BCGPS | PUPOUS-BSITOUMN 2-3
-- =========================================================
-- USAGE: Run only if upgrading from an older version of the schema,
--        after 001_normalize_purpose_labels.sql, while connected to
--        the pup_ous_pdts database.
-- =========================================================

-- 1. Purposes lookup table
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

-- 2. Repair legacy audit_logs rows written by a fixed code path that
--    stored the acting staff member's full_name (instead of username)
--    and an invalid 'MODIFY' action (instead of CREATE/DELETE).
UPDATE audit_logs SET action = 'DELETE', "user" = u.username
FROM users u
WHERE audit_logs.action = 'MODIFY'
  AND audit_logs.details ILIKE 'Deleted registrar staff account:%'
  AND u.full_name = audit_logs."user";

UPDATE audit_logs SET action = 'CREATE', "user" = u.username
FROM users u
WHERE audit_logs.action = 'MODIFY'
  AND audit_logs.details ILIKE 'Registered new registrar staff account:%'
  AND u.full_name = audit_logs."user";

-- 3. Foreign keys tying SUBMISSIONS and CHECKLIST_TEMPLATES to the shared purposes lookup
--    (wrapped so this migration can be safely re-run against a database that
--    already has these constraints)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_submissions_purpose') THEN
    ALTER TABLE submissions
      ADD CONSTRAINT fk_submissions_purpose FOREIGN KEY (purpose) REFERENCES purposes(name);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_checklist_templates_purpose') THEN
    ALTER TABLE checklist_templates
      ADD CONSTRAINT fk_checklist_templates_purpose FOREIGN KEY (purpose) REFERENCES purposes(name);
  END IF;

  -- 4. Foreign key tying AUDIT_LOGS to USERS
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_audit_logs_user') THEN
    ALTER TABLE audit_logs
      ADD CONSTRAINT fk_audit_logs_user FOREIGN KEY ("user") REFERENCES users(username);
  END IF;

  -- 5. CHECK constraints enforcing known valid enum values
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_users_role') THEN
    ALTER TABLE users
      ADD CONSTRAINT chk_users_role CHECK (role IN ('Head Admin', 'Registrar Officer'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_audit_logs_action') THEN
    ALTER TABLE audit_logs
      ADD CONSTRAINT chk_audit_logs_action CHECK (action IN ('CREATE', 'DELETE', 'UPDATE', 'IMPORT', 'EXPORT', 'RESET'));
  END IF;
END $$;

-- 6. Verification
SELECT DISTINCT purpose FROM submissions ORDER BY purpose;
SELECT DISTINCT purpose FROM checklist_templates ORDER BY purpose;
SELECT DISTINCT "user" FROM audit_logs ORDER BY "user";
SELECT DISTINCT action FROM audit_logs ORDER BY action;
