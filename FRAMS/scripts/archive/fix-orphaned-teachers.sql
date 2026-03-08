-- ==============================================================================
-- Fix Orphaned Teacher Records
-- ==============================================================================
-- This script creates missing teacher records for users with role='teacher'
-- who don't have a corresponding entry in the teachers table.
--
-- Run this in Supabase SQL Editor to fix the warning:
-- "No teacher metadata found for ID: ..."
-- ==============================================================================

BEGIN;

-- Insert missing teacher records
INSERT INTO public.teachers (id, department)
SELECT u.id, 'Not assigned'
FROM public.users u
WHERE u.role = 'teacher'
  AND NOT EXISTS (
    SELECT 1 FROM public.teachers t WHERE t.id = u.id
  );

-- Show what was fixed
SELECT 
  u.email,
  u.full_name,
  u.role,
  t.department,
  CASE 
    WHEN t.id IS NOT NULL THEN '✅ Fixed'
    ELSE '❌ Still missing'
  END as status
FROM public.users u
LEFT JOIN public.teachers t ON t.id = u.id
WHERE u.role = 'teacher'
ORDER BY u.created_at DESC;

COMMIT;

-- ==============================================================================
-- Optional: Create trigger to prevent this in the future
-- ==============================================================================
-- Uncomment the following to automatically create teacher records
-- when a user with role='teacher' is created:

/*
CREATE OR REPLACE FUNCTION create_teacher_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'teacher' THEN
    INSERT INTO public.teachers (id, department)
    VALUES (NEW.id, 'Not assigned')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_teacher_profile
AFTER INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION create_teacher_profile();
*/
