-- ============================================================================
-- DATABASE VERIFICATION SCRIPT (FIXED)
-- Check if Classes and Departments tables have data
-- ============================================================================

-- Step 1: Check Classes Table - Count
SELECT 
  'classes' as table_name,
  COUNT(*) as total_rows
FROM public.classes;

-- Step 2: Show all classes
SELECT 
  id,
  name,
  value,
  academic_year,
  display_order,
  is_active,
  created_at
FROM public.classes
ORDER BY display_order ASC;

-- Step 3: Check Departments Table - Count
SELECT 
  'org_departments' as table_name,
  COUNT(*) as total_rows
FROM public.org_departments;

-- Step 4: Show all departments
SELECT 
  id,
  name,
  code,
  display_order,
  is_active,
  created_at
FROM public.org_departments
ORDER BY display_order ASC;

-- Step 5: Check Branches Table - Count
SELECT 
  'branches' as table_name,
  COUNT(*) as total_rows
FROM public.branches;

-- Step 6: Show all branches
SELECT 
  id,
  name,
  code,
  class_id,
  display_order,
  is_active,
  created_at
FROM public.branches
ORDER BY display_order ASC;

-- Step 7: Summary - Total counts
SELECT 
  'SUMMARY' as section,
  (SELECT COUNT(*) FROM public.classes) as total_classes,
  (SELECT COUNT(*) FROM public.org_departments) as total_departments,
  (SELECT COUNT(*) FROM public.branches) as total_branches,
  (SELECT COUNT(*) FROM public.students) as total_students,
  (SELECT COUNT(*) FROM public.teachers) as total_teachers;
