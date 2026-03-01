-- ============================================================================
-- SEED FACULTY STRUCTURE
-- Add Departments, Classes, and Branches based on actual faculty structure
-- ============================================================================

-- ============================================================================
-- STEP 1: ADD DEPARTMENTS (Faculties)
-- ============================================================================

INSERT INTO public.org_departments (name, code, display_order, is_active, created_at, updated_at)
VALUES
  ('Science', 'science_dept', 1, true, NOW(), NOW()),
  ('Commerce', 'commerce_dept', 2, true, NOW(), NOW()),
  ('Arts', 'arts_dept', 3, true, NOW(), NOW()),
  ('Law', 'law_dept', 4, true, NOW(), NOW())
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- STEP 2: ADD CLASSES (Class Nomenclature)
-- ============================================================================

-- Science Classes: F.Y. / S.Y. / T.Y. B.Sc.
INSERT INTO public.classes (name, value, academic_year, display_order, is_active, created_at, updated_at)
VALUES
  ('F.Y. B.Sc.', 'fy_bsc', '2025-2026', 1, true, NOW(), NOW()),
  ('S.Y. B.Sc.', 'sy_bsc', '2025-2026', 2, true, NOW(), NOW()),
  ('T.Y. B.Sc.', 'ty_bsc', '2025-2026', 3, true, NOW(), NOW()),
  
  -- Commerce Classes: F.Y. / S.Y. / T.Y. B.Com/BMS
  ('F.Y. B.Com', 'fy_bcom', '2025-2026', 4, true, NOW(), NOW()),
  ('S.Y. B.Com', 'sy_bcom', '2025-2026', 5, true, NOW(), NOW()),
  ('T.Y. B.Com', 'ty_bcom', '2025-2026', 6, true, NOW(), NOW()),
  ('F.Y. BMS', 'fy_bms', '2025-2026', 7, true, NOW(), NOW()),
  ('S.Y. BMS', 'sy_bms', '2025-2026', 8, true, NOW(), NOW()),
  ('T.Y. BMS', 'ty_bms', '2025-2026', 9, true, NOW(), NOW()),
  
  -- Arts Classes: F.Y. / S.Y. / T.Y. B.A.
  ('F.Y. B.A.', 'fy_ba', '2025-2026', 10, true, NOW(), NOW()),
  ('S.Y. B.A.', 'sy_ba', '2025-2026', 11, true, NOW(), NOW()),
  ('T.Y. B.A.', 'ty_ba', '2025-2026', 12, true, NOW(), NOW()),
  
  -- Law Classes: 1st Year to 5th Year LL.B.
  ('1st Year LL.B.', '1st_year_llb', '2025-2026', 13, true, NOW(), NOW()),
  ('2nd Year LL.B.', '2nd_year_llb', '2025-2026', 14, true, NOW(), NOW()),
  ('3rd Year LL.B.', '3rd_year_llb', '2025-2026', 15, true, NOW(), NOW()),
  ('4th Year LL.B.', '4th_year_llb', '2025-2026', 16, true, NOW(), NOW()),
  ('5th Year LL.B.', '5th_year_llb', '2025-2026', 17, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 3: ADD BRANCHES (Primary Branches)
-- ============================================================================

-- Science Branches: Physics, Chemistry, CS, IT, Biotech
-- Get class IDs for F.Y. B.Sc., S.Y. B.Sc., T.Y. B.Sc.
INSERT INTO public.branches (name, code, class_id, display_order, is_active, created_at, updated_at)
SELECT 'Physics', 'physics_branch', id, 1, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_bsc'
UNION ALL
SELECT 'Chemistry', 'chemistry_branch', id, 2, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_bsc'
UNION ALL
SELECT 'Computer Science', 'cs_branch', id, 3, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_bsc'
UNION ALL
SELECT 'Information Technology', 'it_branch', id, 4, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_bsc'
UNION ALL
SELECT 'Biotechnology', 'biotech_branch', id, 5, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_bsc'
UNION ALL
SELECT 'Physics', 'physics_branch_sy', id, 1, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_bsc'
UNION ALL
SELECT 'Chemistry', 'chemistry_branch_sy', id, 2, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_bsc'
UNION ALL
SELECT 'Computer Science', 'cs_branch_sy', id, 3, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_bsc'
UNION ALL
SELECT 'Information Technology', 'it_branch_sy', id, 4, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_bsc'
UNION ALL
SELECT 'Biotechnology', 'biotech_branch_sy', id, 5, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_bsc'
UNION ALL
SELECT 'Physics', 'physics_branch_ty', id, 1, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_bsc'
UNION ALL
SELECT 'Chemistry', 'chemistry_branch_ty', id, 2, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_bsc'
UNION ALL
SELECT 'Computer Science', 'cs_branch_ty', id, 3, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_bsc'
UNION ALL
SELECT 'Information Technology', 'it_branch_ty', id, 4, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_bsc'
UNION ALL
SELECT 'Biotechnology', 'biotech_branch_ty', id, 5, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_bsc'
ON CONFLICT DO NOTHING;

-- Commerce Branches: B.Com, BMS, BAF, BBI
-- Get class IDs for B.Com and BMS classes
INSERT INTO public.branches (name, code, class_id, display_order, is_active, created_at, updated_at)
SELECT 'B.Com', 'bcom_branch', id, 1, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_bcom'
UNION ALL
SELECT 'BMS', 'bms_branch', id, 2, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_bcom'
UNION ALL
SELECT 'BAF', 'baf_branch', id, 3, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_bcom'
UNION ALL
SELECT 'BBI', 'bbi_branch', id, 4, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_bcom'
UNION ALL
SELECT 'B.Com', 'bcom_branch_sy', id, 1, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_bcom'
UNION ALL
SELECT 'BMS', 'bms_branch_sy', id, 2, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_bcom'
UNION ALL
SELECT 'BAF', 'baf_branch_sy', id, 3, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_bcom'
UNION ALL
SELECT 'BBI', 'bbi_branch_sy', id, 4, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_bcom'
UNION ALL
SELECT 'B.Com', 'bcom_branch_ty', id, 1, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_bcom'
UNION ALL
SELECT 'BMS', 'bms_branch_ty', id, 2, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_bcom'
UNION ALL
SELECT 'BAF', 'baf_branch_ty', id, 3, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_bcom'
UNION ALL
SELECT 'BBI', 'bbi_branch_ty', id, 4, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_bcom'
UNION ALL
SELECT 'B.Com', 'bcom_branch_bms_fy', id, 1, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_bms'
UNION ALL
SELECT 'BMS', 'bms_branch_bms_fy', id, 2, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_bms'
UNION ALL
SELECT 'BAF', 'baf_branch_bms_fy', id, 3, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_bms'
UNION ALL
SELECT 'BBI', 'bbi_branch_bms_fy', id, 4, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_bms'
UNION ALL
SELECT 'B.Com', 'bcom_branch_bms_sy', id, 1, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_bms'
UNION ALL
SELECT 'BMS', 'bms_branch_bms_sy', id, 2, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_bms'
UNION ALL
SELECT 'BAF', 'baf_branch_bms_sy', id, 3, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_bms'
UNION ALL
SELECT 'BBI', 'bbi_branch_bms_sy', id, 4, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_bms'
UNION ALL
SELECT 'B.Com', 'bcom_branch_bms_ty', id, 1, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_bms'
UNION ALL
SELECT 'BMS', 'bms_branch_bms_ty', id, 2, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_bms'
UNION ALL
SELECT 'BAF', 'baf_branch_bms_ty', id, 3, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_bms'
UNION ALL
SELECT 'BBI', 'bbi_branch_bms_ty', id, 4, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_bms'
ON CONFLICT DO NOTHING;

-- Arts Branches: History, Economics, Psychology, Languages
-- Get class IDs for B.A. classes
INSERT INTO public.branches (name, code, class_id, display_order, is_active, created_at, updated_at)
SELECT 'History', 'history_branch', id, 1, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_ba'
UNION ALL
SELECT 'Economics', 'economics_branch', id, 2, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_ba'
UNION ALL
SELECT 'Psychology', 'psychology_branch', id, 3, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_ba'
UNION ALL
SELECT 'Languages', 'languages_branch', id, 4, true, NOW(), NOW() FROM public.classes WHERE value = 'fy_ba'
UNION ALL
SELECT 'History', 'history_branch_sy', id, 1, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_ba'
UNION ALL
SELECT 'Economics', 'economics_branch_sy', id, 2, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_ba'
UNION ALL
SELECT 'Psychology', 'psychology_branch_sy', id, 3, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_ba'
UNION ALL
SELECT 'Languages', 'languages_branch_sy', id, 4, true, NOW(), NOW() FROM public.classes WHERE value = 'sy_ba'
UNION ALL
SELECT 'History', 'history_branch_ty', id, 1, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_ba'
UNION ALL
SELECT 'Economics', 'economics_branch_ty', id, 2, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_ba'
UNION ALL
SELECT 'Psychology', 'psychology_branch_ty', id, 3, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_ba'
UNION ALL
SELECT 'Languages', 'languages_branch_ty', id, 4, true, NOW(), NOW() FROM public.classes WHERE value = 'ty_ba'
ON CONFLICT DO NOTHING;

-- Law doesn't have branches (no primary branches specified)
-- But we can add specializations if needed

-- ============================================================================
-- VERIFICATION: Check what was inserted
-- ============================================================================

SELECT 'DEPARTMENTS ADDED' as section;
SELECT name, code, is_active FROM public.org_departments ORDER BY display_order;

SELECT 'CLASSES ADDED' as section;
SELECT name, value, is_active FROM public.classes ORDER BY display_order;

SELECT 'BRANCHES ADDED' as section;
SELECT name, code, is_active FROM public.branches ORDER BY display_order;

SELECT 'SUMMARY' as section;
SELECT 
  (SELECT COUNT(*) FROM public.org_departments) as total_departments,
  (SELECT COUNT(*) FROM public.classes) as total_classes,
  (SELECT COUNT(*) FROM public.branches) as total_branches;
