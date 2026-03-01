-- ============================================================================
-- QUICK DATABASE CHECK - Simple and Fast
-- ============================================================================

-- Check 1: How many classes do we have?
SELECT COUNT(*) as "Total Classes" FROM public.classes;

-- Check 2: How many departments do we have?
SELECT COUNT(*) as "Total Departments" FROM public.org_departments;

-- Check 3: How many branches do we have?
SELECT COUNT(*) as "Total Branches" FROM public.branches;

-- Check 4: Show all classes
SELECT name, value, academic_year, is_active FROM public.classes ORDER BY display_order;

-- Check 5: Show all departments
SELECT name, code, is_active FROM public.org_departments ORDER BY display_order;

-- Check 6: Show all branches
SELECT name, code, is_active FROM public.branches ORDER BY display_order;
