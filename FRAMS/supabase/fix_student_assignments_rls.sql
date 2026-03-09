-- ==============================================================================
-- FIX STUDENT_ASSIGNMENTS RLS POLICIES
-- ==============================================================================

-- Check current policies
SELECT 
  'Current Policies' as check_type,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'student_assignments'
ORDER BY cmd, policyname;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view own assignments" ON student_assignments;
DROP POLICY IF EXISTS "Students can insert own submissions" ON student_assignments;
DROP POLICY IF EXISTS "Students can update own submissions" ON student_assignments;
DROP POLICY IF EXISTS "Teachers can view all submissions" ON student_assignments;
DROP POLICY IF EXISTS "Teachers can update submissions" ON student_assignments;
DROP POLICY IF EXISTS "Admins have full access" ON student_assignments;

-- Enable RLS
ALTER TABLE student_assignments ENABLE ROW LEVEL SECURITY;

-- Policy 1: Students can view their own assignment records
CREATE POLICY "Students can view own assignments"
  ON student_assignments
  FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid() AND
    auth.uid() IN (SELECT id FROM users WHERE role = 'student')
  );

-- Policy 2: Students can insert their own submissions (UPSERT needs INSERT)
CREATE POLICY "Students can insert own submissions"
  ON student_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    student_id = auth.uid() AND
    auth.uid() IN (SELECT id FROM users WHERE role = 'student')
  );

-- Policy 3: Students can update their own submissions (UPSERT needs UPDATE)
CREATE POLICY "Students can update own submissions"
  ON student_assignments
  FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid() AND
    auth.uid() IN (SELECT id FROM users WHERE role = 'student')
  )
  WITH CHECK (
    student_id = auth.uid() AND
    auth.uid() IN (SELECT id FROM users WHERE role = 'student')
  );

-- Policy 4: Teachers can view all submissions
CREATE POLICY "Teachers can view all submissions"
  ON student_assignments
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('teacher', 'admin'))
  );

-- Policy 5: Teachers can update submissions (for grading)
CREATE POLICY "Teachers can update submissions"
  ON student_assignments
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('teacher', 'admin'))
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role IN ('teacher', 'admin'))
  );

-- Policy 6: Admins have full access
CREATE POLICY "Admins have full access"
  ON student_assignments
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  )
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- Verify new policies
SELECT 
  'New Policies' as check_type,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'student_assignments'
ORDER BY cmd, policyname;

-- Test query to verify student can see their own records
SELECT 
  'Policy Test' as check_type,
  'Run this as a student user to verify' as note;
