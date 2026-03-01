-- ==============================================================================
-- FRAMS · SUBJECT MANAGEMENT MIGRATION
-- ==============================================================================
-- Migration : 20260224_create_subjects_tables.sql
-- Date      : 2026-02-24
-- Purpose   : Create academic_years, subjects, and subject_teachers tables
-- Spec      : .kiro/specs/subject-management
-- Requirements: 3.9, 14.1, 14.2, 17.1, 17.2, 17.6, 18.1
-- ==============================================================================
-- This migration creates the academic_years, subjects, and subject_teachers
-- tables which are required for the subject management feature. The tables include:
-- - Academic years with unique names and date validation
-- - Subjects with comprehensive audit fields (created_by, updated_by, etc.)
-- - Subject-teacher junction table for many-to-many relationships
-- - Soft delete support (deleted_at, deleted_by)
-- - Academic year scoping for subjects
-- - Audit metadata for teacher assignments (assigned_by, assigned_at)
-- - Automatic timestamp management
-- - Performance indexes for common queries
-- ==============================================================================

BEGIN;

-- ============================================================
-- BLOCK 1 – CREATE academic_years TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraint: end_date must be after start_date
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- ============================================================
-- BLOCK 2 – CREATE INDEXES
-- ============================================================

-- Index for current year queries (frequently used to filter current academic year)
CREATE INDEX IF NOT EXISTS idx_academic_years_is_current 
  ON public.academic_years(is_current) 
  WHERE is_current = true;

-- Index for name lookups
CREATE INDEX IF NOT EXISTS idx_academic_years_name 
  ON public.academic_years(name);

-- ============================================================
-- BLOCK 3 – CREATE TRIGGER FOR updated_at
-- ============================================================

-- Create trigger to automatically update updated_at timestamp
-- Note: update_updated_at_column() function already exists from previous migrations
CREATE TRIGGER trigger_academic_years_updated_at
  BEFORE UPDATE ON public.academic_years
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- BLOCK 4 – ENABLE ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on academic_years table
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BLOCK 5 – CREATE RLS POLICIES
-- ============================================================

-- Policy: Authenticated users can read all academic years
CREATE POLICY academic_years_select_authenticated
  ON public.academic_years
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only admins can insert academic years
CREATE POLICY academic_years_insert_admin
  ON public.academic_years
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only admins can update academic years
CREATE POLICY academic_years_update_admin
  ON public.academic_years
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: Only admins can delete academic years
CREATE POLICY academic_years_delete_admin
  ON public.academic_years
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- BLOCK 6 – ADD COMMENTS FOR DOCUMENTATION
-- ============================================================

COMMENT ON TABLE public.academic_years IS 
  'Academic years for scoping subjects and other academic entities. Each year has a unique name, date range, and current year flag.';

COMMENT ON COLUMN public.academic_years.id IS 
  'Primary key UUID';

COMMENT ON COLUMN public.academic_years.name IS 
  'Unique academic year name (e.g., "2023-2024", "2024-2025")';

COMMENT ON COLUMN public.academic_years.start_date IS 
  'Start date of the academic year';

COMMENT ON COLUMN public.academic_years.end_date IS 
  'End date of the academic year (must be after start_date)';

COMMENT ON COLUMN public.academic_years.is_current IS 
  'Flag indicating if this is the current academic year. Only one year should be current at a time.';

COMMENT ON COLUMN public.academic_years.created_at IS 
  'Timestamp when the record was created';

COMMENT ON COLUMN public.academic_years.updated_at IS 
  'Timestamp when the record was last updated (automatically managed by trigger)';

COMMENT ON CONSTRAINT valid_date_range ON public.academic_years IS 
  'Ensures end_date is after start_date';

-- ============================================================
-- BLOCK 7 – DROP OLD subjects TABLE AND CREATE NEW ONE
-- ============================================================

-- Drop old subjects table (it has the wrong schema)
DROP TABLE IF EXISTS public.subjects CASCADE;

-- Create new subjects table with correct schema
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
  academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  updated_by UUID REFERENCES public.users(id) ON DELETE RESTRICT,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.users(id) ON DELETE RESTRICT,
  
  -- Unique constraint scoped by class, code, and academic year
  CONSTRAINT unique_subject_per_class_year UNIQUE (class_id, code, academic_year_id)
);

-- ============================================================
-- BLOCK 8 – CREATE INDEXES FOR subjects TABLE
-- ============================================================

-- Index for class lookups
CREATE INDEX idx_subjects_class_id 
  ON public.subjects(class_id);

-- Index for academic year lookups
CREATE INDEX idx_subjects_academic_year_id 
  ON public.subjects(academic_year_id);

-- Index for code lookups
CREATE INDEX idx_subjects_code 
  ON public.subjects(code);

-- Index for active status filtering
CREATE INDEX idx_subjects_is_active 
  ON public.subjects(is_active);

-- Index for soft delete filtering
CREATE INDEX idx_subjects_deleted_at 
  ON public.subjects(deleted_at);

-- Composite index for common queries (class + academic year + soft delete)
CREATE INDEX idx_subjects_class_year_deleted 
  ON public.subjects(class_id, academic_year_id, deleted_at);

-- ============================================================
-- BLOCK 9 – CREATE TRIGGER FOR subjects updated_at
-- ============================================================

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER trigger_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- BLOCK 10 – ADD COMMENTS FOR subjects TABLE
-- ============================================================

COMMENT ON TABLE public.subjects IS 
  'Academic subjects/courses taught within classes. Supports many-to-many relationships with teachers, academic year scoping, soft delete, and comprehensive audit trails.';

COMMENT ON COLUMN public.subjects.id IS 
  'Primary key UUID';

COMMENT ON COLUMN public.subjects.name IS 
  'Subject name (e.g., "Mathematics", "Physics")';

COMMENT ON COLUMN public.subjects.code IS 
  'Subject code - lowercase letters, numbers, and underscores only (e.g., "math_101", "physics_advanced")';

COMMENT ON COLUMN public.subjects.class_id IS 
  'Foreign key to classes table - the class this subject is associated with';

COMMENT ON COLUMN public.subjects.academic_year_id IS 
  'Foreign key to academic_years table - the academic year this subject belongs to (immutable after creation)';

COMMENT ON COLUMN public.subjects.is_active IS 
  'Active status flag - false indicates archived subject';

COMMENT ON COLUMN public.subjects.created_at IS 
  'Timestamp when the record was created';

COMMENT ON COLUMN public.subjects.updated_at IS 
  'Timestamp when the record was last updated (automatically managed by trigger)';

COMMENT ON COLUMN public.subjects.created_by IS 
  'Foreign key to users table - UUID of user who created the subject';

COMMENT ON COLUMN public.subjects.updated_by IS 
  'Foreign key to users table - UUID of user who last updated the subject';

COMMENT ON COLUMN public.subjects.deleted_at IS 
  'Soft delete timestamp - when the subject was marked as deleted';

COMMENT ON COLUMN public.subjects.deleted_by IS 
  'Foreign key to users table - UUID of user who deleted the subject';

COMMENT ON CONSTRAINT unique_subject_per_class_year ON public.subjects IS 
  'Ensures subject codes are unique within a class and academic year combination';

-- ============================================================
-- BLOCK 11 – CREATE subject_teachers JUNCTION TABLE
-- ============================================================

CREATE TABLE public.subject_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  assigned_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Unique constraint: a teacher can only be assigned to a subject once
  CONSTRAINT unique_subject_teacher UNIQUE (subject_id, teacher_id)
);

-- ============================================================
-- BLOCK 12 – CREATE INDEXES FOR subject_teachers TABLE
-- ============================================================

-- Index for subject lookups (find all teachers for a subject)
CREATE INDEX idx_subject_teachers_subject_id 
  ON public.subject_teachers(subject_id);

-- Index for teacher lookups (find all subjects for a teacher)
CREATE INDEX idx_subject_teachers_teacher_id 
  ON public.subject_teachers(teacher_id);

-- Index for primary teacher queries
CREATE INDEX idx_subject_teachers_is_primary 
  ON public.subject_teachers(is_primary) 
  WHERE is_primary = true;

-- ============================================================
-- BLOCK 13 – ADD COMMENTS FOR subject_teachers TABLE
-- ============================================================

COMMENT ON TABLE public.subject_teachers IS 
  'Junction table managing many-to-many relationships between subjects and teachers. Includes audit metadata for tracking who assigned teachers and when.';

COMMENT ON COLUMN public.subject_teachers.id IS 
  'Primary key UUID';

COMMENT ON COLUMN public.subject_teachers.subject_id IS 
  'Foreign key to subjects table - CASCADE on delete (when subject is deleted, assignments are removed)';

COMMENT ON COLUMN public.subject_teachers.teacher_id IS 
  'Foreign key to users table - CASCADE on delete (when teacher is deleted, assignments are removed)';

COMMENT ON COLUMN public.subject_teachers.is_primary IS 
  'Flag indicating if this teacher is the primary teacher for the subject';

COMMENT ON COLUMN public.subject_teachers.assigned_by IS 
  'Foreign key to users table - UUID of user who assigned this teacher to the subject (RESTRICT on delete to preserve audit trail)';

COMMENT ON COLUMN public.subject_teachers.assigned_at IS 
  'Timestamp when the teacher was assigned to the subject';

COMMENT ON COLUMN public.subject_teachers.created_at IS 
  'Timestamp when the record was created';

COMMENT ON CONSTRAINT unique_subject_teacher ON public.subject_teachers IS 
  'Ensures a teacher can only be assigned to a subject once';

-- ============================================================
-- BLOCK 14 – ENABLE ROW LEVEL SECURITY ON subjects
-- ============================================================

-- Enable RLS on subjects table
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BLOCK 15 – CREATE RLS POLICIES FOR subjects TABLE
-- ============================================================

-- Policy: Admins have full access to all subjects
CREATE POLICY subjects_admin_full
  ON public.subjects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Policy: Teachers can read subjects they are assigned to teach
CREATE POLICY subjects_teacher_read
  ON public.subjects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.role = 'teacher'
    )
    AND EXISTS (
      SELECT 1 FROM public.subject_teachers st
      WHERE st.subject_id = subjects.id
      AND st.teacher_id = auth.uid()
    )
  );

-- Policy: Students can read subjects for their assigned class
-- Only active and non-deleted subjects are visible to students
CREATE POLICY subjects_student_read
  ON public.subjects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = auth.uid() 
    )
    AND subjects.class_id = (SELECT class_id FROM public.students WHERE id = auth.uid())
    AND subjects.is_active = true
    AND subjects.deleted_at IS NULL
  );

-- ============================================================
-- BLOCK 16 – ENABLE ROW LEVEL SECURITY ON subject_teachers
-- ============================================================

-- Enable RLS on subject_teachers table
ALTER TABLE public.subject_teachers ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- BLOCK 17 – CREATE RLS POLICIES FOR subject_teachers TABLE
-- ============================================================

-- Policy: Admins have full access to subject-teacher assignments
CREATE POLICY subject_teachers_admin_full
  ON public.subject_teachers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    )
  );

-- Policy: Teachers can read their own subject assignments
CREATE POLICY subject_teachers_teacher_read
  ON public.subject_teachers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() 
      AND u.role = 'teacher'
    )
    AND subject_teachers.teacher_id = auth.uid()
  );

-- Policy: Students can read teacher assignments for subjects in their class
-- Only for active and non-deleted subjects
CREATE POLICY subject_teachers_student_read
  ON public.subject_teachers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM public.subjects subj
      WHERE subj.id = subject_teachers.subject_id
      AND subj.class_id = (SELECT class_id FROM public.students WHERE id = auth.uid())
      AND subj.is_active = true
      AND subj.deleted_at IS NULL
    )
  );

COMMIT;;
