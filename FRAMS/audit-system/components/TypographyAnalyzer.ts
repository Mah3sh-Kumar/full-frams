/**
 * Typography Analyzer Component
 * Evaluates typography consistency and accessibility in React Native screens
 */

import * as fs from 'fs';
import { 
  TypographyIssue, 
  TypographyAnalyzer as ITypographyAnalyzer, 
  ScreenInfo, 
  IssueSeverity, 
  TypographyIssueType 
} from '../types';

export class TypographyAnalyzer implements ITypographyAnalyzer {
  // WCAG contrast ratio standards
  private readonly WCAG_NORMAL_TEXT_RATIO = 4.5;
  private readonly WCAG_LARGE_TEXT_RATIO = 3.0;
  private readonly LARGE_TEXT_SIZE = 18; // 18pt or larger is considered large text

  /**
   * Analyzes typography issues for a given screen
   */
  async analyzeTypography(screen: ScreenInfo): Promise<TypographyIssue[]> {
    const issues: TypographyIssue[] = [];

    // Read the screen file content
    const content = fs.readFileSync(screen.path, 'utf-8');

    // Check for font scalability issues
    const scalabilityIssues = this.checkFontScalabilityIssues(screen, content);
    issues.push(...scalabilityIssues);

    // Check for text overflow issues
    const overflowIssues = this.checkTextOverflowIssues(screen, content);
    issues.push(...overflowIssues);

    // Check for contrast ratio issues
    const contrastIssues = this.checkContrastRatioIssues(screen, content);
    issues.push(...contrastIssues);

    return issues;
  }

  /**
   * Checks if a component uses scalable font units
   */
  checkFontScalability(component: string): boolean {
    // In React Native, fontSize is automatically scalable (uses sp equivalent)
    // We check for hardcoded pixel values that might not scale properly
    const hardcodedFontPattern = /fontSize\s*:\s*(\d+)/;
    const match = component.match(hardcodedFontPattern);
    
    if (!match) {
      return true; // No explicit fontSize means it uses defaults (scalable)
    }

    // Check if the fontSize is reasonable (not too small or too large)
    const fontSize = parseInt(match[1], 10);
    return fontSize >= 12 && fontSize <= 72;
  }

  /**
   * Checks if a component handles text overflow properly
   */
  checkTextOverflow(component: string): boolean {
    // Check if Text component has numberOfLines or ellipsizeMode
    const hasNumberOfLines = /numberOfLines\s*=/.test(component);
    const hasEllipsizeMode = /ellipsizeMode\s*=/.test(component);
    
    // If it's a Text component with content, it should have overflow handling
    const isTextComponent = /<Text[\s>]/.test(component);
    
    if (!isTextComponent) {
      return true; // Not a Text component, no overflow concern
    }

    // Text components should have at least one overflow handling mechanism
    return hasNumberOfLines || hasEllipsizeMode;
  }

  /**
   * Calculates contrast ratio between text and background colors
   */
  checkContrastRatio(textColor: string, backgroundColor: string): number {
    const textLuminance = this.calculateRelativeLuminance(textColor);
    const bgLuminance = this.calculateRelativeLuminance(backgroundColor);

    // Calculate contrast ratio using WCAG formula
    const lighter = Math.max(textLuminance, bgLuminance);
    const darker = Math.min(textLuminance, bgLuminance);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  /**
   * Checks for font scalability issues in the screen
   */
  private checkFontScalabilityIssues(screen: ScreenInfo, content: string): TypographyIssue[] {
    const issues: TypographyIssue[] = [];

    // Find all fontSize declarations
    const fontSizePattern = /fontSize\s*:\s*(\d+)/g;
    let match;

    while ((match = fontSizePattern.exec(content)) !== null) {
      const fontSize = parseInt(match[1], 10);
      
      // Check if font size is too small (less than 12)
      if (fontSize < 12) {
        issues.push(this.createIssue(
          screen,
          'non-scalable',
          'high',
          'Font size too small',
          `Font size of ${fontSize}px is below the minimum recommended size of 12px. This may cause readability issues, especially for users with visual impairments.`,
          [
            '1. Open the screen on an Android device',
            '2. Navigate to Settings > Display > Font size',
            '3. Increase the font size to 150% or 200%',
            '4. Return to the app and observe that text may be too small to read comfortably'
          ],
          `Increase font size to at least 12px. Consider using theme tokens for consistent typography.`,
          'TextComponent',
          fontSize,
          12
        ));
      }

      // Check if font size is excessively large (greater than 72)
      if (fontSize > 72) {
        issues.push(this.createIssue(
          screen,
          'non-scalable',
          'medium',
          'Font size excessively large',
          `Font size of ${fontSize}px is unusually large. This may cause layout issues on smaller screens.`,
          [
            '1. Open the screen on a small Android device (720×1480)',
            '2. Observe that large text may overflow or cause layout problems'
          ],
          `Reduce font size to a more reasonable value (typically 12-48px for body text, up to 72px for large headings).`,
          'TextComponent',
          fontSize,
          48
        ));
      }
    }

    return issues;
  }

  /**
   * Checks for text overflow issues in the screen
   */
  private checkTextOverflowIssues(screen: ScreenInfo, content: string): TypographyIssue[] {
    const issues: TypographyIssue[] = [];

    // Find all Text components
    const textComponentPattern = /<Text\s+([^>]*?)(?:\/?>|>[\s\S]*?<\/Text>)/g;
    let match;

    while ((match = textComponentPattern.exec(content)) !== null) {
      const props = match[1];
      const fullComponent = match[0];
      
      // Check if Text component has overflow handling
      const hasNumberOfLines = /numberOfLines\s*=/.test(props);
      const hasEllipsizeMode = /ellipsizeMode\s*=/.test(props);
      
      // Check if the Text component has dynamic content (props, state, variables)
      const hasDynamicContent = /\{[^}]+\}/.test(fullComponent);
      
      // If it has dynamic content but no overflow handling, flag it
      if (hasDynamicContent && !hasNumberOfLines && !hasEllipsizeMode) {
        issues.push(this.createIssue(
          screen,
          'overflow',
          'medium',
          'Missing text overflow handling',
          `Text component with dynamic content does not have numberOfLines or ellipsizeMode configured. Long text may overflow and break the layout.`,
          [
            '1. Open the screen on an Android device',
            '2. Ensure the text content is long enough to exceed available space',
            '3. Observe that text may overflow, overlap other elements, or break the layout'
          ],
          `Add numberOfLines prop to limit text lines and ellipsizeMode="tail" to show ellipsis for truncated text.`,
          'Text',
          0,
          0
        ));
      }
    }

    return issues;
  }

  /**
   * Checks for contrast ratio issues in the screen
   */
  private checkContrastRatioIssues(screen: ScreenInfo, content: string): TypographyIssue[] {
    const issues: TypographyIssue[] = [];

    // Extract color combinations from styles
    const colorCombinations = this.extractColorCombinations(content);

    for (const combo of colorCombinations) {
      const contrastRatio = this.checkContrastRatio(combo.textColor, combo.backgroundColor);
      const fontSize = combo.fontSize || 14;
      const isLargeText = fontSize >= this.LARGE_TEXT_SIZE;
      const requiredRatio = isLargeText ? this.WCAG_LARGE_TEXT_RATIO : this.WCAG_NORMAL_TEXT_RATIO;

      if (contrastRatio < requiredRatio) {
        issues.push(this.createIssue(
          screen,
          'contrast',
          'high',
          'Insufficient color contrast',
          `Text color "${combo.textColor}" on background "${combo.backgroundColor}" has a contrast ratio of ${contrastRatio.toFixed(2)}:1, which is below the WCAG ${isLargeText ? 'AA' : 'AAA'} standard of ${requiredRatio}:1.`,
          [
            '1. Open the screen on an Android device',
            '2. Observe the text in question',
            '3. Note that text may be difficult to read, especially in bright sunlight or for users with visual impairments'
          ],
          `Adjust text color or background color to achieve a contrast ratio of at least ${requiredRatio}:1. Use a contrast checker tool to verify.`,
          combo.component,
          fontSize,
          fontSize,
          contrastRatio
        ));
      }
    }

    return issues;
  }

  /**
   * Extracts color combinations from content
   */
  private extractColorCombinations(content: string): Array<{
    textColor: string;
    backgroundColor: string;
    fontSize?: number;
    component: string;
  }> {
    const combinations: Array<{
      textColor: string;
      backgroundColor: string;
      fontSize?: number;
      component: string;
    }> = [];

    // Look for style objects with color and backgroundColor
    const stylePattern = /style\s*=\s*\{?\s*\{([^}]+)\}\s*\}?/g;
    let match;

    while ((match = stylePattern.exec(content)) !== null) {
      const styleContent = match[1];
      
      // Extract color
      const colorMatch = styleContent.match(/color\s*:\s*['"]([^'"]+)['"]/);
      const bgColorMatch = styleContent.match(/backgroundColor\s*:\s*['"]([^'"]+)['"]/);
      const fontSizeMatch = styleContent.match(/fontSize\s*:\s*(\d+)/);

      if (colorMatch && bgColorMatch) {
        combinations.push({
          textColor: colorMatch[1],
          backgroundColor: bgColorMatch[1],
          fontSize: fontSizeMatch ? parseInt(fontSizeMatch[1], 10) : undefined,
          component: 'Text',
        });
      }
    }

    // Also check theme colors (common patterns in FRAMS)
    const themeColorPattern = /colors\.(\w+)/g;
    const themeColors: string[] = [];
    
    while ((match = themeColorPattern.exec(content)) !== null) {
      themeColors.push(match[1]);
    }

    // If we found theme colors, create some default combinations to check
    if (themeColors.length > 0) {
      // Common theme color combinations that should be checked
      const commonCombos = [
        { text: 'text', bg: 'background' },
        { text: 'textSecondary', bg: 'background' },
        { text: 'white', bg: 'primary' },
        { text: 'primary', bg: 'background' },
      ];

      for (const combo of commonCombos) {
        if (themeColors.includes(combo.text) || themeColors.includes(combo.bg)) {
          // Use placeholder colors for theme tokens (these would be resolved at runtime)
          combinations.push({
            textColor: this.getThemeColorValue(combo.text),
            backgroundColor: this.getThemeColorValue(combo.bg),
            component: 'Text',
          });
        }
      }
    }

    return combinations;
  }

  /**
   * Gets a placeholder color value for theme tokens
   */
  private getThemeColorValue(tokenName: string): string {
    // These are common theme color values from FRAMS
    const themeColors: Record<string, string> = {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#FFFFFF',
      text: '#000000',
      textSecondary: '#666666',
      white: '#FFFFFF',
      black: '#000000',
      error: '#FF3B30',
      success: '#34C759',
    };

    return themeColors[tokenName] || '#000000';
  }

  /**
   * Calculates relative luminance for a color
   * Uses WCAG formula: https://www.w3.org/TR/WCAG20/#relativeluminancedef
   */
  private calculateRelativeLuminance(color: string): number {
    // Parse color to RGB
    const rgb = this.parseColor(color);
    
    // Convert to sRGB
    const rsRGB = rgb.r / 255;
    const gsRGB = rgb.g / 255;
    const bsRGB = rgb.b / 255;

    // Apply gamma correction
    const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    // Calculate relative luminance
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Parses a color string to RGB values
   */
  private parseColor(color: string): { r: number; g: number; b: number } {
    // Handle hex colors
    if (color.startsWith('#')) {
      const hex = color.substring(1);
      
      if (hex.length === 3) {
        // Short hex format (#RGB)
        return {
          r: parseInt(hex[0] + hex[0], 16),
          g: parseInt(hex[1] + hex[1], 16),
          b: parseInt(hex[2] + hex[2], 16),
        };
      } else if (hex.length === 6) {
        // Full hex format (#RRGGBB)
        return {
          r: parseInt(hex.substring(0, 2), 16),
          g: parseInt(hex.substring(2, 4), 16),
          b: parseInt(hex.substring(4, 6), 16),
        };
      }
    }

    // Handle rgb/rgba format
    const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (rgbMatch) {
      return {
        r: parseInt(rgbMatch[1], 10),
        g: parseInt(rgbMatch[2], 10),
        b: parseInt(rgbMatch[3], 10),
      };
    }

    // Handle named colors (basic set)
    const namedColors: Record<string, { r: number; g: number; b: number }> = {
      white: { r: 255, g: 255, b: 255 },
      black: { r: 0, g: 0, b: 0 },
      red: { r: 255, g: 0, b: 0 },
      green: { r: 0, g: 128, b: 0 },
      blue: { r: 0, g: 0, b: 255 },
      gray: { r: 128, g: 128, b: 128 },
      grey: { r: 128, g: 128, b: 128 },
    };

    return namedColors[color.toLowerCase()] || { r: 0, g: 0, b: 0 };
  }

  /**
   * Creates a typography issue object
   */
  private createIssue(
    screen: ScreenInfo,
    issueType: TypographyIssueType,
    severity: IssueSeverity,
    title: string,
    description: string,
    reproductionSteps: string[],
    recommendation: string,
    component: string,
    currentFontSize: number,
    recommendedFontSize: number,
    contrastRatio?: number
  ): TypographyIssue {
    return {
      id: this.generateId(),
      screen: screen.name,
      category: 'typography',
      issueType,
      severity,
      title,
      description,
      reproductionSteps,
      recommendation,
      component,
      currentFontSize,
      recommendedFontSize,
      contrastRatio,
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
    return `typography-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}
