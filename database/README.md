# PUPOUS PDTS — Database Documentation

**Project:** PUPOUS Document Tracking System (PDTS)  
**Database:** PostgreSQL  
**Authors:** VANDAM | PUPOUS-BSITOUMN 2-3  

---

## Folder Structure

```
database/
├── schema/
│   └── pup_database_schema.sql         ← DDL: tables, indexes, grants
├── seeds/
│   └── default_data.sql                ← Default users + checklist templates
├── migrations/
│   ├── 001_normalize_purpose_labels.sql            ← Legacy data cleanup
│   ├── 002_add_relational_constraints.sql          ← Adds purposes lookup table + FKs/CHECKs
│   └── 003_email_template_config_singleton.sql     ← Enforces single-row config table
├── maintenance/
│   └── cleanup_duplicate_records.sql   ← Remove duplicates (run as needed)
└── README.md                           ← This file
```

---

## Setup Instructions

### Fresh Installation

```bash
# Step 0: Create the database (skip if it already exists)
createdb -U postgres pup_ous_pdts

# Step 1: Create schema and tables
psql -U postgres -d pup_ous_pdts -f schema/pup_database_schema.sql

# Step 2: Insert default data
psql -U postgres -d pup_ous_pdts -f seeds/default_data.sql
```

### Existing Database (Migration)

```bash
# Run only if upgrading from an older version, in order
psql -U postgres -d pup_ous_pdts -f migrations/001_normalize_purpose_labels.sql
psql -U postgres -d pup_ous_pdts -f migrations/002_add_relational_constraints.sql
psql -U postgres -d pup_ous_pdts -f migrations/003_email_template_config_singleton.sql
```

---

## Default Login Credentials

| Username   | Password    | Role              |
|------------|-------------|-------------------|
| admin001   | pupadmin    | Head Admin        |
| officer001 | pupofficer  | Registrar Officer |

> **Important:** Change these passwords after first login via the Account settings page.
> Passwords are stored as bcrypt hashes at rest. The `seeds/default_data.sql` file already
> contains the bcrypt hash of the plaintext passwords above, not the plaintext itself — the
> app also transparently upgrades any legacy plaintext password row to a bcrypt hash the next
> time that account logs in.

---

## Tables Overview

| Table                  | Description                                      |
|------------------------|--------------------------------------------------|
| `purposes`             | Lookup table of the 5 valid academic purpose categories. Referenced by `submissions.purpose` and `checklist_templates.purpose`. |
| `users`                | Staff login accounts and roles (RBAC). `password` stores a bcrypt hash. `role` is CHECK-constrained. |
| `submissions`          | Student document submission ledger. `purpose` is a foreign key into `purposes`. |
| `simulated_emails`     | Outbound email log, mirrored to real SMTP (nodemailer) when configured. FK to `submissions`. |
| `audit_logs`           | Full system audit trail. `"user"` is a foreign key into `users.username` (not the display name), and `action` is CHECK-constrained. An account cannot be deleted while it still has audit history. |
| `checklist_templates`  | Configurable document requirements per purpose. `purpose` is a foreign key into `purposes`. |
| `email_template_config`| Singleton config row (always `id = 1`) backing the Admin Settings "Email Templates" feature. |

### Table Relationships

- `submissions.purpose` → `purposes.name`
- `checklist_templates.purpose` → `purposes.name`
- `simulated_emails.submission_id` → `submissions.id` (`ON DELETE CASCADE`)
- `audit_logs."user"` → `users.username`
- `email_template_config` is intentionally standalone (a single global config row, not per-user/per-purpose, so it has nothing to reference by foreign key).

---

## Maintenance

Run the duplicate cleanup script periodically or after bulk imports:

```bash
psql -U postgres -d pup_ous_pdts -f maintenance/cleanup_duplicate_records.sql
```