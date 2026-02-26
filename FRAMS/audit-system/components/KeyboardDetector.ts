/**
 * Keyboard Interaction Detector Component
 * Identifies keyboard-related UI issues in React Native screens
 */

import * as fs from 'fs';
import { KeyboardIssue, KeyboardDetector as IKeyboardDetector, ScreenInfo, IssueSeverity, KeyboardIssueType } from '../types';

export class KeyboardDetector implements IKeyboardDetector {
  /**
   * Detects all keyboard-related issues for a given screen
   */
  async detectKeyboardIssues(screen: ScreenInfo): Promise<KeyboardIssue[]> {
    const issues: KeyboardIssue[] = [];

    // Only check screens with input fields
    if (!screen.hasInputFields) {
      return issues;
    }

    // Read the screen file content
    const content = fs.readFileSync(screen.path, 'utf-8');

    // Check for KeyboardAwareScrollView usage
    if (!screen.hasKeyboardAwareScrollView) {
      issues.push(this.createIssue(
        screen,
        'no-resize',
        'critical',
        'Missing KeyboardAwareScrollView',
        `Screen "${screen.name}" has input fields but does not use KeyboardAwareScrollView. This may cause the keyboard to obscure input fields.`,
        [
          '1. Open the screen on an Android device',
          '2. Tap on an input field near the bottom of the screen',
          '3. Observe that the keyboard covers the input field',
          '4. User cannot see what they are typing'
        ],
        'Wrap the screen content in KeyboardAwareScrollView component and configure extraScrollHeight property.',
        content,
        false
      ));
    }

    // Check for extraScrollHeight configuration
    if (screen.hasKeyboardAwareScrollView) {
      const hasExtraScrollHeight = this.checkExtraScrollHeight(content);
      if (!hasExtraScrollHeight) {
        issues.push(this.createIssue(
          screen,
          'no-resize',
          'medium',
          'Missing extraScrollHeight configuration',
          `Screen "${screen.name}" uses KeyboardAwareScrollView but does not configure extraScrollHeight. This may result in insufficient scrolling when keyboard appears.`,
          [
            '1. Open the screen on an Android device',
            '2. Tap on an input field',
            '3. Observe that the field may be partially obscured by the keyboard',
            '4. The automatic scroll may not provide enough space'
          ],
          'Add extraScrollHeight prop to KeyboardAwareScrollView (recommended value: 20-40).',
          content,
          true
        ));
      }
    }

    // Check for returnKeyType configuration on input fields
    const missingReturnKeyType = this.checkReturnKeyType(content);
    if (missingReturnKeyType.length > 0) {
      issues.push(this.createIssue(
        screen,
        'focus-transition',
        'medium',
        'Missing returnKeyType on input fields',
        `Screen "${screen.name}" has ${missingReturnKeyType.length} input field(s) without returnKeyType configuration. This affects keyboard navigation between fields.`,
        [
          '1. Open the screen on an Android device',
          '2. Fill in the first input field',
          '3. Press the keyboard action button',
          '4. Observe that the keyboard behavior is not optimized for form navigation'
        ],
        'Add returnKeyType prop to Input/TextInput components (use "next" for intermediate fields, "done" for the last field).',
        content,
        screen.hasKeyboardAwareScrollView
      ));
    }

    // Check for potential keyboard dismissal issues
    const hasDismissKeyboard = this.checkKeyboardDismissal(content);
    if (!hasDismissKeyboard && screen.hasInputFields) {
      issues.push(this.createIssue(
        screen,
        'dismiss-failure',
        'low',
        'No explicit keyboard dismissal mechanism',
        `Screen "${screen.name}" may not have explicit keyboard dismissal handling. Users may need to rely on back button or tapping outside.`,
        [
          '1. Open the screen on an Android device',
          '2. Tap on an input field to show keyboard',
          '3. Try to dismiss the keyboard by tapping outside the input',
          '4. Verify if keyboard dismisses as expected'
        ],
        'Consider adding keyboardShouldPersistTaps="handled" to ScrollView or implementing Keyboard.dismiss() on appropriate actions.',
        content,
        screen.hasKeyboardAwareScrollView
      ));
    }

    return issues;
  }

  /**
   * Tests if input fields remain visible when keyboard appears
   */
  async testInputFieldVisibility(screen: ScreenInfo): Promise<boolean> {
    // This is a static analysis check
    // In a real implementation, this would require runtime testing
    return screen.hasKeyboardAwareScrollView;
  }

  /**
   * Tests if focus transitions work correctly between input fields
   */
  async testFocusTransitions(screen: ScreenInfo): Promise<boolean> {
    // This is a static analysis check
    const content = fs.readFileSync(screen.path, 'utf-8');
    const missingReturnKeyType = this.checkReturnKeyType(content);
    return missingReturnKeyType.length === 0;
  }

  /**
   * Tests if keyboard can be dismissed properly
   */
  async testKeyboardDismissal(screen: ScreenInfo): Promise<boolean> {
    // This is a static analysis check
    const content = fs.readFileSync(screen.path, 'utf-8');
    return this.checkKeyboardDismissal(content);
  }

  /**
   * Checks if extraScrollHeight is configured
   */
  private checkExtraScrollHeight(content: string): boolean {
    const extraScrollHeightPattern = /extraScrollHeight\s*=\s*\{?\s*\d+\s*\}?/;
    return extraScrollHeightPattern.test(content);
  }

  /**
   * Checks for returnKeyType configuration on input fields
   * Returns array of input fields missing returnKeyType
   */
  private checkReturnKeyType(content: string): string[] {
    const missing: string[] = [];
    
    // Find all Input/TextInput components
    const inputPattern = /<(Input|TextInput)\s+([^>]*?)(?:\/?>|>[\s\S]*?<\/\1>)/g;
    let match;
    
    while ((match = inputPattern.exec(content)) !== null) {
      const componentType = match[1];
      const props = match[2];
      
      // Check if returnKeyType is present in props
      if (!props.includes('returnKeyType')) {
        missing.push(componentType);
      }
    }
    
    return missing;
  }

  /**
   * Checks if keyboard dismissal mechanisms are present
   */
  private checkKeyboardDismissal(content: string): boolean {
    const dismissalPatterns = [
      /keyboardShouldPersistTaps\s*=\s*["']handled["']/,
      /Keyboard\.dismiss\(\)/,
      /dismissKeyboard/,
    ];
    
    return dismissalPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Calculates severity based on issue type and context
   */
  private calculateSeverity(
    issueType: KeyboardIssueType,
    hasKeyboardAwareScrollView: boolean
  ): IssueSeverity {
    switch (issueType) {
      case 'obscured':
      case 'no-resize':
        return hasKeyboardAwareScrollView ? 'medium' : 'critical';
      case 'focus-transition':
        return 'medium';
      case 'returnkey-missing':
        return 'medium';
      case 'dismiss-failure':
        return 'low';
      default:
        return 'medium';
    }
  }

  /**
   * Creates a keyboard issue object
   */
  private createIssue(
    screen: ScreenInfo,
    issueType: KeyboardIssueType,
    severity: IssueSeverity,
    title: string,
    description: string,
    reproductionSteps: string[],
    recommendation: string,
    content: string,
    hasKeyboardAwareScrollView: boolean
  ): KeyboardIssue {
    // Extract component name from the issue
    const componentMatch = content.match(/<(Input|TextInput|KeyboardAwareScrollView)/);
    const component = componentMatch ? componentMatch[1] : 'Unknown';

    // Try to find line number for code reference
    const lineNumber = this.findLineNumber(content, component);

    return {
      id: this.generateId(),
      screen: screen.name,
      category: 'keyboard',
      issueType,
      severity,
      title,
      description,
      reproductionSteps,
      recommendation,
      component,
      hasKeyboardAwareScrollView,
      codeReference: {
        file: screen.path,
        lineNumber,
        component,
      },
    };
  }

  /**
   * Finds the line number of a component in the content
   */
  private findLineNumber(content: string, componentName: string): number | undefined {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(`<${componentName}`)) {
        return i + 1; // Line numbers are 1-indexed
      }
    }
    return undefined;
  }

  /**
   * Generates a unique ID for issues
   */
  private generateId(): string {
    return `keyboard-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
