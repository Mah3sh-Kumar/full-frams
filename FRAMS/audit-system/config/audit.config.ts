/**
 * Audit System Configuration
 * Defines the parameters and settings for the UI/UX audit process
 */

import { DeviceConfig, TestConditions, IssueSeverity } from '../types';

// ============================================================================
// Device Configuration Matrix
// ============================================================================

export const DEVICE_MATRIX: DeviceConfig[] = [
  {
    name: 'Small Screen (Samsung Galaxy A series)',
    width: 720,
    height: 1480,
    density: 2,
    androidVersion: '11',
    manufacturer: 'Samsung',
  },
  {
    name: 'Mid-Range (Pixel 5)',
    width: 1080,
    height: 2400,
    density: 3,
    androidVersion: '13',
    manufacturer: 'Google',
  },
  {
    name: 'Mid-Range (Samsung S21)',
    width: 1080,
    height: 2400,
    density: 3,
    androidVersion: '12',
    manufacturer: 'Samsung',
  },
  {
    name: 'Large Screen/Tablet (Samsung Tab S7)',
    width: 1600,
    height: 2560,
    density: 2.625,
    androidVersion: '12',
    manufacturer: 'Samsung',
  },
];

// ============================================================================
// Test Conditions Matrix
// ============================================================================

export const TEST_CONDITIONS: TestConditions[] = [
  {
    networkSpeed: 'wifi',
    textSize: 100,
    orientation: 'portrait',
    darkMode: false,
  },
  {
    networkSpeed: 'slow-3g',
    textSize: 100,
    orientation: 'portrait',
    darkMode: false,
  },
  {
    networkSpeed: 'wifi',
    textSize: 125,
    orientation: 'portrait',
    darkMode: false,
  },
  {
    networkSpeed: 'wifi',
    textSize: 150,
    orientation: 'portrait',
    darkMode: false,
  },
  {
    networkSpeed: 'wifi',
    textSize: 175,
    orientation: 'portrait',
    darkMode: false,
  },
  {
    networkSpeed: 'wifi',
    textSize: 200,
    orientation: 'portrait',
    darkMode: false,
  },
  {
    networkSpeed: 'wifi',
    textSize: 100,
    orientation: 'landscape',
    darkMode: false,
  },
  {
    networkSpeed: 'wifi',
    textSize: 100,
    orientation: 'portrait',
    darkMode: true,
  },
];

// ============================================================================
// Severity Thresholds
// ============================================================================

export interface SeverityThresholds {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export const SEVERITY_THRESHOLDS: SeverityThresholds = {
  critical: 90, // Issues scoring 90+ are critical
  high: 70,     // Issues scoring 70-89 are high
  medium: 40,   // Issues scoring 40-69 are medium
  low: 0,       // Issues scoring 0-39 are low
};

// ============================================================================
// Screen Paths Configuration
// ============================================================================

export const SCREEN_PATHS = {
  auth: [
    'screens/SignInScreen.tsx',
    'screens/SignUpScreen.tsx',
    'screens/ForgotPasswordScreen.tsx',
    'screens/ResetPasswordScreen.tsx',
    'screens/EmailVerificationScreen.tsx',
    'screens/UnverifiedScreen.tsx',
  ],
  admin: [
    'screens/admin/UserManagement.tsx',
    'screens/admin/OrganizationManager.tsx',
    'screens/admin/AuditLogsScreen.tsx',
    'screens/admin/VerificationDashboard.tsx',
    'screens/admin/ReportsScreen.tsx',
    'screens/admin/AdminDashboard.tsx',
  ],
  teacher: [
    'screens/teacher/AttendanceManager.tsx',
    'screens/teacher/AssignmentManager.tsx',
    'screens/teacher/MarksReviewManager.tsx',
    'screens/teacher/TeacherDashboard.tsx',
  ],
  student: [
    'screens/student/AttendanceScreen.tsx',
    'screens/student/AssignmentScreen.tsx',
    'screens/student/StudentDashboard.tsx',
  ],
  auxiliary: [
    'screens/ProfileScreen.tsx',
    'screens/SettingsScreen.tsx',
    'screens/NotificationsScreen.tsx',
    'screens/DashboardScreen.tsx',
    'screens/ChangePasswordScreen.tsx',
    'screens/PrivacyPolicyScreen.tsx',
    'screens/TermsScreen.tsx',
  ],
};

// ============================================================================
// WCAG Contrast Standards
// ============================================================================

export const WCAG_CONTRAST_STANDARDS = {
  normalText: 4.5,      // Minimum contrast ratio for normal text
  largeText: 3.0,       // Minimum contrast ratio for large text (18pt+ or 14pt+ bold)
  largeTextSize: 18,    // Font size threshold for "large text"
};

// ============================================================================
// Performance Thresholds
// ============================================================================

export const PERFORMANCE_THRESHOLDS = {
  targetFrameRate: 60,
  minimumFrameRate: 50,
  maxRenderTime: 16.67, // milliseconds (60fps = 16.67ms per frame)
  listOptimizationThreshold: 50, // Number of items before optimization is required
};

// ============================================================================
// Audit Configuration Interface
// ============================================================================

export interface AuditConfig {
  devices: DeviceConfig[];
  testConditions: TestConditions[];
  severityThresholds: SeverityThresholds;
  outputPath: string;
  screenshotsEnabled: boolean;
  performanceTestsEnabled: boolean;
  screenPaths: typeof SCREEN_PATHS;
  wcagStandards: typeof WCAG_CONTRAST_STANDARDS;
  performanceThresholds: typeof PERFORMANCE_THRESHOLDS;
}

// ============================================================================
// Default Audit Configuration
// ============================================================================

export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  devices: DEVICE_MATRIX,
  testConditions: TEST_CONDITIONS,
  severityThresholds: SEVERITY_THRESHOLDS,
  outputPath: './audit-reports',
  screenshotsEnabled: false, // Disabled by default for automated runs
  performanceTestsEnabled: true,
  screenPaths: SCREEN_PATHS,
  wcagStandards: WCAG_CONTRAST_STANDARDS,
  performanceThresholds: PERFORMANCE_THRESHOLDS,
};

// ============================================================================
// Configuration Loader
// ============================================================================

/**
 * Load audit configuration with optional overrides
 */
export function loadAuditConfig(overrides?: Partial<AuditConfig>): AuditConfig {
  return {
    ...DEFAULT_AUDIT_CONFIG,
    ...overrides,
  };
}

/**
 * Validate audit configuration
 */
export function validateAuditConfig(config: AuditConfig): boolean {
  if (!config.devices || config.devices.length === 0) {
    throw new Error('Audit configuration must include at least one device');
  }

  if (!config.testConditions || config.testConditions.length === 0) {
    throw new Error('Audit configuration must include at least one test condition');
  }

  if (!config.outputPath) {
    throw new Error('Audit configuration must specify an output path');
  }

  return true;
}
