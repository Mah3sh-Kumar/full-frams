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
AS $$
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
$$;;
