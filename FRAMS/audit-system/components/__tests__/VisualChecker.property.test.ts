/**
 * Property-Based Tests for Visual Consistency Checker
 * Feature: android-ui-ux-audit, Property 15: Theme Consistency
 * Validates: Requirements 6.1, 6.2
 * 
 * Property 15: Theme Consistency
 * For any component using the design system, the component should use tokens 
 * from the theme (colors, spacing, typography) rather than hardcoded values.
 */

import * as fc from 'fast-check';
import { VisualChecker } from '../VisualChecker';
import { ScreenInfo } from '../../types';

describe('VisualChecker Property Tests', () => {
  let visualChecker: VisualChecker;
  
  beforeEach(() => {
    visualChecker = new VisualChecker();
  });
  
  /**
   * Property 15: Theme Consistency
   * For any component using the design system, the component should use tokens 
   * from the theme (colors, spacing, typography) rather than hardcoded values.
   */
  test('Property 15: Components use theme tokens instead of hardcoded values', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random component code with varying patterns
        fc.array(
          fc.constantFrom(
            'color: "#FF0000"',
            'backgroundColor: "red"',
            'borderColor: "#00FF00"',
            'margin: 10',
            'padding: "20px"',
            'height: 30',
            'colors.primary',
            'spacing.md',
            'theme.colors.secondary',
            'tokens.spacing.lg'
          ),
          { minLength: 1, maxLength: 10 }
        ),
        async (components) => {
          const componentCode = components.join('\n');
          
          // Create a mock screen info
          const mockScreen: ScreenInfo = {
            name: 'TestScreen',
            path: '/test/path',
            category: 'auth',
            hasInputFields: false,
            hasScrollView: false,
            hasKeyboardAwareScrollView: false,
            components: ['TestComponent']
          };
          
          // Mock file system read
          const originalReadFile = require('fs/promises').readFile;
          require('fs/promises').readFile = jest.fn().mockResolvedValue(componentCode);
          
          try {
            const issues = await visualChecker.checkConsistency(mockScreen);
            
            // Check if hardcoded values are detected
            const hasHardcodedColor = componentCode.includes('"#') || 
                                     (componentCode.includes('color:') && !componentCode.includes('colors.')) ||
                                     (componentCode.includes('backgroundColor:') && !componentCode.includes('colors.'));
            
            const hasHardcodedSpacing = (componentCode.includes('margin:') || componentCode.includes('padding:')) &&
                                       !componentCode.includes('spacing.') && !componentCode.includes('tokens.');
            
            if (hasHardcodedColor || hasHardcodedSpacing) {
              // Should have at least one issue for hardcoded values
              expect(issues.length).toBeGreaterThan(0);
              
              // All issues should be theme-violation or inconsistent-spacing
              const validIssueTypes = issues.every(issue => 
                issue.issueType === 'theme-violation' || 
                issue.issueType === 'inconsistent-spacing'
              );
              expect(validIssueTypes).toBe(true);
            } else {
              // No hardcoded values, should have no issues
              expect(issues.length).toBe(0);
            }
            
            return true;
          } finally {
            // Restore original readFile
            require('fs/promises').readFile = originalReadFile;
          }
        }
      ),
      { numRuns: 20 }
    );
  });
  
  /**
   * Property: validateThemeUsage correctly identifies theme token usage
   */
  test('Property: validateThemeUsage returns true for theme-based components', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constantFrom(
            'colors.primary',
            'spacing.md',
            'theme.colors.secondary',
            'tokens.spacing.lg',
            'colors.text.primary',
            'borders.radius.medium'
          ),
          { minLength: 1, maxLength: 5 }
        ),
        async (tokens) => {
          const componentCode = `style={{ ${tokens.join(', ')} }}`;
          const isValid = visualChecker.validateThemeUsage(componentCode);
          // Components using theme tokens should be valid
          expect(isValid).toBe(true);
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
  
  /**
   * Property: validateThemeUsage returns false for hardcoded values
   */
  test('Property: validateThemeUsage returns false for hardcoded values', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constantFrom(
            'color: "#FF0000"',
            'backgroundColor: "red"',
            'margin: 10',
            'padding: "20px"',
            'height: 30'
          ),
          { minLength: 1, maxLength: 3 }
        ),
        async (values) => {
          const componentCode = `style={{ ${values.join(', ')} }}`;
          const isValid = visualChecker.validateThemeUsage(componentCode);
          // Components with hardcoded values should be invalid
          expect(isValid).toBe(false);
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
  
  /**
   * Property: Button consistency check validates standard button sizes
   */
  test('Property: checkButtonConsistency validates standard button heights', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.array(
            fc.constantFrom(
              'height: 52',
              'height: 48',
              'height: 60',
              'height: 40',
              'colors.primary',
              'backgroundColor: "blue"'
            ),
            { minLength: 1, maxLength: 3 }
          ),
          { minLength: 1, maxLength: 5 }
        ),
        async (buttonArrays) => {
          const buttons = buttonArrays.map(arr => arr.join(' '));
          const isValid = visualChecker.checkButtonConsistency(buttons);
          
          // Check if all buttons have valid heights and theme colors
          const allValid = buttons.every(button => {
            const hasValidHeight = button.includes('height: 52') || button.includes('height: 48');
            const hasThemeColor = button.includes('colors.') || button.includes('theme.');
            return hasValidHeight && hasThemeColor;
          });
          
          expect(isValid).toBe(allValid);
          return true;
        }
      ),
      { numRuns: 10 }
    );
  });
  
  /**
   * Property: Empty button array is always consistent
   */
  test('Property: Empty button array is always consistent', async () => {
    const isValid = visualChecker.checkButtonConsistency([]);
    expect(isValid).toBe(true);
  });
  
  /**
   * Property: Theme token detection covers all token types
   */
  test('Property: All theme token types are recognized', () => {
    const tokenTypes = [
      'colors.primary',
      'colors.secondary',
      'colors.success',
      'colors.error',
      'colors.warning',
      'colors.info',
      'colors.text.primary',
      'colors.text.secondary',
      'spacing.xs',
      'spacing.sm',
      'spacing.md',
      'spacing.lg',
      'spacing.xl',
      'borders.radius.small',
      'borders.radius.medium',
      'borders.radius.large',
      'borders.radius.xlarge'
    ];
    
    tokenTypes.forEach(token => {
      const component = `style={{ ${token} }}`;
      const isValid = visualChecker.validateThemeUsage(component);
      expect(isValid).toBe(true);
    });
  });
  
  /**
   * Property: Hardcoded value patterns are detected
   */
  test('Property: Various hardcoded value patterns are detected', () => {
    const hardcodedPatterns = [
      'color: "#FF0000"',
      'backgroundColor: "red"',
      'borderColor: "#00FF00"',
      'margin: 10',
      'padding: "20px"',
      'height: 30',
      'width: "100px"',
      'borderRadius: 5',
      'fontSize: 14'
    ];
    
    hardcodedPatterns.forEach(pattern => {
      const component = `style={{ ${pattern} }}`;
      const isValid = visualChecker.validateThemeUsage(component);
      expect(isValid).toBe(false);
    });
  });
  
  /**
   * Property: Mixed token and hardcoded values are invalid
   */
  test('Property: Components with mixed tokens and hardcoded values are invalid', () => {
    const mixedComponents = [
      'style={{ colors.primary, margin: 10 }}',
      'style={{ spacing.md, color: "#FF0000" }}',
      'style={{ theme.colors.secondary, padding: "20px" }}'
    ];
    
    mixedComponents.forEach(component => {
      const isValid = visualChecker.validateThemeUsage(component);
      expect(isValid).toBe(false);
    });
  });
  
  /**
   * Property: Issue severity matches problem type
   */
  test('Property: Issue severity is appropriate for problem type', async () => {
    // Create test cases for different issue types
    const testCases = [
      {
        code: 'color: "#FF0000"',
        expectedSeverity: 'medium',
        expectedType: 'theme-violation'
      },
      {
        code: 'margin: 10',
        expectedSeverity: 'low',
        expectedType: 'inconsistent-spacing'
      },
      {
        code: 'height: 60',
        expectedSeverity: 'medium',
        expectedType: 'inconsistent-sizing'
      }
    ];
    
    for (const testCase of testCases) {
      const mockScreen: ScreenInfo = {
        name: 'TestScreen',
        path: '/test/path',
        category: 'auth',
        hasInputFields: false,
        hasScrollView: false,
        hasKeyboardAwareScrollView: false,
        components: ['TestComponent']
      };
      
      // Mock file system read
      const originalReadFile = require('fs/promises').readFile;
      require('fs/promises').readFile = jest.fn().mockResolvedValue(`<View style={{ ${testCase.code} }} />`);
      
      try {
        const issues = await visualChecker.checkConsistency(mockScreen);
        
        if (issues.length > 0) {
          const issue = issues[0];
          expect(issue.severity).toBe(testCase.expectedSeverity);
          expect(issue.issueType).toBe(testCase.expectedType);
        }
      } finally {
        require('fs/promises').readFile = originalReadFile;
      }
    }
  });
  
  /**
   * Property 16: Loading State Consistency
   * For any asynchronous operation, the loading state should be displayed 
   * using the standard LoadingSpinner component with consistent styling.
   * Validates: Requirements 6.3
   */
  test('Property 16: Loading states use standard LoadingSpinner component', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random screen content with loading patterns
        fc.array(
          fc.constantFrom(
            '<LoadingSpinner size="large" />',
            '<ActivityIndicator animating={true} />',
            '<CustomSpinner />',
            'isLoading={true}',
            'loading={true}',
            'showSpinner={true}',
            '<View><Text>Loading...</Text></View>',
            '<View style={{flex: 1}}><ActivityIndicator /></View>'
          ),
          { minLength: 1, maxLength: 5 }
        ),
        async (components) => {
          const screenContent = components.join('\n');
          
          // Create a mock screen info
          const mockScreen: ScreenInfo = {
            name: 'TestScreen',
            path: '/test/path',
            category: 'auth',
            hasInputFields: false,
            hasScrollView: false,
            hasKeyboardAwareScrollView: false,
            components: ['TestComponent']
          };
          
          // Mock file system read
          const originalReadFile = require('fs/promises').readFile;
          require('fs/promises').readFile = jest.fn().mockResolvedValue(screenContent);
          
          try {
            const issues = await visualChecker.checkConsistency(mockScreen);
            
            // Check if content has loading indicators
            const hasLoadingIndicator = screenContent.includes('Loading') || 
                                       screenContent.includes('Spinner') ||
                                       screenContent.includes('ActivityIndicator') ||
                                       screenContent.includes('isLoading') ||
                                       screenContent.includes('loading');
            
            if (hasLoadingIndicator) {
              // Check if standard loading component is used
              const usesStandardLoader = screenContent.includes('<LoadingSpinner') ||
                                        screenContent.includes('<ActivityIndicator');
              
              if (!usesStandardLoader) {
                // Should have an issue for non-standard loading implementation
                expect(issues.length).toBeGreaterThan(0);
                
                const loadingIssues = issues.filter(issue => 
                  issue.title.includes('loading') || 
                  issue.description.includes('loading') ||
                  issue.issueType === 'inconsistent-sizing'
                );
                expect(loadingIssues.length).toBeGreaterThan(0);
              } else {
                // Standard loader used, should have no loading issues
                const loadingIssues = issues.filter(issue => 
                  issue.title.includes('loading') || 
                  issue.description.includes('loading')
                );
                expect(loadingIssues.length).toBe(0);
              }
            } else {
              // No loading indicators, should have no loading issues
              const loadingIssues = issues.filter(issue => 
                issue.title.includes('loading') || 
                issue.description.includes('loading')
              );
              expect(loadingIssues.length).toBe(0);
            }
            
            return true;
          } finally {
            // Restore original readFile
            require('fs/promises').readFile = originalReadFile;
          }
        }
      ),
      { numRuns: 10 }
    );
  });
  
  /**
   * Property 17: Validation State Visibility
   * For any form input with validation, the validation state (error, success) 
   * should be clearly visible and distinguished using consistent styling.
   * Validates: Requirements 6.4
   */
  test('Property 17: Validation states use consistent styling and theme colors', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random screen content with validation patterns
        fc.array(
          fc.constantFrom(
            'error={true}',
            'success={true}',
            'warning={true}',
            'isValid={false}',
            'hasError={true}',
            'validationError="Required field"',
            'colors.error',
            'colors.success',
            'colors.warning',
            'style={{color: "red"}}',
            'style={{color: "#FF0000"}}',
            'style={{borderColor: "green"}}',
            'theme.colors.error',
            'tokens.colors.success'
          ),
          { minLength: 1, maxLength: 5 }
        ),
        async (components) => {
          const screenContent = components.join('\n');
          
          // Create a mock screen info
          const mockScreen: ScreenInfo = {
            name: 'TestScreen',
            path: '/test/path',
            category: 'auth',
            hasInputFields: false,
            hasScrollView: false,
            hasKeyboardAwareScrollView: false,
            components: ['TestComponent']
          };
          
          // Mock file system read
          const originalReadFile = require('fs/promises').readFile;
          require('fs/promises').readFile = jest.fn().mockResolvedValue(screenContent);
          
          try {
            const issues = await visualChecker.checkConsistency(mockScreen);
            
            // Check if content has validation indicators
            const hasValidation = screenContent.includes('error') || 
                                 screenContent.includes('success') ||
                                 screenContent.includes('warning') ||
                                 screenContent.includes('valid') ||
                                 screenContent.includes('invalid');
            
            if (hasValidation) {
              // Check if theme colors are used for validation
              const usesThemeColors = screenContent.includes('colors.error') ||
                                     screenContent.includes('colors.success') ||
                                     screenContent.includes('colors.warning') ||
                                     screenContent.includes('theme.colors.') ||
                                     screenContent.includes('tokens.colors.');
              
              // Check for hardcoded validation colors
              const hasHardcodedColors = screenContent.includes('"red"') ||
                                        screenContent.includes('"green"') ||
                                        screenContent.includes('"#FF0000"') ||
                                        screenContent.includes('"#00FF00"') ||
                                        screenContent.includes('"#FFA500"');
              
              if (hasHardcodedColors && !usesThemeColors) {
                // Should have an issue for hardcoded validation colors
                expect(issues.length).toBeGreaterThan(0);
                
                const validationIssues = issues.filter(issue => 
                  issue.title.includes('validation') || 
                  issue.description.includes('validation') ||
                  issue.issueType === 'theme-violation'
                );
                expect(validationIssues.length).toBeGreaterThan(0);
              } else if (usesThemeColors) {
                // Theme colors used, should have no validation issues
                const validationIssues = issues.filter(issue => 
                  issue.title.includes('validation') || 
                  issue.description.includes('validation')
                );
                expect(validationIssues.length).toBe(0);
              }
            } else {
              // No validation indicators, should have no validation issues
              const validationIssues = issues.filter(issue => 
                issue.title.includes('validation') || 
                issue.description.includes('validation')
              );
              expect(validationIssues.length).toBe(0);
            }
            
            return true;
          } finally {
            // Restore original readFile
            require('fs/promises').readFile = originalReadFile;
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});