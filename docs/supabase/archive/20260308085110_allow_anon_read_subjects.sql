-- Allow anonymous users to read active subjects
-- This is needed for tests and public-facing features that need to query subjects
CREATE POLICY "subjects_anon_read"
ON public.subjects
FOR SELECT
TO anon
USING (is_active = true AND deleted_at IS NULL);;
