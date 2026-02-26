-- ============================================================================
-- VERIFY DATABASE TABLES AND DATA
-- Run this in Supabase SQL Editor to check what tables exist and their data
-- ============================================================================

-- Check if org_departments table exists and has data
SELECT 'org_departments' as table_name, COUNT(*) as record_count 
FROM public.org_departments;

-- Check if classes table exists and has data
SELECT 'classes' as table_name, COUNT(*) as record_count 
FROM public.classes;

-- Check if branches table exists and has data
SELECT 'branches' as table_name, COUNT(*) as record_count 
FROM public.branches;

-- ============================================================================
-- DETAILED DATA CHECK
-- ============================================================================

-- Show all departments
SELECT 'DEPARTMENTS' as section;
SELECT id, name, code, is_active FROM public.org_departments ORDER BY display_order;

-- Show all classes
SELECT 'CLASSES' as section;
SELECT id, name, value, is_active FROM public.classes ORDER BY display_order;

-- Show all branches (first 10)
SELECT 'BRANCHES (first 10)' as section;
SELECT id, name, code, class_id, is_active FROM public.branches ORDER BY display_order LIMIT 10;

-- ============================================================================
-- CHECK TABLE STRUCTURE
-- ============================================================================

-- Check org_departments columns
SELECT 'org_departments columns' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'org_departments' 
ORDER BY ordinal_position;

-- Check classes columns
SELECT 'classes columns' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'classes' 
ORDER BY ordinal_position;

-- Check branches columns
SELECT 'branches columns' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'branches' 
ORDER BY ordinal_position;
