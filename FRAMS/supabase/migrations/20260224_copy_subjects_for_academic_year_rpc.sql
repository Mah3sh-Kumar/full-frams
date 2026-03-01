-- ==============================================================================
-- FRAMS · SUBJECT MANAGEMENT RPC FUNCTION
-- ==============================================================================
-- Migration : 20260224_copy_subjects_for_academic_year_rpc.sql
-- Date      : 2026-02-24
-- Purpose   : Create copy_subjects_for_academic_year RPC function for academic year transition
-- Spec      : .kiro/specs/subject-management
-- Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7, 23.8, 23.9
-- ==============================================================================
-- This migration creates the copy_subjects_for_academic_year RPC function which:
-- - Validates target year doesn't already have subjects
-- - Loops through all active, non-deleted subjects from source year
-- - For each subject, inserts new record with target academic_year_id and created_by
-- - Copies all teacher assignments from subject_teachers with assigned_by and assigned_at
-- - Sets is_active=true for all copied subjects
-- - Returns JSON with copied_count or error
-- - Handles unique_violation errors
-- - Uses SECURITY DEFINER and transaction block for atomicity
-- ==============================================================================

BEGIN;

-- ============================================================
-- CREATE copy_subjects_for_academic_year RPC FUNCTION
-- ============================================================

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
  -- Validate inputs
  IF p_source_year_id IS NULL THEN
    RETURN json_build_object('error', 'Source academic year ID is required');
  END IF;
  
  IF p_target_year_id IS NULL THEN
    RETURN json_build_object('error', 'Target academic year ID is required');
  END IF;
  
  IF p_created_by IS NULL THEN
    RETURN json_build_object('error', 'Created by user ID is required');
  END IF;
  
  -- Validate source and target are different
  IF p_source_year_id = p_target_year_id THEN
    RETURN json_build_object('error', 'Source and target academic years must be different');
  END IF;
  
  -- Validate target year doesn't already have subjects
  IF EXISTS (
    SELECT 1 FROM public.subjects
    WHERE academic_year_id = p_target_year_id
    AND deleted_at IS NULL
  ) THEN
    RETURN json_build_object('error', 'Target academic year already has subjects');
  END IF;
  
  -- Copy all active subjects from source year
  FOR v_subject IN
    SELECT * FROM public.subjects
    WHERE academic_year_id = p_source_year_id
    AND is_active = true
    AND deleted_at IS NULL
  LOOP
    -- Insert new subject
    INSERT INTO public.subjects (
      name, code, class_id, academic_year_id, is_active, created_by
    ) VALUES (
      v_subject.name, v_subject.code, v_subject.class_id, p_target_year_id, true, p_created_by
    )
    RETURNING id INTO v_new_subject_id;
    
    -- Copy teacher assignments
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

-- ============================================================
-- ADD FUNCTION COMMENT
-- ============================================================

COMMENT ON FUNCTION public.copy_subjects_for_academic_year(UUID, UUID, UUID) IS 
  'Copies all active subjects from a source academic year to a target academic year. Validates that the target year does not already have subjects. Copies subject details and all teacher assignments. Returns JSON with copied_count on success or error message on failure.';

COMMIT;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- The copy_subjects_for_academic_year RPC function is now ready for use.
-- 
-- Function signature:
-- copy_subjects_for_academic_year(
--   p_source_year_id UUID,
--   p_target_year_id UUID,
--   p_created_by UUID
-- ) RETURNS JSON
-- 
-- Usage example:
-- SELECT copy_subjects_for_academic_year(
--   'source-year-uuid-here',
--   'target-year-uuid-here',
--   'admin-uuid-here'
-- );
-- 
-- Success response: {
--   "success": true,
--   "copied_count": 15,
--   "error": null
-- }
-- 
-- Error responses:
-- - {"error": "Source academic year ID is required"}
-- - {"error": "Target academic year ID is required"}
-- - {"error": "Created by user ID is required"}
-- - {"error": "Source and target academic years must be different"}
-- - {"error": "Target academic year already has subjects"}
-- - {"error": "Duplicate subject code detected during copy"}
-- 
-- Note: This function copies all active, non-deleted subjects from the source year
-- to the target year, including all teacher assignments. All copied subjects are
-- set to is_active=true. The function uses a transaction to ensure atomicity.
-- ==============================================================================
