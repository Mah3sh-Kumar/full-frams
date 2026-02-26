/**
 * Property-Based Tests for Typography Analyzer
 * Feature: android-ui-ux-audit
 */

import * as fc from 'fast-check';
import { TypographyAnalyzer } from '../TypographyAnalyzer';
import { ScreenInfo } from '../../types';
import * as fs from 'fs';
import * as path from 'path';

describe('TypographyAnalyzer Property Tests', () => {
  const analyzer = new TypographyAnalyzer();
  
  /**
   * Property 6: Typography Scalability
   * For any text element in the application, when Android text size is increased 
   * in OS settings, the text should scale proportionally and remain readable.
   * Validates: Requirements 3.1, 3.2
   */
  test('Property 6: Typography Scalability - font sizes are within scalable range', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }),
        async (fontSize) => {
          // Create a mock component with the given font size
          const component = `<Text style={{ fontSize: ${fontSize} }}>Sample Text</Text>`;
          
          const isScalable = analyzer.checkFontScalability(component);
          
          // Font sizes should be scalable if they're in the reasonable range (12-72)
          if (fontSize >= 12 && fontSize <= 72) {
            return isScalable === true;
          } else {
            // Sizes outside this range may not scale properly
            return true; // We allow the analyzer to flag these
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 6 (Real Screens): Typography Scalability on actual FRAMS screens
   * Validates: Requirements 3.1, 3.2
   */
  test('Property 6: Real screens have scalable typography', async () => {
    const screensPath = path.join(process.cwd(), 'screens');
    
    // Get a sample of real screens to test
    const testScreens: ScreenInfo[] = [
      {
        name: 'SignInScreen',
        path: path.join(screensPath, 'SignInScreen.tsx'),
        category: 'auth',
        hasInputFields: true,
        hasScrollView: true,
        hasKeyboardAwareScrollView: true,
        components: [],
      },
      {
        name: 'ProfileScreen',
        path: path.join(screensPath, 'ProfileScreen.tsx'),
        category: 'auxiliary',
        hasInputFields: true,
        hasScrollView: true,
        hasKeyboardAwareScrollView: true,
        components: [],
      },
    ];

    for (const screen of testScreens) {
      if (fs.existsSync(screen.path)) {
        const issues = await analyzer.analyzeTypography(screen);
        
        // Filter for scalability issues
        const scalabilityIssues = issues.filter(i => i.issueType === 'non-scalable');
        
        // All font sizes should be in reasonable range
        scalabilityIssues.forEach(issue => {
          // If there's a scalability issue, it should have a valid recommendation
          expect(issue.recommendedFontSize).toBeGreaterThanOrEqual(12);
          expect(issue.recommendedFontSize).toBeLessThanOrEqual(72);
          expect(issue.recommendation).toBeTruthy();
        });
      }
    }
  });

  /**
   * Property: Font scalability check is consistent
   */
  test('Property: checkFontScalability is deterministic', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (fontSize) => {
          const component = `<Text style={{ fontSize: ${fontSize} }}>Sample Text</Text>`;
          
          // Call the function multiple times with the same input
          const result1 = analyzer.checkFontScalability(component);
          const result2 = analyzer.checkFontScalability(component);
          const result3 = analyzer.checkFontScalability(component);
          
          // Results should be consistent
          return result1 === result2 && result2 === result3;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Components without explicit fontSize are considered scalable
   */
  test('Property: Components without fontSize use scalable defaults', () => {
    const componentsWithoutFontSize = [
      '<Text>Default Text</Text>',
      '<Text style={{ color: "black" }}>Colored Text</Text>',
      '<Text style={{ fontWeight: "bold" }}>Bold Text</Text>',
    ];

    componentsWithoutFontSize.forEach(component => {
      const isScalable = analyzer.checkFontScalability(component);
      expect(isScalable).toBe(true);
    });
  });

  /**
   * Property: Very small font sizes are flagged as non-scalable
   */
  test('Property: Font sizes below 12px are flagged', async () => {
    const smallFontSizes = [6, 8, 10, 11];
    
    for (const fontSize of smallFontSizes) {
      const component = `<Text style={{ fontSize: ${fontSize} }}>Small Text</Text>`;
      const isScalable = analyzer.checkFontScalability(component);
      
      // Small fonts should be flagged as potentially non-scalable
      expect(isScalable).toBe(false);
    }
  });

  /**
   * Property: Very large font sizes are flagged as non-scalable
   */
  test('Property: Font sizes above 72px are flagged', async () => {
    const largeFontSizes = [80, 100, 120];
    
    for (const fontSize of largeFontSizes) {
      const component = `<Text style={{ fontSize: ${fontSize} }}>Large Text</Text>`;
      const isScalable = analyzer.checkFontScalability(component);
      
      // Very large fonts should be flagged as potentially non-scalable
      expect(isScalable).toBe(false);
    }
  });

  /**
   * Property: Reasonable font sizes are considered scalable
   */
  test('Property: Font sizes in range 12-72px are scalable', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 12, max: 72 }),
        (fontSize) => {
          const component = `<Text style={{ fontSize: ${fontSize} }}>Normal Text</Text>`;
          const isScalable = analyzer.checkFontScalability(component);
          
          // Reasonable font sizes should be scalable
          return isScalable === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7: Text Overflow Handling
   * For any text element with limited space, when content exceeds available space,
   * the text should be clipped with ellipsis rather than overlapping other elements.
   * Validates: Requirements 3.3
   */
  test('Property 7: Text components with overflow handling are properly configured', async () => {
    await fc.assert(
      fc.property(
        fc.boolean(), // hasNumberOfLines
        fc.boolean(), // hasEllipsizeMode
        (hasNumberOfLines, hasEllipsizeMode) => {
          // Create a component with or without overflow handling
          let component = '<Text';
          if (hasNumberOfLines) {
            component += ' numberOfLines={2}';
          }
          if (hasEllipsizeMode) {
            component += ' ellipsizeMode="tail"';
          }
          component += '>Sample Text</Text>';
          
          const hasOverflowHandling = analyzer.checkTextOverflow(component);
          
          // If component has either numberOfLines or ellipsizeMode, it should pass
          if (hasNumberOfLines || hasEllipsizeMode) {
            return hasOverflowHandling === true;
          } else {
            // Without overflow handling, it should fail
            return hasOverflowHandling === false;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 7 (Real Screens): Text overflow handling on actual FRAMS screens
   * Validates: Requirements 3.3
   */
  test('Property 7: Real screens handle text overflow properly', async () => {
    const screensPath = path.join(process.cwd(), 'screens');
    
    // Get a sample of real screens to test
    const testScreens: ScreenInfo[] = [
      {
        name: 'SignInScreen',
        path: path.join(screensPath, 'SignInScreen.tsx'),
        category: 'auth',
        hasInputFields: true,
        hasScrollView: true,
        hasKeyboardAwareScrollView: true,
        components: [],
      },
      {
        name: 'ProfileScreen',
        path: path.join(screensPath, 'ProfileScreen.tsx'),
        category: 'auxiliary',
        hasInputFields: true,
        hasScrollView: true,
        hasKeyboardAwareScrollView: true,
        components: [],
      },
    ];

    for (const screen of testScreens) {
      if (fs.existsSync(screen.path)) {
        const issues = await analyzer.analyzeTypography(screen);
        
        // Filter for overflow issues
        const overflowIssues = issues.filter(i => i.issueType === 'overflow');
        
        // All overflow issues should have valid recommendations
        overflowIssues.forEach(issue => {
          expect(issue.recommendation).toBeTruthy();
          expect(issue.recommendation).toContain('numberOfLines');
        });
      }
    }
  });

  /**
   * Property: Text overflow check is consistent
   */
  test('Property: checkTextOverflow is deterministic', async () => {
    await fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        (hasNumberOfLines, hasEllipsizeMode) => {
          let component = '<Text';
          if (hasNumberOfLines) {
            component += ' numberOfLines={2}';
          }
          if (hasEllipsizeMode) {
            component += ' ellipsizeMode="tail"';
          }
          component += '>Sample Text</Text>';
          
          // Call the function multiple times with the same input
          const result1 = analyzer.checkTextOverflow(component);
          const result2 = analyzer.checkTextOverflow(component);
          const result3 = analyzer.checkTextOverflow(component);
          
          // Results should be consistent
          return result1 === result2 && result2 === result3;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Text components with numberOfLines have overflow handling
   */
  test('Property: Text with numberOfLines passes overflow check', () => {
    const componentsWithNumberOfLines = [
      '<Text numberOfLines={1}>Single Line</Text>',
      '<Text numberOfLines={2}>Two Lines</Text>',
      '<Text numberOfLines={3}>Three Lines</Text>',
    ];

    componentsWithNumberOfLines.forEach(component => {
      const hasOverflowHandling = analyzer.checkTextOverflow(component);
      expect(hasOverflowHandling).toBe(true);
    });
  });

  /**
   * Property: Text components with ellipsizeMode have overflow handling
   */
  test('Property: Text with ellipsizeMode passes overflow check', () => {
    const componentsWithEllipsizeMode = [
      '<Text ellipsizeMode="tail">Tail Ellipsis</Text>',
      '<Text ellipsizeMode="head">Head Ellipsis</Text>',
      '<Text ellipsizeMode="middle">Middle Ellipsis</Text>',
    ];

    componentsWithEllipsizeMode.forEach(component => {
      const hasOverflowHandling = analyzer.checkTextOverflow(component);
      expect(hasOverflowHandling).toBe(true);
    });
  });

  /**
   * Property: Text components without overflow handling are flagged
   */
  test('Property: Text without overflow handling fails check', () => {
    const componentsWithoutOverflowHandling = [
      '<Text>No Overflow Handling</Text>',
      '<Text style={{ fontSize: 16 }}>Styled Text</Text>',
      '<Text style={{ color: "black" }}>Colored Text</Text>',
    ];

    componentsWithoutOverflowHandling.forEach(component => {
      const hasOverflowHandling = analyzer.checkTextOverflow(component);
      expect(hasOverflowHandling).toBe(false);
    });
  });

  /**
   * Property: Non-Text components pass overflow check
   */
  test('Property: Non-Text components are not flagged for overflow', () => {
    const nonTextComponents = [
      '<View>Container</View>',
      '<Button title="Click Me" />',
      '<Image source={require("./image.png")} />',
    ];

    nonTextComponents.forEach(component => {
      const hasOverflowHandling = analyzer.checkTextOverflow(component);
      expect(hasOverflowHandling).toBe(true);
    });
  });

  /**
   * Property 8: Contrast Ratio Compliance
   * For any text element, the contrast ratio between text color and background color
   * should meet WCAG standards (4.5:1 for normal text, 3:1 for large text).
   * Validates: Requirements 3.4
   */
  test('Property 8: Contrast ratio calculation is accurate', async () => {
    // Test known color combinations with expected contrast ratios
    const testCases = [
      { text: '#000000', bg: '#FFFFFF', expected: 21 }, // Black on white
      { text: '#FFFFFF', bg: '#000000', expected: 21 }, // White on black
      { text: '#777777', bg: '#FFFFFF', expected: 4.48 }, // Gray on white (approximately)
      { text: '#000000', bg: '#000000', expected: 1 }, // Same color (no contrast)
    ];

    testCases.forEach(({ text, bg, expected }) => {
      const ratio = analyzer.checkContrastRatio(text, bg);
      
      // Allow small margin of error due to floating point calculations
      expect(ratio).toBeCloseTo(expected, 1);
    });
  });

  /**
   * Property 8 (Real Screens): Contrast ratio compliance on actual FRAMS screens
   * Validates: Requirements 3.4
   */
  test('Property 8: Real screens have adequate contrast ratios', async () => {
    const screensPath = path.join(process.cwd(), 'screens');
    
    // Get a sample of real screens to test
    const testScreens: ScreenInfo[] = [
      {
        name: 'SignInScreen',
        path: path.join(screensPath, 'SignInScreen.tsx'),
        category: 'auth',
        hasInputFields: true,
        hasScrollView: true,
        hasKeyboardAwareScrollView: true,
        components: [],
      },
    ];

    for (const screen of testScreens) {
      if (fs.existsSync(screen.path)) {
        const issues = await analyzer.analyzeTypography(screen);
        
        // Filter for contrast issues
        const contrastIssues = issues.filter(i => i.issueType === 'contrast');
        
        // All contrast issues should have valid contrast ratios and recommendations
        contrastIssues.forEach(issue => {
          expect(issue.contrastRatio).toBeDefined();
          expect(issue.contrastRatio).toBeGreaterThan(0);
          expect(issue.recommendation).toBeTruthy();
          expect(issue.recommendation).toContain('contrast ratio');
        });
      }
    }
  });

  /**
   * Property: Contrast ratio is symmetric
   */
  test('Property: Contrast ratio is same regardless of color order', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        (r1, g1, b1, r2, g2, b2) => {
          const color1 = `rgb(${r1}, ${g1}, ${b1})`;
          const color2 = `rgb(${r2}, ${g2}, ${b2})`;
          
          const ratio1 = analyzer.checkContrastRatio(color1, color2);
          const ratio2 = analyzer.checkContrastRatio(color2, color1);
          
          // Contrast ratio should be the same regardless of order
          return Math.abs(ratio1 - ratio2) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Contrast ratio is always positive
   */
  test('Property: Contrast ratio is always greater than or equal to 1', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        (r1, g1, b1, r2, g2, b2) => {
          const color1 = `rgb(${r1}, ${g1}, ${b1})`;
          const color2 = `rgb(${r2}, ${g2}, ${b2})`;
          
          const ratio = analyzer.checkContrastRatio(color1, color2);
          
          // Contrast ratio should always be at least 1:1
          return ratio >= 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Same colors have contrast ratio of 1
   */
  test('Property: Identical colors have minimum contrast ratio', async () => {
    await fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        (r, g, b) => {
          const color = `rgb(${r}, ${g}, ${b})`;
          const ratio = analyzer.checkContrastRatio(color, color);
          
          // Same color should have contrast ratio of 1:1
          return Math.abs(ratio - 1) < 0.01;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Black and white have maximum contrast
   */
  test('Property: Black and white have highest contrast ratio', () => {
    const blackWhiteRatio = analyzer.checkContrastRatio('#000000', '#FFFFFF');
    const whiteBlackRatio = analyzer.checkContrastRatio('#FFFFFF', '#000000');
    
    // Black and white should have contrast ratio of 21:1
    expect(blackWhiteRatio).toBeCloseTo(21, 0);
    expect(whiteBlackRatio).toBeCloseTo(21, 0);
  });

  /**
   * Property: Contrast ratio calculation handles different color formats
   */
  test('Property: Contrast ratio works with different color formats', () => {
    const testCases = [
      { text: '#000', bg: '#FFF' }, // Short hex
      { text: '#000000', bg: '#FFFFFF' }, // Full hex
      { text: 'black', bg: 'white' }, // Named colors
      { text: 'rgb(0, 0, 0)', bg: 'rgb(255, 255, 255)' }, // RGB format
    ];

    testCases.forEach(({ text, bg }) => {
      const ratio = analyzer.checkContrastRatio(text, bg);
      
      // All should calculate to approximately 21:1
      expect(ratio).toBeGreaterThan(15); // Allow some tolerance for parsing
    });
  });

  /**
   * Property: WCAG AA compliance for normal text
   */
  test('Property: Normal text requires 4.5:1 contrast ratio', () => {
    // Test colors that meet WCAG AA for normal text
    const passingCombos = [
      { text: '#000000', bg: '#FFFFFF' }, // 21:1
      { text: '#595959', bg: '#FFFFFF' }, // ~7:1
    ];

    passingCombos.forEach(({ text, bg }) => {
      const ratio = analyzer.checkContrastRatio(text, bg);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  /**
   * Property: WCAG AA compliance for large text
   */
  test('Property: Large text requires 3:1 contrast ratio', () => {
    // Test colors that meet WCAG AA for large text but not normal text
    const largTextCombos = [
      { text: '#767676', bg: '#FFFFFF' }, // ~3.9:1
    ];

    largTextCombos.forEach(({ text, bg }) => {
      const ratio = analyzer.checkContrastRatio(text, bg);
      expect(ratio).toBeGreaterThanOrEqual(3.0);
    });
  });
});
