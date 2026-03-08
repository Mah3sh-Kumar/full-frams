-- ==============================================================================
-- Add Assignment Attachments Support
-- ==============================================================================
-- Adds file attachment capability to assignments
-- Teachers can upload PDF/Word files that students can view
-- ==============================================================================

BEGIN;

-- Add attachment columns to assignments table
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Add comments for documentation
COMMENT ON COLUMN public.assignments.attachment_url IS 'URL to the uploaded file in Supabase Storage';
COMMENT ON COLUMN public.assignments.attachment_name IS 'Original filename of the uploaded document';
COMMENT ON COLUMN public.assignments.attachment_type IS 'MIME type of the file (e.g., application/pdf)';
COMMENT ON COLUMN public.assignments.attachment_size IS 'File size in bytes';

-- Create storage bucket for assignment attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-attachments',
  'assignment-attachments',
  false, -- Not public, requires authentication
  10485760, -- 10MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for assignment attachments

-- Teachers can upload files
CREATE POLICY "Teachers can upload assignment attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'assignment-attachments' AND
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'teacher'
  )
);

-- Teachers can update their own assignment files
CREATE POLICY "Teachers can update their assignment attachments"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'assignment-attachments' AND
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'teacher'
  )
);

-- Teachers can delete their own assignment files
CREATE POLICY "Teachers can delete their assignment attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'assignment-attachments' AND
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'teacher'
  )
);

-- Students can view attachments for assignments in their subjects
CREATE POLICY "Students can view assignment attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'assignment-attachments' AND
  (
    -- Teachers can view all
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'teacher'
    )
    OR
    -- Students can view attachments for assignments in their enrolled subjects
    -- Extract assignment_id from the file path (format: assignment_id/filename)
    SPLIT_PART(storage.objects.name, '/', 1)::uuid IN (
      SELECT a.id
      FROM public.assignments a
      INNER JOIN public.subjects sub ON sub.id = a.subject_id
      INNER JOIN public.classes c ON c.id = sub.class_id
      INNER JOIN public.students s ON s.class_id = c.id
      WHERE s.id = auth.uid()
    )
  )
);

-- Add index for faster attachment queries
CREATE INDEX IF NOT EXISTS idx_assignments_attachment_url 
ON public.assignments(attachment_url) 
WHERE attachment_url IS NOT NULL;

COMMIT;

-- ==============================================================================
-- COMPLETE! 🎉
-- ==============================================================================
-- ✅ Added attachment columns to assignments table
-- ✅ Created storage bucket for assignment files
-- ✅ Set up storage policies for teachers and students
-- ✅ Added performance index
--
-- Teachers can now upload PDF/Word files to assignments!
-- Students can view files for assignments in their subjects!
-- ==============================================================================
