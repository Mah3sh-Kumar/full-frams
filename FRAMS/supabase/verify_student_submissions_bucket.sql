-- ==============================================================================
-- VERIFY STUDENT SUBMISSIONS STORAGE BUCKET
-- ==============================================================================

-- Check if bucket exists
SELECT 
  'Bucket Status' as check_type,
  id,
  name,
  public,
  CASE 
    WHEN public THEN '✅ Public - URLs will work'
    ELSE '❌ Private - URLs will fail'
  END as status,
  file_size_limit / 1024 / 1024 as size_limit_mb
FROM storage.buckets
WHERE id = 'student-submissions';

-- Check storage policies
SELECT 
  'Storage Policies' as check_type,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%submission%'
ORDER BY policyname;

-- If bucket doesn't exist, create it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'student-submissions') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'student-submissions',
      'student-submissions',
      true,
      10485760,
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
    );
    RAISE NOTICE '✅ Created student-submissions bucket';
  ELSE
    -- Update to ensure it's public
    UPDATE storage.buckets 
    SET public = true,
        file_size_limit = 10485760
    WHERE id = 'student-submissions';
    RAISE NOTICE '✅ Updated student-submissions bucket to public';
  END IF;
END $$;

-- Verify final status
SELECT 
  'Final Status' as check_type,
  id,
  name,
  public,
  CASE 
    WHEN public THEN '✅ Ready for uploads'
    ELSE '❌ Needs to be public'
  END as status
FROM storage.buckets
WHERE id = 'student-submissions';
