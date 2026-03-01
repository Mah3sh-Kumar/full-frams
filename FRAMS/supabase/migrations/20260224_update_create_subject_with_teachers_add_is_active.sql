-- ==============================================================================
-- FRAMS · SUBJECT MANAGEMENT RPC FUNCTION UPDATE
-- ==============================================================================
-- Migration : 20260224_update_create_subject_with_teachers_add_is_active.sql
-- Date      : 2026-02-24
-- Purpose   : Update create_subject_with_teachers RPC function to accept is_active parameter
-- Spec      : .kiro/specs/subject-management
-- Requirements: 18.1, 18.2
-- ==============================================================================
-- This migration updates the create_subject_with_teachers RPC function to:
-- - Accept p_is_active parameter (defaults to true)
-- - Use the provided is_active value instead of hardcoding to true
-- ==============================================================================

BEGIN;

-- ============================================================
-- UPDATE create_subject_with_teachers RPC FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_subject_with_teachers(
  p_name TEXT,
  p_code TEXT,
  p_class_id UUID,
  p_academic_year_id UUID,
  p_teacher_ids UUID[],
  p_primary_teacher_id UUID,
  p_created_by UUID,
  p_is_active BOOLEAN DEFAULT true
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $
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
  
  -- Insert subject with provided is_active value
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
    p_is_active, 
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
$;

-- ============================================================
-- UPDATE FUNCTION COMMENT
-- ============================================================

COMMENT ON FUNCTION public.create_subject_with_teachers(TEXT, TEXT, UUID, UUID, UUID[], UUID, UUID, BOOLEAN) IS 
  'Creates a new subject with multiple teacher assignments in a single transaction. Validates branch isolation, primary teacher membership, and handles all error cases. Accepts is_active parameter (defaults to true). Returns JSON with subject_id on success or error message on failure.';

COMMIT;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
