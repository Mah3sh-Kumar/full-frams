-- ============================================================================
-- DATABASE VERIFICATION SCRIPT
-- Check if Classes and Departments tables have data
-- ============================================================================

-- Step 1: Check if 'classes' table exists and has data
SELECT 
  'classes' as table_name,
  COUNT(*) as row_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
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

-- Step 3: Check if 'org_departments' table exists and has data
SELECT 
  'org_departments' as table_name,
  COUNT(*) as row_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
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

-- Step 5: Check if 'branches' table exists and has data
SELECT 
  'branches' as table_name,
  COUNT(*) as row_count,
  COUNT(CASE WHEN is_active = true THEN 1 END) as active_count
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

-- Step 7: Check table structure - Classes columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'classes'
ORDER BY ordinal_position;

-- Step 8: Check table structure - Departments columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'org_departments'
ORDER BY ordinal_position;

-- Step 9: Check for any foreign key relationships
SELECT 
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.referential_constraints
WHERE table_schema = 'public' AND (table_name = 'classes' OR table_name = 'org_departments')
ORDER BY table_name;

-- Step 10: Summary - Total counts
SELECT 
  'SUMMARY' as section,
  (SELECT COUNT(*) FROM public.classes) as total_classes,
  (SELECT COUNT(*) FROM public.org_departments) as total_departments,
  (SELECT COUNT(*) FROM public.branches) as total_branches,
  (SELECT COUNT(*) FROM public.students) as total_students,
  (SELECT COUNT(*) FROM public.teachers) as total_teachers;
