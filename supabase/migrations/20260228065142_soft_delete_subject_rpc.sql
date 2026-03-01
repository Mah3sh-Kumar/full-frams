CREATE OR REPLACE FUNCTION public.soft_delete_subject(
  p_subject_id UUID,
  p_deleted_by UUID
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
  IF p_subject_id IS NULL THEN
    RETURN json_build_object('error', 'Subject ID is required');
  END IF;
  
  IF p_deleted_by IS NULL THEN
    RETURN json_build_object('error', 'Deleted by user ID is required');
  END IF;
  
  SELECT COUNT(*) INTO v_attendance_count
  FROM public.attendance
  WHERE subject_id = p_subject_id;
  
  -- Note: timetable and face_recognition_mappings tables don't exist yet
  -- So we skip those checks for now
  
  IF v_attendance_count > 0 THEN
    RETURN json_build_object(
      'error', 'Cannot delete subject: dependencies exist',
      'attendance_count', v_attendance_count,
      'timetable_count', v_timetable_count,
      'face_recognition_count', v_face_recognition_count
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
$$;;
