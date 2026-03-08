-- Drop the problematic policies
DROP POLICY IF EXISTS subjects_teacher_read ON subjects;
DROP POLICY IF EXISTS subjects_student_read ON subjects;

-- Recreate teacher read policy without circular dependency
-- Teachers can read subjects they're assigned to via subject_teachers
CREATE POLICY subjects_teacher_read ON subjects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users u 
    WHERE u.id = auth.uid() AND u.role = 'teacher'
  )
  AND id IN (
    SELECT subject_id 
    FROM subject_teachers 
    WHERE teacher_id = auth.uid()
  )
);

-- Recreate student read policy without circular dependency
-- Students can read active subjects in their class
CREATE POLICY subjects_student_read ON subjects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.id = auth.uid()
  )
  AND class_id IN (
    SELECT class_id 
    FROM students 
    WHERE id = auth.uid()
  )
  AND is_active = true 
  AND deleted_at IS NULL
);;
