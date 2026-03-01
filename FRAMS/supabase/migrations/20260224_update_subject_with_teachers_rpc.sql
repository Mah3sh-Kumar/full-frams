-- ==============================================================================
-- FRAMS · SUBJECT MANAGEMENT RPC FUNCTION
-- ==============================================================================
-- Migration : 20260224_update_subject_with_teachers_rpc.sql
-- Date      : 2026-02-24
-- Purpose   : Create update_subject_with_teachers RPC function for transactional subject updates
-- Spec      : .kiro/specs/subject-management
-- Requirements: 4.4, 4.5, 14.6, 15.1, 15.2, 17.4, 17.7, 19.2, 19.3, 19.4, 19.5, 20.4
-- ==============================================================================
-- This migration creates the update_subject_with_teachers RPC function which:
-- - Gets current academic_year_id (immutable field - cannot be changed)
-- - Validates teacher branch_id matches class branch_id for all teachers
-- - Validates primary teacher is in the teacher list
-- - Updates subjects table with updated_by audit field (academic_year_id remains unchanged)
-- - Deletes existing subject_teachers records
-- - Inserts new subject_teachers records with is_primary flag, assigned_by, and assigned_at
-- - Returns JSON with success or error
-- - Handles unique_violation (23505) and foreign_key_violation (23503) errors
-- - Uses SECURITY DEFINER and transaction block for atomicity
-- ==============================================================================

BEGIN;

-- ============================================================
-- CREATE update_subject_with_teachers RPC FUNCTION
-- ============================================================

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
  v_class_branch_id UUID;
  v_teacher_branch_id UUID;
  v_academic_year_id UUID;
BEGIN
  -- Validate inputs
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
  
  -- Get current academic_year_id (immutable field)
  SELECT academic_year_id INTO v_academic_year_id
  FROM public.subjects
  WHERE id = p_subject_id AND deleted_at IS NULL;
  
  IF v_academic_year_id IS NULL THEN
    RETURN json_build_object('error', 'Subject not found');
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
  
  -- Update subject (academic_year_id is immutable and not updated)
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
  
  -- Delete existing teacher assignments
  DELETE FROM public.subject_teachers WHERE subject_id = p_subject_id;
  
  -- Insert new teacher assignments
  FOREACH v_teacher_id IN ARRAY p_teacher_ids LOOP
    INSERT INTO public.subject_teachers (
      subject_id, 
      teacher_id, 
      is_primary, 
      assigned_by, 
      assigned_at
    ) VALUES (
      p_subject_id, 
      v_teacher_id, 
      v_teacher_id = p_primary_teacher_id, 
      p_updated_by, 
      now()
    );
  END LOOP;
  
  -- Return success
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

-- ============================================================
-- ADD FUNCTION COMMENT
-- ============================================================

COMMENT ON FUNCTION public.update_subject_with_teachers(UUID, TEXT, TEXT, UUID, BOOLEAN, UUID[], UUID, UUID) IS 
  'Updates an existing subject with multiple teacher assignments in a single transaction. Preserves immutable academic_year_id, validates branch isolation, primary teacher membership, and handles all error cases. Returns JSON with success flag on success or error message on failure.';

COMMIT;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- The update_subject_with_teachers RPC function is now ready for use.
-- 
-- Function signature:
-- update_subject_with_teachers(
--   p_subject_id UUID,
--   p_name TEXT,
--   p_code TEXT,
--   p_class_id UUID,
--   p_is_active BOOLEAN,
--   p_teacher_ids UUID[],
--   p_primary_teacher_id UUID,
--   p_updated_by UUID
-- ) RETURNS JSON
-- 
-- Usage example:
-- SELECT update_subject_with_teachers(
--   'subject-uuid-here',
--   'Advanced Mathematics',
--   'math_advanced',
--   'class-uuid-here',
--   true,
--   ARRAY['teacher1-uuid', 'teacher2-uuid'],
--   'teacher1-uuid',
--   'admin-uuid-here'
-- );
-- 
-- Success response: {"success": true, "error": null}
-- Error response: {"error": "error message"}
-- 
-- Note: The academic_year_id field is immutable and cannot be changed after creation.
-- ==============================================================================
