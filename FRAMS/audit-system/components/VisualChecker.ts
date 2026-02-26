/**
 * Visual Consistency Checker Component
 * Evaluates visual consistency and design system adherence in React Native screens
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import { 
  VisualIssue, 
  VisualChecker as IVisualChecker, 
  ScreenInfo, 
  IssueSeverity, 
  VisualIssueType 
} from '../types';

export class VisualChecker implements IVisualChecker {
  // Design system constants
  private readonly PRIMARY_BUTTON_HEIGHT = 52;
  private readonly SECONDARY_BUTTON_HEIGHT = 48;
  private readonly STANDARD_SPACING_VALUES = [4, 8, 16, 24, 32]; // xs, sm, md, lg, xl
  
  // Theme token patterns
  private readonly THEME_TOKEN_PATTERNS = [
    /colors\.\w+(\.\w+)*/,      // colors.primary, colors.text.primary
    /spacing\.\w+/,             // spacing.md, spacing.lg
    /theme\.colors\.\w+/,       // theme.colors.primary
    /tokens\.\w+\.\w+/,         // tokens.colors.primary, tokens.spacing.md
    /borders\.radius\.\w+/,     // borders.radius.medium
  ];
  
  // Hardcoded value patterns
  private readonly HARDCODED_COLOR_PATTERNS = [
    /color\s*:\s*['"]#[0-9A-Fa-f]{3,6}['"]/g,  // color: "#FF0000"
    /color\s*:\s*['"](red|green|blue|black|white|gray|grey|yellow|orange|purple|pink|brown)['"]/gi, // color: "red"
    /backgroundColor\s*:\s*['"]#[0-9A-Fa-f]{3,6}['"]/g, // backgroundColor: "#FF0000"
    /backgroundColor\s*:\s*['"](red|green|blue|black|white|gray|grey|yellow|orange|purple|pink|brown)['"]/gi, // backgroundColor: "red"
  ];
  
  // Hardcoded spacing patterns
  private readonly HARDCODED_SPACING_PATTERNS = [
    /margin\s*:\s*(\d+)/g,       // margin: 10
    /padding\s*:\s*(\d+)/g,      // padding: 20
    /margin\w*\s*:\s*(\d+)/g,    // marginTop: 10, marginHorizontal: 20
    /padding\w*\s*:\s*(\d+)/g,   // paddingTop: 10, paddingVertical: 20
  ];
  
  // Button patterns
  private readonly BUTTON_HEIGHT_PATTERN = /height\s*:\s*(\d+)/;
  private readonly BUTTON_COLOR_PATTERN = /(backgroundColor|color)\s*:\s*(colors\.|theme\.|tokens\.)/;
  private readonly BUTTON_THEME_COLOR_PATTERN = /(colors\.|theme\.|tokens\.)/;
  
  // Loading state patterns
  private readonly LOADING_COMPONENT_PATTERNS = [
    /<LoadingSpinner\s/,        // <LoadingSpinner
    /<ActivityIndicator\s/,     // <ActivityIndicator
  ];
  
  // Custom loading patterns (non-standard)
  private readonly CUSTOM_LOADING_PATTERNS = [
    /<Text>.*Loading.*<\/Text>/i, // <Text>Loading...</Text>
    /<View.*>.*Loading.*<\/View>/i, // <View>Loading...</View>
    /<CustomSpinner\s/,         // <CustomSpinner
  ];
  
  // Validation state patterns
  private readonly VALIDATION_COLOR_PATTERNS = [
    /color\s*:\s*['"](red|#FF0000|#FF3B30)['"]/gi, // Error colors
    /color\s*:\s*['"](green|#00FF00|#34C759)['"]/gi, // Success colors
    /color\s*:\s*['"](orange|#FFA500|#FF9500)['"]/gi, // Warning colors
  ];
  
  // Theme validation colors
  private readonly THEME_VALIDATION_COLORS = [
    /colors\.error/,
    /colors\.success/,
    /colors\.warning/,
    /theme\.colors\.error/,
    /theme\.colors\.success/,
    /theme\.colors\.warning/,
  ];

  /**
   * Checks visual consistency for a given screen
   */
  async checkConsistency(screen: ScreenInfo): Promise<VisualIssue[]> {
    const issues: VisualIssue[] = [];

    try {
      // Read the screen file content
      const content = await fs.readFile(screen.path, 'utf-8');

      // Check for theme usage violations
      const themeIssues = this.checkThemeUsageIssues(screen, content);
      issues.push(...themeIssues);

      // Check for button consistency issues
      const buttonIssues = this.checkButtonConsistencyIssues(screen, content);
      issues.push(...buttonIssues);

      // Check for spacing consistency issues
      const spacingIssues = this.checkSpacingConsistencyIssues(screen, content);
      issues.push(...spacingIssues);

      // Check for loading state consistency issues
      const loadingIssues = this.checkLoadingStateIssues(screen, content);
      issues.push(...loadingIssues);

      // Check for validation state consistency issues
      const validationIssues = this.checkValidationStateIssues(screen, content);
      issues.push(...validationIssues);

    } catch (error) {
      // Handle file read errors gracefully
      console.warn(`Error reading screen ${screen.name}: ${error}`);
    }

    return issues;
  }

  /**
   * Validates if a component uses theme tokens instead of hardcoded values
   */
  validateThemeUsage(component: string): boolean {
    if (!component || component.trim() === '') {
      return true; // Empty component is considered valid
    }

    // Check for hardcoded values
    const hasHardcodedColor = this.HARDCODED_COLOR_PATTERNS.some(pattern => 
      pattern.test(component)
    );
    
    const hasHardcodedSpacing = this.HARDCODED_SPACING_PATTERNS.some(pattern => 
      pattern.test(component)
    );

    // If there are hardcoded values, check if there are also theme tokens
    if (hasHardcodedColor || hasHardcodedSpacing) {
      // Check for theme tokens
      const hasThemeTokens = this.THEME_TOKEN_PATTERNS.some(pattern => 
        pattern.test(component)
      );
      
      // If there are hardcoded values but no theme tokens, it's invalid
      // If there are both hardcoded values and theme tokens, it's also invalid (mixed)
      return false;
    }

    // No hardcoded values found, check if it has theme tokens or no styling at all
    const hasThemeTokens = this.THEME_TOKEN_PATTERNS.some(pattern => 
      pattern.test(component)
    );
    
    // Valid if it has theme tokens or no styling at all
    return hasThemeTokens || !component.includes('style=');
  }

  /**
   * Checks button consistency across an array of button definitions
   */
  checkButtonConsistency(buttons: string[]): boolean {
    if (!buttons || buttons.length === 0) {
      return true; // Empty array is consistent
    }

    for (const button of buttons) {
      // Check button height
      const heightMatch = button.match(this.BUTTON_HEIGHT_PATTERN);
      if (heightMatch) {
        const height = parseInt(heightMatch[1], 10);
        if (height !== this.PRIMARY_BUTTON_HEIGHT && height !== this.SECONDARY_BUTTON_HEIGHT) {
          return false; // Non-standard height
        }
      } else {
        return false; // Missing height
      }

      // Check for theme color usage - using the more flexible pattern
      const hasThemeColor = this.BUTTON_THEME_COLOR_PATTERN.test(button);
      if (!hasThemeColor) {
        return false; // Missing theme color
      }
    }

    return true;
  }

  /**
   * Checks spacing consistency for a screen
   */
  checkSpacingConsistency(screen: ScreenInfo): boolean {
    try {
      const content = fsSync.readFileSync(screen.path, 'utf-8');
      
      // Find all spacing values
      const spacingValues: number[] = [];
      
      for (const pattern of this.HARDCODED_SPACING_PATTERNS) {
        const matches = content.matchAll(pattern);
        for (const match of matches) {
          if (match[1]) {
            spacingValues.push(parseInt(match[1], 10));
          }
        }
      }

      // If no spacing values found, it's consistent
      if (spacingValues.length === 0) {
        return true;
      }

      // Check if any spacing value is not a standard value
      for (const value of spacingValues) {
        if (!this.STANDARD_SPACING_VALUES.includes(value)) {
          return false;
        }
      }

      return true;
    } catch (error) {
      // If we can't read the file, assume it's consistent
      return true;
    }
  }

  /**
   * Checks for theme usage issues in the screen
   */
  private checkThemeUsageIssues(screen: ScreenInfo, content: string): VisualIssue[] {
    const issues: VisualIssue[] = [];

    // Check for hardcoded colors
    for (const pattern of this.HARDCODED_COLOR_PATTERNS) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const hardcodedValue = match[0];
        
        issues.push(this.createIssue(
          screen,
          'theme-violation',
          'medium',
          'Hardcoded color value',
          `Found hardcoded color value: ${hardcodedValue}. Use theme tokens (colors.primary, colors.secondary, etc.) instead.`,
          [
            '1. Open the screen on an Android device',
            '2. Observe the component with hardcoded color',
            '3. Note that this color may not match the design system'
          ],
          `Replace ${hardcodedValue} with appropriate theme token (e.g., colors.primary, colors.text.primary).`,
          'Component',
          hardcodedValue,
          'colors.primary (or appropriate theme token)',
          'Design System: Colors should use theme tokens for consistency'
        ));
      }
    }

    // Check for hardcoded spacing that's not standard
    for (const pattern of this.HARDCODED_SPACING_PATTERNS) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const spacingValue = parseInt(match[1], 10);
          if (!this.STANDARD_SPACING_VALUES.includes(spacingValue)) {
            issues.push(this.createIssue(
              screen,
              'inconsistent-spacing',
              'low',
              'Non-standard spacing value',
              `Found spacing value: ${spacingValue}. Use standard spacing tokens (spacing.xs: 4, sm: 8, md: 16, lg: 24, xl: 32).`,
              [
                '1. Open the screen on an Android device',
                '2. Observe the component with non-standard spacing',
                '3. Note that spacing may be inconsistent with other screens'
              ],
              `Replace spacing value ${spacingValue} with appropriate spacing token (spacing.xs, sm, md, lg, or xl).`,
              'Component',
              spacingValue.toString(),
              'spacing.md (or appropriate spacing token)',
              'Design System: Spacing should use standard tokens'
            ));
          }
        }
      }
    }

    return issues;
  }

  /**
   * Checks for button consistency issues in the screen
   */
  private checkButtonConsistencyIssues(screen: ScreenInfo, content: string): VisualIssue[] {
    const issues: VisualIssue[] = [];

    // Find all button components
    const buttonPattern = /<Button\s+([^>]*?)(?:\/?>|>[\s\S]*?<\/Button>)/g;
    let match;
    const buttonDefinitions: string[] = [];

    while ((match = buttonPattern.exec(content)) !== null) {
      const buttonProps = match[1];
      buttonDefinitions.push(buttonProps);

      // Check individual button consistency
      const heightMatch = buttonProps.match(this.BUTTON_HEIGHT_PATTERN);
      if (heightMatch) {
        const height = parseInt(heightMatch[1], 10);
        if (height !== this.PRIMARY_BUTTON_HEIGHT && height !== this.SECONDARY_BUTTON_HEIGHT) {
          issues.push(this.createIssue(
            screen,
            'inconsistent-sizing',
            'medium',
            'Non-standard button height',
            `Button has height: ${height}px. Standard button heights are ${this.PRIMARY_BUTTON_HEIGHT}px (primary) and ${this.SECONDARY_BUTTON_HEIGHT}px (secondary).`,
            [
              '1. Open the screen on an Android device',
              '2. Observe the button with non-standard height',
              '3. Compare with other buttons in the app'
            ],
            `Adjust button height to ${this.PRIMARY_BUTTON_HEIGHT}px for primary buttons or ${this.SECONDARY_BUTTON_HEIGHT}px for secondary buttons.`,
            'Button',
            `${height}px`,
            `${this.PRIMARY_BUTTON_HEIGHT}px or ${this.SECONDARY_BUTTON_HEIGHT}px`,
            'Design System: Button sizing standards'
          ));
        }
      } else {
        issues.push(this.createIssue(
          screen,
          'inconsistent-sizing',
          'medium',
          'Missing button height',
          `Button does not have explicit height defined.`,
          [
            '1. Open the screen on an Android device',
            '2. Observe the button without explicit height',
            '3. Note that button size may be inconsistent'
          ],
          `Add explicit height: ${this.PRIMARY_BUTTON_HEIGHT}px for primary buttons or ${this.SECONDARY_BUTTON_HEIGHT}px for secondary buttons.`,
          'Button',
          'Not defined',
          `${this.PRIMARY_BUTTON_HEIGHT}px or ${this.SECONDARY_BUTTON_HEIGHT}px`,
          'Design System: Button sizing standards'
        ));
      }

      // Check for theme color usage
      const hasThemeColor = this.BUTTON_THEME_COLOR_PATTERN.test(buttonProps);
      if (!hasThemeColor) {
        issues.push(this.createIssue(
          screen,
          'theme-violation',
          'medium',
          'Button missing theme colors',
          `Button does not use theme colors for styling.`,
          [
            '1. Open the screen on an Android device',
            '2. Observe the button color',
            '3. Note that color may not match design system'
          ],
          `Use theme colors (colors.primary, colors.secondary, etc.) for button styling.`,
          'Button',
          'Hardcoded or missing color',
          'colors.primary or colors.secondary',
          'Design System: Color token usage'
        ));
      }
    }

    // Check overall button consistency across the screen
    if (buttonDefinitions.length > 1) {
      const isConsistent = this.checkButtonConsistency(buttonDefinitions);
      if (!isConsistent) {
        issues.push(this.createIssue(
          screen,
          'inconsistent-sizing',
          'high',
          'Inconsistent button styling',
          `Multiple buttons on this screen have inconsistent styling (heights, colors).`,
          [
            '1. Open the screen on an Android device',
            '2. Observe all buttons on the screen',
            '3. Note differences in button sizes and colors'
          ],
          `Standardize all buttons to use consistent heights and theme colors.`,
          'Multiple Buttons',
          'Mixed values',
          'Consistent theme-based styling',
          'Design System: Visual consistency'
        ));
      }
    }

    return issues;
  }

  /**
   * Checks for spacing consistency issues in the screen
   */
  private checkSpacingConsistencyIssues(screen: ScreenInfo, content: string): VisualIssue[] {
    const issues: VisualIssue[] = [];

    // Check for non-standard spacing values
    for (const pattern of this.HARDCODED_SPACING_PATTERNS) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          const spacingValue = parseInt(match[1], 10);
          if (!this.STANDARD_SPACING_VALUES.includes(spacingValue)) {
            issues.push(this.createIssue(
              screen,
              'inconsistent-spacing',
              'low',
              'Non-standard spacing value',
              `Found spacing value: ${spacingValue}. Use standard spacing tokens.`,
              [
                '1. Open the screen on an Android device',
                '2. Observe the component with non-standard spacing',
                '3. Note spacing inconsistency'
              ],
              `Replace ${spacingValue} with appropriate spacing token (spacing.xs: 4, sm: 8, md: 16, lg: 24, xl: 32).`,
              'Component',
              spacingValue.toString(),
              'Standard spacing token',
              'Design System: Spacing standards'
            ));
          }
        }
      }
    }

    return issues;
  }

  /**
   * Checks for loading state consistency issues in the screen
   */
  private checkLoadingStateIssues(screen: ScreenInfo, content: string): VisualIssue[] {
    const issues: VisualIssue[] = [];

    // Check for custom loading implementations
    for (const pattern of this.CUSTOM_LOADING_PATTERNS) {
      if (pattern.test(content)) {
        issues.push(this.createIssue(
          screen,
          'inconsistent-sizing',
          'medium',
          'Non-standard loading implementation',
          `Found custom loading implementation. Use standard LoadingSpinner component.`,
          [
            '1. Open the screen on an Android device',
            '2. Trigger a loading state',
            '3. Observe the custom loading indicator'
          ],
          `Replace custom loading implementation with <LoadingSpinner size="large" /> or <ActivityIndicator animating={true} />.`,
          'Loading Component',
          'Custom implementation',
          'Standard LoadingSpinner or ActivityIndicator',
          'Design System: Loading state consistency'
        ));
      }
    }

    // Check if standard loading components are used when needed
    const hasLoadingLogic = content.includes('isLoading') || 
                           content.includes('loading') || 
                           content.includes('showSpinner');
    
    if (hasLoadingLogic) {
      const hasStandardLoader = this.LOADING_COMPONENT_PATTERNS.some(pattern => 
        pattern.test(content)
      );
      
      if (!hasStandardLoader) {
        issues.push(this.createIssue(
          screen,
          'inconsistent-sizing',
          'high',
          'Missing standard loading component',
          `Screen has loading logic but does not use standard loading component.`,
          [
            '1. Open the screen on an Android device',
            '2. Trigger a loading state',
            '3. Observe missing or non-standard loading indicator'
          ],
          `Add <LoadingSpinner size="large" /> or <ActivityIndicator animating={true} /> for loading states.`,
          'Loading State',
          'Missing or custom',
          'Standard loading component',
          'Design System: Loading state standards'
        ));
      }
    }

    return issues;
  }

  /**
   * Checks for validation state consistency issues in the screen
   */
  private checkValidationStateIssues(screen: ScreenInfo, content: string): VisualIssue[] {
    const issues: VisualIssue[] = [];

    // Check for hardcoded validation colors
    for (const pattern of this.VALIDATION_COLOR_PATTERNS) {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const hardcodedColor = match[0];
        
        issues.push(this.createIssue(
          screen,
          'theme-violation',
          'medium',
          'Hardcoded validation color',
          `Found hardcoded validation color: ${hardcodedColor}. Use theme validation colors.`,
          [
            '1. Open the screen on an Android device',
            '2. Trigger a validation state (error, success, warning)',
            '3. Observe the hardcoded color usage'
          ],
          `Replace ${hardcodedColor} with theme validation colors (colors.error, colors.success, colors.warning).`,
          'Validation Component',
          hardcodedColor,
          'colors.error, colors.success, or colors.warning',
          'Design System: Validation state colors'
        ));
      }
    }

    // Check if validation logic exists but doesn't use theme colors
    const hasValidationLogic = content.includes('error=') || 
                              content.includes('success=') || 
                              content.includes('warning=') ||
                              content.includes('isValid=') ||
                              content.includes('hasError=');
    
    if (hasValidationLogic) {
      const hasThemeValidationColors = this.THEME_VALIDATION_COLORS.some(pattern => 
        pattern.test(content)
      );
      
      if (!hasThemeValidationColors) {
        issues.push(this.createIssue(
          screen,
          'theme-violation',
          'high',
          'Validation states missing theme colors',
          `Screen has validation logic but does not use theme validation colors.`,
          [
            '1. Open the screen on an Android device',
            '2. Trigger validation states',
            '3. Observe color usage for validation feedback'
          ],
          `Use theme validation colors (colors.error, colors.success, colors.warning) for consistent validation styling.`,
          'Validation States',
          'Hardcoded or missing colors',
          'Theme validation colors',
          'Design System: Validation state consistency'
        ));
      }
    }

    return issues;
  }

  /**
   * Creates a visual issue object
   */
  private createIssue(
    screen: ScreenInfo,
    issueType: VisualIssueType,
    severity: IssueSeverity,
    title: string,
    description: string,
    reproductionSteps: string[],
    recommendation: string,
    component: string,
    expectedValue: string,
    actualValue: string,
    designSystemReference: string
  ): VisualIssue {
    return {
      id: this.generateId(),
      screen: screen.name,
      category: 'visual',
      issueType,
      severity,
      title,
      description,
      reproductionSteps,
      recommendation,
      component,
      expectedValue,
      actualValue,
      designSystemReference,
      codeReference: {
        file: screen.path,
        component,
      },
    };
  }

  /**
   * Generates a unique ID for issues
   */
  private generateId(): string {
    return `visual-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}