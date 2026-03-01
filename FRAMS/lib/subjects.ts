import { supabase } from './supabase';
import { SubjectItem, TeacherInfo, SubjectDependencies } from './types';

/**
 * Error code mapping for user-friendly messages
 * Maps PostgreSQL error codes to human-readable messages
 */
const SUBJECT_ERROR_MESSAGES: Record<string, string> = {
  '23505': 'A subject with this code already exists for this class and academic year',
  '23503': 'Invalid reference - the associated class, teacher, or academic year does not exist',
  '23502': 'Required field is missing',
  '23514': 'Invalid data format',
  'PGRST116': 'Subject not found',
};

/**
 * Converts database errors to user-friendly messages
 * Handles PostgreSQL error codes, foreign key violations, branch isolation errors,
 * and dependency errors from RPC functions
 * @param error - Error object from Supabase
 * @returns User-friendly error message
 */
function getSubjectErrorMessage(error: any): string {
  // Check for standard PostgreSQL error codes first
  if (error?.code && SUBJECT_ERROR_MESSAGES[error.code]) {
    // Special handling for foreign key constraint errors (23503)
    if (error.code === '23503') {
      // Check for specific foreign key violations in the error message
      if (error?.message?.includes('attendance')) {
        return 'Cannot delete subject: it is being used in attendance records';
      }
      if (error?.message?.includes('timetable')) {
        return 'Cannot delete subject: it is being used in timetable entries';
      }
      if (error?.message?.includes('face_recognition')) {
        return 'Cannot delete subject: it is being used in face recognition mappings';
      }
      if (error?.message?.includes('branch')) {
        return 'Cannot assign teacher: teacher belongs to a different branch';
      }
      // Return the generic foreign key error message
      return SUBJECT_ERROR_MESSAGES[error.code];
    }
    
    // Return the mapped error message for other codes
    return SUBJECT_ERROR_MESSAGES[error.code];
  }
  
  // Handle branch isolation errors (can occur without specific error codes)
  if (error?.message?.includes('branch')) {
    return 'Cannot assign teacher: teacher belongs to a different branch';
  }
  
  // Handle dependency errors from RPC functions
  if (error?.message?.includes('dependencies exist')) {
    return error.message;
  }
  
  // Return the original error message or a generic fallback
  return error?.message || 'An unexpected error occurred';
}

/**
 * Get subjects from the database with their assigned teachers
 * @param includeInactive - Whether to include inactive subjects (admin only)
 * @param includeDeleted - Whether to include soft-deleted subjects (admin only)
 * @param academicYearId - Filter by specific academic year (defaults to current)
 * @param page - Page number for pagination (default 1)
 * @param pageSize - Number of items per page (default 50)
 * @returns Promise with subjects array (including teachers) and error
 */
export async function getSubjects(
  includeInactive: boolean = false,
  includeDeleted: boolean = false,
  academicYearId?: string,
  page: number = 1,
  pageSize: number = 50
): Promise<{ data: (SubjectItem & { teachers: TeacherInfo[] })[] | null; error: string | null }> {
  try {
    console.log('🔍 getSubjects called with:', {
      includeInactive,
      includeDeleted,
      academicYearId,
      page,
      pageSize
    });

    // Build base query
    let query = supabase
      .from('subjects')
      .select(`
        id,
        name,
        code,
        class_id,
        academic_year_id,
        is_active,
        created_at,
        updated_at,
        created_by,
        updated_by,
        deleted_at,
        deleted_by,
        classes:class_id (
          name
        ),
        academic_years:academic_year_id (
          name
        )
      `)
      .order('name', { ascending: true });

    // Apply filters
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    if (!includeDeleted) {
      query = query.is('deleted_at', null);
    }

    // Handle academic year filtering
    if (academicYearId) {
      query = query.eq('academic_year_id', academicYearId);
    } else {
      // Get current academic year
      const { data: currentYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      if (yearError) {
        console.warn('⚠️ No current academic year found:', yearError);
      } else if (currentYear) {
        query = query.eq('academic_year_id', currentYear.id);
      }
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error } = await query;

    console.log('📊 getSubjects - Raw response:', { data, error });

    if (error) {
      console.error('❌ Supabase error in getSubjects:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('✅ getSubjects - No subjects found');
      return { data: [], error: null };
    }

    // Fetch teachers for each subject using separate query
    const subjectIds = data.map(s => s.id);
    const { data: teacherData, error: teacherError } = await supabase
      .from('subject_teachers')
      .select(`
        subject_id,
        is_primary,
        users:teacher_id (
          id,
          full_name
        )
      `)
      .in('subject_id', subjectIds);

    if (teacherError) {
      console.error('❌ Error fetching teachers:', teacherError);
      // Continue without teachers rather than failing completely
    }

    // Aggregate teachers by subject with json_agg pattern
    const teachersBySubject = teacherData?.reduce((acc, st) => {
      if (!acc[st.subject_id]) {
        acc[st.subject_id] = [];
      }
      // Handle both single object and array responses from Supabase
      const user = Array.isArray(st.users) ? st.users[0] : st.users;
      if (user) {
        acc[st.subject_id].push({
          id: user.id,
          full_name: user.full_name,
          is_primary: st.is_primary
        });
      }
      return acc;
    }, {} as Record<string, TeacherInfo[]>) || {};

    // Transform and return data
    const result = data.map(subject => {
      // Handle both single object and array responses from Supabase
      const classData = Array.isArray(subject.classes) ? subject.classes[0] : subject.classes;
      const yearData = Array.isArray(subject.academic_years) ? subject.academic_years[0] : subject.academic_years;
      
      return {
        ...subject,
        class_name: classData?.name,
        academic_year_name: yearData?.name,
        teachers: teachersBySubject[subject.id] || []
      };
    });

    console.log('✅ getSubjects - Returning:', result.length, 'subjects');
    return { data: result, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getSubjects:', error);
    return { data: null, error: getSubjectErrorMessage(error) };
  }
}

/**
 * Create a new subject with teacher assignments using RPC function
 * @param name - Subject name
 * @param code - Subject code (lowercase with underscores)
 * @param classId - UUID of the class
 * @param academicYearId - UUID of the academic year
 * @param teacherIds - Array of teacher UUIDs
 * @param primaryTeacherId - UUID of the primary teacher
 * @returns Promise with created subject and error
 */
export async function createSubject(
  name: string,
  code: string,
  classId: string,
  academicYearId: string,
  teacherIds: string[],
  primaryTeacherId: string,
  isActive: boolean = true
): Promise<{ data: SubjectItem | null; error: string | null }> {
  try {
    console.log('🔍 createSubject called with:', {
      name,
      code,
      classId,
      academicYearId,
      teacherIds,
      primaryTeacherId
    });

    // Client-side validation
    if (!name || name.trim().length < 2) {
      return { data: null, error: 'Subject name must be at least 2 characters' };
    }

    if (name.trim().length > 100) {
      return { data: null, error: 'Subject name must not exceed 100 characters' };
    }

    if (!code || !/^[a-z0-9_]+$/.test(code.trim())) {
      return { data: null, error: 'Subject code must contain only lowercase letters, numbers, and underscores' };
    }

    if (!teacherIds || teacherIds.length === 0) {
      return { data: null, error: 'At least one teacher must be assigned' };
    }

    if (!teacherIds.includes(primaryTeacherId)) {
      return { data: null, error: 'Primary teacher must be in the teacher list' };
    }

    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error in createSubject:', authError);
      return { data: null, error: 'Authentication error' };
    }

    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }

    console.log('📤 Calling create_subject_with_teachers RPC...');

    // Call RPC function for transactional creation
    const { data: rpcData, error: rpcError } = await supabase.rpc('create_subject_with_teachers', {
      p_name: name.trim(),
      p_code: code.trim().toLowerCase(),
      p_class_id: classId,
      p_academic_year_id: academicYearId,
      p_teacher_ids: teacherIds,
      p_primary_teacher_id: primaryTeacherId,
      p_created_by: user.id,
      p_is_active: isActive
    });

    console.log('📊 RPC response:', { rpcData, rpcError });

    if (rpcError) {
      console.error('❌ RPC error in createSubject:', rpcError);
      return { data: null, error: getSubjectErrorMessage(rpcError) };
    }

    // Check if RPC returned an error in the JSON response
    if (rpcData && rpcData.error) {
      console.error('❌ RPC returned error:', rpcData.error);
      return { data: null, error: rpcData.error };
    }

    // Fetch the created subject
    const subjectId = rpcData?.subject_id;
    if (!subjectId) {
      console.error('❌ No subject_id in RPC response');
      return { data: null, error: 'Failed to create subject: no ID returned' };
    }

    console.log('📥 Fetching created subject:', subjectId);

    const { data: subject, error: fetchError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching created subject:', fetchError);
      return { data: null, error: getSubjectErrorMessage(fetchError) };
    }

    console.log('✅ Subject created successfully:', subject);
    return { data: subject, error: null };
  } catch (error: any) {
    console.error('❌ Exception in createSubject:', error);
    return { data: null, error: getSubjectErrorMessage(error) };
  }
}

/**
 * Get subjects taught by a specific teacher
 * @param teacherId - UUID of the teacher
 * @param academicYearId - Filter by specific academic year (defaults to current)
 * @returns Promise with subjects array and error
 */
export async function getSubjectsByTeacher(
  teacherId: string,
  academicYearId?: string
): Promise<{ data: (SubjectItem & { teachers: TeacherInfo[] })[] | null; error: string | null }> {
  try {
    console.log('🔍 getSubjectsByTeacher called with:', {
      teacherId,
      academicYearId
    });

    // Determine academic year filter
    let yearFilter = academicYearId;

    if (!yearFilter) {
      const { data: currentYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      if (yearError) {
        console.warn('⚠️ No current academic year found:', yearError);
      } else if (currentYear) {
        yearFilter = currentYear.id;
      }
    }

    // Build query to get subjects through subject_teachers junction table
    let query = supabase
      .from('subject_teachers')
      .select(`
        subject:subject_id (
          id,
          name,
          code,
          class_id,
          academic_year_id,
          is_active,
          created_at,
          updated_at,
          created_by,
          updated_by,
          deleted_at,
          deleted_by,
          classes:class_id (
            name
          ),
          academic_years:academic_year_id (
            name
          )
        )
      `)
      .eq('teacher_id', teacherId);

    const { data, error } = await query;

    console.log('📊 getSubjectsByTeacher - Raw response:', { data, error });

    if (error) {
      console.error('❌ Supabase error in getSubjectsByTeacher:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('✅ getSubjectsByTeacher - No subjects found');
      return { data: [], error: null };
    }

    // Filter and transform the results
    const subjects = data
      .map(st => {
        // Handle both single object and array responses from Supabase
        const subject = Array.isArray(st.subject) ? st.subject[0] : st.subject;
        if (!subject) return null;

        const classData = Array.isArray(subject.classes) ? subject.classes[0] : subject.classes;
        const yearData = Array.isArray(subject.academic_years) ? subject.academic_years[0] : subject.academic_years;

        return {
          ...subject,
          class_name: classData?.name,
          academic_year_name: yearData?.name
        };
      })
      .filter(subject => {
        // Filter out null subjects and soft-deleted subjects
        if (!subject || subject.deleted_at) return false;
        
        // Filter by academic year if specified
        if (yearFilter && subject.academic_year_id !== yearFilter) return false;
        
        return true;
      }) as SubjectItem[];

    // Fetch teachers for each subject using separate query
    const subjectIds = subjects.map(s => s.id);
    if (subjectIds.length === 0) {
      console.log('✅ getSubjectsByTeacher - No subjects after filtering');
      return { data: [], error: null };
    }

    const { data: teacherData, error: teacherError } = await supabase
      .from('subject_teachers')
      .select(`
        subject_id,
        is_primary,
        users:teacher_id (
          id,
          full_name
        )
      `)
      .in('subject_id', subjectIds);

    if (teacherError) {
      console.error('❌ Error fetching teachers:', teacherError);
      // Continue without teachers rather than failing completely
    }

    // Aggregate teachers by subject
    const teachersBySubject = teacherData?.reduce((acc, st) => {
      if (!acc[st.subject_id]) {
        acc[st.subject_id] = [];
      }
      // Handle both single object and array responses from Supabase
      const user = Array.isArray(st.users) ? st.users[0] : st.users;
      if (user) {
        acc[st.subject_id].push({
          id: user.id,
          full_name: user.full_name,
          is_primary: st.is_primary
        });
      }
      return acc;
    }, {} as Record<string, TeacherInfo[]>) || {};

    // Add teachers to subjects
    const result = subjects.map(subject => ({
      ...subject,
      teachers: teachersBySubject[subject.id] || []
    }));

    console.log('✅ getSubjectsByTeacher - Returning:', result.length, 'subjects');
    return { data: result, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getSubjectsByTeacher:', error);
    return { data: null, error: getSubjectErrorMessage(error) };
  }
}

/**
 * Get subjects for a specific class (for student access)
 * @param classId - UUID of the class
 * @param academicYearId - Filter by specific academic year (defaults to current)
 * @returns Promise with subjects array (including teachers) and error
 */
export async function getSubjectsByClass(
  classId: string,
  academicYearId?: string
): Promise<{ data: (SubjectItem & { teachers: TeacherInfo[] })[] | null; error: string | null }> {
  try {
    console.log('🔍 getSubjectsByClass called with:', {
      classId,
      academicYearId
    });

    // Determine academic year filter
    let yearFilter = academicYearId;

    if (!yearFilter) {
      const { data: currentYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      if (yearError) {
        console.warn('⚠️ No current academic year found:', yearError);
      } else if (currentYear) {
        yearFilter = currentYear.id;
      }
    }

    // Build query to get subjects filtered by class_id, is_active=true, deleted_at IS NULL
    let query = supabase
      .from('subjects')
      .select(`
        id,
        name,
        code,
        class_id,
        academic_year_id,
        is_active,
        created_at,
        updated_at,
        created_by,
        updated_by,
        deleted_at,
        deleted_by,
        classes:class_id (
          name
        ),
        academic_years:academic_year_id (
          name
        )
      `)
      .eq('class_id', classId)
      .eq('is_active', true)
      .is('deleted_at', null);

    // Apply academic year filter
    if (yearFilter) {
      query = query.eq('academic_year_id', yearFilter);
    }

    const { data, error } = await query;

    console.log('📊 getSubjectsByClass - Raw response:', { data, error });

    if (error) {
      console.error('❌ Supabase error in getSubjectsByClass:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    if (!data || data.length === 0) {
      console.log('✅ getSubjectsByClass - No subjects found');
      return { data: [], error: null };
    }

    // Fetch teachers for each subject using separate query with json_agg pattern
    const subjectIds = data.map(s => s.id);
    const { data: teacherData, error: teacherError } = await supabase
      .from('subject_teachers')
      .select(`
        subject_id,
        is_primary,
        users:teacher_id (
          id,
          full_name
        )
      `)
      .in('subject_id', subjectIds);

    if (teacherError) {
      console.error('❌ Error fetching teachers:', teacherError);
      // Continue without teachers rather than failing completely
    }

    // Aggregate teachers by subject with json_agg pattern
    const teachersBySubject = teacherData?.reduce((acc, st) => {
      if (!acc[st.subject_id]) {
        acc[st.subject_id] = [];
      }
      // Handle both single object and array responses from Supabase
      const user = Array.isArray(st.users) ? st.users[0] : st.users;
      if (user) {
        acc[st.subject_id].push({
          id: user.id,
          full_name: user.full_name,
          is_primary: st.is_primary
        });
      }
      return acc;
    }, {} as Record<string, TeacherInfo[]>) || {};

    // Transform and return data
    const result = data.map(subject => {
      // Handle both single object and array responses from Supabase
      const classData = Array.isArray(subject.classes) ? subject.classes[0] : subject.classes;
      const yearData = Array.isArray(subject.academic_years) ? subject.academic_years[0] : subject.academic_years;
      
      return {
        ...subject,
        class_name: classData?.name,
        academic_year_name: yearData?.name,
        teachers: teachersBySubject[subject.id] || []
      };
    });

    console.log('✅ getSubjectsByClass - Returning:', result.length, 'subjects');
    return { data: result, error: null };
  } catch (error: any) {
    console.error('❌ Exception in getSubjectsByClass:', error);
    return { data: null, error: getSubjectErrorMessage(error) };
  }
}

/**
 * Update an existing subject and its teacher assignments using RPC function
 * @param id - UUID of the subject
 * @param updates - Fields to update
 * @param teacherIds - Array of teacher UUIDs (replaces existing assignments)
 * @param primaryTeacherId - UUID of the primary teacher
 * @returns Promise with updated subject and error
 */
export async function updateSubject(
  id: string,
  updates: {
    name?: string;
    code?: string;
    class_id?: string;
    is_active?: boolean;
  },
  teacherIds?: string[],
  primaryTeacherId?: string
): Promise<{ data: SubjectItem | null; error: string | null }> {
  try {
    console.log('🔍 updateSubject called with:', {
      id,
      updates,
      teacherIds,
      primaryTeacherId
    });

    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error in updateSubject:', authError);
      return { data: null, error: 'Authentication error' };
    }

    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }

    // Validate if teacher updates are provided
    if (teacherIds && teacherIds.length === 0) {
      return { data: null, error: 'At least one teacher must be assigned' };
    }

    if (teacherIds && primaryTeacherId && !teacherIds.includes(primaryTeacherId)) {
      return { data: null, error: 'Primary teacher must be in the teacher list' };
    }

    // Get current subject data
    const { data: currentSubject, error: fetchError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching current subject:', fetchError);
      return { data: null, error: getSubjectErrorMessage(fetchError) };
    }

    if (!currentSubject) {
      return { data: null, error: 'Subject not found' };
    }

    // Prevent teacher assignment changes for archived subjects (Requirement 18.5)
    if (!currentSubject.is_active && teacherIds !== undefined) {
      return { 
        data: null, 
        error: 'Cannot assign teachers to archived subject. Please reactivate the subject first.' 
      };
    }

    // Validate updates if provided
    if (updates.name !== undefined) {
      const trimmedName = updates.name.trim();
      if (!trimmedName || trimmedName.length < 2) {
        return { data: null, error: 'Subject name must be at least 2 characters' };
      }
      if (trimmedName.length > 100) {
        return { data: null, error: 'Subject name must not exceed 100 characters' };
      }
    }

    if (updates.code !== undefined) {
      const trimmedCode = updates.code.trim();
      if (!trimmedCode || !/^[a-z0-9_]+$/.test(trimmedCode)) {
        return { data: null, error: 'Subject code must contain only lowercase letters, numbers, and underscores' };
      }
    }

    console.log('📤 Calling update_subject_with_teachers RPC...');

    // Call RPC function (academic_year_id is immutable and not passed)
    const { data: rpcData, error: rpcError } = await supabase.rpc('update_subject_with_teachers', {
      p_subject_id: id,
      p_name: updates.name ?? currentSubject.name,
      p_code: updates.code ?? currentSubject.code,
      p_class_id: updates.class_id ?? currentSubject.class_id,
      p_is_active: updates.is_active ?? currentSubject.is_active,
      p_teacher_ids: teacherIds ?? [],
      p_primary_teacher_id: primaryTeacherId ?? '',
      p_updated_by: user.id
    });

    console.log('📊 RPC response:', { rpcData, rpcError });

    if (rpcError) {
      console.error('❌ RPC error in updateSubject:', rpcError);
      return { data: null, error: getSubjectErrorMessage(rpcError) };
    }

    // Check if RPC returned an error in the JSON response
    if (rpcData && rpcData.error) {
      console.error('❌ RPC returned error:', rpcData.error);
      return { data: null, error: rpcData.error };
    }

    console.log('📥 Fetching updated subject:', id);

    // Fetch the updated subject
    const { data: subject, error: fetchUpdatedError } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchUpdatedError) {
      console.error('❌ Error fetching updated subject:', fetchUpdatedError);
      return { data: null, error: getSubjectErrorMessage(fetchUpdatedError) };
    }

    console.log('✅ Subject updated successfully:', subject);
    return { data: subject, error: null };
  } catch (error: any) {
    console.error('❌ Exception in updateSubject:', error);
    return { data: null, error: getSubjectErrorMessage(error) };
  }
}

/**
 * Soft delete a subject using RPC function (checks dependencies)
 * @param id - UUID of the subject
 * @param name - Subject name (for error messages)
 * @returns Promise with error
 */
export async function deleteSubject(
  id: string,
  name: string
): Promise<{ error: string | null }> {
  try {
    console.log('🔍 deleteSubject called with:', {
      id,
      name
    });

    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error in deleteSubject:', authError);
      return { error: 'Authentication error' };
    }

    if (!user) {
      return { error: 'Not authenticated' };
    }

    console.log('📤 Calling soft_delete_subject RPC...');

    // Call RPC function for soft delete with dependency checking
    const { data, error } = await supabase.rpc('soft_delete_subject', {
      p_subject_id: id,
      p_deleted_by: user.id
    });

    console.log('📊 RPC response:', { data, error });

    if (error) {
      console.error('❌ RPC error in deleteSubject:', error);
      return { error: getSubjectErrorMessage(error) };
    }

    // Check if RPC returned an error in the JSON response
    if (data && data.error) {
      console.error('❌ RPC returned error:', data.error);
      
      // Format dependency error message with counts if dependencies exist
      if (data.attendance_count || data.timetable_count || data.face_recognition_count) {
        const deps = [];
        if (data.attendance_count > 0) {
          deps.push(`${data.attendance_count} attendance record(s)`);
        }
        if (data.timetable_count > 0) {
          deps.push(`${data.timetable_count} timetable entry(ies)`);
        }
        if (data.face_recognition_count > 0) {
          deps.push(`${data.face_recognition_count} face recognition mapping(s)`);
        }
        
        return {
          error: `Cannot delete "${name}": it is being used by ${deps.join(', ')}. Consider archiving instead.`
        };
      }
      
      return { error: data.error };
    }

    console.log('✅ Subject soft deleted successfully');
    return { error: null };
  } catch (error: any) {
    console.error('❌ Exception in deleteSubject:', error);
    return { error: getSubjectErrorMessage(error) };
  }
}

/**
 * Check if a subject has dependencies in other tables
 * @param id - UUID of the subject
 * @returns Promise with dependency counts and error
 */
export async function checkSubjectDependencies(
  id: string
): Promise<{ data: SubjectDependencies | null; error: string | null }> {
  try {
    console.log('🔍 checkSubjectDependencies called with:', { id });

    console.log('📤 Calling check_subject_dependencies RPC...');

    // Call RPC function to check dependencies
    const { data, error } = await supabase.rpc('check_subject_dependencies', {
      p_subject_id: id
    });

    console.log('📊 RPC response:', { data, error });

    if (error) {
      console.error('❌ RPC error in checkSubjectDependencies:', error);
      return { data: null, error: getSubjectErrorMessage(error) };
    }

    // Transform the response to match SubjectDependencies interface
    const dependencies: SubjectDependencies = {
      attendance_count: data?.attendance_count || 0,
      timetable_count: data?.timetable_count || 0,
      face_recognition_count: data?.face_recognition_count || 0
    };

    console.log('✅ checkSubjectDependencies - Returning:', dependencies);
    return { data: dependencies, error: null };
  } catch (error: any) {
    console.error('❌ Exception in checkSubjectDependencies:', error);
    return { data: null, error: getSubjectErrorMessage(error) };
  }
}

/**
 * Validate that a teacher belongs to the same branch as the class
 * @param teacherId - UUID of the teacher
 * @param classId - UUID of the class
 * @returns Promise with validation result and error
 */
export async function validateTeacherBranch(
  teacherId: string,
  classId: string
): Promise<{ valid: boolean; error: string | null }> {
  try {
    console.log('🔍 validateTeacherBranch called with:', {
      teacherId,
      classId
    });

    // Get teacher's branch
    const { data: teacher, error: teacherError } = await supabase
      .from('users')
      .select('branch_id')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .single();

    if (teacherError) {
      console.error('❌ Error fetching teacher:', teacherError);
      return { valid: false, error: 'Teacher not found' };
    }

    if (!teacher) {
      console.log('❌ Teacher not found');
      return { valid: false, error: 'Teacher not found' };
    }

    // Get class's branch
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('branch_id')
      .eq('id', classId)
      .single();

    if (classError) {
      console.error('❌ Error fetching class:', classError);
      return { valid: false, error: 'Class not found' };
    }

    if (!classData) {
      console.log('❌ Class not found');
      return { valid: false, error: 'Class not found' };
    }

    // Compare branches
    if (teacher.branch_id !== classData.branch_id) {
      console.log('❌ Branch mismatch:', {
        teacherBranch: teacher.branch_id,
        classBranch: classData.branch_id
      });
      return { 
        valid: false, 
        error: 'Cannot assign teacher: teacher belongs to a different branch' 
      };
    }

    console.log('✅ Branch validation passed');
    return { valid: true, error: null };
  } catch (error: any) {
    console.error('❌ Exception in validateTeacherBranch:', error);
    return { valid: false, error: getSubjectErrorMessage(error) };
  }
}

/**
 * Copy all subjects from one academic year to another using RPC function
 * @param sourceYearId - UUID of the source academic year
 * @param targetYearId - UUID of the target academic year
 * @returns Promise with copy result and error
 */
export async function copySubjectsForAcademicYear(
  sourceYearId: string,
  targetYearId: string
): Promise<{ data: { copied_count: number } | null; error: string | null }> {
  try {
    console.log('🔍 copySubjectsForAcademicYear called with:', {
      sourceYearId,
      targetYearId
    });

    // Get current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error in copySubjectsForAcademicYear:', authError);
      return { data: null, error: 'Authentication error' };
    }

    if (!user) {
      return { data: null, error: 'Not authenticated' };
    }

    console.log('📤 Calling copy_subjects_for_academic_year RPC...');

    // Call RPC function
    const { data, error } = await supabase.rpc('copy_subjects_for_academic_year', {
      p_source_year_id: sourceYearId,
      p_target_year_id: targetYearId,
      p_created_by: user.id
    });

    console.log('📊 RPC response:', { data, error });

    if (error) {
      console.error('❌ RPC error in copySubjectsForAcademicYear:', error);
      return { data: null, error: getSubjectErrorMessage(error) };
    }

    // Check if RPC returned an error in the JSON response
    if (data && data.error) {
      console.error('❌ RPC returned error:', data.error);
      return { data: null, error: data.error };
    }

    console.log('✅ Subjects copied successfully:', data.copied_count);
    return {
      data: { copied_count: data.copied_count },
      error: null
    };
  } catch (error: any) {
    console.error('❌ Exception in copySubjectsForAcademicYear:', error);
    return { data: null, error: getSubjectErrorMessage(error) };
  }
}