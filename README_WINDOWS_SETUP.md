# PUPOUS RMS - Windows Setup Guide

This project works on Windows PC, MacBook, and browser-based school deployment. The website and future APK/tablet version sync through the same Express API and PostgreSQL database.

## Requirements for Windows

Install these first:

1. Node.js LTS
2. PostgreSQL for Windows
3. VS Code

During PostgreSQL installation, remember the password for the PostgreSQL admin user, usually `postgres`.

## Fastest Windows Setup

1. First, set up the database (one-time step) by double-clicking:

```text
WINDOWS_RESET_DATABASE_ONLY.bat
```

This creates the `pup_ous_pdts` database (if it doesn't already exist) and applies the schema and default seed data via `psql`.

2. Then open the project folder and double-click:

```text
WINDOWS_SETUP_AND_RUN.bat
```

This file will:

1. Install project dependencies (`npm install`).
2. Start the system at `http://localhost:3000` (`npm run dev`).

Make sure `.env` exists in the project root with your PostgreSQL and SMTP details before running this — copy `.env.windows.example` if you don't have one yet.

## Database details

`WINDOWS_RESET_DATABASE_ONLY.bat` creates/resets:

```text
Database: pup_ous_pdts
```

Connect using the PostgreSQL admin user/password you set during installation (matching `SQL_ADMIN_USER` / `SQL_ADMIN_PASSWORD` in `.env`).

Default login accounts:

```text
Head Admin
Username: admin001
Password: pupadmin
```

```text
Registrar Officer
Username: officer001
Password: pupofficer
```

## If psql is not found

Add this to Windows PATH, depending on installed PostgreSQL version:

```text
C:\Program Files\PostgreSQL\16\bin
```

or:

```text
C:\Program Files\PostgreSQL\17\bin
```

or:

```text
C:\Program Files\PostgreSQL\18\bin
```

Then reopen Command Prompt / VS Code and run again.

## Run only, after setup is complete

Double-click:

```text
WINDOWS_RUN_ONLY.bat
```

## Reset database only

Double-click:

```text
WINDOWS_RESET_DATABASE_ONLY.bat
```

## Manual run command

```bat
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```
