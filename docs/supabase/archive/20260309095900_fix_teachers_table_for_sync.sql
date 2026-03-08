-- ==============================================================================
-- FIX TEACHERS TABLE FOR DEPARTMENT SYNC
-- ==============================================================================
-- Migration : 20260309095900_fix_teachers_table_for_sync.sql
-- Date      : 2026-03-09
-- Purpose   : Fix teachers table to allow department updates
-- ==============================================================================
-- This migration fixes the issue where update_updated_at_column() trigger
-- expects an updated_at column that doesn't exist in the teachers table.
-- ==============================================================================

BEGIN;

-- ============================================================
-- OPTION 1: Add updated_at column to teachers table
-- ============================================================

-- Check if updated_at column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teachers' 
    AND column_name = 'updated_at'
  ) THEN
    -- Add updated_at column
    ALTER TABLE public.teachers 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    
    RAISE NOTICE 'Added updated_at column to teachers table';
  ELSE
    RAISE NOTICE 'updated_at column already exists in teachers table';
  END IF;
END $$;

-- ============================================================
-- OPTION 2: Create or replace the trigger to handle missing column
-- ============================================================

-- Create a safer version of update_updated_at_column that checks if column exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column_safe()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the table has an updated_at column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = TG_TABLE_SCHEMA 
    AND table_name = TG_TABLE_NAME 
    AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.update_updated_at_column_safe() IS 
  'Safely updates updated_at column if it exists. Does not fail if column is missing.';

-- ============================================================
-- OPTION 3: Update existing trigger to use safe version
-- ============================================================

-- Drop and recreate trigger on teachers table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_teachers_updated_at' 
    AND tgrelid = 'public.teachers'::regclass
  ) THEN
    DROP TRIGGER trigger_teachers_updated_at ON public.teachers;
    RAISE NOTICE 'Dropped old trigger_teachers_updated_at';
  END IF;
  
  -- Create new trigger using safe function
  CREATE TRIGGER trigger_teachers_updated_at
    BEFORE UPDATE ON public.teachers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column_safe();
  
  RAISE NOTICE 'Created new safe trigger_teachers_updated_at';
END $$;

-- ============================================================
-- Verification
-- ============================================================

-- Show teachers table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'teachers'
ORDER BY ordinal_position;

COMMIT;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- ✅ Added updated_at column to teachers table (if missing)
-- ✅ Created safe version of update_updated_at_column function
-- ✅ Updated trigger to use safe function
--
-- Now you can run the department sync migration without errors!
-- ==============================================================================
