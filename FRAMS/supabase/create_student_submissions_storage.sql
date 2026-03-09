-- ==============================================================================
-- CREATE STUDENT SUBMISSIONS STORAGE BUCKET
-- ==============================================================================

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-submissions',
  'student-submissions',
  true,  -- Public for easy access
  10485760,  -- 10MB limit
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Storage policies for student submissions

-- Students can upload their own submissions
DROP POLICY IF EXISTS "Students can upload submissions" ON storage.objects;
CREATE POLICY "Students can upload submissions"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'student-submissions' AND
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'student')
  );

-- Students can view their own submissions
DROP POLICY IF EXISTS "Students can view own submissions" ON storage.objects;
CREATE POLICY "Students can view own submissions"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-submissions' AND
    (
      auth.uid() IN (SELECT id FROM public.users WHERE role = 'student')
      OR auth.uid() IN (SELECT id FROM public.users WHERE role IN ('teacher', 'admin'))
    )
  );

-- Teachers can view all submissions
DROP POLICY IF EXISTS "Teachers can view all submissions" ON storage.objects;
CREATE POLICY "Teachers can view all submissions"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'student-submissions' AND
    auth.uid() IN (SELECT id FROM public.users WHERE role IN ('teacher', 'admin'))
  );

-- Verify bucket created
SELECT 
  'Bucket Status' as check_type,
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 as size_limit_mb
FROM storage.buckets
WHERE id = 'student-submissions';
