-- ==============================================================================
-- Sync Teacher Departments from Subject Assignments
-- ==============================================================================
-- This script updates teacher departments based on their assigned subjects
-- It derives the department from: subject → class → branch → department
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- STEP 1: Show current state (before update)
-- ==============================================================================

SELECT 
  u.email,
  u.full_name,
  t.department as current_department,
  COUNT(st.subject_id) as subjects_assigned,
  CASE 
    WHEN t.department IS NULL THEN '❌ NULL'
    WHEN t.department = 'Not assigned' THEN '⚠️ Not assigned'
    ELSE '✅ Has department'
  END as status
FROM public.users u
INNER JOIN public.teachers t ON t.id = u.id
LEFT JOIN public.subject_teachers st ON st.teacher_id = u.id
WHERE u.role = 'teacher'
GROUP BY u.email, u.full_name, t.department
ORDER BY status, u.email;

-- ==============================================================================
-- STEP 2: Update teacher departments based on their subject assignments
-- ==============================================================================

-- Update teachers who have "Not assigned" or NULL department
-- Sets department based on their first assigned subject
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
WHERE (t.department IS NULL OR t.department = 'Not assigned')
  AND EXISTS (
    SELECT 1 FROM public.subject_teachers st WHERE st.teacher_id = t.id
  );

-- ==============================================================================
-- STEP 3: Show updated state (after update)
-- ==============================================================================

SELECT 
  u.email,
  u.full_name,
  t.department as updated_department,
  COUNT(st.subject_id) as subjects_assigned,
  CASE 
    WHEN t.department IS NULL THEN '❌ NULL'
    WHEN t.department = 'Not assigned' THEN '⚠️ Still not assigned'
    ELSE '✅ Department assigned'
  END as status
FROM public.users u
INNER JOIN public.teachers t ON t.id = u.id
LEFT JOIN public.subject_teachers st ON st.teacher_id = u.id
WHERE u.role = 'teacher'
GROUP BY u.email, u.full_name, t.department
ORDER BY status, u.email;

-- ==============================================================================
-- STEP 4: Show teachers who still need manual assignment
-- ==============================================================================

-- These are teachers with no subject assignments
SELECT 
  u.email,
  u.full_name,
  t.department,
  '⚠️ No subjects assigned - needs manual department assignment' as note
FROM public.users u
INNER JOIN public.teachers t ON t.id = u.id
WHERE u.role = 'teacher'
  AND (t.department IS NULL OR t.department = 'Not assigned')
  AND NOT EXISTS (
    SELECT 1 FROM public.subject_teachers st WHERE st.teacher_id = u.id
  );

-- ==============================================================================
-- STEP 5: Verification - Show department distribution
-- ==============================================================================

SELECT 
  COALESCE(t.department, 'Not assigned') as department,
  COUNT(*) as teacher_count,
  STRING_AGG(u.email, ', ') as teachers
FROM public.users u
INNER JOIN public.teachers t ON t.id = u.id
WHERE u.role = 'teacher'
GROUP BY t.department
ORDER BY teacher_count DESC;

COMMIT;

-- ==============================================================================
-- Expected Results:
-- ==============================================================================
-- ✅ Teachers with subject assignments should now have departments
-- ⚠️ Teachers without subject assignments will still show "Not assigned"
-- 📝 Manual assignment needed for teachers without subjects
-- ==============================================================================

-- ==============================================================================
-- To manually assign department to a specific teacher:
-- ==============================================================================
/*
UPDATE public.teachers
SET department = 'Computer Science'  -- Change to actual department
WHERE id = 'teacher-user-id';
*/
