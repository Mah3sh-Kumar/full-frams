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

    // Admin
    UserManagement: undefined;
    OrganizationManager: undefined;
    AuditLogs: undefined;
    VerificationDashboard: undefined;
    Reports: undefined;
};
