-- =========================================================
-- PUPOUS PDTS - Maintenance: Duplicate Record Cleanup
-- Description : Removes duplicate submissions and email logs
--               caused by repeated save clicks or network
--               retries. Keeps the newest record per group.
-- Authors     : VANDAM | PUPOUS-BSITOUMN 2-3
-- =========================================================
-- USAGE:
--   psql pup_ous_pdts -f maintenance/cleanup_duplicate_records.sql
-- WARNING: This performs DELETE operations inside a transaction.
--          Review results before committing in production.
-- =========================================================

\connect pup_ous_pdts

BEGIN;

-- ─── 1. Remove duplicate submissions ─────────────────────────────────────────
-- Groups by: email + purpose + date + contact number
-- Keeps: the most recently created record per group
WITH ranked_submissions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(student_email), purpose, date_string, contact_number
      ORDER BY created_at DESC NULLS LAST, timestamp DESC, id DESC
    ) AS row_num
  FROM submissions
),
duplicate_submissions AS (
  SELECT id FROM ranked_submissions WHERE row_num > 1
)
DELETE FROM submissions
WHERE id IN (SELECT id FROM duplicate_submissions);

-- ─── 2. Remove duplicate email logs ──────────────────────────────────────────
-- Groups by: submission_id + recipient email + subject
-- Keeps: the most recently created email log per group
WITH ranked_emails AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY submission_id, LOWER(recipient_email), subject
      ORDER BY created_at DESC NULLS LAST, timestamp DESC, id DESC
    ) AS row_num
  FROM simulated_emails
),
duplicate_emails AS (
  SELECT id FROM ranked_emails WHERE row_num > 1
)
DELETE FROM simulated_emails
WHERE id IN (SELECT id FROM duplicate_emails);

-- ─── 3. Post-cleanup record count verification ───────────────────────────────
SELECT 'submissions'     AS table_name, COUNT(*) AS total FROM submissions
UNION ALL
SELECT 'simulated_emails',              COUNT(*)           FROM simulated_emails
UNION ALL
SELECT 'audit_logs',                    COUNT(*)           FROM audit_logs
ORDER BY table_name;

COMMIT;
