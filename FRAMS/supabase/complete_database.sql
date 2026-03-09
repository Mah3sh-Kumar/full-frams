-- ==============================================================================
-- FRAMS COMPLETE DATABASE SCHEMA
-- ==============================================================================
-- Generated: 2026-03-09
-- Purpose: Consolidated database schema from all migrations
-- ==============================================================================
-- This file contains the complete database schema for FRAMS including:
-- - Academic years and subjects management
-- - Teacher-subject assignments
-- - Assignment attachments
-- - Row Level Security policies
-- - Triggers and functions
-- - All migrations consolidated into a single file
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- PART 1: ACADEMIC YEARS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.academic_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_date_range CHECK (end_date > start_date)
);

-- Indexes for academic_years
CREATE INDEX IF NOT EXISTS idx_academic_years_is_current 
  ON public.academic_years(is_current) 
  WHERE is_current = true;

CREATE INDEX IF NOT EXISTS idx_academic_years_name 
  ON public.academic_years(name);

-- Trigger for updated_at
CREATE TRIGGER trigger_academic_years_updated_at
  BEFORE UPDATE ON public.academic_years
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

-- RLS Policies for academic_years
CREATE POLICY academic_years_select_authenticated
  ON public.academic_years FOR SELECT TO authenticated USING (true);

CREATE POLICY academic_years_select_anon
  ON public.academic_years FOR SELECT TO anon USING (true);

CREATE POLICY academic_years_insert_admin
  ON public.academic_years FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY academic_years_update_admin
  ON public.academic_years FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY academic_years_delete_admin
  ON public.academic_years FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'));

-- ==============================================================================
-- PART 2: SUBJECTS TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.subjects (
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
  
  CONSTRAINT unique_subject_per_class_year UNIQUE (class_id, code, academic_year_id)
);

-- Indexes for subjects
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON public.subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_subjects_academic_year_id ON public.subjects(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON public.subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_is_active ON public.subjects(is_active);
CREATE INDEX IF NOT EXISTS idx_subjects_deleted_at ON public.subjects(deleted_at);
CREATE INDEX IF NOT EXISTS idx_subjects_class_year_deleted 
  ON public.subjects(class_id, academic_year_id, deleted_at);

-- Trigger for updated_at
CREATE TRIGGER trigger_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subjects
CREATE POLICY subjects_admin_full
  ON public.subjects FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY subjects_teacher_read
  ON public.subjects FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'teacher')
    AND id IN (SELECT subject_id FROM subject_teachers WHERE teacher_id = auth.uid())
  );

CREATE POLICY subjects_student_read
  ON public.subjects FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = auth.uid())
    AND class_id IN (SELECT class_id FROM students WHERE id = auth.uid())
    AND is_active = true AND deleted_at IS NULL
  );

CREATE POLICY subjects_anon_read
  ON public.subjects FOR SELECT TO anon
  USING (is_active = true AND deleted_at IS NULL);

-- ==============================================================================
-- PART 3: SUBJECT_TEACHERS JUNCTION TABLE
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.subject_teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  assigned_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_subject_teacher UNIQUE (subject_id, teacher_id)
);

-- Indexes for subject_teachers
CREATE INDEX IF NOT EXISTS idx_subject_teachers_subject_id ON public.subject_teachers(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_teachers_teacher_id ON public.subject_teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subject_teachers_is_primary 
  ON public.subject_teachers(is_primary) WHERE is_primary = true;

-- Enable RLS
ALTER TABLE public.subject_teachers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subject_teachers
CREATE POLICY subject_teachers_admin_full
  ON public.subject_teachers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE POLICY subject_teachers_teacher_read
  ON public.subject_teachers FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'teacher')
    AND subject_teachers.teacher_id = auth.uid()
  );

-- Security definer function for student access
CREATE OR REPLACE FUNCTION public.subject_belongs_to_student_class(
  p_subject_id uuid,
  p_student_id uuid
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $
  SELECT EXISTS (
    SELECT 1 
    FROM subjects s
    INNER JOIN students st ON st.class_id = s.class_id
    WHERE s.id = p_subject_id
      AND st.id = p_student_id
      AND s.is_active = true
      AND s.deleted_at IS NULL
  );
$;

GRANT EXECUTE ON FUNCTION public.subject_belongs_to_student_class(uuid, uuid) TO authenticated;

CREATE POLICY subject_teachers_student_read
  ON public.subject_teachers FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM students s WHERE s.id = auth.uid())
    AND public.subject_belongs_to_student_class(subject_id, auth.uid())
  );

-- ==============================================================================
-- PART 4: ASSIGNMENT ATTACHMENTS
-- ==============================================================================

-- Add attachment columns to assignments table
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT,
ADD COLUMN IF NOT EXISTS attachment_type TEXT,
ADD COLUMN IF NOT EXISTS attachment_size INTEGER;

-- Index for attachment queries
CREATE INDEX IF NOT EXISTS idx_assignments_attachment_url 
  ON public.assignments(attachment_url) WHERE attachment_url IS NOT NULL;

-- Create storage bucket for assignment attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'assignment-attachments',
  'assignment-attachments',
  false,
  10485760,
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for assignment attachments
CREATE POLICY "Teachers can upload assignment attachments"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'assignment-attachments' AND
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'teacher')
  );

CREATE POLICY "Teachers can update their assignment attachments"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'assignment-attachments' AND
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'teacher')
  );

CREATE POLICY "Teachers can delete their assignment attachments"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'assignment-attachments' AND
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'teacher')
  );

CREATE POLICY "Students can view assignment attachments"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'assignment-attachments' AND
    (
      auth.uid() IN (SELECT id FROM public.users WHERE role = 'teacher')
      OR
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

-- ==============================================================================
-- PART 5: STORED PROCEDURES AND FUNCTIONS
-- ==============================================================================

-- Function: Create subject with teachers
CREATE OR REPLACE FUNCTION public.create_subject_with_teachers(
  p_name TEXT,
  p_code TEXT,
  p_class_id UUID,
  p_academic_year_id UUID,
  p_teacher_ids UUID[],
  p_primary_teacher_id UUID,
  p_created_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  v_subject_id UUID;
  v_teacher_id UUID;
BEGIN
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RETURN json_build_object('error', 'Subject name is required');
  END IF;
  
  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN json_build_object('error', 'Subject code is required');
  END IF;
  
  IF p_class_id IS NULL THEN
    RETURN json_build_object('error', 'Class ID is required');
  END IF;
  
  IF p_academic_year_id IS NULL THEN
    RETURN json_build_object('error', 'Academic year ID is required');
  END IF;
  
  IF p_teacher_ids IS NULL OR array_length(p_teacher_ids, 1) IS NULL THEN
    RETURN json_build_object('error', 'At least one teacher must be assigned');
  END IF;
  
  IF p_primary_teacher_id IS NULL THEN
    RETURN json_build_object('error', 'Primary teacher ID is required');
  END IF;
  
  IF p_created_by IS NULL THEN
    RETURN json_build_object('error', 'Created by user ID is required');
  END IF;
  
  IF NOT (p_primary_teacher_id = ANY(p_teacher_ids)) THEN
    RETURN json_build_object('error', 'Primary teacher must be in the teacher list');
  END IF;
  
  INSERT INTO public.subjects (
    name, code, class_id, academic_year_id, is_active, created_by
  ) VALUES (
    trim(p_name), trim(lower(p_code)), p_class_id, p_academic_year_id, true, p_created_by
  )
  RETURNING id INTO v_subject_id;
  
  FOREACH v_teacher_id IN ARRAY p_teacher_ids LOOP
    INSERT INTO public.subject_teachers (
      subject_id, teacher_id, is_primary, assigned_by, assigned_at
    ) VALUES (
      v_subject_id, v_teacher_id, v_teacher_id = p_primary_teacher_id, p_created_by, now()
    );
  END LOOP;
  
  RETURN json_build_object('subject_id', v_subject_id, 'error', null);
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('error', 'A subject with this code already exists for this class and academic year');
  WHEN foreign_key_violation THEN
    RETURN json_build_object('error', 'Invalid reference - the associated item does not exist');
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$;

-- Function: Update subject with teachers
CREATE OR REPLACE FUNCTION public.update_subject_with_teachers(
  p_subject_id UUID,
  p_name TEXT,
  p_code TEXT,
  p_class_id UUID,
  p_is_active BOOLEAN,
  p_teacher_ids UUID[],
  p_primary_teacher_id UUID,
  p_updated_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  v_teacher_id UUID;
  v_academic_year_id UUID;
BEGIN
  IF p_subject_id IS NULL THEN
    RETURN json_build_object('error', 'Subject ID is required');
  END IF;
  
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RETURN json_build_object('error', 'Subject name is required');
  END IF;
  
  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN json_build_object('error', 'Subject code is required');
  END IF;
  
  IF p_class_id IS NULL THEN
    RETURN json_build_object('error', 'Class ID is required');
  END IF;
  
  IF p_is_active IS NULL THEN
    RETURN json_build_object('error', 'Active status is required');
  END IF;
  
  IF p_teacher_ids IS NULL OR array_length(p_teacher_ids, 1) IS NULL THEN
    RETURN json_build_object('error', 'At least one teacher must be assigned');
  END IF;
  
  IF p_primary_teacher_id IS NULL THEN
    RETURN json_build_object('error', 'Primary teacher ID is required');
  END IF;
  
  IF p_updated_by IS NULL THEN
    RETURN json_build_object('error', 'Updated by user ID is required');
  END IF;
  
  SELECT academic_year_id INTO v_academic_year_id
  FROM public.subjects
  WHERE id = p_subject_id AND deleted_at IS NULL;
  
  IF v_academic_year_id IS NULL THEN
    RETURN json_build_object('error', 'Subject not found');
  END IF;
  
  IF NOT (p_primary_teacher_id = ANY(p_teacher_ids)) THEN
    RETURN json_build_object('error', 'Primary teacher must be in the teacher list');
  END IF;
  
  UPDATE public.subjects
  SET name = trim(p_name),
      code = trim(lower(p_code)),
      class_id = p_class_id,
      is_active = p_is_active,
      updated_by = p_updated_by,
      updated_at = now()
  WHERE id = p_subject_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Subject not found or already deleted');
  END IF;
  
  DELETE FROM public.subject_teachers WHERE subject_id = p_subject_id;
  
  FOREACH v_teacher_id IN ARRAY p_teacher_ids LOOP
    INSERT INTO public.subject_teachers (
      subject_id, teacher_id, is_primary, assigned_by, assigned_at
    ) VALUES (
      p_subject_id, v_teacher_id, v_teacher_id = p_primary_teacher_id, p_updated_by, now()
    );
  END LOOP;
  
  RETURN json_build_object('success', true, 'error', null);
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('error', 'A subject with this code already exists for this class and academic year');
  WHEN foreign_key_violation THEN
    RETURN json_build_object('error', 'Invalid reference - the associated item does not exist');
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$;

-- Function: Soft delete subject
CREATE OR REPLACE FUNCTION public.soft_delete_subject(
  p_subject_id UUID,
  p_deleted_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  v_attendance_count INTEGER;
BEGIN
  IF p_subject_id IS NULL THEN
    RETURN json_build_object('error', 'Subject ID is required');
  END IF;
  
  IF p_deleted_by IS NULL THEN
    RETURN json_build_object('error', 'Deleted by user ID is required');
  END IF;
  
  SELECT COUNT(*) INTO v_attendance_count
  FROM public.attendance
  WHERE subject_id = p_subject_id;
  
  IF v_attendance_count > 0 THEN
    RETURN json_build_object(
      'error', 'Cannot delete subject: dependencies exist',
      'attendance_count', v_attendance_count
    );
  END IF;
  
  UPDATE public.subjects
  SET deleted_at = now(),
      deleted_by = p_deleted_by
  WHERE id = p_subject_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Subject not found or already deleted');
  END IF;
  
  RETURN json_build_object('success', true, 'error', null);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$;

-- Function: Check subject dependencies
CREATE OR REPLACE FUNCTION public.check_subject_dependencies(
  p_subject_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  v_attendance_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_attendance_count
  FROM public.attendance
  WHERE subject_id = p_subject_id;
  
  RETURN json_build_object(
    'attendance_count', v_attendance_count,
    'has_dependencies', (v_attendance_count > 0)
  );
END;
$;

-- Function: Copy subjects for academic year
CREATE OR REPLACE FUNCTION public.copy_subjects_for_academic_year(
  p_source_year_id UUID,
  p_target_year_id UUID,
  p_created_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $
DECLARE
  v_subject RECORD;
  v_new_subject_id UUID;
  v_teacher RECORD;
  v_copied_count INTEGER := 0;
BEGIN
  IF p_source_year_id IS NULL THEN
    RETURN json_build_object('error', 'Source academic year ID is required');
  END IF;
  
  IF p_target_year_id IS NULL THEN
    RETURN json_build_object('error', 'Target academic year ID is required');
  END IF;
  
  IF p_created_by IS NULL THEN
    RETURN json_build_object('error', 'Created by user ID is required');
  END IF;
  
  IF p_source_year_id = p_target_year_id THEN
    RETURN json_build_object('error', 'Source and target academic years must be different');
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM public.subjects
    WHERE academic_year_id = p_target_year_id
    AND deleted_at IS NULL
  ) THEN
    RETURN json_build_object('error', 'Target academic year already has subjects');
  END IF;
  
  FOR v_subject IN
    SELECT * FROM public.subjects
    WHERE academic_year_id = p_source_year_id
    AND is_active = true
    AND deleted_at IS NULL
  LOOP
    INSERT INTO public.subjects (
      name, code, class_id, academic_year_id, is_active, created_by
    ) VALUES (
      v_subject.name, v_subject.code, v_subject.class_id, p_target_year_id, true, p_created_by
    )
    RETURNING id INTO v_new_subject_id;
    
    FOR v_teacher IN
      SELECT teacher_id, is_primary
      FROM public.subject_teachers
      WHERE subject_id = v_subject.id
    LOOP
      INSERT INTO public.subject_teachers (
        subject_id, teacher_id, is_primary, assigned_by, assigned_at
      ) VALUES (
        v_new_subject_id, v_teacher.teacher_id, v_teacher.is_primary, p_created_by, now()
      );
    END LOOP;
    
    v_copied_count := v_copied_count + 1;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'copied_count', v_copied_count,
    'error', null
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('error', 'Duplicate subject code detected during copy');
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$;

-- ==============================================================================
-- PART 6: TEACHER DEPARTMENT AUTO-SYNC
-- ==============================================================================

-- Add updated_at column to teachers table if missing
DO $
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'teachers' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.teachers ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $;

-- Safe version of update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column_safe()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = TG_TABLE_SCHEMA 
    AND table_name = TG_TABLE_NAME 
    AND column_name = 'updated_at'
  ) THEN
    NEW.updated_at = TIMEZONE('utc'::TEXT, NOW());
  END IF;
  RETURN NEW;
END;
$;

-- Function: Get department from subject
CREATE OR REPLACE FUNCTION public.get_department_from_subject(p_subject_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  v_department_name TEXT;
BEGIN
  SELECT d.name INTO v_department_name
  FROM public.subjects s
  INNER JOIN public.classes c ON c.id = s.class_id
  INNER JOIN public.branches b ON b.id = c.branch_id
  INNER JOIN public.org_departments d ON d.id = b.department_id
  WHERE s.id = p_subject_id;
  
  RETURN v_department_name;
END;
$;

-- Function: Sync teacher department (trigger function)
CREATE OR REPLACE FUNCTION public.sync_teacher_department()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  v_department_name TEXT;
  v_current_department TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT department INTO v_current_department
    FROM public.teachers
    WHERE id = NEW.teacher_id;
    
    IF v_current_department IS NULL 
       OR v_current_department = '' 
       OR v_current_department = 'Not assigned' THEN
      
      v_department_name := public.get_department_from_subject(NEW.subject_id);
      
      IF v_department_name IS NOT NULL THEN
        UPDATE public.teachers
        SET department = v_department_name
        WHERE id = NEW.teacher_id;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$;

-- Trigger: Auto-sync teacher department on subject assignment
DROP TRIGGER IF EXISTS trigger_sync_teacher_department ON public.subject_teachers;
CREATE TRIGGER trigger_sync_teacher_department
  AFTER INSERT ON public.subject_teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_teacher_department();

-- Function: Manually sync teacher department
CREATE OR REPLACE FUNCTION public.sync_teacher_department_manual(p_teacher_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $
DECLARE
  v_department_name TEXT;
BEGIN
  SELECT public.get_department_from_subject(st.subject_id) INTO v_department_name
  FROM public.subject_teachers st
  WHERE st.teacher_id = p_teacher_id
  LIMIT 1;
  
  IF v_department_name IS NULL THEN
    RETURN 'No subject assignments found for this teacher';
  END IF;
  
  UPDATE public.teachers
  SET department = v_department_name
  WHERE id = p_teacher_id;
  
  RETURN 'Department updated to: ' || v_department_name;
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'Error updating department: ' || SQLERRM;
END;
$;

-- ==============================================================================
-- PART 7: AUTO-CREATE ROLE PROFILES
-- ==============================================================================

-- Function: Auto-create role profile (trigger function)
CREATE OR REPLACE FUNCTION public.auto_create_role_profile()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $
BEGIN
  IF NEW.role = 'teacher' THEN
    INSERT INTO public.teachers (id, department)
    VALUES (NEW.id, 'Not assigned')
    ON CONFLICT (id) DO NOTHING;
  
  ELSIF NEW.role = 'student' THEN
    INSERT INTO public.students (id, enrollment_number, class_id, branch_id, department_id)
    VALUES (
      NEW.id, 
      'PENDING_' || SUBSTRING(NEW.id::text, 1, 8),
      NULL,
      NULL,
      NULL
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$;

-- Trigger: Auto-create role profiles on user insert
DROP TRIGGER IF EXISTS trigger_auto_create_role_profile ON public.users;
CREATE TRIGGER trigger_auto_create_role_profile
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_role_profile();

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- PART 8: BACKFILL EXISTING DATA
-- ==============================================================================

-- Backfill orphaned teachers
INSERT INTO public.teachers (id, department)
SELECT u.id, 'Not assigned'
FROM public.users u
WHERE u.role = 'teacher'
  AND NOT EXISTS (SELECT 1 FROM public.teachers t WHERE t.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Backfill orphaned students
INSERT INTO public.students (id, enrollment_number, class_id, branch_id, department_id)
SELECT 
  u.id, 
  'PENDING_' || SUBSTRING(u.id::text, 1, 8),
  NULL,
  NULL,
  NULL
FROM public.users u
WHERE u.role = 'student'
  AND NOT EXISTS (SELECT 1 FROM public.students s WHERE s.id = u.id)
ON CONFLICT (id) DO NOTHING;

-- Backfill teacher departments from subject assignments
UPDATE public.teachers t
SET department = (
  SELECT public.get_department_from_subject(st.subject_id)
  FROM public.subject_teachers st
  WHERE st.teacher_id = t.id
  LIMIT 1
)
WHERE (t.department IS NULL OR t.department = '' OR t.department = 'Not assigned')
  AND EXISTS (SELECT 1 FROM public.subject_teachers st WHERE st.teacher_id = t.id);

COMMIT;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- This consolidated schema includes:
-- ✅ Academic years table with RLS policies
-- ✅ Subjects table with soft delete and audit fields
-- ✅ Subject-teacher junction table
-- ✅ Assignment attachments support
-- ✅ Storage bucket and policies for file uploads
-- ✅ All stored procedures and functions
-- ✅ Teacher department auto-sync
-- ✅ Auto-create role profiles trigger
-- ✅ Backfill for existing data
-- ==============================================================================
