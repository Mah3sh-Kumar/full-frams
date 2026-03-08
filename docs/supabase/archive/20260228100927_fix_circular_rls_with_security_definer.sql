
-- Create a security definer function that bypasses RLS
-- This function checks if a subject belongs to a student's class
CREATE OR REPLACE FUNCTION public.subject_belongs_to_student_class(
  p_subject_id uuid,
  p_student_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM subjects s
    INNER JOIN students st ON st.class_id = s.class_id
    WHERE s.id = p_subject_id
      AND st.id = p_student_id
      AND s.is_active = true
      AND s.deleted_at IS NULL
  );
$$;

-- Drop and recreate the subject_teachers_student_read policy
DROP POLICY IF EXISTS subject_teachers_student_read ON subject_teachers;

CREATE POLICY subject_teachers_student_read ON subject_teachers
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s 
    WHERE s.id = auth.uid()
  )
  AND public.subject_belongs_to_student_class(subject_id, auth.uid())
);

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.subject_belongs_to_student_class(uuid, uuid) TO authenticated;
;
