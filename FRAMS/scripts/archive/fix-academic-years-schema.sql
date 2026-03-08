-- ==============================================================================
-- FRAMS · DATABASE SCHEMA FIX SCRIPT
-- ==============================================================================
-- Script    : fix-academic-years-schema.sql
-- Date      : 2026-02-24
-- Purpose   : Verify and correct academic_years table schema and foreign keys
-- Spec      : .kiro/specs/subject-database-schema-fix
-- Bug       : PGRST205 (table not found) and PGRST200 (foreign key not found)
-- ==============================================================================
-- This script diagnoses and fixes database schema issues that prevent the
-- getSubjects function from working correctly. It handles:
-- 1. Missing academic_years table
-- 2. Misspelled table name (acaddemic_years → academic_years)
-- 3. Missing foreign key constraint between subjects and academic_years
-- 4. PostgREST schema cache reload
-- ==============================================================================

BEGIN;

-- ============================================================
-- STEP 1: DIAGNOSTIC CHECKS
-- ============================================================

DO $$
DECLARE
  academic_years_exists BOOLEAN;
  misspelled_table_exists BOOLEAN;
  fk_exists BOOLEAN;
  subjects_table_exists BOOLEAN;
BEGIN
  -- Check if academic_years table exists with correct spelling
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'academic_years'
  ) INTO academic_years_exists;
  
  -- Check if misspelled table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'acaddemic_years'
  ) INTO misspelled_table_exists;
  
  -- Check if subjects table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subjects'
  ) INTO subjects_table_exists;
  
  -- Check if foreign key constraint exists
  IF subjects_table_exists THEN
    SELECT EXISTS (
      SELECT FROM information_schema.table_constraints 
      WHERE table_schema = 'public'
      AND table_name = 'subjects' 
      AND constraint_type = 'FOREIGN KEY' 
      AND constraint_name = 'subjects_academic_year_id_fkey'
    ) INTO fk_exists;
  ELSE
    fk_exists := FALSE;
  END IF;
  
  -- Output diagnostic information
  RAISE NOTICE '=== DIAGNOSTIC RESULTS ===';
  RAISE NOTICE 'academic_years table exists: %', academic_years_exists;
  RAISE NOTICE 'acaddemic_years (misspelled) exists: %', misspelled_table_exists;
  RAISE NOTICE 'subjects table exists: %', subjects_table_exists;
  RAISE NOTICE 'Foreign key constraint exists: %', fk_exists;
  RAISE NOTICE '========================';
END $$;

-- ============================================================
-- STEP 2: RENAME MISSPELLED TABLE (IF NEEDED)
-- ============================================================

DO $$
DECLARE
  misspelled_exists BOOLEAN;
  correct_exists BOOLEAN;
BEGIN
  -- Check if misspelled table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'acaddemic_years'
  ) INTO misspelled_exists;
  
  -- Check if correct table already exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'academic_years'
  ) INTO correct_exists;
  
  IF misspelled_exists AND NOT correct_exists THEN
    RAISE NOTICE 'Renaming acaddemic_years to academic_years...';
    EXECUTE 'ALTER TABLE public.acaddemic_years RENAME TO academic_years';
    RAISE NOTICE 'Table renamed successfully';
  ELSIF misspelled_exists AND correct_exists THEN
    RAISE WARNING 'Both acaddemic_years and academic_years exist! Manual intervention required.';
  ELSIF NOT misspelled_exists AND NOT correct_exists THEN
    RAISE NOTICE 'Neither table exists. Migration needs to be run.';
  ELSE
    RAISE NOTICE 'Table academic_years already exists with correct spelling';
  END IF;
END $$;

-- ============================================================
-- STEP 3: CREATE FOREIGN KEY CONSTRAINT (IF MISSING)
-- ============================================================

DO $$
DECLARE
  fk_exists BOOLEAN;
  subjects_exists BOOLEAN;
  academic_years_exists BOOLEAN;
  column_exists BOOLEAN;
BEGIN
  -- Check if subjects table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subjects'
  ) INTO subjects_exists;
  
  -- Check if academic_years table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'academic_years'
  ) INTO academic_years_exists;
  
  IF NOT subjects_exists THEN
    RAISE NOTICE 'subjects table does not exist. Migration needs to be run.';
    RETURN;
  END IF;
  
  IF NOT academic_years_exists THEN
    RAISE NOTICE 'academic_years table does not exist. Cannot create foreign key.';
    RETURN;
  END IF;
  
  -- Check if academic_year_id column exists in subjects table
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subjects' 
    AND column_name = 'academic_year_id'
  ) INTO column_exists;
  
  IF NOT column_exists THEN
    RAISE NOTICE 'academic_year_id column does not exist in subjects table. Migration needs to be run.';
    RETURN;
  END IF;
  
  -- Check if foreign key constraint exists
  SELECT EXISTS (
    SELECT FROM information_schema.table_constraints 
    WHERE table_schema = 'public'
    AND table_name = 'subjects' 
    AND constraint_type = 'FOREIGN KEY' 
    AND constraint_name = 'subjects_academic_year_id_fkey'
  ) INTO fk_exists;
  
  IF NOT fk_exists THEN
    RAISE NOTICE 'Creating foreign key constraint subjects_academic_year_id_fkey...';
    EXECUTE 'ALTER TABLE public.subjects 
             ADD CONSTRAINT subjects_academic_year_id_fkey 
             FOREIGN KEY (academic_year_id) 
             REFERENCES public.academic_years(id) 
             ON DELETE RESTRICT';
    RAISE NOTICE 'Foreign key constraint created successfully';
  ELSE
    RAISE NOTICE 'Foreign key constraint already exists';
  END IF;
END $$;

-- ============================================================
-- STEP 4: VERIFY SCHEMA CORRECTIONS
-- ============================================================

DO $$
DECLARE
  academic_years_exists BOOLEAN;
  fk_exists BOOLEAN;
  all_good BOOLEAN := TRUE;
BEGIN
  RAISE NOTICE '=== VERIFICATION ===';
  
  -- Verify academic_years table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'academic_years'
  ) INTO academic_years_exists;
  
  IF academic_years_exists THEN
    RAISE NOTICE '✓ academic_years table exists';
  ELSE
    RAISE WARNING '✗ academic_years table does NOT exist';
    all_good := FALSE;
  END IF;
  
  -- Verify foreign key exists
  SELECT EXISTS (
    SELECT FROM information_schema.table_constraints 
    WHERE table_schema = 'public'
    AND table_name = 'subjects' 
    AND constraint_type = 'FOREIGN KEY' 
    AND constraint_name = 'subjects_academic_year_id_fkey'
  ) INTO fk_exists;
  
  IF fk_exists THEN
    RAISE NOTICE '✓ Foreign key constraint exists';
  ELSE
    RAISE WARNING '✗ Foreign key constraint does NOT exist';
    all_good := FALSE;
  END IF;
  
  IF all_good THEN
    RAISE NOTICE '=== ALL CHECKS PASSED ===';
  ELSE
    RAISE WARNING '=== SOME CHECKS FAILED - MANUAL INTERVENTION MAY BE REQUIRED ===';
  END IF;
END $$;

COMMIT;

-- ============================================================
-- STEP 5: RELOAD POSTGREST SCHEMA CACHE
-- ============================================================

-- Notify PostgREST to reload its schema cache
-- This ensures PostgREST recognizes the corrected table names and foreign keys
NOTIFY pgrst, 'reload schema';

-- ==============================================================================
-- SCRIPT COMPLETE
-- ==============================================================================
-- 
-- NEXT STEPS:
-- 
-- 1. If the script reported that tables don't exist at all:
--    - Run the full migration: 20260224_create_subjects_tables.sql
--    - Then run this script again to verify
-- 
-- 2. If the script reported "Both acaddemic_years and academic_years exist":
--    - Manually inspect both tables to determine which one has the correct data
--    - Drop the incorrect table or merge data as needed
--    - Then run this script again
-- 
-- 3. If all checks passed:
--    - Test the getSubjects function to verify it works correctly
--    - If PostgREST still reports errors, try reloading schema cache via Supabase dashboard
-- 
-- 4. To reload PostgREST schema cache via Supabase dashboard:
--    - Go to Database → Replication → Schema Cache
--    - Click "Reload Schema Cache" button
-- 
-- ==============================================================================
