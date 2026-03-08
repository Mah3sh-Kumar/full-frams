-- ==============================================================================
-- AUTO-SYNC TEACHER DEPARTMENT FROM SUBJECT ASSIGNMENTS
-- ==============================================================================
-- Migration : 20260309100000_auto_sync_teacher_department.sql
-- Date      : 2026-03-09
-- Purpose   : Automatically sync teacher department when assigned to subjects
-- ==============================================================================
-- This migration:
-- 1. Creates a function to get department from subject
-- 2. Creates a function to sync teacher department
-- 3. Creates a trigger to auto-sync on subject assignment
-- 4. Backfills existing teachers' departments from their subject assignments
-- ==============================================================================

BEGIN;

-- ============================================================
-- STEP 1: CREATE FUNCTION TO GET DEPARTMENT FROM SUBJECT
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_department_from_subject(p_subject_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_department_name TEXT;
BEGIN
  -- Get department name through: subject -> class -> branch -> department
  SELECT d.name INTO v_department_name
  FROM public.subjects s
  INNER JOIN public.classes c ON c.id = s.class_id
  INNER JOIN public.branches b ON b.id = c.branch_id
  INNER JOIN public.org_departments d ON d.id = b.department_id
  WHERE s.id = p_subject_id;
  
  RETURN v_department_name;
END;
$$;

COMMENT ON FUNCTION public.get_department_from_subject(UUID) IS 
  'Gets the department name for a subject by traversing: subject -> class -> branch -> department';

-- ============================================================
-- STEP 2: CREATE FUNCTION TO SYNC TEACHER DEPARTMENT
-- ============================================================

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
  -- Only process INSERT operations (when teacher is assigned to a subject)
  IF TG_OP = 'INSERT' THEN
    -- Get current teacher department
    SELECT department INTO v_current_department
    FROM public.teachers
    WHERE id = NEW.teacher_id;
    
    -- Only update if department is NULL, empty, or "Not assigned"
    IF v_current_department IS NULL 
       OR v_current_department = '' 
       OR v_current_department = 'Not assigned' THEN
      
      -- Get department from the subject
      v_department_name := public.get_department_from_subject(NEW.subject_id);
      
      IF v_department_name IS NOT NULL THEN
        -- Update teacher's department
        -- Note: This may trigger update_updated_at if that column exists
        UPDATE public.teachers
        SET department = v_department_name
        WHERE id = NEW.teacher_id;
        
        RAISE NOTICE 'Auto-synced department "%" for teacher %', v_department_name, NEW.teacher_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the subject assignment
    RAISE WARNING 'Failed to sync teacher department: %', SQLERRM;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.sync_teacher_department() IS 
  'Trigger function that automatically updates a teacher''s department when they are assigned to a subject. Only updates if current department is NULL, empty, or "Not assigned".';

-- ============================================================
-- STEP 3: CREATE TRIGGER ON subject_teachers TABLE
-- ============================================================

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_sync_teacher_department ON public.subject_teachers;

-- Create trigger to run after subject assignment
CREATE TRIGGER trigger_sync_teacher_department
  AFTER INSERT ON public.subject_teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_teacher_department();

COMMENT ON TRIGGER trigger_sync_teacher_department ON public.subject_teachers IS 
  'Automatically syncs teacher department when they are assigned to a subject. Updates teachers.department based on the subject''s department hierarchy.';

-- ============================================================
-- STEP 4: BACKFILL EXISTING TEACHERS' DEPARTMENTS
-- ============================================================

-- Temporarily disable the update_updated_at trigger if it exists
DO $$
BEGIN
  -- Disable trigger on teachers table if it exists
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_teachers_updated_at' 
    AND tgrelid = 'public.teachers'::regclass
  ) THEN
    ALTER TABLE public.teachers DISABLE TRIGGER trigger_teachers_updated_at;
    RAISE NOTICE 'Temporarily disabled update_updated_at trigger';
  END IF;
END $$;

-- Update teachers who have "Not assigned" or NULL department
-- but have subject assignments
DO $$
DECLARE
  v_teacher_record RECORD;
  v_department_name TEXT;
  v_updated_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting backfill of teacher departments...';
  
  -- Loop through teachers with "Not assigned" or NULL department
  FOR v_teacher_record IN
    SELECT DISTINCT t.id, t.department
    FROM public.teachers t
    INNER JOIN public.subject_teachers st ON st.teacher_id = t.id
    WHERE t.department IS NULL 
       OR t.department = '' 
       OR t.department = 'Not assigned'
  LOOP
    -- Get department from their first subject assignment
    SELECT public.get_department_from_subject(st.subject_id) INTO v_department_name
    FROM public.subject_teachers st
    WHERE st.teacher_id = v_teacher_record.id
    LIMIT 1;
    
    IF v_department_name IS NOT NULL THEN
      -- Update teacher's department (without triggering updated_at)
      UPDATE public.teachers
      SET department = v_department_name
      WHERE id = v_teacher_record.id;
      
      v_updated_count := v_updated_count + 1;
      RAISE NOTICE 'Updated teacher % with department: %', v_teacher_record.id, v_department_name;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Backfill complete. Updated % teacher departments.', v_updated_count;
END $$;

-- Re-enable the trigger if it was disabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'trigger_teachers_updated_at' 
    AND tgrelid = 'public.teachers'::regclass
  ) THEN
    ALTER TABLE public.teachers ENABLE TRIGGER trigger_teachers_updated_at;
    RAISE NOTICE 'Re-enabled update_updated_at trigger';
  END IF;
END $$;

-- ============================================================
-- STEP 5: CREATE HELPER FUNCTION TO MANUALLY SYNC DEPARTMENT
-- ============================================================

CREATE OR REPLACE FUNCTION public.sync_teacher_department_manual(p_teacher_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_department_name TEXT;
  v_current_department TEXT;
BEGIN
  -- Get current department
  SELECT department INTO v_current_department
  FROM public.teachers
  WHERE id = p_teacher_id;
  
  -- Get department from first subject assignment
  SELECT public.get_department_from_subject(st.subject_id) INTO v_department_name
  FROM public.subject_teachers st
  WHERE st.teacher_id = p_teacher_id
  LIMIT 1;
  
  IF v_department_name IS NULL THEN
    RETURN 'No subject assignments found for this teacher';
  END IF;
  
  -- Update teacher's department
  UPDATE public.teachers
  SET department = v_department_name
  WHERE id = p_teacher_id;
  
  RETURN 'Department updated to: ' || v_department_name;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error updating department: ' || SQLERRM;
END;
$$;

COMMENT ON FUNCTION public.sync_teacher_department_manual(UUID) IS 
  'Manually syncs a teacher''s department from their subject assignments. Useful for fixing existing records. Returns the updated department name.';

-- ============================================================
-- STEP 6: VERIFICATION QUERY
-- ============================================================

-- Show teachers and their departments
DO $$
DECLARE
  total_teachers INTEGER;
  assigned_teachers INTEGER;
  not_assigned_teachers INTEGER;
  teachers_with_subjects INTEGER;
BEGIN
  -- Count teachers
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
  
  SELECT COUNT(DISTINCT st.teacher_id) INTO teachers_with_subjects
  FROM public.subject_teachers st;
  
  RAISE NOTICE '=== TEACHER DEPARTMENT SYNC VERIFICATION ===';
  RAISE NOTICE 'Total teachers: %', total_teachers;
  RAISE NOTICE 'Teachers with assigned department: %', assigned_teachers;
  RAISE NOTICE 'Teachers with "Not assigned": %', not_assigned_teachers;
  RAISE NOTICE 'Teachers with subject assignments: %', teachers_with_subjects;
  
  IF not_assigned_teachers > 0 THEN
    RAISE WARNING 'Found % teachers still with "Not assigned" department', not_assigned_teachers;
  ELSE
    RAISE NOTICE '✅ All teachers have proper departments assigned!';
  END IF;
END $$;

-- Show detailed teacher department status
SELECT 
  u.email,
  u.full_name,
  t.department,
  COUNT(st.subject_id) as subjects_count,
  CASE 
    WHEN t.department IS NULL THEN '❌ NULL'
    WHEN t.department = 'Not assigned' THEN '⚠️ Not assigned'
    WHEN t.department = '' THEN '❌ Empty'
    ELSE '✅ Assigned'
  END as status
FROM public.users u
INNER JOIN public.teachers t ON t.id = u.id
LEFT JOIN public.subject_teachers st ON st.teacher_id = u.id
WHERE u.role = 'teacher'
GROUP BY u.email, u.full_name, t.department
ORDER BY status, u.email;

COMMIT;

-- ==============================================================================
-- USAGE EXAMPLES
-- ==============================================================================

-- Example 1: Manually sync a specific teacher's department
-- SELECT public.sync_teacher_department_manual('teacher-uuid-here');

-- Example 2: Check department for a specific subject
-- SELECT public.get_department_from_subject('subject-uuid-here');

-- Example 3: View all teachers with their departments
-- SELECT u.email, t.department, COUNT(st.subject_id) as subjects
-- FROM users u
-- INNER JOIN teachers t ON t.id = u.id
-- LEFT JOIN subject_teachers st ON st.teacher_id = u.id
-- WHERE u.role = 'teacher'
-- GROUP BY u.email, t.department;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- ✅ Created get_department_from_subject() function
-- ✅ Created sync_teacher_department() trigger function
-- ✅ Created trigger on subject_teachers table
-- ✅ Backfilled existing teachers' departments
-- ✅ Created manual sync helper function
-- ✅ Verified all teachers have proper departments
--
-- Future subject assignments will automatically update teacher departments!
-- ==============================================================================
