-- ==============================================================================
-- ADD TEACHER_REMARKS AND GRADED_AT COLUMNS TO STUDENT_ASSIGNMENTS
-- ==============================================================================

-- Check current schema
SELECT 
  'Current Schema' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'student_assignments'
  AND column_name IN ('remarks', 'teacher_remarks', 'graded_at', 'submitted_at')
ORDER BY ordinal_position;

-- Add teacher_remarks column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_assignments' 
    AND column_name = 'teacher_remarks'
  ) THEN
    ALTER TABLE student_assignments 
    ADD COLUMN teacher_remarks TEXT;
    
    RAISE NOTICE '✅ Added teacher_remarks column';
  ELSE
    RAISE NOTICE '✅ teacher_remarks column already exists';
  END IF;
END $$;

-- Add graded_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_assignments' 
    AND column_name = 'graded_at'
  ) THEN
    ALTER TABLE student_assignments 
    ADD COLUMN graded_at TIMESTAMPTZ;
    
    RAISE NOTICE '✅ Added graded_at column';
  ELSE
    RAISE NOTICE '✅ graded_at column already exists';
  END IF;
END $$;

-- Add comments for clarity
COMMENT ON COLUMN student_assignments.remarks IS 'Student notes/comments when submitting';
COMMENT ON COLUMN student_assignments.teacher_remarks IS 'Teacher feedback when grading';
COMMENT ON COLUMN student_assignments.submitted_at IS 'When student submitted the assignment';
COMMENT ON COLUMN student_assignments.graded_at IS 'When teacher graded the assignment';

-- Verify final schema
SELECT 
  'Final Schema' as check_type,
  column_name,
  data_type,
  is_nullable,
  col_description('student_assignments'::regclass, ordinal_position) as description
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'student_assignments'
  AND column_name IN ('remarks', 'teacher_remarks', 'graded_at', 'submitted_at', 'score', 'status')
ORDER BY ordinal_position;
