@echo off
cd /d "%~dp0"
echo This will run the PDTS schema and seed SQL files using psql.
echo Make sure PostgreSQL bin folder is in PATH.
pause
createdb -U postgres pup_ous_pdts
psql -U postgres -d pup_ous_pdts -f database\schema\pup_database_schema.sql
psql -U postgres -d pup_ous_pdts -f database\seeds\default_data.sql
pause
