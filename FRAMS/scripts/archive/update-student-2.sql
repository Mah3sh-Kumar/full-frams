-- Script to update Student 2 (mk94854541@gmail.com) with proper data
-- Replace the values below with the actual branch and class the student should be in

-- Step 1: View available branches
SELECT id, name, code, department_id 
FROM branches 
WHERE is_active = true 
ORDER BY name;

-- Step 2: View available classes for a specific branch
-- Replace 'BRANCH_ID_HERE' with the actual branch ID from Step 1
SELECT id, name, value, branch_id, academic_year 
FROM classes 
WHERE branch_id = 'BRANCH_ID_HERE' AND is_active = true 
ORDER BY name;

-- Step 3: Update Student 2 with the correct data
-- Example: Setting student to B.Sc. (IT) First Year
UPDATE students 
SET 
    enrollment_number = 'STU002',  -- Replace with actual enrollment number
    branch_id = '917f7654-511f-450d-a653-57e678ceab48',  -- Replace with actual branch ID
    class_id = '6d51de5a-b7e2-4cb5-855d-71f24bd8c9be',   -- Replace with actual class ID
    department_id = NULL  -- Will be auto-populated by trigger from branch_id
WHERE id = '8747f587-bc18-4a58-af39-c719d8e8bf94';

-- Step 4: Verify the update
SELECT 
    s.id,
    u.email,
    u.full_name,
    s.enrollment_number,
    c.name as class_name,
    b.name as branch_name,
    d.name as department_name
FROM students s
JOIN users u ON s.id = u.id
LEFT JOIN classes c ON s.class_id = c.id
LEFT JOIN branches b ON s.branch_id = b.id
LEFT JOIN org_departments d ON s.department_id = d.id
WHERE s.id = '8747f587-bc18-4a58-af39-c719d8e8bf94';
