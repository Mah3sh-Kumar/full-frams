# Android UI/UX Audit System

A comprehensive audit system for evaluating the UI/UX quality and Android-specific behaviors of the FRAMS React Native mobile application.

## Overview

This audit system systematically evaluates all screens across authentication flows, role-based interfaces (Admin, Teacher, Student), and auxiliary screens to identify issues related to:

- **Keyboard Interactions**: Input field visibility, focus transitions, keyboard dismissal
- **Typography**: Font scalability, text overflow, contrast ratios
- **Layout Responsiveness**: Device size compatibility, orientation handling
- **Navigation Flows**: User journey integrity, back button behavior
- **Visual Consistency**: Design system adherence, component consistency
- **Performance**: Frame rates, render times, list optimization

## Project Structure

```
audit-system/
├── types/              # TypeScript type definitions
│   └── index.ts        # Core data models and interfaces
├── config/             # Configuration files
│   └── audit.config.ts # Audit parameters and settings
├── components/         # Audit system components
│   ├── ScreenScanner.ts
│   ├── KeyboardDetector.ts
│   ├── TypographyAnalyzer.ts
│   ├── LayoutTester.ts
│   ├── NavigationValidator.ts
│   ├── VisualChecker.ts
│   ├── PerformanceMonitor.ts
│   └── ReportGenerator.ts
├── utils/              # Utility functions
│   └── helpers.ts
├── tests/              # Test files (to be added)
└── index.ts            # Main entry point
```

## Core Components

### 1. Screen Scanner
Identifies and catalogs all screens in the FRAMS application by category (auth, admin, teacher, student, auxiliary).

### 2. Keyboard Detector
Detects keyboard-related UI issues including input field obscuring, focus transitions, and keyboard dismissal problems.

### 3. Typography Analyzer
Evaluates typography consistency, font scalability, text overflow handling, and WCAG contrast compliance.

### 4. Layout Tester
Tests layout behavior across different device sizes (720×1480, 1080×2400, 1200+ dp) and orientations.

### 5. Navigation Validator
Verifies navigation flow integrity, login/logout flows, back button behavior, and deep linking.

### 6. Visual Checker
Ensures adherence to the design system, checking for consistent spacing, colors, sizing, and theme usage.

### 7. Performance Monitor
Identifies performance bottlenecks including frame drops, slow renders, and unoptimized lists.

### 8. Report Generator
Compiles all findings into a comprehensive Markdown report with actionable recommendations.

## Configuration

The audit system is configured via `config/audit.config.ts`:

- **Device Matrix**: Test devices with various screen sizes and Android versions
- **Test Conditions**: Network speeds, text sizes, orientations, dark mode
- **Severity Thresholds**: Scoring thresholds for issue severity levels
- **Screen Paths**: Locations of all screens to audit
- **WCAG Standards**: Contrast ratio requirements
- **Performance Thresholds**: Frame rate and render time targets

## Usage

```typescript
import { 
  ScreenScanner, 
  KeyboardDetector, 
  ReportGenerator,
  loadAuditConfig 
} from './audit-system';

// Load configuration
const config = loadAuditConfig();

// Scan screens
const scanner = new ScreenScanner();
const screens = await scanner.scanAllScreens();

// Detect issues
const keyboardDetector = new KeyboardDetector();
const keyboardIssues = await keyboardDetector.detectKeyboardIssues(screens[0]);

// Generate report
const reportGenerator = new ReportGenerator();
const report = await reportGenerator.generateReport(allIssues);
```

## Testing

The audit system uses property-based testing with **fast-check** to verify correctness properties:

- Property 1: Complete Screen Coverage
- Property 2: Issue Documentation Completeness
- Property 3-20: Various behavioral properties
- Property 21: Report Completeness

Each property test runs a minimum of 100 iterations to ensure comprehensive coverage.

## Development Status

This is the initial setup (Task 1). Component implementations will be added in subsequent tasks:

- Task 2: Screen Scanner implementation
- Task 3: Keyboard Detector implementation
- Task 4: Typography Analyzer implementation
- Task 5: Layout Tester implementation
- Task 6: Navigation Validator implementation
- Task 8: Visual Checker implementation
- Task 9: Performance Monitor implementation
- Task 10: Report Generator implementation

## Requirements

- React Native 0.81.5
- TypeScript 5.9
- Expo ~54.0
- fast-check (for property-based testing)
- Jest (for unit testing)

## License

Internal tool for FRAMS project audit purposes.
