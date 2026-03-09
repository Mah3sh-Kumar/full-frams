-- ==============================================================================
-- CREATE ASSIGNMENT ATTACHMENTS STORAGE BUCKET
-- ==============================================================================
-- This creates the storage bucket and policies for assignment attachments
-- ==============================================================================

-- Step 1: Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-attachments',
  'assignment-attachments',
  false,  -- Not public, requires authentication
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
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif'
  ];

-- Step 2: Create storage policies

-- Policy 1: Teachers can upload assignment attachments
DROP POLICY IF EXISTS "Teachers can upload assignment attachments" ON storage.objects;
CREATE POLICY "Teachers can upload assignment attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assignment-attachments' AND
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'teacher')
  );

-- Policy 2: Teachers can update their assignment attachments
DROP POLICY IF EXISTS "Teachers can update assignment attachments" ON storage.objects;
CREATE POLICY "Teachers can update assignment attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'assignment-attachments' AND
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'teacher')
  );

-- Policy 3: Teachers can delete their assignment attachments
DROP POLICY IF EXISTS "Teachers can delete assignment attachments" ON storage.objects;
CREATE POLICY "Teachers can delete assignment attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'assignment-attachments' AND
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'teacher')
  );

-- Policy 4: Students can view assignment attachments for their class
DROP POLICY IF EXISTS "Students can view assignment attachments" ON storage.objects;
CREATE POLICY "Students can view assignment attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'assignment-attachments' AND
    (
      -- Teachers can see all
      auth.uid() IN (SELECT id FROM public.users WHERE role = 'teacher')
      OR
      -- Admins can see all
      auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
      OR
      -- Students can see attachments for assignments in their class
      EXISTS (
        SELECT 1
        FROM public.assignments a
        INNER JOIN public.subjects sub ON sub.id = a.subject_id
        INNER JOIN public.students st ON st.class_id = sub.class_id
        WHERE st.id = auth.uid()
          AND a.attachment_url LIKE '%' || storage.objects.name || '%'
          AND sub.is_active = true
          AND sub.deleted_at IS NULL
      )
    )
  );

-- Step 3: Verify bucket was created
SELECT 
  'Bucket Status' as check_type,
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'assignment-attachments';

-- Step 4: Verify policies were created
SELECT 
  'Storage Policies' as check_type,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND policyname LIKE '%assignment%'
ORDER BY policyname;

-- ==============================================================================
-- AFTER RUNNING THIS:
-- ==============================================================================
-- 1. Teachers can now upload files when creating assignments
-- 2. Students can view/download attachments for their class assignments
-- 3. Files are stored securely with proper access control
-- ==============================================================================
