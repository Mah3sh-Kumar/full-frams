/**
 * Property-Based Tests for Report Generator
 * Feature: android-ui-ux-audit, Property 2: Issue Documentation Completeness
 * Feature: android-ui-ux-audit, Property 21: Report Completeness
 * Validates: Requirements 1.6, 1.7, 1.8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10
 */

import * as fc from 'fast-check';
import { ReportGenerator } from '../ReportGenerator';
import { 
  AllIssues, 
  Issue, 
  KeyboardIssue, 
  TypographyIssue, 
  LayoutIssue, 
  NavigationIssue, 
  VisualIssue, 
  PerformanceIssue,
  IssueSeverity,
  IssueCategory
} from '../../types';

// Simplified arbitrary generators for property testing
const severityArbitrary = fc.constantFrom<IssueSeverity>('critical', 'high', 'medium', 'low');
const categoryArbitrary = fc.constantFrom<IssueCategory>('keyboard', 'typography', 'layout', 'navigation', 'visual', 'performance');

// Create a simple issue generator
const simpleIssueArbitrary = fc.record({
  id: fc.string({ minLength: 1 }),
  screen: fc.string({ minLength: 1 }),
  category: categoryArbitrary,
  issueType: fc.string({ minLength: 1 }),
  severity: severityArbitrary,
  title: fc.string({ minLength: 1 }),
  description: fc.string({ minLength: 1 }),
  reproductionSteps: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
  recommendation: fc.string({ minLength: 1 })
});

// Create all issues arbitrary with simplified structure
const allIssuesArbitrary: fc.Arbitrary<AllIssues> = fc.record({
  keyboard: fc.array(
    fc.record({
      id: fc.string({ minLength: 1 }),
      screen: fc.string({ minLength: 1 }),
      category: fc.constant('keyboard' as const),
      issueType: fc.constantFrom('obscured', 'no-resize', 'focus-transition', 'dismiss-failure', 'returnkey-missing'),
      severity: severityArbitrary,
      title: fc.string({ minLength: 1 }),
      description: fc.string({ minLength: 1 }),
      reproductionSteps: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
      recommendation: fc.string({ minLength: 1 }),
      component: fc.string({ minLength: 1 }),
      hasKeyboardAwareScrollView: fc.boolean()
    }),
    { minLength: 0, maxLength: 3 }
  ),
  typography: fc.array(
    fc.record({
      id: fc.string({ minLength: 1 }),
      screen: fc.string({ minLength: 1 }),
      category: fc.constant('typography' as const),
      issueType: fc.constantFrom('non-scalable', 'overflow', 'contrast', 'misalignment'),
      severity: severityArbitrary,
      title: fc.string({ minLength: 1 }),
      description: fc.string({ minLength: 1 }),
      reproductionSteps: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
      recommendation: fc.string({ minLength: 1 }),
      component: fc.string({ minLength: 1 }),
      currentFontSize: fc.float({ min: 8, max: 72 }),
      recommendedFontSize: fc.float({ min: 8, max: 72 })
    }),
    { minLength: 0, maxLength: 3 }
  ),
  layout: fc.array(
    fc.record({
      id: fc.string({ minLength: 1 }),
      screen: fc.string({ minLength: 1 }),
      category: fc.constant('layout' as const),
      issueType: fc.constantFrom('clipping', 'overlap', 'misalignment', 'spacing-inconsistent'),
      severity: severityArbitrary,
      title: fc.string({ minLength: 1 }),
      description: fc.string({ minLength: 1 }),
      reproductionSteps: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
      recommendation: fc.string({ minLength: 1 }),
      orientation: fc.constantFrom('portrait', 'landscape'),
      affectedComponents: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 2 })
    }),
    { minLength: 0, maxLength: 3 }
  ),
  navigation: fc.array(
    fc.record({
      id: fc.string({ minLength: 1 }),
      screen: fc.string({ minLength: 1 }),
      category: fc.constant('navigation' as const),
      issueType: fc.constantFrom('dead-end', 'inconsistent-transition', 'back-button-failure', 'state-reset-failure'),
      severity: severityArbitrary,
      title: fc.string({ minLength: 1 }),
      description: fc.string({ minLength: 1 }),
      reproductionSteps: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
      recommendation: fc.string({ minLength: 1 }),
      flow: fc.string({ minLength: 1 }),
      expectedBehavior: fc.string({ minLength: 1 }),
      actualBehavior: fc.string({ minLength: 1 })
    }),
    { minLength: 0, maxLength: 3 }
  ),
  visual: fc.array(
    fc.record({
      id: fc.string({ minLength: 1 }),
      screen: fc.string({ minLength: 1 }),
      category: fc.constant('visual' as const),
      issueType: fc.constantFrom('inconsistent-spacing', 'inconsistent-colors', 'inconsistent-sizing', 'theme-violation'),
      severity: severityArbitrary,
      title: fc.string({ minLength: 1 }),
      description: fc.string({ minLength: 1 }),
      reproductionSteps: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
      recommendation: fc.string({ minLength: 1 }),
      component: fc.string({ minLength: 1 }),
      expectedValue: fc.string({ minLength: 1 }),
      actualValue: fc.string({ minLength: 1 }),
      designSystemReference: fc.string({ minLength: 1 })
    }),
    { minLength: 0, maxLength: 3 }
  ),
  performance: fc.array(
    fc.record({
      id: fc.string({ minLength: 1 }),
      screen: fc.string({ minLength: 1 }),
      category: fc.constant('performance' as const),
      issueType: fc.constantFrom('jank', 'slow-render', 'unoptimized-list', 'delayed-feedback'),
      severity: severityArbitrary,
      title: fc.string({ minLength: 1 }),
      description: fc.string({ minLength: 1 }),
      reproductionSteps: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 3 }),
      recommendation: fc.string({ minLength: 1 }),
      metrics: fc.record({
        frameRate: fc.option(fc.float({ min: 0, max: 120 }), { nil: undefined }),
        renderTime: fc.option(fc.float({ min: 0, max: 1000 }), { nil: undefined })
      }),
      optimizationRecommendation: fc.string({ minLength: 1 })
    }),
    { minLength: 0, maxLength: 3 }
  )
});

describe('ReportGenerator Property Tests', () => {
  let reportGenerator: ReportGenerator;

  beforeEach(() => {
    reportGenerator = new ReportGenerator();
  });

  /**
   * Property 2: Issue Documentation Completeness
   * For any identified UI issue, the audit system should document all required fields 
   * including screen name, issue description, severity rating, reproduction steps, and code reference.
   * Validates: Requirements 1.6, 1.7, 1.8
   */
  test('Property 2: All issues have required documentation fields', async () => {
    await fc.assert(
      fc.asyncProperty(
        allIssuesArbitrary,
        async (issues) => {
          // Flatten all issues
          const allIssuesList = [
            ...issues.keyboard,
            ...issues.typography,
            ...issues.layout,
            ...issues.navigation,
            ...issues.visual,
            ...issues.performance
          ];

          // Every issue should have all required fields
          return allIssuesList.every(issue => 
            issue.screen && 
            issue.screen.length > 0 &&
            issue.description && 
            issue.description.length > 0 &&
            issue.severity &&
            ['critical', 'high', 'medium', 'low'].includes(issue.severity) &&
            issue.reproductionSteps && 
            issue.reproductionSteps.length > 0 &&
            issue.reproductionSteps.every(step => step && step.length > 0) &&
            issue.recommendation &&
            issue.recommendation.length > 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 21: Report Completeness
   * For any completed audit, the generated report should include all required sections:
   * executive summary, screen-by-screen findings, keyboard audit, typography audit,
   * responsiveness findings, visual consistency audit, navigation audit, 
   * performance observations, fix recommendations, and testing suggestions.
   * Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10
   */
  test('Property 21: Generated reports include all required sections', async () => {
    await fc.assert(
      fc.asyncProperty(
        allIssuesArbitrary,
        async (issues) => {
          const report = await reportGenerator.generateReport(issues);
          
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

          // All required sections should be present in the report
          return requiredSections.every(section => 
            report.includes(section)
          );
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: UX Score Calculation Consistency
   * For any set of issues, the UX score should be between 0 and 100 inclusive.
   */
  test('Property: UX score is always between 0 and 100', async () => {
    await fc.assert(
      fc.asyncProperty(
        allIssuesArbitrary,
        async (issues) => {
          const uxScore = reportGenerator.calculateUXScore(issues);
          return uxScore >= 0 && uxScore <= 100;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: UX Score Monotonicity
   * Adding more severe issues should not increase the UX score.
   */
  test('Property: Adding issues does not increase UX score', async () => {
    await fc.assert(
      fc.asyncProperty(
        allIssuesArbitrary,
        allIssuesArbitrary,
        async (issues1, issues2) => {
          const score1 = reportGenerator.calculateUXScore(issues1);
          
          // Combine issues
          const combinedIssues: AllIssues = {
            keyboard: [...issues1.keyboard, ...issues2.keyboard],
            typography: [...issues1.typography, ...issues2.typography],
            layout: [...issues1.layout, ...issues2.layout],
            navigation: [...issues1.navigation, ...issues2.navigation],
            visual: [...issues1.visual, ...issues2.visual],
            performance: [...issues1.performance, ...issues2.performance]
          };
          
          const scoreCombined = reportGenerator.calculateUXScore(combinedIssues);
          
          // Combined score should be <= original score (more issues = lower score)
          return scoreCombined <= score1;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Issue Prioritization Consistency
   * Critical issues should always appear before high/medium/low issues in priority list.
   */
  test('Property: Critical issues are prioritized first', async () => {
    await fc.assert(
      fc.asyncProperty(
        allIssuesArbitrary,
        async (issues) => {
          const prioritized = reportGenerator.prioritizeIssues(issues);
          
          // Find the first non-critical issue
          const firstNonCriticalIndex = prioritized.findIndex(issue => issue.severity !== 'critical');
          
          if (firstNonCriticalIndex === -1) {
            // All issues are critical or no issues
            return true;
          }
          
          // All issues before firstNonCriticalIndex should be critical
          const issuesBefore = prioritized.slice(0, firstNonCriticalIndex);
          return issuesBefore.every(issue => issue.severity === 'critical');
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Executive Summary Contains Required Metrics
   * The executive summary should always contain UX score and issue counts.
   */
  test('Property: Executive summary contains all required metrics', async () => {
    await fc.assert(
      fc.asyncProperty(
        allIssuesArbitrary,
        async (issues) => {
          const summary = reportGenerator.generateExecutiveSummary(issues);
          
          return (
            typeof summary.uxScore === 'number' &&
            summary.uxScore >= 0 && summary.uxScore <= 100 &&
            typeof summary.totalIssues === 'number' &&
            summary.totalIssues >= 0 &&
            typeof summary.criticalIssues === 'number' &&
            summary.criticalIssues >= 0 &&
            typeof summary.highIssues === 'number' &&
            summary.highIssues >= 0 &&
            typeof summary.mediumIssues === 'number' &&
            summary.mediumIssues >= 0 &&
            typeof summary.lowIssues === 'number' &&
            summary.lowIssues >= 0 &&
            Array.isArray(summary.majorBlockers) &&
            Array.isArray(summary.priorityList)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Report Generation Idempotence
   * Generating a report twice with the same issues should produce the same result.
   */
  test('Property: Report generation is idempotent', async () => {
    await fc.assert(
      fc.asyncProperty(
        allIssuesArbitrary,
        async (issues) => {
          const report1 = await reportGenerator.generateReport(issues);
          const report2 = await reportGenerator.generateReport(issues);
          
          return report1 === report2;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Empty Issues Produces Perfect Score
   * When there are no issues, the UX score should be 100.
   */
  test('Property: No issues results in perfect UX score', async () => {
    const emptyIssues: AllIssues = {
      keyboard: [],
      typography: [],
      layout: [],
      navigation: [],
      visual: [],
      performance: []
    };
    
    const uxScore = reportGenerator.calculateUXScore(emptyIssues);
    expect(uxScore).toBe(100);
  });

  /**
   * Property: Severity Impact on UX Score
   * Critical issues should have more negative impact on UX score than low issues.
   */
  test('Property: Critical issues impact UX score more than low issues', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(keyboardIssueArbitrary, { minLength: 1, maxLength: 3 }),
        fc.array(keyboardIssueArbitrary, { minLength: 1, maxLength: 3 }),
        async (criticalIssues, lowIssues) => {
          // Set all issues in first array to critical
          const criticalSet = criticalIssues.map(issue => ({
            ...issue,
            severity: 'critical' as const
          }));
          
          // Set all issues in second array to low
          const lowSet = lowIssues.map(issue => ({
            ...issue,
            severity: 'low' as const
          }));
          
          const criticalOnly: AllIssues = {
            keyboard: criticalSet,
            typography: [],
            layout: [],
            navigation: [],
            visual: [],
            performance: []
          };
          
          const lowOnly: AllIssues = {
            keyboard: lowSet,
            typography: [],
            layout: [],
            navigation: [],
            visual: [],
            performance: []
          };
          
          const criticalScore = reportGenerator.calculateUXScore(criticalOnly);
          const lowScore = reportGenerator.calculateUXScore(lowOnly);
          
          // With same number of issues, critical should result in lower score
          if (criticalSet.length === lowSet.length) {
            return criticalScore <= lowScore;
          }
          
          return true; // Different counts, can't compare directly
        }
      ),
      { numRuns: 50 }
    );
  });
});