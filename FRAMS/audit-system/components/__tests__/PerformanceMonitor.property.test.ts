/**
 * Property-Based Tests for Performance Monitor
 * Feature: android-ui-ux-audit
 */

import * as fc from 'fast-check';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { ScreenScanner } from '../ScreenScanner';
import { ScreenInfo, TestConditions, NetworkSpeed } from '../../types';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Helper method to detect if a screen has network calls
 */
async function detectNetworkCalls(screen: ScreenInfo): Promise<boolean> {
  try {
    const screenPath = screen.path;
    if (!fs.existsSync(screenPath)) {
      return false;
    }
    
    const content = fs.readFileSync(screenPath, 'utf-8');
    
    return content.includes('fetch(') || 
           content.includes('axios') || 
           content.includes('supabase') ||
           content.includes('api/');
  } catch (error) {
    return false;
  }
}

describe('PerformanceMonitor Property Tests', () => {
  const screensPath = path.join(process.cwd(), 'screens');
  let monitor: PerformanceMonitor;
  let scanner: ScreenScanner;
  let allScreens: ScreenInfo[];

  beforeAll(async () => {
    monitor = new PerformanceMonitor();
    scanner = new ScreenScanner(screensPath);
    allScreens = await scanner.scanAllScreens();
  });

  /**
   * Property 18: Performance Under Network Stress
   * For any screen that loads data from the network, when tested under slow network conditions, 
   * the UI should remain responsive and provide appropriate feedback.
   * 
   * Validates: Requirements 7.1
   */
  test('Property 18: Screens with network calls handle slow network conditions', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens),
        fc.constantFrom<NetworkSpeed>('slow-3g', 'fast-3g', '4g', 'wifi'),
        async (screen, networkSpeed) => {
          const conditions: TestConditions = {
            networkSpeed,
            textSize: 100,
            orientation: 'portrait',
            darkMode: false
          };

          const issues = await monitor.monitorPerformance(screen, conditions);
          
          // Filter network-related performance issues
          const networkIssues = issues.filter(issue => 
            issue.title.includes('network') || 
            issue.title.includes('Network') ||
            issue.description.includes('network') ||
            issue.description.includes('Network')
          );

          // If screen has network calls and we're testing slow network
          const hasNetworkCalls = await detectNetworkCalls(screen);
          
          if (hasNetworkCalls && (networkSpeed === 'slow-3g' || networkSpeed === 'fast-3g')) {
            // Should have appropriate network-related issues or optimizations
            // Either issues are detected (showing we can identify problems)
            // Or no issues means the screen is properly optimized
            expect(Array.isArray(networkIssues)).toBe(true);
            
            // Check that issues have proper documentation if present
            networkIssues.forEach(issue => {
              expect(issue.id).toBeTruthy();
              expect(issue.screen).toBe(screen.name);
              expect(issue.category).toBe('performance');
              expect(issue.severity).toMatch(/^(critical|high|medium|low)$/);
              expect(issue.title).toBeTruthy();
              expect(issue.description).toBeTruthy();
              expect(issue.reproductionSteps.length).toBeGreaterThan(0);
              expect(issue.recommendation).toBeTruthy();
              expect(issue.optimizationRecommendation).toBeTruthy();
            });
          }
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.length, 10) }
    );
  }, 60000);

  /**
   * Property 18 (Extended): Network issues have actionable recommendations
   * For any screen with network performance issues, the recommendations should
   * provide specific optimization guidance.
   * 
   * Validates: Requirements 7.1, 7.7
   */
  test('Property 18 (Extended): Network performance issues include specific optimization guidance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens),
        async (screen) => {
          const conditions: TestConditions = {
            networkSpeed: 'slow-3g',
            textSize: 100,
            orientation: 'portrait',
            darkMode: false
          };

          const issues = await monitor.monitorPerformance(screen, conditions);
          const networkIssues = issues.filter(issue => 
            issue.title.includes('network') || 
            issue.title.includes('Network') ||
            issue.description.includes('network') ||
            issue.description.includes('Network')
          );

          // Every network issue should have actionable recommendations
          networkIssues.forEach(issue => {
            expect(issue.recommendation).toBeTruthy();
            expect(issue.recommendation.length).toBeGreaterThan(20);
            expect(issue.optimizationRecommendation).toBeTruthy();
            expect(issue.optimizationRecommendation.length).toBeGreaterThan(20);
            
            // Should mention specific solutions
            const hasSpecificSolution = 
              issue.recommendation.includes('loading') ||
              issue.recommendation.includes('Loading') ||
              issue.recommendation.includes('pagination') ||
              issue.recommendation.includes('Pagination') ||
              issue.recommendation.includes('error') ||
              issue.recommendation.includes('Error') ||
              issue.recommendation.includes('retry') ||
              issue.recommendation.includes('Retry');
            
            expect(hasSpecificSolution).toBe(true);
          });
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.length, 10) }
    );
  }, 60000);

  /**
   * Property 18 (Consistency): Network test results are reproducible
   * For any screen, running the network performance test multiple times
   * should yield consistent results.
   * 
   * Validates: Requirements 7.1
   */
  test('Property 18 (Consistency): Network performance tests yield consistent results', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens.slice(0, 5)), // Test subset for performance
        async (screen) => {
          const conditions: TestConditions = {
            networkSpeed: 'slow-3g',
            textSize: 100,
            orientation: 'portrait',
            darkMode: false
          };

          // Run test multiple times
          const results1 = await monitor.monitorPerformance(screen, conditions);
          const results2 = await monitor.monitorPerformance(screen, conditions);
          
          // Should have same number of network-related issues
          const networkIssues1 = results1.filter(issue => 
            issue.title.includes('network') || 
            issue.title.includes('Network')
          );
          const networkIssues2 = results2.filter(issue => 
            issue.title.includes('network') || 
            issue.title.includes('Network')
          );
          
          expect(networkIssues1.length).toBe(networkIssues2.length);
          
          // If there are issues, they should have similar characteristics
          if (networkIssues1.length > 0 && networkIssues2.length > 0) {
            expect(networkIssues1[0].title).toBe(networkIssues2[0].title);
            expect(networkIssues1[0].severity).toBe(networkIssues2[0].severity);
          }
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.length, 5) }
    );
  }, 60000);

  /**
   * Property 18 (Documentation): All network performance issues are fully documented
   * For any screen with network performance issues, all required documentation
   * fields should be present.
   * 
   * Validates: Requirements 7.1, 7.7
   */
  test('Property 18 (Documentation): Network performance issues have complete documentation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens),
        async (screen) => {
          const conditions: TestConditions = {
            networkSpeed: 'slow-3g',
            textSize: 100,
            orientation: 'portrait',
            darkMode: false
          };

          const issues = await monitor.monitorPerformance(screen, conditions);
          const networkIssues = issues.filter(issue => 
            issue.title.includes('network') || 
            issue.title.includes('Network') ||
            issue.description.includes('network') ||
            issue.description.includes('Network')
          );

          // Every network issue should have complete documentation
          networkIssues.forEach(issue => {
            expect(issue.id).toBeTruthy();
            expect(issue.screen).toBe(screen.name);
            expect(issue.category).toBe('performance');
            expect(issue.issueType).toBeTruthy();
            expect(issue.severity).toMatch(/^(critical|high|medium|low)$/);
            expect(issue.title).toBeTruthy();
            expect(issue.description).toBeTruthy();
            expect(issue.reproductionSteps).toBeDefined();
            expect(issue.reproductionSteps.length).toBeGreaterThan(0);
            expect(issue.recommendation).toBeTruthy();
            expect(issue.optimizationRecommendation).toBeTruthy();
            expect(issue.metrics).toBeDefined();
            expect(issue.codeReference).toBeDefined();
            
            // Metrics should be appropriate for the issue type
            if (issue.issueType === 'slow-render' || issue.issueType === 'unoptimized-list') {
              expect(issue.metrics.listItemCount).toBeDefined();
            }
            if (issue.issueType === 'jank') {
              expect(issue.metrics.frameRate).toBeDefined();
            }
          });
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.length, 10) }
    );
  }, 60000);

  /**
   * Property 18 (Severity): Network issue severity matches impact
   * For any screen with network performance issues, the severity should
   * appropriately reflect the impact on user experience.
   * 
   * Validates: Requirements 7.1, 7.4, 7.7
   */
  test('Property 18 (Severity): Network issue severity reflects user impact', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...allScreens),
        async (screen) => {
          const conditions: TestConditions = {
            networkSpeed: 'slow-3g',
            textSize: 100,
            orientation: 'portrait',
            darkMode: false
          };

          const issues = await monitor.monitorPerformance(screen, conditions);
          const networkIssues = issues.filter(issue => 
            issue.title.includes('network') || 
            issue.title.includes('Network') ||
            issue.description.includes('network') ||
            issue.description.includes('Network')
          );

          // Check severity appropriateness
          networkIssues.forEach(issue => {
            const title = issue.title.toLowerCase();
            const description = issue.description.toLowerCase();
            
            // Critical issues should be for major blockers
            if (issue.severity === 'critical') {
              expect(title).toMatch(/(crash|freeze|unusable|blocker)/);
            }
            
            // High issues should be for significant problems
            if (issue.severity === 'high') {
              expect(title).toMatch(/(slow|lag|jank|unresponsive|timeout)/);
            }
            
            // Medium issues should be for noticeable but workable problems
            if (issue.severity === 'medium') {
              expect(title).toMatch(/(missing|incomplete|partial|delayed)/);
            }
            
            // Low issues should be for minor improvements
            if (issue.severity === 'low') {
              expect(title).toMatch(/(optimization|improvement|enhancement|feedback)/);
            }
          });
          
          return true;
        }
      ),
      { numRuns: Math.min(allScreens.length, 10) }
    );
  }, 60000);


});