-- ==============================================================================
-- FRAMS · SUBJECT MANAGEMENT RPC FUNCTION
-- ==============================================================================
-- Migration : 20260224_soft_delete_subject_rpc.sql
-- Date      : 2026-02-24
-- Purpose   : Create soft_delete_subject RPC function for safe subject deletion with dependency checking
-- Spec      : .kiro/specs/subject-management
-- Requirements: 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 17.8, 22.1, 22.2, 22.3, 22.4, 22.5
-- ==============================================================================
-- This migration creates the soft_delete_subject RPC function which:
-- - Checks dependencies in attendance, timetable, and face_recognition_mappings tables
-- - If dependencies exist, returns error JSON with counts for each dependency type
-- - If no dependencies, updates subjects table setting deleted_at and deleted_by
-- - Returns JSON with success or error with dependency details
-- - Uses SECURITY DEFINER and transaction block for atomicity
-- ==============================================================================

BEGIN;

-- ============================================================
-- CREATE soft_delete_subject RPC FUNCTION
-- ============================================================

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
  v_timetable_count INTEGER;
  v_face_recognition_count INTEGER;
BEGIN
  -- Validate inputs
  IF p_subject_id IS NULL THEN
    RETURN json_build_object('error', 'Subject ID is required');
  END IF;
  
  IF p_deleted_by IS NULL THEN
    RETURN json_build_object('error', 'Deleted by user ID is required');
  END IF;
  
  -- Check dependencies in attendance table
  SELECT COUNT(*) INTO v_attendance_count
  FROM public.attendance
  WHERE subject_id = p_subject_id;
  
  -- Check dependencies in timetable table
  SELECT COUNT(*) INTO v_timetable_count
  FROM public.timetable
  WHERE subject_id = p_subject_id;
  
  -- Check dependencies in face_recognition_mappings table
  SELECT COUNT(*) INTO v_face_recognition_count
  FROM public.face_recognition_mappings
  WHERE subject_id = p_subject_id;
  
  -- If dependencies exist, return error with counts
  IF v_attendance_count > 0 OR v_timetable_count > 0 OR v_face_recognition_count > 0 THEN
    RETURN json_build_object(
      'error', 'Cannot delete subject: dependencies exist',
      'attendance_count', v_attendance_count,
      'timetable_count', v_timetable_count,
      'face_recognition_count', v_face_recognition_count
    );
  END IF;
  
  -- Perform soft delete
  UPDATE public.subjects
  SET deleted_at = now(),
      deleted_by = p_deleted_by
  WHERE id = p_subject_id AND deleted_at IS NULL;
  
  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Subject not found or already deleted');
  END IF;
  
  -- Return success
  RETURN json_build_object('success', true, 'error', null);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$;

-- ============================================================
-- ADD FUNCTION COMMENT
-- ============================================================

COMMENT ON FUNCTION public.soft_delete_subject(UUID, UUID) IS 
  'Soft deletes a subject by setting deleted_at and deleted_by fields. Checks for dependencies in attendance, timetable, and face_recognition_mappings tables before deletion. Returns JSON with success flag on success or error message with dependency counts on failure.';

COMMIT;

-- ==============================================================================
-- MIGRATION COMPLETE
-- ==============================================================================
-- The soft_delete_subject RPC function is now ready for use.
-- 
-- Function signature:
-- soft_delete_subject(
--   p_subject_id UUID,
--   p_deleted_by UUID
-- ) RETURNS JSON
-- 
-- Usage example:
-- SELECT soft_delete_subject(
--   'subject-uuid-here',
--   'admin-uuid-here'
-- );
-- 
-- Success response: {"success": true, "error": null}
-- Error response (no dependencies): {"error": "Subject not found or already deleted"}
-- Error response (with dependencies): {
--   "error": "Cannot delete subject: dependencies exist",
--   "attendance_count": 5,
--   "timetable_count": 3,
--   "face_recognition_count": 2
-- }
-- 
-- Note: This function performs a soft delete by setting deleted_at and deleted_by
-- fields rather than physically removing the record from the database.
-- ==============================================================================
