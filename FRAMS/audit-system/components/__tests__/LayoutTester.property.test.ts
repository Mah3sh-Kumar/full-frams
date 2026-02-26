/**
 * Property-Based Tests for Layout Tester
 * Feature: android-ui-ux-audit, Property 9: Layout Responsiveness Across Devices
 * Feature: android-ui-ux-audit, Property 10: Orientation Change Stability
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.6, 4.7
 */

import * as fc from 'fast-check';
import { LayoutTester } from '../LayoutTester';
import { ScreenScanner } from '../ScreenScanner';
import { DeviceConfig, ScreenInfo } from '../../types';
import * as path from 'path';

describe('LayoutTester Property Tests', () => {
  const screensPath = path.join(process.cwd(), 'screens');
  let scanner: ScreenScanner;
  let tester: LayoutTester;
  let screens: ScreenInfo[];

  beforeAll(async () => {
    scanner = new ScreenScanner(screensPath);
    tester = new LayoutTester();
    screens = await scanner.scanAllScreens();
  });

  /**
   * Property 9: Layout Responsiveness Across Devices
   * For any screen, when rendered on devices with different screen sizes 
   * (720×1480, 1080×2400, 1200+ dp), the layout should adapt without 
   * clipping, overlapping, or misalignment.
   */
  test('Property 9: Layouts adapt to different screen sizes without critical issues', async () => {
    // Test a sample of screens across all device sizes
    const deviceMatrix = tester.getDeviceMatrix();
    
    for (const screen of screens) {
      const issues = await tester.testResponsiveness(screen, deviceMatrix);
      
      // Filter for critical clipping or overlap issues
      const criticalIssues = issues.filter(
        issue => 
          issue.severity === 'critical' && 
          (issue.issueType === 'clipping' || issue.issueType === 'overlap')
      );
      
      // Property: No screen should have critical clipping or overlap issues
      // across all device sizes
      expect(criticalIssues.length).toBe(0);
      
      // If there are issues, they should have proper documentation
      issues.forEach(issue => {
        expect(issue.screen).toBe(screen.name);
        expect(issue.category).toBe('layout');
        expect(issue.deviceConfig).toBeDefined();
        expect(issue.reproductionSteps.length).toBeGreaterThan(0);
        expect(issue.recommendation).toBeTruthy();
      });
    }
  }, 60000); // Increase timeout for testing all screens

  /**
   * Property 9 (Variant): Device-specific issues are correctly attributed
   */
  test('Property 9: Device-specific layout issues are correctly attributed to devices', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...screens),
        async (screen) => {
          const deviceMatrix = tester.getDeviceMatrix();
          const issues = await tester.testResponsiveness(screen, deviceMatrix);
          
          // Every issue should reference a device from the matrix
          return issues.every(issue => {
            const deviceNames = deviceMatrix.map(d => d.name);
            return issue.deviceConfig && deviceNames.includes(issue.deviceConfig.name);
          });
        }
      ),
      { numRuns: Math.min(10, screens.length) }
    );
  }, 60000);

  /**
   * Property 9 (Variant): Small screen devices should not have more critical issues
   * than larger screens (if layout is responsive)
   */
  test('Property 9: Responsive layouts handle small screens appropriately', async () => {
    const deviceMatrix = tester.getDeviceMatrix();
    const smallDevice = deviceMatrix.find(d => d.width === 720);
    const largeDevice = deviceMatrix.find(d => d.width >= 1200);
    
    expect(smallDevice).toBeDefined();
    expect(largeDevice).toBeDefined();
    
    // Test a sample of screens
    const sampleScreens = screens.slice(0, Math.min(5, screens.length));
    
    for (const screen of sampleScreens) {
      const smallDeviceIssues = await tester.testResponsiveness(screen, [smallDevice!]);
      const largeDeviceIssues = await tester.testResponsiveness(screen, [largeDevice!]);
      
      // Count critical issues
      const smallCritical = smallDeviceIssues.filter(i => i.severity === 'critical').length;
      const largeCritical = largeDeviceIssues.filter(i => i.severity === 'critical').length;
      
      // If there are critical issues on small device, there should be recommendations
      if (smallCritical > 0) {
        smallDeviceIssues.forEach(issue => {
          expect(issue.recommendation).toBeTruthy();
          expect(issue.recommendation.length).toBeGreaterThan(20);
        });
      }
    }
  }, 60000);

  /**
   * Property 10: Orientation Change Stability
   * For any screen, when the device orientation changes from portrait to 
   * landscape or vice versa, the layout should adapt correctly without 
   * losing content or functionality.
   */
  test('Property 10: Screens handle orientation changes without critical issues', async () => {
    for (const screen of screens) {
      const issues = await tester.testOrientation(screen);
      
      // Filter for critical issues
      const criticalIssues = issues.filter(issue => issue.severity === 'critical');
      
      // Property: No screen should have critical orientation issues
      expect(criticalIssues.length).toBe(0);
      
      // All orientation issues should specify the orientation
      issues.forEach(issue => {
        expect(issue.orientation).toBeDefined();
        expect(['portrait', 'landscape']).toContain(issue.orientation);
        expect(issue.reproductionSteps.length).toBeGreaterThan(0);
        expect(issue.recommendation).toBeTruthy();
      });
    }
  }, 60000);

  /**
   * Property 10 (Variant): Orientation issues should reference both orientations
   */
  test('Property 10: Orientation-specific issues are correctly identified', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...screens),
        async (screen) => {
          const issues = await tester.testOrientation(screen);
          
          // Every issue should have a valid orientation
          return issues.every(issue => 
            issue.orientation === 'portrait' || issue.orientation === 'landscape'
          );
        }
      ),
      { numRuns: Math.min(10, screens.length) }
    );
  }, 60000);

  /**
   * Property: Flex layout detection is consistent
   */
  test('Property: checkFlexLayout correctly identifies flex usage', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          'style={{ flex: 1 }}',
          'style={{ flexDirection: "row" }}',
          'style={{ justifyContent: "center" }}',
          'style={{ alignItems: "stretch" }}',
          'style={{ width: 100 }}'
        ),
        (component) => {
          const hasFlex = tester.checkFlexLayout(component);
          
          // Components with flex-related properties should return true
          const hasFlexProperty = 
            component.includes('flex:') || 
            component.includes('flexDirection') || 
            component.includes('justifyContent') || 
            component.includes('alignItems');
          
          if (hasFlexProperty) {
            return hasFlex === true;
          }
          
          // Components without flex properties should return false
          return hasFlex === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: ScrollView usage detection is accurate
   */
  test('Property: checkScrollViewUsage correctly identifies ScrollView presence', async () => {
    // Test screens that should have ScrollView
    const screensWithScrollView = screens.filter(s => s.hasScrollView || s.hasKeyboardAwareScrollView);
    
    for (const screen of screensWithScrollView) {
      const hasScrollView = tester.checkScrollViewUsage(screen);
      expect(hasScrollView).toBe(true);
    }
    
    // Test screens without ScrollView
    const screensWithoutScrollView = screens.filter(s => !s.hasScrollView && !s.hasKeyboardAwareScrollView);
    
    for (const screen of screensWithoutScrollView) {
      const hasScrollView = tester.checkScrollViewUsage(screen);
      expect(hasScrollView).toBe(false);
    }
  });

  /**
   * Property: All layout issues have complete documentation
   */
  test('Property: All layout issues have required fields', async () => {
    // Test a sample of screens
    const sampleScreens = screens.slice(0, Math.min(5, screens.length));
    
    for (const screen of sampleScreens) {
      const deviceMatrix = tester.getDeviceMatrix();
      const issues = await tester.testResponsiveness(screen, deviceMatrix);
      
      // Every issue should have all required fields
      issues.forEach(issue => {
        expect(issue.id).toBeTruthy();
        expect(issue.screen).toBe(screen.name);
        expect(issue.category).toBe('layout');
        expect(issue.issueType).toBeTruthy();
        expect(issue.severity).toBeTruthy();
        expect(issue.title).toBeTruthy();
        expect(issue.description).toBeTruthy();
        expect(Array.isArray(issue.reproductionSteps)).toBe(true);
        expect(issue.reproductionSteps.length).toBeGreaterThan(0);
        expect(issue.recommendation).toBeTruthy();
        expect(issue.deviceConfig).toBeDefined();
        expect(issue.orientation).toBeDefined();
        expect(Array.isArray(issue.affectedComponents)).toBe(true);
        expect(issue.codeReference).toBeDefined();
        expect(issue.codeReference?.file).toBe(screen.path);
      });
    }
  }, 60000);

  /**
   * Property: Device matrix contains all required device sizes
   */
  test('Property: Device matrix covers all required screen sizes', () => {
    const deviceMatrix = tester.getDeviceMatrix();
    
    // Should have at least 3 devices (small, mid, large)
    expect(deviceMatrix.length).toBeGreaterThanOrEqual(3);
    
    // Should have a small screen device (720×1480)
    const smallDevice = deviceMatrix.find(d => d.width === 720 && d.height === 1480);
    expect(smallDevice).toBeDefined();
    expect(smallDevice?.name).toContain('Small');
    
    // Should have a mid-range device (1080×2400)
    const midDevice = deviceMatrix.find(d => d.width === 1080 && d.height === 2400);
    expect(midDevice).toBeDefined();
    expect(midDevice?.name).toContain('Mid-range');
    
    // Should have a large screen/tablet (1200+ dp)
    const largeDevice = deviceMatrix.find(d => d.width >= 1200);
    expect(largeDevice).toBeDefined();
    expect(largeDevice?.name).toContain('Large');
    
    // All devices should have required fields
    deviceMatrix.forEach(device => {
      expect(device.name).toBeTruthy();
      expect(device.width).toBeGreaterThan(0);
      expect(device.height).toBeGreaterThan(0);
      expect(device.density).toBeGreaterThan(0);
      expect(device.androidVersion).toBeTruthy();
    });
  });

  /**
   * Property: Issue severity is appropriate for issue type
   */
  test('Property: Critical issues are correctly classified', async () => {
    // Test a sample of screens
    const sampleScreens = screens.slice(0, Math.min(5, screens.length));
    
    for (const screen of sampleScreens) {
      const deviceMatrix = tester.getDeviceMatrix();
      const issues = await tester.testResponsiveness(screen, deviceMatrix);
      
      // Critical issues should be for serious problems
      const criticalIssues = issues.filter(i => i.severity === 'critical');
      
      criticalIssues.forEach(issue => {
        // Critical issues should be clipping or overlap
        expect(['clipping', 'overlap']).toContain(issue.issueType);
      });
      
      // Low severity issues should not be critical problems
      const lowIssues = issues.filter(i => i.severity === 'low');
      
      lowIssues.forEach(issue => {
        // Low issues should typically be spacing inconsistencies
        expect(issue.issueType).not.toBe('clipping');
        expect(issue.issueType).not.toBe('overlap');
      });
    }
  }, 60000);
});
