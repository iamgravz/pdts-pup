# PUPOUS Document Tracking System (PDTS) - Clean Source Package

This package contains only the necessary source files for the PDTS web system.

Included:
- React/Vite frontend source
- Express/Node backend source
- PostgreSQL SQL files
- Public assets and login background images
- Package files for npm install
- Existing `.env` configuration retained from your uploaded project

Not included:
- `node_modules`
- `dist`
- Mac `__MACOSX` metadata
- temporary build outputs

## Default run

1. Open this folder in VS Code.
2. Make sure PostgreSQL is running.
3. Confirm your `.env` values are correct.
4. Install dependencies:

```bash
npm install
```

5. Run the system:

```bash
npm run dev
```

6. Open the app in your browser:

```text
http://localhost:3000
```

## Database

Use the SQL files below if you need to create/reset the database tables (see `database/README.md` for full details):

```text
database/schema/pup_database_schema.sql
database/seeds/default_data.sql
```

## Important

Your `.env` file may contain database and SMTP credentials. Do not upload or share this project package publicly.
