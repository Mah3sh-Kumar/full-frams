import { supabase } from './supabase';

// Error mapping for user-friendly messages
const ERROR_MESSAGES: Record<string, string> = {
    'PGRST116': 'User profile not found',
    '23505': 'This email or enrollment number is already registered',
    '23503': 'Invalid class selection',
    'PGRST205': 'Database schema not initialized. Please contact support.',
};

export function getErrorMessage(error: any): string {
    if (error?.code && ERROR_MESSAGES[error.code]) {
        return ERROR_MESSAGES[error.code];
    }
    return error?.message || 'An unexpected error occurred';
}

// Create user profile in public.users table
export async function createUserProfile(
    userId: string,
    fullName: string,
    email: string,
    role: 'student' | 'teacher' | 'admin'
) {
    try {
        // Validate required fields
        if (!userId || !fullName || !email || !role) {
            return { data: null, error: 'User ID, full name, email, and role are required' };
        }

        const { data, error } = await supabase
            .from('users')
            .insert({
                id: userId,
                full_name: fullName,
                email: email,
                role: role,
            })
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating user profile:', error);
        const errorMessage = error?.message || 'An unexpected error occurred';
        return { data: null, error: errorMessage };
    }
}

// Create student profile in public.students table
export async function createStudentProfile(
    userId: string,
    enrollmentNumber: string,
    classId: string | null,
    branchId: string | null = null,
    departmentId: string | null = null
) {
    try {
        // Validate required fields
        if (!userId || !enrollmentNumber) {
            return { data: null, error: 'User ID and enrollment number are required' };
        }

        const { data, error } = await supabase
            .from('students')
            .insert({
                id: userId,
                enrollment_number: enrollmentNumber,
                class_id: classId,
                branch_id: branchId,
                department_id: departmentId,
            })
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating student profile:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}

// Create teacher profile in public.teachers table
export async function createTeacherProfile(
    userId: string,
    department: string
) {
    try {
        // Validate required fields
        if (!userId || !department) {
            return { data: null, error: 'User ID and department are required' };
        }

        const { data, error } = await supabase
            .from('teachers')
            .insert({
                id: userId,
                department: department,
            })
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        console.error('Error creating teacher profile:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}

// Fetch all classes for dropdown
export async function fetchClasses() {
    try {
        const { data, error } = await supabase
            .from('classes')          // consolidated schema: org_classes → classes
            .select('id, name, academic_year')
            .order('display_order', { ascending: true });

        if (error) {
            console.error('❌ Error fetching classes - Code:', error.code);
            console.error('❌ Error fetching classes - Message:', error.message);
            console.error('❌ Error fetching classes - Details:', error.details);
            throw error;
        }
        return { data: data || [], error: null };
    } catch (error: any) {
        console.error('❌ Error fetching classes:', error);
        console.error('❌ Full error object:', JSON.stringify(error, null, 2));
        return { data: [], error: getErrorMessage(error) };
    }
}

// Get user role from public.users table
export async function getUserRole(userId: string) {
    try {
        console.log('📊 database.getUserRole called for userId:', userId);
        const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('❌ Supabase error in getUserRole:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            throw error;
        }

        console.log('📊 getUserRole - Raw data from database:', data);
        console.log('📊 getUserRole - Extracted role:', data?.role);
        return { data: data?.role || null, error: null };
    } catch (error: any) {
        console.error('❌ Exception in getUserRole:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}

// Check if enrollment number is unique
export async function checkEnrollmentNumberUnique(enrollmentNumber: string): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('enrollment_number')
            .eq('enrollment_number', enrollmentNumber)
            .maybeSingle();

        if (error) throw error;
        return data === null;
    } catch (error: any) {
        console.error('Error checking enrollment number:', error);
        return false;
    }
}

// Fetch subjects assigned to a teacher
export async function fetchTeacherSubjects(teacherId: string) {
    try {
        // Query through subject_teachers junction table
        const { data, error } = await supabase
            .from('subject_teachers')
            .select(`
                subject_id,
                subjects!inner (
                    id, 
                    name, 
                    code, 
                    class_id, 
                    classes (
                        id,
                        name,
                        academic_year
                    )
                )
            `)
            .eq('teacher_id', teacherId);

        if (error) throw error;
        
        // Transform the data to match the expected format
        const formattedData = data?.map(item => ({
            id: item.subjects.id,
            name: item.subjects.name,
            code: item.subjects.code,
            class_id: item.subjects.class_id,
            classes: item.subjects.classes
        })) || [];
        
        return { data: formattedData, error: null };
    } catch (error: any) {
        console.error('Error fetching teacher subjects:', error);
        return { data: [], error: getErrorMessage(error) };
    }
}

// Fetch students in a specific class
export async function fetchStudentsByClass(classId: string) {
    try {
        const { data, error } = await supabase
            .from('students')
            .select(`
                id,
                enrollment_number,
                full_name:users(full_name)
            `)
            .eq('class_id', classId)    // consolidated schema: class_id (not org_class_id)
            .order('enrollment_number', { ascending: true });

        if (error) throw error;

        const formattedData = data?.map(student => ({
            id: student.id,
            enrollment_number: student.enrollment_number,
            full_name: (student.full_name as any)?.full_name || 'Unknown'
        })) || [];

        return { data: formattedData, error: null };
    } catch (error: any) {
        console.error('Error fetching students:', error);
        return { data: [], error: getErrorMessage(error) };
    }
}

// Mark attendance for a student
export async function markAttendance(
    studentId: string,
    subjectId: string,
    status: 'present' | 'absent' | 'late',
    date: string
) {
    try {
        // Use upsert to handle both insert and update in one atomic operation
        const { data, error } = await supabase
            .from('attendance')
            .upsert({
                student_id: studentId,
                subject_id: subjectId,
                date: date,
                status: status,
                timestamp: new Date().toISOString()
            }, {
                onConflict: 'student_id,subject_id,date', // Conflict on unique combination
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        console.error('Error marking attendance:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}

// Fetch assignments created by a teacher
export async function fetchTeacherAssignments(teacherId: string) {
    try {
        // Get subjects through subject_teachers junction table
        const { data: subjectTeachers, error: stError } = await supabase
            .from('subject_teachers')
            .select('subject_id')
            .eq('teacher_id', teacherId);

        if (stError) {
            console.error('Error fetching subject_teachers:', stError);
            throw stError;
        }

        const subjectIds = subjectTeachers?.map(st => st.subject_id) || [];

        if (subjectIds.length === 0) return { data: [], error: null };

        // Fetch assignments for these subjects
        const { data: assignments, error: assignError } = await supabase
            .from('assignments')
            .select('*')
            .in('subject_id', subjectIds)
            .order('created_at', { ascending: false });

        if (assignError) {
            console.error('Error fetching assignments:', assignError);
            throw assignError;
        }

        // Fetch subject and class details separately
        if (assignments && assignments.length > 0) {
            const uniqueSubjectIds = [...new Set(assignments.map(a => a.subject_id))];
            
            const { data: subjects, error: subjectsError } = await supabase
                .from('subjects')
                .select(`
                    id,
                    name,
                    code,
                    class_id,
                    classes:class_id (
                        id,
                        name,
                        academic_year
                    )
                `)
                .in('id', uniqueSubjectIds);

            if (subjectsError) {
                console.error('Error fetching subjects:', subjectsError);
            }

            // Map subjects to assignments
            const subjectsMap = new Map(subjects?.map(s => [s.id, s]) || []);
            
            const enrichedAssignments = assignments.map(assignment => {
                const subject = subjectsMap.get(assignment.subject_id);
                return {
                    ...assignment,
                    subjects: subject ? {
                        name: subject.name,
                        code: subject.code,
                        classes: subject.classes
                    } : null
                };
            });

            return { data: enrichedAssignments, error: null };
        }

        return { data: assignments || [], error: null };
    } catch (error: any) {
        console.error('Error fetching teacher assignments:', error);
        return { data: [], error: getErrorMessage(error) };
    }
}

// Fetch submissions for an assignment
export async function fetchAssignmentSubmissions(assignmentId: string) {
    try {
        const { data, error } = await supabase
            .from('student_assignments')
            .select(`
                *,
                students (
                    enrollment_number,
                    users (full_name)
                )
            `)
            .eq('assignment_id', assignmentId);

        if (error) throw error;

        const formatted = data?.map(sub => ({
            ...sub,
            student_name: sub.students?.users?.full_name || 'Unknown',
            enrollment_number: sub.students?.enrollment_number
        })) || [];

        return { data: formatted, error: null };
    } catch (error: any) {
        console.error('Error fetching submissions:', error);
        return { data: [], error: getErrorMessage(error) };
    }
}

// Grade a submission
export async function gradeSubmission(
    submissionId: string,
    score: number,
    remarks: string
) {
    try {
        // Validate inputs
        if (!submissionId) {
            return { data: null, error: 'Submission ID is required' };
        }

        if (score < 0) {
            return { data: null, error: 'Score must be a non-negative number' };
        }

        // First get the current submission to preserve student's notes
        const { data: currentSubmission } = await supabase
            .from('student_assignments')
            .select('remarks')
            .eq('id', submissionId)
            .single();

        const studentNotes = currentSubmission?.remarks;

        const { data, error } = await supabase
            .from('student_assignments')
            .update({
                score,
                teacher_remarks: remarks || '', // Store teacher's remarks separately
                status: 'graded',
                graded_at: new Date().toISOString()
            })
            .eq('id', submissionId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        console.error('Error grading submission:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}

// Bulk mark attendance for multiple students
export async function bulkMarkAttendance(
    studentIds: string[],
    subjectId: string,
    status: 'present' | 'absent' | 'late',
    date: string
) {
    try {
        if (!studentIds || studentIds.length === 0) {
            return { data: [], error: null };
        }

        const records = studentIds.map(studentId => ({
            student_id: studentId,
            subject_id: subjectId,
            date,
            status,
            timestamp: new Date().toISOString()
        }));

        // Use upsert to handle potential conflicts
        const { data, error } = await supabase
            .from('attendance')
            .upsert(records, {
                onConflict: 'student_id,subject_id,date',
                ignoreDuplicates: false
            })
            .select();

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        console.error('Error bulk marking attendance:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}

// Fetch attendance with date range filter
export async function fetchAttendanceByDateRange(
    studentId: string,
    startDate: string,
    endDate: string,
    subjectId?: string
) {
    try {
        let query = supabase
            .from('attendance')
            .select(`
                id,
                date,
                status,
                subject_id
            `)
            .eq('student_id', studentId)
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: false });

        if (subjectId) {
            query = query.eq('subject_id', subjectId);
        }

        const { data: attendanceData, error } = await query;

        if (error) throw error;

        // Fetch subject names separately if we have attendance records
        if (attendanceData && attendanceData.length > 0) {
            const subjectIds = [...new Set(attendanceData.map(a => a.subject_id))];
            
            const { data: subjects, error: subjectsError } = await supabase
                .from('subjects')
                .select('id, name')
                .in('id', subjectIds);

            if (subjectsError) {
                console.error('Error fetching subjects:', subjectsError);
            }

            // Map subjects to attendance records
            const subjectsMap = new Map(subjects?.map(s => [s.id, s.name]) || []);
            
            const enrichedData = attendanceData.map(attendance => ({
                ...attendance,
                subjects: { name: subjectsMap.get(attendance.subject_id) || 'Unknown' }
            }));

            return { data: enrichedData, error: null };
        }

        return { data: attendanceData || [], error: null };
    } catch (error: any) {
        console.error('Error fetching attendance by date range:', error);
        return { data: [], error: getErrorMessage(error) };
    }
}

// Get attendance statistics for a class
export async function fetchAttendanceStatsByClass(classId: string, subjectId: string, date: string) {
    try {
        const { data: students } = await fetchStudentsByClass(classId);
        const studentIds = students.map(s => s.id);

        const { data: attendance, error } = await supabase
            .from('attendance')
            .select('status')
            .eq('subject_id', subjectId)
            .eq('date', date)
            .in('student_id', studentIds);

        if (error) throw error;

        const stats = {
            total: students.length,
            present: attendance?.filter(a => a.status === 'present').length || 0,
            absent: attendance?.filter(a => a.status === 'absent').length || 0,
            late: attendance?.filter(a => a.status === 'late').length || 0,
        };

        return { data: stats, error: null };
    } catch (error: any) {
        console.error('Error fetching attendance stats:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}

// Delete assignment
export async function deleteAssignment(assignmentId: string) {
    try {
        const { error } = await supabase
            .from('assignments')
            .delete()
            .eq('id', assignmentId);

        if (error) throw error;
        return { error: null };
    } catch (error: any) {
        console.error('Error deleting assignment:', error);
        return { error: getErrorMessage(error) };
    }
}

// Update assignment
export async function updateAssignment(
    assignmentId: string,
    title: string,
    description: string,
    dueDate: string,
    maxScore: number
) {
    try {
        // Validate inputs
        if (!assignmentId || !title.trim()) {
            return { data: null, error: 'Assignment ID and title are required' };
        }

        const { data, error } = await supabase
            .from('assignments')
            .update({
                title: title.trim(),
                description: description || '',
                due_date: dueDate,
                max_score: maxScore,
            })
            .eq('id', assignmentId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating assignment:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}

// Get assignment statistics
export async function fetchAssignmentStatistics(assignmentId: string) {
    try {
        const { data: submissions, error } = await supabase
            .from('student_assignments')
            .select('status, score')
            .eq('assignment_id', assignmentId);

        if (error) throw error;

        const validSubmissions = submissions || [];
        const gradedSubmissions = validSubmissions.filter(s => s.score !== null);

        const stats = {
            total: validSubmissions.length,
            submitted: validSubmissions.filter(s => s.status !== 'pending').length,
            graded: validSubmissions.filter(s => s.status === 'graded').length,
            pending: validSubmissions.filter(s => s.status === 'pending').length,
            averageScore: gradedSubmissions.length > 0
                ? gradedSubmissions.reduce((acc, s) => acc + (s.score || 0), 0) / gradedSubmissions.length
                : 0,
        };

        return { data: stats, error: null };
    } catch (error: any) {
        console.error('Error fetching assignment statistics:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}

// Update user profile
export async function updateUserProfile(
    userId: string,
    updates: {
        full_name?: string;
        email?: string;
        department?: string;
        enrollment_number?: string;
    }
) {
    try {
        // Validate inputs
        if (!userId) {
            return { data: null, error: 'User ID is required' };
        }

        // Prepare updates object - only include defined values
        const validUpdates: any = {};
        Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) {
                validUpdates[key] = value;
            }
        });

        if (Object.keys(validUpdates).length === 0) {
            return { data: null, error: 'No valid updates provided' };
        }

        const { data, error } = await supabase
            .from('users')
            .update(validUpdates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        console.error('Error updating user profile:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}

// Submit assignment
export async function submitAssignment(
    studentId: string,
    assignmentId: string,
    submissionUrl: string
) {
    try {
        // Use upsert to handle both insert and update scenarios
        const { data, error } = await supabase
            .from('student_assignments')
            .upsert({
                student_id: studentId,
                assignment_id: assignmentId,
                status: 'submitted',
                submission_url: submissionUrl,
                created_at: new Date().toISOString(),
            }, {
                onConflict: 'student_id,assignment_id',
                ignoreDuplicates: false
            })
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error: any) {
        console.error('Error submitting assignment:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}

// Get student attendance statistics
export async function fetchStudentAttendanceStats(studentId: string) {
    try {
        const { data, error } = await supabase
            .from('attendance')
            .select('status')
            .eq('student_id', studentId);

        if (error) throw error;

        const total = data?.length || 0;
        const present = data?.filter(a => a.status === 'present').length || 0;
        const rate = total > 0 ? Math.round((present / total) * 100) : 0;

        return { data: { total, present, rate }, error: null };
    } catch (error: any) {
        console.error('Error fetching student attendance stats:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}

// Get student pending assignments count
export async function fetchStudentPendingAssignments(studentId: string) {
    try {
        const { count, error } = await supabase
            .from('student_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', studentId)
            .eq('status', 'pending');

        if (error) throw error;
        return { data: count || 0, error: null };
    } catch (error: any) {
        console.error('Error fetching pending assignments:', error);
        return { data: 0, error: getErrorMessage(error) };
    }
}

// Fetch student's metadata (class, branch, academic year)
export async function fetchStudentMetadata(studentId: string) {
    try {
        const { data, error } = await supabase
            .from('students')
            .select(`
                class_id,
                branch,
                class_level,
                classes!inner (
                    id,
                    name,
                    academic_year
                )
            `)
            .eq('id', studentId)
            .single();

        if (error) throw error;

        const classData = Array.isArray(data?.classes) ? data?.classes[0] : data?.classes;

        return {
            data: {
                classId: data?.class_id,
                className: classData?.name,
                branch: data?.branch,
                classLevel: data?.class_level,
                academicYear: classData?.academic_year,
            },
            error: null
        };
    } catch (error: any) {
        console.error('Error fetching student metadata:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}

// Fetch teacher's metadata (department)
export async function fetchTeacherMetadata(teacherId: string) {
    try {
        if (!teacherId) {
            return { data: null, error: 'Teacher ID is required' };
        }

        const { data, error } = await supabase
            .from('teachers')
            .select('department')
            .eq('id', teacherId)
            .maybeSingle(); // Use maybeSingle instead of single to handle missing records gracefully

        if (error) {
            console.error('Error fetching teacher metadata:', error);
            throw error;
        }

        // If no teacher record exists, return default values
        if (!data) {
            console.warn(`No teacher metadata found for ID: ${teacherId}`);
            return {
                data: {
                    department: 'Not assigned',
                },
                error: null
            };
        }

        return {
            data: {
                department: data.department || 'Not assigned',
            },
            error: null
        };
    } catch (error: any) {
        console.error('Error fetching teacher metadata:', error);
        return { 
            data: { department: 'Not assigned' }, 
            error: getErrorMessage(error) 
        };
    }
}

// Fetch class details by ID
export async function fetchClassDetails(classId: string) {
    try {
        const { data, error } = await supabase
            .from('classes')
            .select('id, name, academic_year, value, display_order')
            .eq('id', classId)
            .single();

        if (error) throw error;

        return {
            data: {
                id: data?.id,
                name: data?.name,
                academicYear: data?.academic_year,
                value: data?.value,
                displayOrder: data?.display_order,
            },
            error: null
        };
    } catch (error: any) {
        console.error('Error fetching class details:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}

// Fetch branch details by ID
export async function fetchBranchDetails(branchId: string) {
    try {
        const { data, error } = await supabase
            .from('branches')
            .select('id, name, code, class_id')
            .eq('id', branchId)
            .single();

        if (error) throw error;

        return {
            data: {
                id: data?.id,
                name: data?.name,
                code: data?.code,
                classId: data?.class_id,
            },
            error: null
        };
    } catch (error: any) {
        console.error('Error fetching branch details:', error);
        return { data: null, error: getErrorMessage(error) };
    }
}