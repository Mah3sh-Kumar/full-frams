CREATE OR REPLACE FUNCTION public.copy_subjects_for_academic_year(
  p_source_year_id UUID,
  p_target_year_id UUID,
  p_created_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;;
