CREATE OR REPLACE FUNCTION public.check_subject_dependencies(
  p_subject_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attendance_count INTEGER;
  v_timetable_count INTEGER := 0;
  v_face_recognition_count INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO v_attendance_count
  FROM public.attendance
  WHERE subject_id = p_subject_id;
  
  -- Note: timetable and face_recognition_mappings tables don't exist yet
  
  RETURN json_build_object(
    'attendance_count', v_attendance_count,
    'timetable_count', v_timetable_count,
    'face_recognition_count', v_face_recognition_count,
    'has_dependencies', (v_attendance_count > 0)
  );
END;
$$;;
