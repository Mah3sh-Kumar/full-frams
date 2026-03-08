-- Fix existing student records with NULL values
-- This script helps populate missing branch_id, department_id, and class_id for students

-- First, let's see what we have
SELECT 
    s.id,
    u.email,
    u.full_name,
    s.enrollment_number,
    s.class_id,
    s.branch_id,
    s.department_id,
    s.class_level,
    s.branch
FROM students s
JOIN users u ON s.id = u.id
WHERE s.enrollment_number IS NULL 
   OR s.class_id IS NULL 
   OR s.branch_id IS NULL;

-- For Student 2 (mk94854541@gmail.com) - you'll need to manually set these values
-- Example update (replace with actual values):
-- UPDATE students 
-- SET 
--     enrollment_number = 'ENROLL002',
--     class_id = (SELECT id FROM classes WHERE name = 'Graduation Year 1' LIMIT 1),
--     branch_id = (SELECT id FROM branches WHERE name = 'Computer Science' LIMIT 1),
--     department_id = (SELECT department_id FROM branches WHERE name = 'Computer Science' LIMIT 1)
-- WHERE id = '8747f587-bc18-4a58-af39-c719d8e8bf94';

-- Create a helper function to auto-populate department_id from branch_id
CREATE OR REPLACE FUNCTION auto_populate_student_department()
RETURNS TRIGGER AS $$
BEGIN
    -- If branch_id is set but department_id is not, auto-populate it
    IF NEW.branch_id IS NOT NULL AND NEW.department_id IS NULL THEN
        SELECT department_id INTO NEW.department_id
        FROM branches
        WHERE id = NEW.branch_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate department when branch is set
DROP TRIGGER IF EXISTS trigger_auto_populate_student_department ON students;
CREATE TRIGGER trigger_auto_populate_student_department
    BEFORE INSERT OR UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_student_department();

-- Test the trigger by updating Student 2 with a branch
-- (This will automatically set the department_id)
-- UPDATE students 
-- SET branch_id = (SELECT id FROM branches WHERE name = 'Computer Science' LIMIT 1)
-- WHERE id = '8747f587-bc18-4a58-af39-c719d8e8bf94';
