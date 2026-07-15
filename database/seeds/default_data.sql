-- =========================================================
-- PUPOUS PDTS - Seed Data (pgAdmin version)
-- Run AFTER pgadmin_schema.sql
-- =========================================================

-- 1. Default users
-- Passwords below are bcrypt hashes (cost 10) of the default plaintext passwords
-- 'pupadmin' and 'pupofficer' respectively -- change them after first login.
INSERT INTO users (username, full_name, role, email, password, avatar_url)
VALUES
  ('admin001',   'Head Admin',         'Head Admin',         'admin.ous@pup.edu.ph',   '$2b$10$94zk3fXiXSV868br1eqmQ./CHzLjWbQEbrt5.GIECnDC.TjGzsMZe',   ''),
  ('officer001', 'Registrar Officer',  'Registrar Officer',  'officer.ous@pup.edu.ph', '$2b$10$iL6s8zCetD7SRKC8JuBm3O4CjEmaTY4UEHAcBNUKWHi7iGcjXxeda', '')
ON CONFLICT (username) DO UPDATE SET
  full_name  = EXCLUDED.full_name,
  role       = EXCLUDED.role,
  email      = EXCLUDED.email,
  password   = EXCLUDED.password,
  avatar_url = EXCLUDED.avatar_url;

-- 2. Checklist templates
INSERT INTO checklist_templates (id, purpose, name, required) VALUES
  ('req-1',  'Admission - Graduation', 'Application for Graduation-Admission Form',          TRUE),
  ('req-2',  'Admission - Graduation', 'Academic Record Evaluation / Curriculum Sheet',      TRUE),
  ('req-3',  'Admission - Graduation', 'PSA Birth Certificate (Original & Copy)',            TRUE),
  ('req-4',  'Admission - Graduation', 'University Clearance Form',                          TRUE),
  ('req-5',  'Admission - Graduation', '2x2 ID Pictures with White Background (3pcs)',       TRUE),
  ('req-6',  'Admission - Bachelor',   'Application for Graduation (Bachelors)',             TRUE),
  ('req-7',  'Admission - Bachelor',   'Official Transcript of Records (TOR for Graduation)',TRUE),
  ('req-8',  'Admission - Bachelor',   'PSA Birth Certificate (Original & Copy)',            TRUE),
  ('req-9',  'Admission - Bachelor',   'University Clearance Form (All Cleared)',            TRUE),
  ('req-10', 'Admission - Bachelor',   'Graduation & Picture Fee Receipts',                  TRUE),
  ('req-11', 'Admission - Bachelor',   'Completed Academic Evaluation Sheet',                TRUE),
  ('req-12', 'Masteral', 'Transcript of Records (TOR) - Original',                          TRUE),
  ('req-13', 'Masteral', 'Honorable Dismissal / Transfer Credentials',                      TRUE),
  ('req-14', 'Masteral', 'PSA Birth Certificate (Original & Copy)',                         TRUE),
  ('req-15', 'Masteral', 'PSA Marriage Certificate (For Married Female)',                   FALSE),
  ('req-16', 'Masteral', 'Certificate of Employment (Min 2 years)',                         TRUE),
  ('req-17', 'Masteral', 'NBI / Police Clearance',                                          FALSE),
  ('req-18', 'Masteral', '2x2 ID Pictures with White Background (3pcs)',                    TRUE),
  ('req-19', 'Masteral', 'Completed OUS Application Form with Photo',                       TRUE),
  ('req-20', 'Comprehensive Exam', 'Certificate of Grades (Coursework Completed)',          TRUE),
  ('req-21', 'Comprehensive Exam', 'Comprehensive Exam Application Form',                   TRUE),
  ('req-22', 'Comprehensive Exam', 'Proof of Tuition & Exam Payment Receipt',               TRUE),
  ('req-23', 'Comprehensive Exam', '2x2 ID Pictures with Name Tag (2pcs)',                  TRUE),
  ('req-24', 'Deficiency', 'Deficiency Cover Sheet / Log Form',                             TRUE),
  ('req-25', 'Deficiency', 'Specifically Flagged Missing Document',                         TRUE),
  ('req-26', 'Deficiency', 'Letter of Explanation for Late Submission',                     FALSE)
ON CONFLICT (id) DO UPDATE SET
  purpose  = EXCLUDED.purpose,
  name     = EXCLUDED.name,
  required = EXCLUDED.required;

-- 3. Verify
SELECT 'users' AS table_name, COUNT(*) AS total FROM users
UNION ALL
SELECT 'checklist_templates', COUNT(*) FROM checklist_templates
ORDER BY table_name;
