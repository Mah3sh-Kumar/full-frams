/**
 * Unit Tests for ReportGenerator
 * Tests Markdown generation, UX score calculation, and issue prioritization
 */

import { ReportGenerator } from '../ReportGenerator';
import { AllIssues, KeyboardIssue, TypographyIssue, LayoutIssue, NavigationIssue, VisualIssue, PerformanceIssue } from '../../types';

describe('ReportGenerator Unit Tests', () => {
  let reportGenerator: ReportGenerator;
  
  beforeEach(() => {
    reportGenerator = new ReportGenerator();
  });

  describe('UX Score Calculation', () => {
    it('should calculate perfect score for no issues', () => {
      const emptyIssues: AllIssues = {
        keyboard: [],
        typography: [],
        layout: [],
        navigation: [],
        visual: [],
        performance: []
      };
      
      const score = reportGenerator.calculateUXScore(emptyIssues);
      expect(score).toBe(100);
    });

    it('should calculate lower score for critical issues', () => {
      const issues: AllIssues = {
        keyboard: [{
          id: '1',
          screen: 'SignInScreen',
          category: 'keyboard',
          issueType: 'obscured',
          severity: 'critical',
          title: 'Keyboard obscures input field',
          description: 'Keyboard covers input field',
          reproductionSteps: ['Open sign in screen', 'Tap on email field'],
          deviceConfig: undefined,
          codeReference: undefined,
          recommendation: 'Use KeyboardAwareScrollView',
          screenshots: [],
          component: 'EmailInput',
          hasKeyboardAwareScrollView: false,
          windowSoftInputMode: undefined
        } as KeyboardIssue],
        typography: [],
        layout: [],
        navigation: [],
        visual: [],
        performance: []
      };
      
      const score = reportGenerator.calculateUXScore(issues);
      expect(score).toBeLessThan(100);
      expect(score).toBeGreaterThan(0);
    });

    it('should prioritize critical issues first', () => {
      const issues: AllIssues = {
        keyboard: [
          {
            id: '1',
            screen: 'SignInScreen',
            category: 'keyboard',
            issueType: 'obscured',
            severity: 'low',
            title: 'Minor keyboard issue',
            description: 'Minor issue',
            reproductionSteps: ['Test'],
            recommendation: 'Fix',
            component: 'Test',
            hasKeyboardAwareScrollView: false
          } as KeyboardIssue,
          {
            id: '2',
            screen: 'SignInScreen',
            category: 'keyboard',
            issueType: 'obscured',
            severity: 'critical',
            title: 'Critical keyboard issue',
            description: 'Critical issue',
            reproductionSteps: ['Test'],
            recommendation: 'Fix',
            component: 'Test',
            hasKeyboardAwareScrollView: false
          } as KeyboardIssue
        ],
        typography: [],
        layout: [],
        navigation: [],
        visual: [],
        performance: []
      };
      
      const prioritized = reportGenerator.prioritizeIssues(issues);
      expect(prioritized[0].severity).toBe('critical');
      expect(prioritized[0].title).toBe('Critical keyboard issue');
    });
  });

  describe('Report Generation', () => {
    it('should generate a non-empty report', async () => {
      const issues: AllIssues = {
        keyboard: [{
          id: '1',
          screen: 'SignInScreen',
          category: 'keyboard',
          issueType: 'obscured',
          severity: 'medium',
          title: 'Keyboard covers input',
          description: 'Keyboard obscures input field',
          reproductionSteps: ['Open sign in', 'Tap email field'],
          recommendation: 'Use KeyboardAwareScrollView',
          component: 'EmailInput',
          hasKeyboardAwareScrollView: false
        } as KeyboardIssue],
        typography: [],
        layout: [],
        navigation: [],
        visual: [],
        performance: []
      };
      
      const report = await reportGenerator.generateReport(issues);
      expect(report).toContain('Android UI/UX Audit Report');
      expect(report).toContain('Executive Summary');
      expect(report).toContain('SignInScreen');
    });

    it('should include all required sections', async () => {
      const issues: AllIssues = {
        keyboard: [],
        typography: [],
        layout: [],
        navigation: [],
        visual: [],
        performance: []
      };
      
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
      
      requiredSections.forEach(section => {
        expect(report).toContain(section);
      });
    });
  });

  describe('Issue Prioritization', () => {
    it('should sort issues by severity', () => {
      const issues: AllIssueTypes[] = [
        {
          id: '1',
          screen: 'Screen1',
          category: 'keyboard',
          issueType: 'obscured',
          severity: 'low',
          title: 'Low severity issue',
          description: 'Low priority',
          reproductionSteps: ['test'],
          recommendation: 'Fix',
          component: 'Test',
          hasKeyboardAwareScrollView: false
        } as KeyboardIssue,
        {
          id: '2',
          screen: 'Screen2',
          category: 'keyboard',
          issueType: 'obscured',
          severity: 'critical',
          title: 'Critical issue',
          description: 'Critical issue',
          reproductionSteps: ['test'],
          recommendation: 'Fix',
          component: 'Test',
          hasKeyboardAwareScrollView: false
        } as KeyboardIssue
      ];
      
      const allIssues: AllIssues = {
        keyboard: issues as KeyboardIssue[],
        typography: [],
        layout: [],
        navigation: [],
        visual: [],
        performance: []
      };
      
      const prioritized = reportGenerator.prioritizeIssues(allIssues);
      expect(prioritized[0].severity).toBe('critical');
    });
  });

  describe('Executive Summary Generation', () => {
    it('should generate executive summary with correct counts', () => {
      const issues: AllIssues = {
        keyboard: [
          {
            id: '1',
            screen: 'Screen1',
            category: 'keyboard',
            issueType: 'obscured',
            severity: 'critical',
            title: 'Critical issue',
            description: 'Test',
            reproductionSteps: ['test'],
            recommendation: 'Fix',
            component: 'Test',
            hasKeyboardAwareScrollView: false
          } as KeyboardIssue
        ],
        typography: [],
        layout: [],
        navigation: [],
        visual: [],
        performance: []
      };
      
      const summary = reportGenerator.generateExecutiveSummary(issues);
      
      expect(summary.uxScore).toBeLessThanOrEqual(100);
      expect(summary.uxScore).toBeGreaterThanOrEqual(0);
      expect(summary.totalIssues).toBe(1);
      expect(summary.criticalIssues).toBe(1);
    });
  });

  describe('Report Formatting', () => {
    it('should format markdown correctly', async () => {
      const issues: AllIssues = {
        keyboard: [{
          id: '1',
          screen: 'TestScreen',
          category: 'keyboard',
          issueType: 'obscured',
          severity: 'high',
          title: 'Test Issue',
          description: 'Test description',
          reproductionSteps: ['Step 1', 'Step 2'],
          recommendation: 'Fix it',
          component: 'TestComponent',
          hasKeyboardAwareScrollView: false
        } as KeyboardIssue],
        typography: [],
        layout: [],
        navigation: [],
        visual: [],
        performance: []
      };
      
      const report = await reportGenerator.generateReport(issues);
      
      // Check for markdown structure
      expect(report).toContain('# Android UI/UX Audit Report');
      expect(report).toContain('## 1. Executive Summary');
      expect(report).toContain('## 2. Screen-by-Screen Findings');
    });

    it('should include all report sections', async () => {
      const issues: AllIssues = {
        keyboard: [],
        typography: [],
        layout: [],
        navigation: [],
        visual: [],
        performance: []
      };
      
      const report = await reportGenerator.generateReport(issues);
      const sections = [
        '1. Executive Summary',
        '2. Screen-by-Screen Findings',
        '3. Android Keyboard Audit',
        '4. Typography & Accessibility Summary',
        '5. Responsiveness Findings',
        '6. Visual Consistency Audit',
        '7. Navigation & Flow Issues',
        '8. Performance Observations',
        '9. Fix Recommendations',
        '10. Testing Suggestions'
      ];
      
      sections.forEach(section => {
        expect(report).toContain(section);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty issue lists', () => {
      const emptyIssues: AllIssues = {
        keyboard: [],
        typography: [],
        layout: [],
        navigation: [],
        visual: [],
        performance: []
      };
      
      const score = reportGenerator.calculateUXScore(emptyIssues);
      expect(score).toBe(100);
      
      const summary = reportGenerator.generateExecutiveSummary(emptyIssues);
      expect(summary.totalIssues).toBe(0);
      expect(summary.uxScore).toBe(100);
    });

    it('should handle mixed severity issues', () => {
      const issues: AllIssues = {
        keyboard: [
          {
            id: '1',
            screen: 'Screen1',
            category: 'keyboard',
            issueType: 'obscured',
            severity: 'critical',
            title: 'Critical',
            description: 'Critical issue',
            reproductionSteps: ['test'],
            recommendation: 'Fix',
            component: 'Test',
            hasKeyboardAwareScrollView: false
          } as KeyboardIssue,
          {
            id: '2',
            screen: 'Screen2',
            category: 'keyboard',
            issueType: 'obscured',
            severity: 'low',
            title: 'Low issue',
            description: 'Low issue',
            reproductionSteps: ['test'],
            recommendation: 'Fix',
            component: 'Test',
            hasKeyboardAwareScrollView: false
          } as KeyboardIssue
        ],
        typography: [],
        layout: [],
        navigation: [],
        visual: [],
        performance: []
      };
      
      const prioritized = reportGenerator.prioritizeIssues(issues);
      expect(prioritized[0].severity).toBe('critical');
    });
  });
});