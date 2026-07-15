-- =========================================================
-- PUPOUS PDTS - Migration 001
-- Description : Normalize legacy purpose label values to
--               current standard labels used by the system.
-- Authors     : BCGPS | PUPOUS-BSITOUMN 2-3
-- =========================================================
-- USAGE: Run in pgAdmin Query Tool
--        while connected to pup_ous_pdts database
-- =========================================================

-- submissions table
UPDATE submissions SET purpose = 'Masteral'
  WHERE purpose = 'Admission (Graduate)';

UPDATE submissions SET purpose = 'Admission - Bachelor'
  WHERE purpose IN ('Admission (Bachelors)', 'Graduation Bachelor');

UPDATE submissions SET purpose = 'Admission - Graduation'
  WHERE purpose IN ('Graduation', 'Graduation-Admission');

-- checklist_templates table
UPDATE checklist_templates SET purpose = 'Masteral'
  WHERE purpose = 'Admission (Graduate)';

UPDATE checklist_templates SET purpose = 'Admission - Bachelor'
  WHERE purpose IN ('Admission (Bachelors)', 'Graduation Bachelor');

UPDATE checklist_templates SET purpose = 'Admission - Graduation'
  WHERE purpose IN ('Graduation', 'Graduation-Admission');

-- Verification
SELECT DISTINCT purpose FROM submissions         ORDER BY purpose;
SELECT DISTINCT purpose FROM checklist_templates ORDER BY purpose;