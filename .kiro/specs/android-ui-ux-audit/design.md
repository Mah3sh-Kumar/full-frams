# Design Document

## Overview

This design document outlines the comprehensive approach for auditing the UI/UX and Android-specific behaviors of the FRAMS React Native mobile application. The audit system will systematically evaluate all screens across authentication flows, role-based interfaces (Admin, Teacher, Student), and auxiliary screens to identify issues related to keyboard interactions, typography, layout responsiveness, navigation flows, visual consistency, and performance.

The audit will produce a detailed Markdown report with reproducible steps, severity ratings, code references, and actionable fix recommendations. The system will leverage both manual inspection and automated testing strategies to ensure comprehensive coverage.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Audit System Architecture                 │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐
│  Screen Scanner  │─────▶│  Issue Detector  │─────▶│  Report Generator│
│                  │      │                  │      │                  │
│  - Auth Screens  │      │  - Keyboard      │      │  - Executive     │
│  - Admin Screens │      │  - Typography    │      │    Summary       │
│  - Teacher       │      │  - Layout        │      │  - Screen-by-    │
│  - Student       │      │  - Navigation    │      │    Screen        │
│  - Auxiliary     │      │  - Visual        │      │  - Recommendations│
└──────────────────┘      │  - Performance   │      └──────────────────┘
                          └──────────────────┘
                                   │
                                   ▼
                          ┌──────────────────┐
                          │  Test Execution  │
                          │                  │
                          │  - Device Matrix │
                          │  - Android Ver   │
                          │  - Screen Sizes  │
                          └──────────────────┘
```

### Component Breakdown

1. **Screen Scanner**: Systematically traverses all application screens
2. **Issue Detector**: Applies detection rules for each audit category
3. **Test Execution**: Runs tests across device configurations
4. **Report Generator**: Compiles findings into structured Markdown

## Components and Interfaces

### 1. Screen Scanner Component

**Purpose**: Identify and catalog all screens in the FRAMS application

**Interface**:
```typescript
interface ScreenInfo {
  name: string;
  path: string;
  category: 'auth' | 'admin' | 'teacher' | 'student' | 'auxiliary';
  role?: 'admin' | 'teacher' | 'student';
  hasInputFields: boolean;
  hasScrollView: boolean;
  hasKeyboardAwareScrollView: boolean;
  components: string[];
}

interface ScreenScanner {
  scanAllScreens(): Promise<ScreenInfo[]>;
  getScreensByCategory(category: string): ScreenInfo[];
  getScreensByRole(role: string): ScreenInfo[];
}
```

**Screens to Scan**:
- **Authentication**: SignInScreen, SignUpScreen, ForgotPasswordScreen, ResetPasswordScreen, EmailVerificationScreen, UnverifiedScreen
- **Admin**: UserManagement, OrganizationManager, AuditLogsScreen, VerificationDashboard, ReportsScreen, AdminDashboard
- **Teacher**: AttendanceManager, AssignmentManager, MarksReviewManager, TeacherDashboard
- **Student**: AttendanceScreen, AssignmentScreen, StudentDashboard
- **Auxiliary**: ProfileScreen, SettingsScreen, NotificationsScreen, DashboardScreen, ChangePasswordScreen, PrivacyPolicyScreen, TermsScreen

### 2. Keyboard Interaction Detector

**Purpose**: Identify keyboard-related UI issues

**Interface**:
```typescript
interface KeyboardIssue {
  screen: string;
  component: string;
  issueType: 'obscured' | 'no-resize' | 'focus-transition' | 'dismiss-failure' | 'returnkey-missing';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  reproductionSteps: string[];
  deviceConfig: DeviceConfig;
  hasKeyboardAwareScrollView: boolean;
  windowSoftInputMode?: string;
}

interface KeyboardDetector {
  detectKeyboardIssues(screen: ScreenInfo): Promise<KeyboardIssue[]>;
  testInputFieldVisibility(screen: ScreenInfo): Promise<boolean>;
  testFocusTransitions(screen: ScreenInfo): Promise<boolean>;
  testKeyboardDismissal(screen: ScreenInfo): Promise<boolean>;
}
```

**Detection Rules**:
- Check if KeyboardAwareScrollView is used on screens with input fields
- Verify extraScrollHeight is configured appropriately
- Test keyboard appearance on forms with multiple inputs
- Validate returnKeyType configuration
- Check android:windowSoftInputMode in app configuration

### 3. Typography Analyzer

**Purpose**: Evaluate typography consistency and accessibility

**Interface**:
```typescript
interface TypographyIssue {
  screen: string;
  component: string;
  issueType: 'non-scalable' | 'overflow' | 'contrast' | 'misalignment';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  currentFontSize: number;
  recommendedFontSize: number;
  contrastRatio?: number;
  reproductionSteps: string[];
}

interface TypographyAnalyzer {
  analyzeTypography(screen: ScreenInfo): Promise<TypographyIssue[]>;
  checkFontScalability(component: string): boolean;
  checkTextOverflow(component: string): boolean;
  checkContrastRatio(textColor: string, backgroundColor: string): number;
}
```

**Analysis Rules**:
- Verify font sizes use scalable units (React Native's default is sp-equivalent)
- Test with Android text size settings at 100%, 125%, 150%, 175%, 200%
- Check for numberOfLines and ellipsizeMode on Text components
- Calculate WCAG contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text)
- Identify hardcoded font sizes that don't scale

### 4. Layout Responsiveness Tester

**Purpose**: Test layout behavior across device sizes and orientations

**Interface**:
```typescript
interface DeviceConfig {
  name: string;
  width: number;
  height: number;
  density: number;
  androidVersion: string;
}

interface LayoutIssue {
  screen: string;
  deviceConfig: DeviceConfig;
  orientation: 'portrait' | 'landscape';
  issueType: 'clipping' | 'overlap' | 'misalignment' | 'spacing-inconsistent';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  affectedComponents: string[];
  reproductionSteps: string[];
}

interface LayoutTester {
  testResponsiveness(screen: ScreenInfo, devices: DeviceConfig[]): Promise<LayoutIssue[]>;
  testOrientation(screen: ScreenInfo): Promise<LayoutIssue[]>;
  checkFlexLayout(component: string): boolean;
  checkScrollViewUsage(screen: ScreenInfo): boolean;
}
```

**Test Matrix**:
- Small screen: 720×1480 (e.g., Samsung Galaxy A series)
- Mid-range: 1080×2400 (e.g., Pixel 5, Samsung S21)
- Large screen/tablet: 1200+ dp width (e.g., Samsung Tab S7)
- Orientations: Portrait and Landscape
- Android versions: 8, 9, 10, 11, 12, 13, 14

### 5. Navigation Flow Validator

**Purpose**: Verify navigation integrity and user flow correctness

**Interface**:
```typescript
interface NavigationIssue {
  flow: string;
  issueType: 'dead-end' | 'inconsistent-transition' | 'back-button-failure' | 'state-reset-failure';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  expectedBehavior: string;
  actualBehavior: string;
  reproductionSteps: string[];
}

interface NavigationValidator {
  validateNavigationFlows(): Promise<NavigationIssue[]>;
  testLoginFlow(role: string): Promise<boolean>;
  testLogoutFlow(): Promise<boolean>;
  testBackButtonBehavior(screen: string): Promise<boolean>;
  testDeepLinking(): Promise<boolean>;
}
```

**Validation Flows**:
- Login → Dashboard (per role)
- Logout → SignIn
- Back button on all screens
- Deep link: Reset Password
- Role switching (if applicable)
- Navigation stack integrity

### 6. Visual Consistency Checker

**Purpose**: Ensure adherence to design system

**Interface**:
```typescript
interface VisualIssue {
  screen: string;
  component: string;
  issueType: 'inconsistent-spacing' | 'inconsistent-colors' | 'inconsistent-sizing' | 'theme-violation';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  expectedValue: string;
  actualValue: string;
  designSystemReference: string;
}

interface VisualChecker {
  checkConsistency(screen: ScreenInfo): Promise<VisualIssue[]>;
  validateThemeUsage(component: string): boolean;
  checkButtonConsistency(buttons: string[]): boolean;
  checkSpacingConsistency(screen: ScreenInfo): boolean;
}
```

**Consistency Rules**:
- Button sizes: Primary (height: 52px), Secondary (height: 48px)
- Spacing: Use tokens.spacing values (xs: 4, sm: 8, md: 16, lg: 24, xl: 32)
- Colors: Use tokens.colors from design system
- Border radius: Use tokens.borders.radius values
- Loading states: Use LoadingSpinner component
- Error messages: Use consistent error styling

### 7. Performance Monitor

**Purpose**: Identify performance bottlenecks and UI jank

**Interface**:
```typescript
interface PerformanceIssue {
  screen: string;
  issueType: 'jank' | 'slow-render' | 'unoptimized-list' | 'delayed-feedback';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  metrics: {
    frameRate?: number;
    renderTime?: number;
    listItemCount?: number;
  };
  reproductionSteps: string[];
  optimizationRecommendation: string;
}

interface PerformanceMonitor {
  monitorPerformance(screen: ScreenInfo, conditions: TestConditions): Promise<PerformanceIssue[]>;
  measureFrameRate(screen: string): Promise<number>;
  checkListOptimization(listComponent: string): boolean;
  testSlowNetwork(screen: string): Promise<PerformanceIssue[]>;
}
```

**Performance Tests**:
- Frame rate during navigation transitions (target: 60fps)
- Render time for screens with large lists
- FlatList optimization (keyExtractor, getItemLayout, removeClippedSubviews)
- Network throttling: Slow 3G, Fast 3G, 4G
- Large data sets: 100+ items in lists

### 8. Report Generator

**Purpose**: Compile findings into comprehensive Markdown report

**Interface**:
```typescript
interface AuditReport {
  executiveSummary: ExecutiveSummary;
  screenFindings: ScreenFinding[];
  keyboardAudit: KeyboardAudit;
  typographyAudit: TypographyAudit;
  responsivenessAudit: ResponsivenessAudit;
  visualConsistencyAudit: VisualConsistencyAudit;
  navigationAudit: NavigationAudit;
  performanceAudit: PerformanceAudit;
  fixRecommendations: FixRecommendation[];
  testingSuggestions: TestingSuggestion[];
}

interface ReportGenerator {
  generateReport(allIssues: AllIssues): Promise<string>;
  calculateUXScore(issues: AllIssues): number;
  prioritizeIssues(issues: AllIssues): Issue[];
  generateExecutiveSummary(issues: AllIssues): ExecutiveSummary;
}
```

**Report Structure**:
1. Executive Summary (UX score, major blockers, priority list)
2. Screen-by-Screen Findings (one section per screen)
3. Android Keyboard Audit (input issues, overlap examples)
4. Typography & Accessibility Summary (issues, suggestions)
5. Responsiveness Findings (device size impact)
6. Visual Consistency Audit
7. Navigation & Flow Issues
8. Performance Observations
9. Fix Recommendations (code references, line numbers)
10. Testing Suggestions (OS versions, input methods)

## Data Models

### Issue Model
```typescript
interface Issue {
  id: string;
  screen: string;
  category: 'keyboard' | 'typography' | 'layout' | 'navigation' | 'visual' | 'performance';
  issueType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reproductionSteps: string[];
  deviceConfig?: DeviceConfig;
  codeReference?: CodeReference;
  recommendation: string;
  screenshots?: string[];
}

interface CodeReference {
  file: string;
  lineNumber?: number;
  component?: string;
  snippet?: string;
}
```

### Device Configuration Model
```typescript
interface DeviceConfig {
  name: string;
  width: number;
  height: number;
  density: number;
  androidVersion: string;
  manufacturer?: string;
}
```

### Test Conditions Model
```typescript
interface TestConditions {
  networkSpeed: 'slow-3g' | 'fast-3g' | '4g' | 'wifi';
  textSize: 100 | 125 | 150 | 175 | 200;
  orientation: 'portrait' | 'landscape';
  darkMode: boolean;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Complete Screen Coverage
*For any* screen in the FRAMS application, the audit system should identify and evaluate it, ensuring no screen is missed in the audit process.
**Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**

### Property 2: Issue Documentation Completeness
*For any* identified UI issue, the audit system should document all required fields including screen name, issue description, severity rating, reproduction steps, and code reference.
**Validates: Requirements 1.6, 1.7, 1.8**

### Property 3: Keyboard Visibility Preservation
*For any* screen with input fields, when the keyboard appears, all focused input fields should remain visible and not be obscured by the keyboard.
**Validates: Requirements 2.1, 2.2**

### Property 4: Keyboard Dismissal Consistency
*For any* screen with input fields, the keyboard should be dismissible using standard Android gestures (back button, tap outside).
**Validates: Requirements 2.3**

### Property 5: Focus Transition Correctness
*For any* form with multiple input fields, when navigating between fields using returnKeyType, the next field should receive focus and become visible.
**Validates: Requirements 2.4, 2.5**

### Property 6: Typography Scalability
*For any* text element in the application, when Android text size is increased in OS settings, the text should scale proportionally and remain readable.
**Validates: Requirements 3.1, 3.2**

### Property 7: Text Overflow Handling
*For any* text element with limited space, when content exceeds available space, the text should be clipped with ellipsis rather than overlapping other elements.
**Validates: Requirements 3.3**

### Property 8: Contrast Ratio Compliance
*For any* text element, the contrast ratio between text color and background color should meet WCAG standards (4.5:1 for normal text, 3:1 for large text).
**Validates: Requirements 3.4**

### Property 9: Layout Responsiveness Across Devices
*For any* screen, when rendered on devices with different screen sizes (720×1480, 1080×2400, 1200+ dp), the layout should adapt without clipping, overlapping, or misalignment.
**Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.7**

### Property 10: Orientation Change Stability
*For any* screen, when the device orientation changes from portrait to landscape or vice versa, the layout should adapt correctly without losing content or functionality.
**Validates: Requirements 4.6**

### Property 11: Navigation Transition Smoothness
*For any* navigation transition between screens, the transition should be smooth and consistent without jarring animations or delays.
**Validates: Requirements 5.1**

### Property 12: No Dead-End States
*For any* screen in the application, there should exist a valid navigation path to return to a previous screen or the home screen, preventing dead-end states.
**Validates: Requirements 5.2**

### Property 13: Back Button Predictability
*For any* screen, when the Android back button is pressed, the behavior should be predictable and consistent with Android conventions.
**Validates: Requirements 5.3**

### Property 14: Authentication State Reset
*For any* logout action, the authentication state should be completely reset, preventing access to authenticated screens.
**Validates: Requirements 5.5**

### Property 15: Theme Consistency
*For any* component using the design system, the component should use tokens from the theme (colors, spacing, typography) rather than hardcoded values.
**Validates: Requirements 6.1, 6.2**

### Property 16: Loading State Consistency
*For any* asynchronous operation, the loading state should be displayed using the standard LoadingSpinner component with consistent styling.
**Validates: Requirements 6.3**

### Property 17: Validation State Visibility
*For any* form input with validation, the validation state (error, success) should be clearly visible and distinguished using consistent styling.
**Validates: Requirements 6.4**

### Property 18: Performance Under Network Stress
*For any* screen that loads data from the network, when tested under slow network conditions, the UI should remain responsive and provide appropriate feedback.
**Validates: Requirements 7.1**

### Property 19: List Optimization
*For any* screen with a list of items, when the list contains more than 50 items, the list should use FlatList with proper optimization (keyExtractor, getItemLayout, removeClippedSubviews).
**Validates: Requirements 7.2, 7.5**

### Property 20: Animation Frame Rate
*For any* screen transition or animation, the frame rate should maintain at least 50fps to ensure smooth visual experience.
**Validates: Requirements 7.3**

### Property 21: Report Completeness
*For any* completed audit, the generated report should include all required sections: executive summary, screen-by-screen findings, keyboard audit, typography audit, responsiveness findings, visual consistency audit, navigation audit, performance observations, fix recommendations, and testing suggestions.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10**

## Error Handling

### Error Categories

1. **Screen Discovery Errors**
   - Missing screen files
   - Unparseable component code
   - Circular dependencies
   - **Handling**: Log warning, continue with available screens, note in report

2. **Test Execution Errors**
   - Device/emulator unavailable
   - Test timeout
   - Crash during test
   - **Handling**: Retry once, log failure, mark test as incomplete in report

3. **Analysis Errors**
   - Unable to parse component structure
   - Missing theme tokens
   - Invalid color values
   - **Handling**: Log error with context, skip specific check, note limitation in report

4. **Report Generation Errors**
   - File write failure
   - Template rendering error
   - **Handling**: Retry with fallback template, output to console if file write fails

### Error Recovery Strategies

- **Graceful Degradation**: Continue audit even if some tests fail
- **Partial Results**: Include partial findings in report with notes about incomplete sections
- **Error Logging**: Maintain detailed error log for debugging
- **User Notification**: Clearly indicate in report which sections are incomplete and why

## Testing Strategy

### Unit Testing

Unit tests will verify individual components of the audit system:

1. **Screen Scanner Tests**
   - Test screen discovery from file system
   - Test categorization logic
   - Test component extraction

2. **Issue Detector Tests**
   - Test keyboard issue detection rules
   - Test typography analysis algorithms
   - Test layout responsiveness checks
   - Test navigation validation logic
   - Test visual consistency rules
   - Test performance monitoring

3. **Report Generator Tests**
   - Test Markdown generation
   - Test severity calculation
   - Test UX score calculation
   - Test prioritization algorithm

### Property-Based Testing

Property-based tests will use **Hypothesis** (Python) or **fast-check** (TypeScript/JavaScript) to verify correctness properties across many inputs.

**Framework**: fast-check (for TypeScript/JavaScript implementation)

**Configuration**: Each property test should run a minimum of 100 iterations.

**Test Examples**:

```typescript
// Property 1: Complete Screen Coverage
test('Property 1: All screens are discovered and evaluated', () => {
  fc.assert(
    fc.property(
      fc.array(screenGenerator()),
      (screens) => {
        const scanner = new ScreenScanner();
        const discovered = scanner.scanAllScreens();
        // Every screen should be discovered
        return screens.every(screen => 
          discovered.some(d => d.path === screen.path)
        );
      }
    ),
    { numRuns: 100 }
  );
});

// Property 2: Issue Documentation Completeness
test('Property 2: All issues have required fields', () => {
  fc.assert(
    fc.property(
      fc.array(issueGenerator()),
      (issues) => {
        // Every issue should have all required fields
        return issues.every(issue => 
          issue.screen && 
          issue.description && 
          issue.severity && 
          issue.reproductionSteps.length > 0 &&
          issue.recommendation
        );
      }
    ),
    { numRuns: 100 }
  );
});

// Property 9: Layout Responsiveness Across Devices
test('Property 9: Layouts adapt to different screen sizes', () => {
  fc.assert(
    fc.property(
      screenGenerator(),
      deviceConfigGenerator(),
      (screen, device) => {
        const tester = new LayoutTester();
        const issues = tester.testResponsiveness(screen, [device]);
        // No critical clipping or overlap issues
        return !issues.some(i => 
          i.severity === 'critical' && 
          (i.issueType === 'clipping' || i.issueType === 'overlap')
        );
      }
    ),
    { numRuns: 100 }
  );
});

// Property 21: Report Completeness
test('Property 21: Generated reports include all required sections', () => {
  fc.assert(
    fc.property(
      allIssuesGenerator(),
      (issues) => {
        const generator = new ReportGenerator();
        const report = generator.generateReport(issues);
        const requiredSections = [
          'Executive Summary',
          'Screen-by-Screen Findings',
          'Android Keyboard Audit',
          'Typography & Accessibility Summary',
          'Responsiveness Findings',
          'Visual Consistency Audit',
          'Navigation & Flow Issues',
          'Performance Observations',
          'Fix Recommendations',
          'Testing Suggestions'
        ];
        // All required sections should be present
        return requiredSections.every(section => 
          report.includes(section)
        );
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test Tags**: Each property-based test must include a comment with the format:
```typescript
// Feature: android-ui-ux-audit, Property 1: Complete Screen Coverage
```

### Integration Testing

Integration tests will verify the end-to-end audit workflow:

1. **Full Audit Execution**
   - Run complete audit on sample screens
   - Verify report generation
   - Check all sections are populated

2. **Device Matrix Testing**
   - Test on multiple Android versions
   - Test on multiple screen sizes
   - Verify consistent results

3. **Error Handling Integration**
   - Simulate missing screens
   - Simulate test failures
   - Verify graceful degradation

### Manual Testing

Manual testing will be required for:

1. **Visual Inspection**
   - Verify screenshots accurately represent issues
   - Confirm visual inconsistencies
   - Validate color contrast issues

2. **User Flow Testing**
   - Walk through navigation flows
   - Test back button behavior
   - Verify deep linking

3. **Performance Validation**
   - Observe actual frame rates
   - Test on real devices
   - Validate network throttling effects

### Test Coverage Goals

- Unit test coverage: 80%+ for core logic
- Property test coverage: All 21 correctness properties
- Integration test coverage: All major workflows
- Manual test coverage: All visual and UX aspects

### Testing Tools

- **Unit Testing**: Jest, React Native Testing Library
- **Property-Based Testing**: fast-check
- **Integration Testing**: Detox (for E2E on React Native)
- **Performance Testing**: React Native Performance Monitor, Flipper
- **Device Testing**: Android Emulator, Real devices (if available)
- **Network Throttling**: Chrome DevTools, Android Debug Bridge (ADB)

## Implementation Notes

### Audit Execution Workflow

1. **Initialization**
   - Load configuration (device matrix, test conditions)
   - Initialize screen scanner
   - Set up test environment

2. **Screen Discovery**
   - Scan all screen files
   - Extract component information
   - Categorize by role and type

3. **Issue Detection**
   - Run keyboard interaction tests
   - Run typography analysis
   - Run layout responsiveness tests
   - Run navigation validation
   - Run visual consistency checks
   - Run performance monitoring

4. **Report Generation**
   - Aggregate all issues
   - Calculate UX score
   - Prioritize issues
   - Generate Markdown report

5. **Output**
   - Save report to file
   - Generate summary statistics
   - Create issue tracking items (optional)

### Configuration

The audit system should be configurable via a configuration file:

```typescript
interface AuditConfig {
  devices: DeviceConfig[];
  testConditions: TestConditions[];
  severityThresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  outputPath: string;
  screenshotsEnabled: boolean;
  performanceTestsEnabled: boolean;
}
```

### Extensibility

The audit system should be designed for extensibility:

- **Custom Detectors**: Allow adding new issue detectors
- **Custom Report Sections**: Allow adding custom report sections
- **Custom Severity Rules**: Allow customizing severity calculation
- **Plugin System**: Support plugins for specialized audits

## Dependencies

- **React Native**: 0.81.5
- **Expo**: ~54.0
- **TypeScript**: 5.9
- **Jest**: For unit testing
- **fast-check**: For property-based testing
- **Detox**: For E2E testing (optional)
- **React Native Testing Library**: For component testing
- **Markdown**: For report generation
- **File System**: For reading screen files and writing reports

## Deliverables

1. **Audit System Implementation**
   - Screen scanner
   - Issue detectors (keyboard, typography, layout, navigation, visual, performance)
   - Report generator

2. **Test Suite**
   - Unit tests
   - Property-based tests
   - Integration tests

3. **Comprehensive Audit Report**
   - Markdown format
   - All required sections
   - Actionable recommendations

4. **Documentation**
   - Usage guide
   - Configuration guide
   - Extending the audit system

## Timeline Estimate

- Screen Scanner: 2-3 days
- Issue Detectors: 5-7 days
- Report Generator: 2-3 days
- Testing: 3-4 days
- Manual Audit Execution: 3-5 days
- Report Refinement: 1-2 days
- **Total**: 16-24 days
