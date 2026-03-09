-- ==============================================================================
-- CHECK STUDENT_ASSIGNMENTS TABLE SCHEMA
-- ==============================================================================

-- Check table structure
SELECT 
  'Column Info' as check_type,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'student_assignments'
ORDER BY ordinal_position;

-- Check if submitted_at column exists
SELECT 
  'Submitted At Column' as check_type,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'student_assignments' 
      AND column_name = 'submitted_at'
    ) THEN '✅ Column exists'
    ELSE '❌ Column missing - needs to be added'
  END as status;

-- Add submitted_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'student_assignments' 
    AND column_name = 'submitted_at'
  ) THEN
    ALTER TABLE student_assignments 
    ADD COLUMN submitted_at TIMESTAMPTZ;
    
    RAISE NOTICE '✅ Added submitted_at column';
  ELSE
    RAISE NOTICE '✅ submitted_at column already exists';
  END IF;
END $$;

-- Verify final schema
SELECT 
  'Final Schema' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'student_assignments'
  AND column_name IN ('student_id', 'assignment_id', 'status', 'submission_url', 'remarks', 'submitted_at', 'created_at')
ORDER BY ordinal_position;
