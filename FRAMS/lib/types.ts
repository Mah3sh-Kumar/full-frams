export type RootStackParamList = {
    // Auth
    SignIn: undefined;
    SignUp: undefined;
    ForgotPassword: undefined;
    ResetPassword: { token?: string };
    ChangePassword: undefined;
    EmailVerification: { email: string };
    Unverified: undefined;

    // Main
    Dashboard: undefined;
    Profile: undefined;
    Notifications: undefined;
    Settings: undefined;
    PrivacyPolicy: undefined;
    Terms: undefined;

    // Student
    Attendance: undefined;
    Assignments: undefined;

    // Teacher
    AttendanceManager: undefined;
    AssignmentManager: undefined;
    MarksReviewManager: undefined;
    AssignedSubjects: undefined;

    // Admin
    UserManagement: undefined;
    OrganizationManager: undefined;
    AuditLogs: undefined;
    VerificationDashboard: undefined;
    Reports: undefined;
    AssignSubjects: undefined;
    DebugUsers: undefined;
};

// ============================================================================
// SUBJECT MANAGEMENT TYPE DEFINITIONS
// ============================================================================

/**
 * Subject item with comprehensive audit fields
 */
export interface SubjectItem {
  id: string;                    // UUID primary key
  name: string;                  // Subject name (e.g., "Mathematics")
  code: string;                  // Subject code (e.g., "math_101")
  class_id: string;              // Foreign key to classes table
  academic_year_id: string;      // Foreign key to academic_years table
  is_active: boolean;            // Active status flag
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
  created_by: string;            // UUID of user who created the subject
  updated_by: string | null;     // UUID of user who last updated the subject
  deleted_at: string | null;     // ISO timestamp of soft delete
  deleted_by: string | null;     // UUID of user who deleted the subject
  
  // Joined data (from queries)
  class_name?: string;           // From classes.name
  academic_year_name?: string;   // From academic_years.name
  teachers?: TeacherInfo[];      // From subject_teachers join (aggregated with json_agg)
}

/**
 * Teacher information for subject display
 */
export interface TeacherInfo {
  id: string;                    // Teacher user ID
  full_name: string;             // Teacher name
  is_primary: boolean;           // Whether this is the primary teacher
}

/**
 * Subject-teacher junction table item with audit metadata
 */
export interface SubjectTeacherItem {
  id: string;                    // UUID primary key
  subject_id: string;            // Foreign key to subjects table
  teacher_id: string;            // Foreign key to users table
  is_primary: boolean;           // Whether this is the primary teacher
  assigned_by: string;           // UUID of user who assigned the teacher
  assigned_at: string;           // ISO timestamp of assignment
  created_at: string;            // ISO timestamp
}

/**
 * Academic year item
 */
export interface AcademicYearItem {
  id: string;                    // UUID primary key
  name: string;                  // Academic year name (e.g., "2023-2024")
  start_date: string;            // ISO date
  end_date: string;              // ISO date
  is_current: boolean;           // Whether this is the current academic year
  created_at: string;            // ISO timestamp
}

/**
 * Subject dependencies for deletion validation
 */
export interface SubjectDependencies {
  attendance_count: number;      // Number of attendance records
  timetable_count: number;       // Number of timetable entries
  face_recognition_count: number; // Number of face recognition mappings
}
