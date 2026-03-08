-- ==============================================================================
-- Assign Department to Teacher
-- ==============================================================================
-- This script assigns a proper department to the teacher and ensures
-- the "Not assigned" placeholder is replaced with actual department names
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- OPTION 1: Fix specific teacher (ID: 2f50604d-a472-42b5-b1ce-817ca038fa75)
-- ==============================================================================

-- First, check if the teacher record exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.teachers WHERE id = '2f50604d-a472-42b5-b1ce-817ca038fa75') THEN
    -- Create the teacher record if it doesn't exist
    INSERT INTO public.teachers (id, department)
    VALUES ('2f50604d-a472-42b5-b1ce-817ca038fa75', 'Computer Science');
    RAISE NOTICE 'Created teacher record with department: Computer Science';
  ELSE
    -- Update existing record
    UPDATE public.teachers
    SET department = 'Computer Science'  -- Change to actual department
    WHERE id = '2f50604d-a472-42b5-b1ce-817ca038fa75';
    RAISE NOTICE 'Updated teacher department to: Computer Science';
  END IF;
END $$;

-- ==============================================================================
-- OPTION 2: Update all teachers with "Not assigned" department
-- ==============================================================================

-- Uncomment the following to update ALL teachers with "Not assigned"
/*
UPDATE public.teachers
SET department = 'General'  -- Or any default department
WHERE department = 'Not assigned' OR department IS NULL;
*/

-- ==============================================================================
-- OPTION 3: Assign departments based on subjects taught
-- ==============================================================================

-- This is more advanced - assigns department based on subjects the teacher teaches
-- Uncomment and modify as needed
/*
UPDATE public.teachers t
SET department = (
  SELECT DISTINCT d.name
  FROM public.subject_teachers st
  INNER JOIN public.subjects s ON s.id = st.subject_id
  INNER JOIN public.classes c ON c.id = s.class_id
  INNER JOIN public.branches b ON b.id = c.branch_id
  INNER JOIN public.org_departments d ON d.id = b.department_id
  WHERE st.teacher_id = t.id
  LIMIT 1
)
WHERE t.department = 'Not assigned' OR t.department IS NULL;
*/

-- ==============================================================================
-- Verification: Show all teachers and their departments
-- ==============================================================================

SELECT 
  u.email,
  u.full_name,
  t.department,
  COUNT(st.subject_id) as subjects_taught,
  CASE 
    WHEN t.department IS NULL THEN '❌ No department'
    WHEN t.department = 'Not assigned' THEN '⚠️ Not assigned'
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
-- Common Department Names (for reference)
-- ==============================================================================
-- Computer Science
-- Information Technology
-- Electronics and Communication
-- Mechanical Engineering
-- Civil Engineering
-- Electrical Engineering
-- Mathematics
-- Physics
-- Chemistry
-- English
-- General
-- ==============================================================================
