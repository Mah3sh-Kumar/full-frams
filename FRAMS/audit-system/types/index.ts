/**
 * Core TypeScript interfaces for the Android UI/UX Audit System
 * These types define the data models used throughout the audit process
 */

// ============================================================================
// Screen Information Models
// ============================================================================

export type ScreenCategory = 'auth' | 'admin' | 'teacher' | 'student' | 'auxiliary';
export type UserRole = 'admin' | 'teacher' | 'student';

export interface ScreenInfo {
  name: string;
  path: string;
  category: ScreenCategory;
  role?: UserRole;
  hasInputFields: boolean;
  hasScrollView: boolean;
  hasKeyboardAwareScrollView: boolean;
  components: string[];
}

// ============================================================================
// Device Configuration Models
// ============================================================================

export interface DeviceConfig {
  name: string;
  width: number;
  height: number;
  density: number;
  androidVersion: string;
  manufacturer?: string;
}

// ============================================================================
// Test Conditions Models
// ============================================================================

export type NetworkSpeed = 'slow-3g' | 'fast-3g' | '4g' | 'wifi';
export type TextSize = 100 | 125 | 150 | 175 | 200;
export type Orientation = 'portrait' | 'landscape';

export interface TestConditions {
  networkSpeed: NetworkSpeed;
  textSize: TextSize;
  orientation: Orientation;
  darkMode: boolean;
}

// ============================================================================
// Issue Models
// ============================================================================

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IssueCategory = 'keyboard' | 'typography' | 'layout' | 'navigation' | 'visual' | 'performance';

export interface CodeReference {
  file: string;
  lineNumber?: number;
  component?: string;
  snippet?: string;
}

export interface Issue {
  id: string;
  screen: string;
  category: IssueCategory;
  issueType: string;
  severity: IssueSeverity;
  title: string;
  description: string;
  reproductionSteps: string[];
  deviceConfig?: DeviceConfig;
  codeReference?: CodeReference;
  recommendation: string;
  screenshots?: string[];
}

// ============================================================================
// Keyboard Issue Models
// ============================================================================

export type KeyboardIssueType = 
  | 'obscured' 
  | 'no-resize' 
  | 'focus-transition' 
  | 'dismiss-failure' 
  | 'returnkey-missing';

export interface KeyboardIssue extends Omit<Issue, 'category' | 'issueType'> {
  category: 'keyboard';
  issueType: KeyboardIssueType;
  component: string;
  hasKeyboardAwareScrollView: boolean;
  windowSoftInputMode?: string;
}

// ============================================================================
// Typography Issue Models
// ============================================================================

export type TypographyIssueType = 
  | 'non-scalable' 
  | 'overflow' 
  | 'contrast' 
  | 'misalignment';

export interface TypographyIssue extends Omit<Issue, 'category' | 'issueType'> {
  category: 'typography';
  issueType: TypographyIssueType;
  component: string;
  currentFontSize: number;
  recommendedFontSize: number;
  contrastRatio?: number;
}

// ============================================================================
// Layout Issue Models
// ============================================================================

export type LayoutIssueType = 
  | 'clipping' 
  | 'overlap' 
  | 'misalignment' 
  | 'spacing-inconsistent';

export interface LayoutIssue extends Omit<Issue, 'category' | 'issueType'> {
  category: 'layout';
  issueType: LayoutIssueType;
  orientation: Orientation;
  affectedComponents: string[];
}

// ============================================================================
// Navigation Issue Models
// ============================================================================

export type NavigationIssueType = 
  | 'dead-end' 
  | 'inconsistent-transition' 
  | 'back-button-failure' 
  | 'state-reset-failure';

export interface NavigationIssue extends Omit<Issue, 'category' | 'issueType'> {
  category: 'navigation';
  issueType: NavigationIssueType;
  flow: string;
  expectedBehavior: string;
  actualBehavior: string;
}

// ============================================================================
// Visual Issue Models
// ============================================================================

export type VisualIssueType = 
  | 'inconsistent-spacing' 
  | 'inconsistent-colors' 
  | 'inconsistent-sizing' 
  | 'theme-violation';

export interface VisualIssue extends Omit<Issue, 'category' | 'issueType'> {
  category: 'visual';
  issueType: VisualIssueType;
  component: string;
  expectedValue: string;
  actualValue: string;
  designSystemReference: string;
}

// ============================================================================
// Performance Issue Models
// ============================================================================

export type PerformanceIssueType = 
  | 'jank' 
  | 'slow-render' 
  | 'unoptimized-list' 
  | 'delayed-feedback';

export interface PerformanceMetrics {
  frameRate?: number;
  renderTime?: number;
  listItemCount?: number;
}

export interface PerformanceIssue extends Omit<Issue, 'category' | 'issueType'> {
  category: 'performance';
  issueType: PerformanceIssueType;
  metrics: PerformanceMetrics;
  optimizationRecommendation: string;
}

// ============================================================================
// Report Models
// ============================================================================

export interface ExecutiveSummary {
  uxScore: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  majorBlockers: string[];
  priorityList: Issue[];
}

export interface ScreenFinding {
  screenName: string;
  category: ScreenCategory;
  issues: Issue[];
  summary: string;
}

export interface KeyboardAudit {
  totalIssues: number;
  screensAffected: string[];
  issues: KeyboardIssue[];
  summary: string;
}

export interface TypographyAudit {
  totalIssues: number;
  screensAffected: string[];
  issues: TypographyIssue[];
  summary: string;
}

export interface ResponsivenessAudit {
  totalIssues: number;
  screensAffected: string[];
  issues: LayoutIssue[];
  deviceImpact: Map<string, number>;
  summary: string;
}

export interface VisualConsistencyAudit {
  totalIssues: number;
  screensAffected: string[];
  issues: VisualIssue[];
  summary: string;
}

export interface NavigationAudit {
  totalIssues: number;
  flowsAffected: string[];
  issues: NavigationIssue[];
  summary: string;
}

export interface PerformanceAudit {
  totalIssues: number;
  screensAffected: string[];
  issues: PerformanceIssue[];
  summary: string;
}

export interface FixRecommendation {
  issueId: string;
  priority: IssueSeverity;
  description: string;
  codeReference: CodeReference;
  implementation: string;
  estimatedEffort: string;
}

export interface TestingSuggestion {
  category: string;
  description: string;
  testCases: string[];
  tools: string[];
}

export interface AuditReport {
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

// ============================================================================
// All Issues Collection
// ============================================================================

export interface AllIssues {
  keyboard: KeyboardIssue[];
  typography: TypographyIssue[];
  layout: LayoutIssue[];
  navigation: NavigationIssue[];
  visual: VisualIssue[];
  performance: PerformanceIssue[];
}

// ============================================================================
// Component Interfaces
// ============================================================================

export interface ScreenScanner {
  scanAllScreens(): Promise<ScreenInfo[]>;
  getScreensByCategory(category: ScreenCategory): ScreenInfo[];
  getScreensByRole(role: UserRole): ScreenInfo[];
}

export interface KeyboardDetector {
  detectKeyboardIssues(screen: ScreenInfo): Promise<KeyboardIssue[]>;
  testInputFieldVisibility(screen: ScreenInfo): Promise<boolean>;
  testFocusTransitions(screen: ScreenInfo): Promise<boolean>;
  testKeyboardDismissal(screen: ScreenInfo): Promise<boolean>;
}

export interface TypographyAnalyzer {
  analyzeTypography(screen: ScreenInfo): Promise<TypographyIssue[]>;
  checkFontScalability(component: string): boolean;
  checkTextOverflow(component: string): boolean;
  checkContrastRatio(textColor: string, backgroundColor: string): number;
}

export interface LayoutTester {
  testResponsiveness(screen: ScreenInfo, devices: DeviceConfig[]): Promise<LayoutIssue[]>;
  testOrientation(screen: ScreenInfo): Promise<LayoutIssue[]>;
  checkFlexLayout(component: string): boolean;
  checkScrollViewUsage(screen: ScreenInfo): boolean;
}

export interface NavigationValidator {
  validateNavigationFlows(): Promise<NavigationIssue[]>;
  testLoginFlow(role: UserRole): Promise<boolean>;
  testLogoutFlow(): Promise<boolean>;
  testBackButtonBehavior(screen: string): Promise<boolean>;
  testDeepLinking(): Promise<boolean>;
}

export interface VisualChecker {
  checkConsistency(screen: ScreenInfo): Promise<VisualIssue[]>;
  validateThemeUsage(component: string): boolean;
  checkButtonConsistency(buttons: string[]): boolean;
  checkSpacingConsistency(screen: ScreenInfo): boolean;
}

export interface PerformanceMonitor {
  monitorPerformance(screen: ScreenInfo, conditions: TestConditions): Promise<PerformanceIssue[]>;
  measureFrameRate(screen: string): Promise<number>;
  checkListOptimization(listComponent: string): boolean;
  testSlowNetwork(screen: string): Promise<PerformanceIssue[]>;
}

export interface ReportGenerator {
  generateReport(allIssues: AllIssues): Promise<string>;
  calculateUXScore(issues: AllIssues): number;
  prioritizeIssues(issues: AllIssues): Issue[];
  generateExecutiveSummary(issues: AllIssues): ExecutiveSummary;
}
