-- ==============================================================================
-- SIMPLE FIX FOR FOREIGN KEY RELATIONSHIPS
-- ==============================================================================
-- Run this in Supabase SQL Editor to fix PostgREST embedded resource queries
-- ==============================================================================

-- Fix attendance table foreign keys
ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_subject_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_subject_id_fkey 
  FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE RESTRICT;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_student_id_fkey;
ALTER TABLE public.attendance ADD CONSTRAINT attendance_student_id_fkey 
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;

-- Fix assignments table foreign keys
ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_subject_id_fkey;
ALTER TABLE public.assignments ADD CONSTRAINT assignments_subject_id_fkey 
  FOREIGN KEY (subject_id) REFERENCES public.subjects(id) ON DELETE RESTRICT;

ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_created_by_fkey;
ALTER TABLE public.assignments ADD CONSTRAINT assignments_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE RESTRICT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_subject_id ON public.attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON public.assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON public.assignments(created_by);

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- Verify foreign keys
SELECT 
  tc.table_name, 
  tc.constraint_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('attendance', 'assignments')
ORDER BY tc.table_name, tc.constraint_name;
