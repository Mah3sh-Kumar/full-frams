/**
 * Layout Responsiveness Tester Component
 * Tests layout behavior across device sizes and orientations
 */

import * as fs from 'fs';
import { 
  LayoutIssue, 
  LayoutTester as ILayoutTester, 
  ScreenInfo, 
  DeviceConfig,
  IssueSeverity, 
  LayoutIssueType,
  Orientation
} from '../types';

export class LayoutTester implements ILayoutTester {
  // Device configuration matrix
  private readonly DEVICE_MATRIX: DeviceConfig[] = [
    {
      name: 'Small Phone (Samsung Galaxy A series)',
      width: 720,
      height: 1480,
      density: 2.0,
      androidVersion: '11',
      manufacturer: 'Samsung'
    },
    {
      name: 'Mid-range Phone (Pixel 5, Samsung S21)',
      width: 1080,
      height: 2400,
      density: 3.0,
      androidVersion: '12',
      manufacturer: 'Google'
    },
    {
      name: 'Large Screen/Tablet (Samsung Tab S7)',
      width: 1200,
      height: 2000,
      density: 2.5,
      androidVersion: '12',
      manufacturer: 'Samsung'
    }
  ];

  /**
   * Tests layout responsiveness across different device sizes
   */
  async testResponsiveness(screen: ScreenInfo, devices?: DeviceConfig[]): Promise<LayoutIssue[]> {
    const issues: LayoutIssue[] = [];
    const testDevices = devices || this.DEVICE_MATRIX;

    // Read the screen file content
    const content = fs.readFileSync(screen.path, 'utf-8');

    for (const device of testDevices) {
      // Check for flex layout issues
      const flexIssues = this.checkFlexLayoutIssues(screen, content, device);
      issues.push(...flexIssues);

      // Check for ScrollView usage
      const scrollViewIssues = this.checkScrollViewIssues(screen, content, device);
      issues.push(...scrollViewIssues);

      // Check for hardcoded dimensions
      const dimensionIssues = this.checkHardcodedDimensions(screen, content, device);
      issues.push(...dimensionIssues);

      // Check for potential clipping issues
      const clippingIssues = this.checkClippingIssues(screen, content, device);
      issues.push(...clippingIssues);

      // Check for spacing inconsistencies
      const spacingIssues = this.checkSpacingIssues(screen, content, device);
      issues.push(...spacingIssues);
    }

    return issues;
  }

  /**
   * Tests layout behavior during orientation changes
   */
  async testOrientation(screen: ScreenInfo): Promise<LayoutIssue[]> {
    const issues: LayoutIssue[] = [];

    // Read the screen file content
    const content = fs.readFileSync(screen.path, 'utf-8');

    // Check if screen handles orientation changes
    const hasOrientationHandling = this.checkOrientationHandling(content);
    
    if (!hasOrientationHandling) {
      // Check if the screen has fixed dimensions that might break in landscape
      const hasFixedDimensions = this.hasFixedDimensions(content);
      
      if (hasFixedDimensions) {
        issues.push(this.createIssue(
          screen,
          'misalignment',
          'medium',
          'No orientation change handling with fixed dimensions',
          `Screen "${screen.name}" uses fixed dimensions without orientation handling. Layout may break when device is rotated.`,
          [
            '1. Open the screen on an Android device in portrait mode',
            '2. Rotate the device to landscape mode',
            '3. Observe that layout may not adapt properly',
            '4. Content may be clipped or misaligned'
          ],
          'Use flexible layouts (flex, percentage-based dimensions) or implement orientation-specific layouts using Dimensions API or useWindowDimensions hook.',
          this.DEVICE_MATRIX[1],
          'landscape',
          ['View', 'Container']
        ));
      }
    }

    // Test both orientations
    for (const orientation of ['portrait', 'landscape'] as Orientation[]) {
      const orientationIssues = this.checkOrientationSpecificIssues(screen, content, orientation);
      issues.push(...orientationIssues);
    }

    return issues;
  }

  /**
   * Checks if a component uses flex layout correctly
   */
  checkFlexLayout(component: string): boolean {
    // Check for flex-related properties
    const flexPatterns = [
      /flex\s*:\s*\d+/,
      /flexDirection\s*:\s*['"](?:row|column|row-reverse|column-reverse)['"]/,
      /justifyContent\s*:\s*['"](?:flex-start|flex-end|center|space-between|space-around|space-evenly)['"]/,
      /alignItems\s*:\s*['"](?:flex-start|flex-end|center|stretch|baseline)['"]/,
    ];

    return flexPatterns.some(pattern => pattern.test(component));
  }

  /**
   * Checks if screen uses ScrollView appropriately
   */
  checkScrollViewUsage(screen: ScreenInfo): boolean {
    // Read the screen file content
    const content = fs.readFileSync(screen.path, 'utf-8');

    // Check if screen has ScrollView or KeyboardAwareScrollView
    return screen.hasScrollView || screen.hasKeyboardAwareScrollView;
  }

  /**
   * Checks for flex layout issues
   */
  private checkFlexLayoutIssues(screen: ScreenInfo, content: string, device: DeviceConfig): LayoutIssue[] {
    const issues: LayoutIssue[] = [];

    // Check for missing flex on container views
    const viewPattern = /<View\s+([^>]*?)(?:\/?>|>[\s\S]*?<\/View>)/g;
    let match;
    let viewCount = 0;
    let flexCount = 0;

    while ((match = viewPattern.exec(content)) !== null) {
      viewCount++;
      const props = match[0];
      
      if (this.checkFlexLayout(props)) {
        flexCount++;
      }
    }

    // If there are many Views but few use flex, it might indicate layout issues
    if (viewCount > 5 && flexCount < viewCount * 0.3) {
      issues.push(this.createIssue(
        screen,
        'misalignment',
        'medium',
        'Limited flex layout usage',
        `Screen "${screen.name}" has ${viewCount} View components but only ${flexCount} use flex layout. This may cause responsiveness issues on device "${device.name}".`,
        [
          `1. Open the screen on a device with ${device.width}×${device.height} resolution`,
          '2. Observe that some elements may not adapt to screen size',
          '3. Content may appear misaligned or improperly spaced'
        ],
        'Use flex layout properties (flex, flexDirection, justifyContent, alignItems) to create responsive layouts that adapt to different screen sizes.',
        device,
        'portrait',
        ['View']
      ));
    }

    return issues;
  }

  /**
   * Checks for ScrollView usage issues
   */
  private checkScrollViewIssues(screen: ScreenInfo, content: string, device: DeviceConfig): LayoutIssue[] {
    const issues: LayoutIssue[] = [];

    // Check if screen has long content but no ScrollView
    const hasLongContent = this.hasLongContent(content);
    const hasScrollView = screen.hasScrollView || screen.hasKeyboardAwareScrollView;

    if (hasLongContent && !hasScrollView) {
      issues.push(this.createIssue(
        screen,
        'clipping',
        'high',
        'Missing ScrollView for long content',
        `Screen "${screen.name}" appears to have long content but does not use ScrollView. Content may be clipped on device "${device.name}".`,
        [
          `1. Open the screen on a device with ${device.width}×${device.height} resolution`,
          '2. Observe that content extends beyond the visible area',
          '3. User cannot scroll to see all content',
          '4. Bottom content is clipped and inaccessible'
        ],
        'Wrap the screen content in a ScrollView or KeyboardAwareScrollView to allow users to access all content.',
        device,
        'portrait',
        ['View', 'Container']
      ));
    }

    // Check for nested ScrollViews (potential issue)
    const nestedScrollViews = this.checkNestedScrollViews(content);
    if (nestedScrollViews > 0) {
      issues.push(this.createIssue(
        screen,
        'misalignment',
        'medium',
        'Nested ScrollViews detected',
        `Screen "${screen.name}" has ${nestedScrollViews} nested ScrollView(s). This can cause scrolling conflicts and poor UX.`,
        [
          `1. Open the screen on a device with ${device.width}×${device.height} resolution`,
          '2. Try to scroll the content',
          '3. Observe that scrolling may be unpredictable or conflict between parent and child ScrollViews'
        ],
        'Avoid nesting ScrollViews. Use FlatList for lists inside ScrollView, or restructure the layout to use a single scrollable container.',
        device,
        'portrait',
        ['ScrollView']
      ));
    }

    return issues;
  }

  /**
   * Checks for hardcoded dimensions
   */
  private checkHardcodedDimensions(screen: ScreenInfo, content: string, device: DeviceConfig): LayoutIssue[] {
    const issues: LayoutIssue[] = [];

    // Find hardcoded width/height values
    const dimensionPattern = /(?:width|height)\s*:\s*(\d+)/g;
    const hardcodedDimensions: Array<{ type: string; value: number }> = [];
    let match;

    while ((match = dimensionPattern.exec(content)) !== null) {
      const fullMatch = content.substring(Math.max(0, match.index - 20), match.index + match[0].length);
      const dimensionType = fullMatch.includes('width') ? 'width' : 'height';
      const value = parseInt(match[1], 10);
      
      hardcodedDimensions.push({ type: dimensionType, value });
    }

    // Check if hardcoded dimensions are problematic for this device
    for (const dim of hardcodedDimensions) {
      const deviceDimension = dim.type === 'width' ? device.width : device.height;
      
      // If hardcoded dimension is close to or exceeds device dimension, flag it
      if (dim.value > deviceDimension * 0.8) {
        issues.push(this.createIssue(
          screen,
          'clipping',
          'high',
          `Hardcoded ${dim.type} may cause clipping`,
          `Screen "${screen.name}" has a hardcoded ${dim.type} of ${dim.value}px, which is ${Math.round((dim.value / deviceDimension) * 100)}% of the device ${dim.type} (${deviceDimension}px) on "${device.name}".`,
          [
            `1. Open the screen on a device with ${device.width}×${device.height} resolution`,
            `2. Observe that content with ${dim.type}: ${dim.value} may be clipped`,
            '3. Content may extend beyond the visible area or cause horizontal scrolling'
          ],
          `Replace hardcoded ${dim.type} with flexible dimensions using percentage, flex, or Dimensions API to adapt to different screen sizes.`,
          device,
          'portrait',
          ['View']
        ));
      }
    }

    return issues;
  }

  /**
   * Checks for potential clipping issues
   */
  private checkClippingIssues(screen: ScreenInfo, content: string, device: DeviceConfig): LayoutIssue[] {
    const issues: LayoutIssue[] = [];

    // Check for absolute positioning without bounds checking
    const absolutePositionPattern = /position\s*:\s*['"]absolute['"]/g;
    const absoluteCount = (content.match(absolutePositionPattern) || []).length;

    if (absoluteCount > 0) {
      // Check if there's proper bounds handling
      const hasDimensionsAPI = /Dimensions\.get\(['"]window['"]\)/.test(content);
      const hasUseWindowDimensions = /useWindowDimensions/.test(content);

      if (!hasDimensionsAPI && !hasUseWindowDimensions) {
        issues.push(this.createIssue(
          screen,
          'clipping',
          'medium',
          'Absolute positioning without dimension awareness',
          `Screen "${screen.name}" uses absolute positioning (${absoluteCount} instance(s)) without checking device dimensions. Content may be clipped on device "${device.name}".`,
          [
            `1. Open the screen on a device with ${device.width}×${device.height} resolution`,
            '2. Observe absolutely positioned elements',
            '3. Elements may appear outside the visible area or overlap incorrectly'
          ],
          'Use Dimensions API or useWindowDimensions hook to calculate positions relative to screen size, or use flex layout instead of absolute positioning.',
          device,
          'portrait',
          ['View']
        ));
      }
    }

    return issues;
  }

  /**
   * Checks for spacing inconsistencies
   */
  private checkSpacingIssues(screen: ScreenInfo, content: string, device: DeviceConfig): LayoutIssue[] {
    const issues: LayoutIssue[] = [];

    // Extract all margin and padding values
    const spacingPattern = /(?:margin|padding)(?:Top|Bottom|Left|Right|Horizontal|Vertical)?\s*:\s*(\d+)/g;
    const spacingValues: number[] = [];
    let match;

    while ((match = spacingPattern.exec(content)) !== null) {
      spacingValues.push(parseInt(match[1], 10));
    }

    // Check for inconsistent spacing values
    const uniqueValues = [...new Set(spacingValues)];
    
    // If there are many different spacing values, it might indicate inconsistency
    if (uniqueValues.length > 10 && spacingValues.length > 15) {
      issues.push(this.createIssue(
        screen,
        'spacing-inconsistent',
        'low',
        'Inconsistent spacing values',
        `Screen "${screen.name}" uses ${uniqueValues.length} different spacing values across ${spacingValues.length} instances. This may indicate inconsistent design implementation.`,
        [
          `1. Open the screen on a device with ${device.width}×${device.height} resolution`,
          '2. Observe spacing between elements',
          '3. Notice that spacing may vary inconsistently throughout the screen'
        ],
        'Use design system spacing tokens (e.g., tokens.spacing.xs, sm, md, lg, xl) to maintain consistent spacing throughout the application.',
        device,
        'portrait',
        ['View']
      ));
    }

    return issues;
  }

  /**
   * Checks for orientation-specific issues
   */
  private checkOrientationSpecificIssues(
    screen: ScreenInfo, 
    content: string, 
    orientation: Orientation
  ): LayoutIssue[] {
    const issues: LayoutIssue[] = [];

    // For landscape orientation, check for potential issues
    if (orientation === 'landscape') {
      // Check if screen has tall content that might not fit in landscape
      const hasTallContent = this.hasTallContent(content);
      const hasScrollView = screen.hasScrollView || screen.hasKeyboardAwareScrollView;

      if (hasTallContent && !hasScrollView) {
        issues.push(this.createIssue(
          screen,
          'clipping',
          'medium',
          'Tall content without ScrollView in landscape',
          `Screen "${screen.name}" has tall content that may not fit in landscape orientation without scrolling.`,
          [
            '1. Open the screen on an Android device in portrait mode',
            '2. Rotate the device to landscape mode',
            '3. Observe that content is clipped at the bottom',
            '4. User cannot access all content in landscape mode'
          ],
          'Ensure ScrollView is used to allow access to all content in both orientations.',
          this.DEVICE_MATRIX[1],
          orientation,
          ['View', 'Container']
        ));
      }
    }

    return issues;
  }

  /**
   * Checks if content has orientation handling
   */
  private checkOrientationHandling(content: string): boolean {
    const orientationPatterns = [
      /useWindowDimensions/,
      /Dimensions\.get\(['"]window['"]\)/,
      /onLayout\s*=/,
      /useOrientation/,
    ];

    return orientationPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Checks if content has fixed dimensions
   */
  private hasFixedDimensions(content: string): boolean {
    const fixedDimensionPattern = /(?:width|height)\s*:\s*\d+/;
    return fixedDimensionPattern.test(content);
  }

  /**
   * Checks if content is long (many components)
   */
  private hasLongContent(content: string): boolean {
    // Count number of major components
    const componentCount = (content.match(/<(?:View|Text|Input|Button|Card)/g) || []).length;
    return componentCount > 15;
  }

  /**
   * Checks if content is tall (many vertical elements)
   */
  private hasTallContent(content: string): boolean {
    // Look for indicators of tall content
    const tallIndicators = [
      /flexDirection\s*:\s*['"]column['"]/g,
      /<View[\s>]/g,
      /<Text[\s>]/g,
    ];

    let score = 0;
    for (const pattern of tallIndicators) {
      const matches = content.match(pattern);
      if (matches) {
        score += matches.length;
      }
    }

    return score > 20;
  }

  /**
   * Checks for nested ScrollViews
   */
  private checkNestedScrollViews(content: string): number {
    // Simple heuristic: count ScrollView occurrences
    // If more than 1, likely nested (this is a simplified check)
    const scrollViewCount = (content.match(/<(?:ScrollView|KeyboardAwareScrollView)/g) || []).length;
    return scrollViewCount > 1 ? scrollViewCount - 1 : 0;
  }

  /**
   * Creates a layout issue object
   */
  private createIssue(
    screen: ScreenInfo,
    issueType: LayoutIssueType,
    severity: IssueSeverity,
    title: string,
    description: string,
    reproductionSteps: string[],
    recommendation: string,
    deviceConfig: DeviceConfig,
    orientation: Orientation,
    affectedComponents: string[]
  ): LayoutIssue {
    return {
      id: this.generateId(),
      screen: screen.name,
      category: 'layout',
      issueType,
      severity,
      title,
      description,
      reproductionSteps,
      recommendation,
      deviceConfig,
      orientation,
      affectedComponents,
      codeReference: {
        file: screen.path,
      },
    };
  }

  /**
   * Generates a unique ID for issues
   */
  private generateId(): string {
    return `layout-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Gets the device configuration matrix
   */
  getDeviceMatrix(): DeviceConfig[] {
    return this.DEVICE_MATRIX;
  }
}
