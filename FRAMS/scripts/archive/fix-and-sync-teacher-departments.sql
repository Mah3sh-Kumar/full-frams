-- ==============================================================================
-- COMPLETE FIX: Teachers Table + Department Sync
-- ==============================================================================
-- Run this entire script in Supabase SQL Editor
-- This combines the table fix and department sync in one script
-- ==============================================================================

BEGIN;

-- ============================================================
-- PART 1: FIX TEACHERS TABLE
-- ============================================================

-- Add updated_at column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teachers' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.teachers 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    RAISE NOTICE '✅ Added updated_at column to teachers table';
  ELSE
    RAISE NOTICE '✅ updated_at column already exists';
  END IF;
END $$;

-- Create safe update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column_safe()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
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

-- Update trigger
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_teachers_updated_at' 
    AND tgrelid = 'public.teachers'::regclass
  ) THEN
    DROP TRIGGER trigger_teachers_updated_at ON public.teachers;
  END IF;
  
  CREATE TRIGGER trigger_teachers_updated_at
    BEFORE UPDATE ON public.teachers
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column_safe();
  
  RAISE NOTICE '✅ Updated trigger to safe version';
END $$;

-- ============================================================
-- PART 2: DEPARTMENT SYNC FUNCTIONS
-- ============================================================

-- Function to get department from subject
CREATE OR REPLACE FUNCTION public.get_department_from_subject(p_subject_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_department_name TEXT;
BEGIN
  SELECT d.name INTO v_department_name
  FROM public.subjects s
  INNER JOIN public.classes c ON c.id = s.class_id
  INNER JOIN public.branches b ON b.id = c.branch_id
  INNER JOIN public.org_departments d ON d.id = b.department_id
  WHERE s.id = p_subject_id;
  RETURN v_department_name;
END;
$$;

-- Trigger function to sync department
CREATE OR REPLACE FUNCTION public.sync_teacher_department()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_department_name TEXT;
  v_current_department TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT department INTO v_current_department
    FROM public.teachers WHERE id = NEW.teacher_id;
    
    IF v_current_department IS NULL 
       OR v_current_department = '' 
       OR v_current_department = 'Not assigned' THEN
      
      v_department_name := public.get_department_from_subject(NEW.subject_id);
      
      IF v_department_name IS NOT NULL THEN
        UPDATE public.teachers
        SET department = v_department_name
        WHERE id = NEW.teacher_id;
        
        RAISE NOTICE '✅ Auto-synced department "%" for teacher %', v_department_name, NEW.teacher_id;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '⚠️ Failed to sync teacher department: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_sync_teacher_department ON public.subject_teachers;
CREATE TRIGGER trigger_sync_teacher_department
  AFTER INSERT ON public.subject_teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_teacher_department();

RAISE NOTICE '✅ Created department sync trigger';

-- ============================================================
-- PART 3: BACKFILL EXISTING TEACHERS
-- ============================================================

DO $$
DECLARE
  v_teacher_record RECORD;
  v_department_name TEXT;
  v_updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🔄 Starting backfill of teacher departments...';
  
  FOR v_teacher_record IN
    SELECT DISTINCT t.id, t.department
    FROM public.teachers t
    INNER JOIN public.subject_teachers st ON st.teacher_id = t.id
    WHERE t.department IS NULL 
       OR t.department = '' 
       OR t.department = 'Not assigned'
  LOOP
    SELECT public.get_department_from_subject(st.subject_id) INTO v_department_name
    FROM public.subject_teachers st
    WHERE st.teacher_id = v_teacher_record.id
    LIMIT 1;
    
    IF v_department_name IS NOT NULL THEN
      UPDATE public.teachers
      SET department = v_department_name
      WHERE id = v_teacher_record.id;
      
      v_updated_count := v_updated_count + 1;
      RAISE NOTICE '  ✅ Updated teacher % with department: %', v_teacher_record.id, v_department_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE '✅ Backfill complete. Updated % teacher departments.', v_updated_count;
END $$;

-- ============================================================
-- PART 4: VERIFICATION
-- ============================================================

DO $$
DECLARE
  total_teachers INTEGER;
  assigned_teachers INTEGER;
  not_assigned_teachers INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_teachers FROM public.teachers;
  
  SELECT COUNT(*) INTO assigned_teachers 
  FROM public.teachers 
  WHERE department IS NOT NULL 
    AND department != '' 
    AND department != 'Not assigned';
  
  SELECT COUNT(*) INTO not_assigned_teachers 
  FROM public.teachers 
  WHERE department IS NULL 
    OR department = '' 
    OR department = 'Not assigned';
  
  RAISE NOTICE '=== VERIFICATION ===';
  RAISE NOTICE 'Total teachers: %', total_teachers;
  RAISE NOTICE 'Teachers with assigned department: %', assigned_teachers;
  RAISE NOTICE 'Teachers with "Not assigned": %', not_assigned_teachers;
  
  IF not_assigned_teachers = 0 THEN
    RAISE NOTICE '✅ All teachers have proper departments!';
  ELSE
    RAISE NOTICE '⚠️ % teachers still need department assignment', not_assigned_teachers;
  END IF;
END $$;

-- Show results
SELECT 
  u.email,
  t.department,
  COUNT(st.subject_id) as subjects_taught,
  CASE 
    WHEN t.department IS NULL THEN '❌ NULL'
    WHEN t.department = 'Not assigned' THEN '⚠️ Not assigned'
    ELSE '✅ Assigned'
  END as status
FROM public.users u
INNER JOIN public.teachers t ON t.id = u.id
LEFT JOIN public.subject_teachers st ON st.teacher_id = u.id
WHERE u.role = 'teacher'
GROUP BY u.email, t.department
ORDER BY status, u.email;

COMMIT;

-- ==============================================================================
-- COMPLETE! 🎉
-- ==============================================================================
-- ✅ Fixed teachers table structure
-- ✅ Created department sync functions
-- ✅ Created automatic sync trigger
-- ✅ Backfilled existing teachers
-- ✅ Verified all teachers
--
-- Future subject assignments will automatically sync teacher departments!
-- ==============================================================================
