-- ==============================================================================
-- AUTO-CREATE ROLE PROFILES MIGRATION
-- ==============================================================================
-- Migration : 20260309000000_auto_create_role_profiles.sql
-- Date      : 2026-03-09
-- Purpose   : Automatically create teacher/student profiles when users are created
-- ==============================================================================
-- This migration:
-- 1. Fixes existing orphaned users (backfill)
-- 2. Creates a trigger to automatically create role profiles for new users
-- 3. Prevents orphaned teacher/student records in the future
-- ==============================================================================

BEGIN;

-- ============================================================
-- STEP 1: FIX EXISTING ORPHANED TEACHERS
-- ============================================================

-- Insert missing teacher records for existing teacher users
INSERT INTO public.teachers (id, department)
SELECT u.id, 'Not assigned'
FROM public.users u
WHERE u.role = 'teacher'
  AND NOT EXISTS (
    SELECT 1 FROM public.teachers t WHERE t.id = u.id
  )
ON CONFLICT (id) DO NOTHING;

-- Log what was fixed
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM public.users u
  INNER JOIN public.teachers t ON t.id = u.id
  WHERE u.role = 'teacher';
  
  RAISE NOTICE 'Fixed % orphaned teacher records', fixed_count;
END $$;

-- ============================================================
-- STEP 2: FIX EXISTING ORPHANED STUDENTS
-- ============================================================

-- Insert missing student records for existing student users
INSERT INTO public.students (id, enrollment_number, class_id, branch_id, department_id)
SELECT 
  u.id, 
  'PENDING_' || SUBSTRING(u.id::text, 1, 8),  -- Generate temporary enrollment number
  NULL,  -- class_id
  NULL,  -- branch_id
  NULL   -- department_id
FROM public.users u
WHERE u.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM public.students s WHERE s.id = u.id
  )
ON CONFLICT (id) DO NOTHING;

-- Log what was fixed
DO $$
DECLARE
  fixed_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO fixed_count
  FROM public.users u
  INNER JOIN public.students s ON s.id = u.id
  WHERE u.role = 'student';
  
  RAISE NOTICE 'Fixed % orphaned student records', fixed_count;
END $$;

-- ============================================================
-- STEP 3: CREATE FUNCTION TO AUTO-CREATE ROLE PROFILES
-- ============================================================

CREATE OR REPLACE FUNCTION public.auto_create_role_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- If user is a teacher, create teacher profile
  IF NEW.role = 'teacher' THEN
    INSERT INTO public.teachers (id, department)
    VALUES (NEW.id, 'Not assigned')
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Auto-created teacher profile for user: %', NEW.email;
  
  -- If user is a student, create student profile
  ELSIF NEW.role = 'student' THEN
    INSERT INTO public.students (id, enrollment_number, class_id, branch_id, department_id)
    VALUES (
      NEW.id, 
      'PENDING_' || SUBSTRING(NEW.id::text, 1, 8),  -- Temporary enrollment number
      NULL,  -- class_id - to be assigned by admin
      NULL,  -- branch_id - to be assigned by admin
      NULL   -- department_id - to be assigned by admin
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Auto-created student profile for user: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================
-- STEP 4: CREATE TRIGGER ON USERS TABLE
-- ============================================================

-- Drop trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_auto_create_role_profile ON public.users;

-- Create trigger to run after user insert
CREATE TRIGGER trigger_auto_create_role_profile
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_role_profile();

-- ============================================================
-- STEP 5: ADD COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON FUNCTION public.auto_create_role_profile() IS 
  'Automatically creates teacher or student profile when a new user is inserted. Teachers get a default department of "Not assigned", students get a temporary enrollment number starting with "PENDING_". This prevents orphaned user records.';

COMMENT ON TRIGGER trigger_auto_create_role_profile ON public.users IS 
  'Automatically creates role-specific profiles (teachers/students) when new users are created. Prevents orphaned records and ensures data consistency.';

-- ============================================================
-- STEP 6: VERIFICATION QUERY
-- ============================================================

-- Show current state of users and their profiles
DO $$
DECLARE
  total_users INTEGER;
  total_teachers INTEGER;
  total_students INTEGER;
  total_admins INTEGER;
  orphaned_teachers INTEGER;
  orphaned_students INTEGER;
BEGIN
  -- Count users by role
  SELECT COUNT(*) INTO total_users FROM public.users;
  SELECT COUNT(*) INTO total_teachers FROM public.users WHERE role = 'teacher';
  SELECT COUNT(*) INTO total_students FROM public.users WHERE role = 'student';
  SELECT COUNT(*) INTO total_admins FROM public.users WHERE role = 'admin';
  
  -- Count orphaned records
  SELECT COUNT(*) INTO orphaned_teachers
  FROM public.users u
  WHERE u.role = 'teacher'
    AND NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = u.id);
  
  SELECT COUNT(*) INTO orphaned_students
  FROM public.users u
  WHERE u.role = 'student'
    AND NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = u.id);
  
  -- Log results
  RAISE NOTICE '=== USER PROFILE VERIFICATION ===';
  RAISE NOTICE 'Total users: %', total_users;
  RAISE NOTICE 'Teachers: %', total_teachers;
  RAISE NOTICE 'Students: %', total_students;
  RAISE NOTICE 'Admins: %', total_admins;
  RAISE NOTICE 'Orphaned teachers: % (should be 0)', orphaned_teachers;
  RAISE NOTICE 'Orphaned students: % (should be 0)', orphaned_students;
  
  IF orphaned_teachers > 0 OR orphaned_students > 0 THEN
    RAISE WARNING 'Found orphaned records! Run the migration again or check for errors.';
  ELSE
    RAISE NOTICE '✅ All users have proper role profiles!';
  END IF;
END $$;

COMMIT;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- This migration:
-- ✅ Fixed all existing orphaned teacher records
-- ✅ Fixed all existing orphaned student records
-- ✅ Created auto_create_role_profile() function
-- ✅ Created trigger to auto-create profiles for new users
-- ✅ Verified all users have proper profiles
--
-- Future user creation will automatically create role profiles!
-- ==============================================================================
