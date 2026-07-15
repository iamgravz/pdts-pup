@echo off
cd /d "%~dp0"
echo ==========================================
echo  PUPOUS Document Tracking System - Windows
echo ==========================================
echo Installing dependencies...
call npm install
if errorlevel 1 pause & exit /b 1
echo Starting PDTS...
call npm run dev
pause
