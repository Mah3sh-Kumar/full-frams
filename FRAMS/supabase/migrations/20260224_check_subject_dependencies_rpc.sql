-- Migration: Create check_subject_dependencies RPC function
-- Description: Creates a function to check if a subject has dependencies in attendance, timetable, or face_recognition_mappings tables
-- Requirements: 22.1, 22.2, 22.3, 22.4, 22.5

-- Drop function if exists (for idempotency)
DROP FUNCTION IF EXISTS public.check_subject_dependencies(UUID);

-- Create check_subject_dependencies function
CREATE OR REPLACE FUNCTION public.check_subject_dependencies(
  p_subject_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attendance_count INTEGER;
  v_timetable_count INTEGER;
  v_face_recognition_count INTEGER;
BEGIN
  -- Query attendance table for count of records with subject_id
  SELECT COUNT(*) INTO v_attendance_count
  FROM public.attendance
  WHERE subject_id = p_subject_id;
  
  -- Query timetable table for count of entries with subject_id
  SELECT COUNT(*) INTO v_timetable_count
  FROM public.timetable
  WHERE subject_id = p_subject_id;
  
  -- Query face_recognition_mappings table for count of records with subject_id
  SELECT COUNT(*) INTO v_face_recognition_count
  FROM public.face_recognition_mappings
  WHERE subject_id = p_subject_id;
  
  -- Return JSON with counts and has_dependencies flag
  RETURN json_build_object(
    'attendance_count', v_attendance_count,
    'timetable_count', v_timetable_count,
    'face_recognition_count', v_face_recognition_count,
    'has_dependencies', (v_attendance_count > 0 OR v_timetable_count > 0 OR v_face_recognition_count > 0)
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_subject_dependencies(UUID) TO authenticated;

-- Add comment to function
COMMENT ON FUNCTION public.check_subject_dependencies(UUID) IS 
  'Checks if a subject has dependencies in attendance, timetable, or face_recognition_mappings tables. Returns counts for each dependency type and a has_dependencies flag.';
