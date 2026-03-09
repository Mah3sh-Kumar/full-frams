-- ==============================================================================
-- FIX FOREIGN KEY RELATIONSHIPS FOR POSTGREST
-- ==============================================================================
-- This migration ensures all foreign key relationships are properly defined
-- and recognized by PostgREST for embedded resource queries
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- PART 1: ENSURE ATTENDANCE TABLE HAS PROPER FOREIGN KEYS
-- ==============================================================================

-- Drop existing foreign key if it exists (to recreate with proper naming)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendance_subject_id_fkey' 
        AND table_name = 'attendance'
    ) THEN
        ALTER TABLE public.attendance DROP CONSTRAINT attendance_subject_id_fkey;
    END IF;
END $$;

-- Add foreign key constraint for attendance -> subjects
ALTER TABLE public.attendance
ADD CONSTRAINT attendance_subject_id_fkey 
FOREIGN KEY (subject_id) 
REFERENCES public.subjects(id) 
ON DELETE RESTRICT;

-- Add foreign key constraint for attendance -> students
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'attendance_student_id_fkey' 
        AND table_name = 'attendance'
    ) THEN
        ALTER TABLE public.attendance
        ADD CONSTRAINT attendance_student_id_fkey 
        FOREIGN KEY (student_id) 
        REFERENCES public.students(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- ==============================================================================
-- PART 2: ENSURE ASSIGNMENTS TABLE HAS PROPER FOREIGN KEYS
-- ==============================================================================

-- Drop existing foreign key if it exists (to recreate with proper naming)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assignments_subject_id_fkey' 
        AND table_name = 'assignments'
    ) THEN
        ALTER TABLE public.assignments DROP CONSTRAINT assignments_subject_id_fkey;
    END IF;
END $$;

-- Add foreign key constraint for assignments -> subjects
ALTER TABLE public.assignments
ADD CONSTRAINT assignments_subject_id_fkey 
FOREIGN KEY (subject_id) 
REFERENCES public.subjects(id) 
ON DELETE RESTRICT;

-- Add foreign key constraint for assignments -> users (created_by)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'assignments_created_by_fkey' 
        AND table_name = 'assignments'
    ) THEN
        ALTER TABLE public.assignments
        ADD CONSTRAINT assignments_created_by_fkey 
        FOREIGN KEY (created_by) 
        REFERENCES public.users(id) 
        ON DELETE RESTRICT;
    END IF;
END $$;

-- ==============================================================================
-- PART 3: CREATE INDEXES FOR BETTER QUERY PERFORMANCE
-- ==============================================================================

-- Indexes for attendance table
CREATE INDEX IF NOT EXISTS idx_attendance_subject_id ON public.attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);

-- Indexes for assignments table
CREATE INDEX IF NOT EXISTS idx_assignments_subject_id ON public.assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignments_created_by ON public.assignments(created_by);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);

-- ==============================================================================
-- PART 4: REFRESH POSTGREST SCHEMA CACHE
-- ==============================================================================

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

COMMIT;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- This migration ensures:
-- ✅ attendance.subject_id -> subjects.id foreign key
-- ✅ attendance.student_id -> students.id foreign key
-- ✅ assignments.subject_id -> subjects.id foreign key
-- ✅ assignments.created_by -> users.id foreign key
-- ✅ Proper indexes for query performance
-- ✅ PostgREST schema cache refresh
-- ==============================================================================
