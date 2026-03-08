-- ==============================================================================
-- Fix Specific Teacher Department
-- ==============================================================================
-- This script fixes the department for teacher ID: 2f50604d-a472-42b5-b1ce-817ca038fa75
-- and ensures the teacher record exists
-- ==============================================================================

BEGIN;

-- First, ensure the teacher record exists
INSERT INTO public.teachers (id, department)
VALUES ('2f50604d-a472-42b5-b1ce-817ca038fa75', 'Computer Science')
ON CONFLICT (id) 
DO UPDATE SET department = 'Computer Science';

-- Verify the fix
SELECT 
  u.email,
  u.full_name,
  u.role,
  t.department
FROM public.users u
LEFT JOIN public.teachers t ON t.id = u.id
WHERE u.id = '2f50604d-a472-42b5-b1ce-817ca038fa75';

COMMIT;

-- ==============================================================================
-- Expected Output:
-- email              | full_name      | role    | department
-- -------------------|----------------|---------|------------------
-- teacher@email.com  | Teacher Name   | teacher | Computer Science
-- ==============================================================================

-- Note: Change 'Computer Science' to the actual department name if different
