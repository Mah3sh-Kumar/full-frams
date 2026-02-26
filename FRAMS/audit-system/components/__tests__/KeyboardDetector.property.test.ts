/**
 * Property-Based Tests for Keyboard Detector
 * Feature: android-ui-ux-audit
 */

import * as fc from 'fast-check';
import { KeyboardDetector } from '../KeyboardDetector';
import { ScreenScanner } from '../ScreenScanner';
import { ScreenInfo } from '../../types';
import * as path from 'path';

describe('KeyboardDetector Property Tests', () => {
  const screensPath = path.join(process.cwd(), 'screens');
  let detector: KeyboardDetector;
  let scanner: ScreenScanner;
  let allScreens: ScreenInfo[];

  beforeAll(async () => {
    detector = new KeyboardDetector();
    scanner = new ScreenScanner(screensPath);
    allScreens = await scanner.scanAllScreens();
  });

  /**
   * Property 3: Keyboard Visibility Preservation
   * For any screen with input fields, when the keyboard appears, 
   * all focused input fields should remain visible and not be obscured by the keyboard.
   * 
   * Validates: Requirements 2.1, 2.2
   */
  test('Property 3: Screens with input fields use KeyboardAwareScrollView', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens.filter(s => s.hasInputFields)),
        async (screen) => {
          const issues = await detector.detectKeyboardIssues(screen);
          
          // If screen has KeyboardAwareScrollView, it should pass visibility test
          const visibilityTest = await detector.testInputFieldVisibility(screen);
          
          if (screen.hasKeyboardAwareScrollView) {
            // Should pass visibility test
            expect(visibilityTest).toBe(true);
            
            // Should not have critical "no-resize" issues
            const criticalNoResize = issues.filter(
              i => i.issueType === 'no-resize' && i.severity === 'critical'
            );
            expect(criticalNoResize.length).toBe(0);
          } else {
            // Should fail visibility test
            expect(visibilityTest).toBe(false);
            
            // Should have at least one critical issue about missing KeyboardAwareScrollView
            const missingKASV = issues.filter(
              i => i.issueType === 'no-resize' && 
                   i.severity === 'critical' &&
                   i.title.includes('KeyboardAwareScrollView')
            );
            expect(missingKASV.length).toBeGreaterThan(0);
          }
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.filter(s => s.hasInputFields).length, 20) }
    );
  }, 60000);

  /**
   * Property 3 (Extended): All keyboard issues have required documentation
   * For any screen with input fields, all detected keyboard issues should have
   * complete documentation including reproduction steps and recommendations.
   * 
   * Validates: Requirements 2.1, 2.2, 2.6, 2.7, 2.8
   */
  test('Property 3 (Extended): All keyboard issues are fully documented', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens.filter(s => s.hasInputFields)),
        async (screen) => {
          const issues = await detector.detectKeyboardIssues(screen);
          
          // Every issue should have complete documentation
          for (const issue of issues) {
            expect(issue.id).toBeTruthy();
            expect(issue.screen).toBe(screen.name);
            expect(issue.category).toBe('keyboard');
            expect(issue.issueType).toBeTruthy();
            expect(issue.severity).toMatch(/^(critical|high|medium|low)$/);
            expect(issue.title).toBeTruthy();
            expect(issue.description).toBeTruthy();
            expect(issue.reproductionSteps).toBeDefined();
            expect(issue.reproductionSteps.length).toBeGreaterThan(0);
            expect(issue.recommendation).toBeTruthy();
            expect(issue.component).toBeTruthy();
            expect(typeof issue.hasKeyboardAwareScrollView).toBe('boolean');
            expect(issue.codeReference).toBeDefined();
            expect(issue.codeReference?.file).toBe(screen.path);
          }
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.filter(s => s.hasInputFields).length, 20) }
    );
  }, 60000);

  /**
   * Property 3 (Severity): Critical issues are only for screens without KeyboardAwareScrollView
   * For any screen with input fields, critical keyboard issues should only occur
   * when KeyboardAwareScrollView is completely missing.
   * 
   * Validates: Requirements 2.1, 2.2
   */
  test('Property 3 (Severity): Critical issues only when KeyboardAwareScrollView is missing', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens.filter(s => s.hasInputFields)),
        async (screen) => {
          const issues = await detector.detectKeyboardIssues(screen);
          const criticalIssues = issues.filter(i => i.severity === 'critical');
          
          if (screen.hasKeyboardAwareScrollView) {
            // Should not have critical issues if KeyboardAwareScrollView is present
            expect(criticalIssues.length).toBe(0);
          } else {
            // Should have at least one critical issue
            expect(criticalIssues.length).toBeGreaterThan(0);
            
            // All critical issues should be about missing KeyboardAwareScrollView
            criticalIssues.forEach(issue => {
              expect(issue.issueType).toBe('no-resize');
              expect(issue.hasKeyboardAwareScrollView).toBe(false);
            });
          }
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.filter(s => s.hasInputFields).length, 20) }
    );
  }, 60000);

  /**
   * Property: Screens without input fields have no keyboard issues
   * For any screen without input fields, the detector should not report
   * any keyboard-related issues.
   */
  test('Property: Screens without input fields have no keyboard issues', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens.filter(s => !s.hasInputFields)),
        async (screen) => {
          const issues = await detector.detectKeyboardIssues(screen);
          
          // Should have no issues
          expect(issues.length).toBe(0);
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.filter(s => !s.hasInputFields).length, 10) }
    );
  }, 30000);

  /**
   * Property: Issue IDs are unique
   * For any screen, all detected issues should have unique IDs.
   */
  test('Property: All issue IDs are unique', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens.filter(s => s.hasInputFields)),
        async (screen) => {
          const issues = await detector.detectKeyboardIssues(screen);
          
          if (issues.length > 0) {
            const ids = issues.map(i => i.id);
            const uniqueIds = new Set(ids);
            
            // All IDs should be unique
            expect(uniqueIds.size).toBe(ids.length);
          }
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.filter(s => s.hasInputFields).length, 20) }
    );
  }, 60000);

  /**
   * Property 4: Keyboard Dismissal Consistency
   * For any screen with input fields, the keyboard should be dismissible 
   * using standard Android gestures (back button, tap outside).
   * 
   * Validates: Requirements 2.3
   */
  test('Property 4: Keyboard dismissal mechanisms are present', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens.filter(s => s.hasInputFields)),
        async (screen) => {
          const dismissalTest = await detector.testKeyboardDismissal(screen);
          const issues = await detector.detectKeyboardIssues(screen);
          
          // Find dismissal-related issues
          const dismissalIssues = issues.filter(i => i.issueType === 'dismiss-failure');
          
          if (dismissalTest) {
            // If dismissal test passes, should have no dismissal issues
            expect(dismissalIssues.length).toBe(0);
          } else {
            // If dismissal test fails, should have at least one dismissal issue
            expect(dismissalIssues.length).toBeGreaterThan(0);
            
            // All dismissal issues should be low severity (not critical)
            dismissalIssues.forEach(issue => {
              expect(issue.severity).toBe('low');
              expect(issue.issueType).toBe('dismiss-failure');
            });
          }
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.filter(s => s.hasInputFields).length, 20) }
    );
  }, 60000);

  /**
   * Property 4 (Extended): Dismissal issues have actionable recommendations
   * For any screen with keyboard dismissal issues, the recommendations should
   * provide specific implementation guidance.
   * 
   * Validates: Requirements 2.3
   */
  test('Property 4 (Extended): Dismissal issues include actionable recommendations', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens.filter(s => s.hasInputFields)),
        async (screen) => {
          const issues = await detector.detectKeyboardIssues(screen);
          const dismissalIssues = issues.filter(i => i.issueType === 'dismiss-failure');
          
          // Every dismissal issue should have actionable recommendations
          dismissalIssues.forEach(issue => {
            expect(issue.recommendation).toBeTruthy();
            expect(issue.recommendation.length).toBeGreaterThan(20);
            
            // Should mention specific solutions
            const hasSpecificSolution = 
              issue.recommendation.includes('keyboardShouldPersistTaps') ||
              issue.recommendation.includes('Keyboard.dismiss') ||
              issue.recommendation.includes('dismissKeyboard');
            
            expect(hasSpecificSolution).toBe(true);
          });
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.filter(s => s.hasInputFields).length, 20) }
    );
  }, 60000);

  /**
   * Property 4 (Consistency): Dismissal test results are consistent with issue detection
   * For any screen, the dismissal test result should be consistent with
   * whether dismissal issues are detected.
   */
  test('Property 4 (Consistency): Dismissal test and issue detection are consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens.filter(s => s.hasInputFields)),
        async (screen) => {
          const dismissalTest = await detector.testKeyboardDismissal(screen);
          const issues = await detector.detectKeyboardIssues(screen);
          const dismissalIssues = issues.filter(i => i.issueType === 'dismiss-failure');
          
          // Test result should match issue presence
          if (dismissalTest) {
            expect(dismissalIssues.length).toBe(0);
          } else {
            expect(dismissalIssues.length).toBeGreaterThan(0);
          }
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.filter(s => s.hasInputFields).length, 20) }
    );
  }, 60000);

  /**
   * Property 5: Focus Transition Correctness
   * For any form with multiple input fields, when navigating between fields 
   * using returnKeyType, the next field should receive focus and become visible.
   * 
   * Validates: Requirements 2.4, 2.5
   */
  test('Property 5: Input fields have proper returnKeyType configuration', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens.filter(s => s.hasInputFields)),
        async (screen) => {
          const focusTest = await detector.testFocusTransitions(screen);
          const issues = await detector.detectKeyboardIssues(screen);
          
          // Find focus transition issues
          const focusIssues = issues.filter(i => i.issueType === 'focus-transition');
          
          if (focusTest) {
            // If focus test passes, should have no focus transition issues
            expect(focusIssues.length).toBe(0);
          } else {
            // If focus test fails, should have at least one focus transition issue
            expect(focusIssues.length).toBeGreaterThan(0);
            
            // All focus issues should be medium severity
            focusIssues.forEach(issue => {
              expect(issue.severity).toBe('medium');
              expect(issue.issueType).toBe('focus-transition');
            });
          }
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.filter(s => s.hasInputFields).length, 20) }
    );
  }, 60000);

  /**
   * Property 5 (Extended): Focus transition issues provide specific guidance
   * For any screen with focus transition issues, the recommendations should
   * specify which input fields need returnKeyType configuration.
   * 
   * Validates: Requirements 2.4, 2.5
   */
  test('Property 5 (Extended): Focus issues include specific returnKeyType guidance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens.filter(s => s.hasInputFields)),
        async (screen) => {
          const issues = await detector.detectKeyboardIssues(screen);
          const focusIssues = issues.filter(i => i.issueType === 'focus-transition');
          
          // Every focus issue should have specific guidance
          focusIssues.forEach(issue => {
            expect(issue.recommendation).toBeTruthy();
            expect(issue.recommendation.length).toBeGreaterThan(20);
            
            // Should mention returnKeyType
            expect(issue.recommendation.toLowerCase()).toContain('returnkeytype');
            
            // Should mention specific values
            const hasSpecificValues = 
              issue.recommendation.includes('next') ||
              issue.recommendation.includes('done');
            
            expect(hasSpecificValues).toBe(true);
            
            // Description should mention how many fields are affected
            expect(issue.description).toMatch(/\d+/); // Should contain a number
          });
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.filter(s => s.hasInputFields).length, 20) }
    );
  }, 60000);

  /**
   * Property 5 (Consistency): Focus test results are consistent with issue detection
   * For any screen, the focus transition test result should be consistent with
   * whether focus transition issues are detected.
   */
  test('Property 5 (Consistency): Focus test and issue detection are consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens.filter(s => s.hasInputFields)),
        async (screen) => {
          const focusTest = await detector.testFocusTransitions(screen);
          const issues = await detector.detectKeyboardIssues(screen);
          const focusIssues = issues.filter(i => i.issueType === 'focus-transition');
          
          // Test result should match issue presence
          if (focusTest) {
            expect(focusIssues.length).toBe(0);
          } else {
            expect(focusIssues.length).toBeGreaterThan(0);
          }
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.filter(s => s.hasInputFields).length, 20) }
    );
  }, 60000);
});
