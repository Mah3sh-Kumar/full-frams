-- ==============================================================================
-- DIAGNOSE STORAGE UPLOAD ISSUES
-- ==============================================================================

-- 1. Check bucket configuration
SELECT 
  '1. Bucket Configuration' as check_type,
  id,
  name,
  public,
  file_size_limit / 1024 / 1024 as size_limit_mb,
  allowed_mime_types,
  avif_autodetection
FROM storage.buckets
WHERE id = 'student-submissions';

-- 2. Check storage policies
SELECT 
  '2. Storage Policies' as check_type,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%submission%'
ORDER BY cmd, policyname;

-- 3. Check if authenticated users can insert
SELECT 
  '3. INSERT Policy Check' as check_type,
  policyname,
  CASE 
    WHEN qual LIKE '%student%' THEN '✅ Has student role check'
    WHEN qual LIKE '%authenticated%' THEN '✅ Has authenticated check'
    ELSE '⚠️ No role restriction'
  END as policy_status
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND cmd = 'INSERT'
  AND policyname LIKE '%submission%';

-- 4. Check if bucket allows the PDF mime type
SELECT 
  '4. MIME Type Check' as check_type,
  CASE 
    WHEN 'application/pdf' = ANY(allowed_mime_types) THEN '✅ PDF allowed'
    WHEN allowed_mime_types IS NULL THEN '✅ All types allowed (NULL)'
    ELSE '❌ PDF not in allowed list'
  END as pdf_status,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'student-submissions';

-- 5. Test if we can see the bucket from storage schema
SELECT 
  '5. Bucket Visibility' as check_type,
  COUNT(*) as bucket_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Bucket visible'
    ELSE '❌ Bucket not found'
  END as status
FROM storage.buckets
WHERE id = 'student-submissions';

-- 6. Check RLS on storage.objects table
SELECT 
  '6. RLS Status' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'storage'
  AND tablename = 'objects';

-- 7. List all storage policies for debugging
SELECT 
  '7. All Storage Policies' as check_type,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY cmd, policyname;
