-- ==============================================================================
-- VERIFY TEACHER CAN SEE STUDENT SUBMISSIONS
-- ==============================================================================

-- 1. Check if there are any submissions
SELECT 
  '1. Submission Count' as check_type,
  COUNT(*) as total_submissions,
  COUNT(CASE WHEN status = 'submitted' THEN 1 END) as submitted_count,
  COUNT(CASE WHEN status = 'graded' THEN 1 END) as graded_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
FROM student_assignments;

-- 2. Check recent submissions with details
SELECT 
  '2. Recent Submissions' as check_type,
  sa.id,
  sa.assignment_id,
  sa.student_id,
  sa.status,
  sa.submission_url,
  sa.remarks as student_notes,
  sa.teacher_remarks,
  sa.score,
  sa.submitted_at,
  sa.graded_at,
  u.full_name as student_name,
  s.enrollment_number,
  a.title as assignment_title
FROM student_assignments sa
LEFT JOIN students s ON sa.student_id = s.id
LEFT JOIN users u ON s.id = u.id
LEFT JOIN assignments a ON sa.assignment_id = a.id
WHERE sa.status IN ('submitted', 'graded')
ORDER BY sa.submitted_at DESC
LIMIT 10;

-- 3. Check RLS policies for student_assignments
SELECT 
  '3. RLS Policies' as check_type,
  policyname,
  cmd,
  roles,
  CASE 
    WHEN policyname LIKE '%teacher%' OR policyname LIKE '%Teacher%' THEN '✅ Teacher policy'
    WHEN policyname LIKE '%student%' OR policyname LIKE '%Student%' THEN '✅ Student policy'
    ELSE '⚠️ Other policy'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'student_assignments'
ORDER BY cmd, policyname;

-- 4. Check if submission URLs are accessible
SELECT 
  '4. Submission URLs' as check_type,
  sa.id,
  u.full_name as student_name,
  a.title as assignment_title,
  sa.submission_url,
  CASE 
    WHEN sa.submission_url IS NULL THEN '❌ No file uploaded'
    WHEN sa.submission_url LIKE '%student-submissions%' THEN '✅ Valid storage URL'
    ELSE '⚠️ Unexpected URL format'
  END as url_status
FROM student_assignments sa
LEFT JOIN students s ON sa.student_id = s.id
LEFT JOIN users u ON s.id = u.id
LEFT JOIN assignments a ON sa.assignment_id = a.id
WHERE sa.status IN ('submitted', 'graded')
ORDER BY sa.submitted_at DESC
LIMIT 5;

-- 5. Check storage bucket policies for teachers
SELECT 
  '5. Storage Policies for Teachers' as check_type,
  policyname,
  cmd,
  CASE 
    WHEN qual LIKE '%teacher%' OR qual LIKE '%admin%' THEN '✅ Teacher/Admin access'
    ELSE '⚠️ No teacher access'
  END as access_status
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%submission%'
ORDER BY cmd;
