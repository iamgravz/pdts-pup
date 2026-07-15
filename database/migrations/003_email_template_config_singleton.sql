-- =========================================================
-- PUPOUS PDTS - Migration 003
-- Description : email_template_config now backs the app's "Email
--   Templates" admin feature directly (previously the feature silently
--   persisted to a local email-template-config.json file instead of
--   this table, which sat completely unused). Enforces the table can
--   only ever hold a single row (id = 1), matching the app's use of it
--   as one global config, not per-user/per-purpose.
-- Authors     : BCGPS | PUPOUS-BSITOUMN 2-3
-- =========================================================
-- USAGE: Run only if upgrading from an older version, after
--        002_add_relational_constraints.sql, while connected to
--        the pup_ous_pdts database.
-- =========================================================

-- If more than one row somehow exists already, keep only the most
-- recently updated one before adding the singleton constraint.
DELETE FROM email_template_config
WHERE id NOT IN (
  SELECT id FROM email_template_config ORDER BY updated_at DESC NULLS LAST LIMIT 1
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_email_template_config_singleton') THEN
    ALTER TABLE email_template_config
      ADD CONSTRAINT chk_email_template_config_singleton CHECK (id = 1);
  END IF;
END $$;

-- Verification
SELECT * FROM email_template_config;
