@echo off
REM ==============================================================================
REM Run Teacher Department Fix via Supabase CLI (Windows)
REM ==============================================================================
REM This script executes the complete fix for teacher department sync
REM ==============================================================================

echo.
echo Starting Teacher Department Fix...
echo.

REM Check if supabase CLI is installed
where supabase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Supabase CLI is not installed
    echo Install it with: npm install -g supabase
    exit /b 1
)

REM Check if we're in the FRAMS directory
if not exist "app.json" (
    echo Error: Please run this script from the FRAMS directory
    exit /b 1
)

echo Supabase CLI found
echo Running from FRAMS directory
echo.

REM Run the SQL script
echo Executing fix-and-sync-teacher-departments.sql...
echo.

supabase db execute --file scripts/fix-and-sync-teacher-departments.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Fix completed successfully!
    echo.
    echo Next steps:
    echo 1. Check the output above for verification results
    echo 2. Test by assigning a teacher to a subject in the admin panel
    echo 3. Verify the department appears in the teacher's profile
) else (
    echo.
    echo Fix failed. Check the error messages above.
    echo.
    echo Alternative: Copy the contents of scripts/fix-and-sync-teacher-departments.sql
    echo and run it directly in the Supabase SQL Editor at:
    echo https://supabase.com/dashboard/project/YOUR_PROJECT/sql
)

pause
