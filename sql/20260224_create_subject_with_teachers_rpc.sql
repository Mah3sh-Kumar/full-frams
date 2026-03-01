-- ==============================================================================
-- FRAMS · SUBJECT MANAGEMENT RPC FUNCTION
-- ==============================================================================
-- Migration : 20260224_create_subject_with_teachers_rpc.sql
-- Date      : 2026-02-24
-- Purpose   : Create create_subject_with_teachers RPC function for transactional subject creation
-- Spec      : .kiro/specs/subject-management
-- Requirements: 3.8, 3.10, 3.12, 15.1, 15.2, 17.3, 17.7, 19.1, 19.3, 19.4, 19.5, 20.1, 20.2
-- ==============================================================================
-- This migration creates the create_subject_with_teachers RPC function which:
-- - Validates teacher branch_id matches class branch_id for all teachers
-- - Validates primary teacher is in the teacher list
-- - Inserts into subjects table with created_by audit field
-- - Inserts into subject_teachers table for each teacher with is_primary flag
-- - Returns JSON with subject_id or error
-- - Handles unique_violation (23505) and foreign_key_violation (23503) errors
-- - Uses SECURITY DEFINER and transaction block for atomicity
-- ==============================================================================

BEGIN;

-- ============================================================
-- CREATE create_subject_with_teachers RPC FUNCTION
-- ============================================================

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
AS $$
DECLARE
  v_subject_id UUID;
  v_teacher_id UUID;
  v_class_branch_id UUID;
  v_teacher_branch_id UUID;
BEGIN
  -- Validate inputs
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
  
  -- Get class branch_id
  SELECT branch_id INTO v_class_branch_id
  FROM public.classes
  WHERE id = p_class_id;
  
  IF v_class_branch_id IS NULL THEN
    RETURN json_build_object('error', 'Invalid class reference');
  END IF;
  
  -- Validate all teachers belong to same branch as the class
  FOREACH v_teacher_id IN ARRAY p_teacher_ids LOOP
    SELECT branch_id INTO v_teacher_branch_id
    FROM public.users
    WHERE id = v_teacher_id AND role = 'teacher';
    
    IF v_teacher_branch_id IS NULL THEN
      RETURN json_build_object('error', 'Invalid teacher reference: ' || v_teacher_id);
    END IF;
    
    IF v_teacher_branch_id != v_class_branch_id THEN
      RETURN json_build_object('error', 'Cannot assign teacher: teacher belongs to a different branch');
    END IF;
  END LOOP;
  
  -- Validate primary teacher is in the teacher list
  IF NOT (p_primary_teacher_id = ANY(p_teacher_ids)) THEN
    RETURN json_build_object('error', 'Primary teacher must be in the teacher list');
  END IF;
  
  -- Insert subject
  INSERT INTO public.subjects (
    name, 
    code, 
    class_id, 
    academic_year_id, 
    is_active, 
    created_by
  ) VALUES (
    trim(p_name), 
    trim(lower(p_code)), 
    p_class_id, 
    p_academic_year_id, 
    true, 
    p_created_by
  )
  RETURNING id INTO v_subject_id;
  
  -- Insert teacher assignments
  FOREACH v_teacher_id IN ARRAY p_teacher_ids LOOP
    INSERT INTO public.subject_teachers (
      subject_id, 
      teacher_id, 
      is_primary, 
      assigned_by, 
      assigned_at
    ) VALUES (
      v_subject_id, 
      v_teacher_id, 
      v_teacher_id = p_primary_teacher_id, 
      p_created_by, 
      now()
    );
  END LOOP;
  
  -- Return success with subject_id
  RETURN json_build_object('subject_id', v_subject_id, 'error', null);
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object('error', 'A subject with this code already exists for this class and academic year');
  WHEN foreign_key_violation THEN
    RETURN json_build_object('error', 'Invalid reference - the associated item does not exist');
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- ============================================================
-- ADD FUNCTION COMMENT
-- ============================================================

COMMENT ON FUNCTION public.create_subject_with_teachers(TEXT, TEXT, UUID, UUID, UUID[], UUID, UUID) IS 
  'Creates a new subject with multiple teacher assignments in a single transaction. Validates branch isolation, primary teacher membership, and handles all error cases. Returns JSON with subject_id on success or error message on failure.';

COMMIT;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- The create_subject_with_teachers RPC function is now ready for use.
-- 
-- Function signature:
-- create_subject_with_teachers(
--   p_name TEXT,
--   p_code TEXT,
--   p_class_id UUID,
--   p_academic_year_id UUID,
--   p_teacher_ids UUID[],
--   p_primary_teacher_id UUID,
--   p_created_by UUID
-- ) RETURNS JSON
-- 
-- Usage example:
-- SELECT create_subject_with_teachers(
--   'Mathematics',
--   'math_101',
--   'class-uuid-here',
--   'academic-year-uuid-here',
--   ARRAY['teacher1-uuid', 'teacher2-uuid'],
--   'teacher1-uuid',
--   'admin-uuid-here'
-- );
-- 
-- Success response: {"subject_id": "uuid", "error": null}
-- Error response: {"error": "error message"}
-- ==============================================================================
