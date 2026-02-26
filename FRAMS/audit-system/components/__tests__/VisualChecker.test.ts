/**
 * Unit Tests for Visual Consistency Checker
 * Tests theme token extraction, hardcoded value detection, and button consistency validation
 */

import { VisualChecker } from '../VisualChecker';
import { ScreenInfo } from '../../types';
import * as fs from 'fs/promises';

// Mock the fs module
jest.mock('fs/promises');

describe('VisualChecker Unit Tests', () => {
  let visualChecker: VisualChecker;
  
  beforeEach(() => {
    visualChecker = new VisualChecker();
    jest.clearAllMocks();
  });
  
  describe('Theme Token Usage Validation', () => {
    test('validateThemeUsage returns true for theme-based components', () => {
      const themeBasedComponents = [
        'style={{ colors.primary, spacing.md }}',
        'style={{ theme.colors.secondary, borders.radius.medium }}',
        'style={{ tokens.colors.success, tokens.spacing.lg }}',
        'style={{ colors.text.primary }}'
      ];
      
      themeBasedComponents.forEach(component => {
        const isValid = visualChecker.validateThemeUsage(component);
        expect(isValid).toBe(true);
      });
    });
    
    test('validateThemeUsage returns false for hardcoded values', () => {
      const hardcodedComponents = [
        'style={{ color: "#FF0000", margin: 10 }}',
        'style={{ backgroundColor: "red", padding: "20px" }}',
        'style={{ borderColor: "#00FF00", height: 30 }}',
        'style={{ fontSize: 14, borderRadius: 5 }}'
      ];
      
      hardcodedComponents.forEach(component => {
        const isValid = visualChecker.validateThemeUsage(component);
        expect(isValid).toBe(false);
      });
    });
    
    test('validateThemeUsage returns false for mixed token and hardcoded values', () => {
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
  });
  
  describe('Button Consistency Validation', () => {
    test('checkButtonConsistency returns true for consistent buttons', () => {
      const consistentButtons = [
        'height: 52, colors.primary',
        'height: 48, theme.colors.secondary',
        'height: 52, tokens.colors.primary',
        'height: 48, colors.secondary'
      ];
      
      const isValid = visualChecker.checkButtonConsistency(consistentButtons);
      expect(isValid).toBe(true);
    });
    
    test('checkButtonConsistency returns false for inconsistent button heights', () => {
      const inconsistentHeightButtons = [
        'height: 60, colors.primary',
        'height: 40, theme.colors.secondary',
        'height: 52, colors.primary', // One valid, one invalid
        'height: 45, colors.secondary'
      ];
      
      const isValid = visualChecker.checkButtonConsistency(inconsistentHeightButtons);
      expect(isValid).toBe(false);
    });
    
    test('checkButtonConsistency returns false for buttons missing theme colors', () => {
      const noThemeColorButtons = [
        'height: 52, backgroundColor: "blue"',
        'height: 48, color: "#FF0000"',
        'height: 52', // Missing color entirely
        'height: 48, style: { backgroundColor: "red" }'
      ];
      
      const isValid = visualChecker.checkButtonConsistency(noThemeColorButtons);
      expect(isValid).toBe(false);
    });
    
    test('checkButtonConsistency returns true for empty button array', () => {
      const isValid = visualChecker.checkButtonConsistency([]);
      expect(isValid).toBe(true);
    });
    
    test('checkButtonConsistency returns false for single inconsistent button', () => {
      const singleInconsistentButton = ['height: 60, backgroundColor: "blue"'];
      const isValid = visualChecker.checkButtonConsistency(singleInconsistentButton);
      expect(isValid).toBe(false);
    });
  });
  
  describe('Spacing Consistency Validation', () => {
    test('checkSpacingConsistency returns true for screens with theme spacing', () => {
      const mockScreen: ScreenInfo = {
        name: 'TestScreen',
        path: '/test/path',
        category: 'auth',
        hasInputFields: false,
        hasScrollView: false,
        hasKeyboardAwareScrollView: false,
        components: ['TestComponent']
      };
      
      // Mock file with theme spacing
      const themeSpacingContent = `
        <View style={{ margin: spacing.md, padding: spacing.lg }}>
          <Text style={{ marginVertical: spacing.sm }}>Test</Text>
        </View>
      `;
      
      // Mock synchronous read for checkSpacingConsistency
      const mockReadFileSync = jest.fn().mockReturnValue(themeSpacingContent);
      // We need to mock the synchronous read that checkSpacingConsistency uses
      // Since checkSpacingConsistency uses fs.readFileSync, we'll patch it
      const originalReadFileSync = require('fs').readFileSync;
      require('fs').readFileSync = mockReadFileSync;
      
      try {
        const isValid = visualChecker.checkSpacingConsistency(mockScreen);
        expect(isValid).toBe(true);
      } finally {
        require('fs').readFileSync = originalReadFileSync;
      }
    });
    
    test('checkSpacingConsistency returns false for screens with hardcoded spacing', () => {
      const mockScreen: ScreenInfo = {
        name: 'TestScreen',
        path: '/test/path',
        category: 'auth',
        hasInputFields: false,
        hasScrollView: false,
        hasKeyboardAwareScrollView: false,
        components: ['TestComponent']
      };
      
      // Mock file with hardcoded spacing
      const hardcodedSpacingContent = `
        <View style={{ margin: 10, padding: "20px" }}>
          <Text style={{ marginVertical: 5 }}>Test</Text>
        </View>
      `;
      
      // Mock synchronous read for checkSpacingConsistency
      const mockReadFileSync = jest.fn().mockReturnValue(hardcodedSpacingContent);
      const originalReadFileSync = require('fs').readFileSync;
      require('fs').readFileSync = mockReadFileSync;
      
      try {
        const isValid = visualChecker.checkSpacingConsistency(mockScreen);
        expect(isValid).toBe(false);
      } finally {
        require('fs').readFileSync = originalReadFileSync;
      }
    });
    
    test('checkSpacingConsistency returns true for screens with no spacing values', () => {
      const mockScreen: ScreenInfo = {
        name: 'TestScreen',
        path: '/test/path',
        category: 'auth',
        hasInputFields: false,
        hasScrollView: false,
        hasKeyboardAwareScrollView: false,
        components: ['TestComponent']
      };
      
      // Mock file with no spacing
      const noSpacingContent = `
        <View>
          <Text>Test</Text>
        </View>
      `;
      
      // Mock synchronous read for checkSpacingConsistency
      const mockReadFileSync = jest.fn().mockReturnValue(noSpacingContent);
      const originalReadFileSync = require('fs').readFileSync;
      require('fs').readFileSync = mockReadFileSync;
      
      try {
        const isValid = visualChecker.checkSpacingConsistency(mockScreen);
        expect(isValid).toBe(true);
      } finally {
        require('fs').readFileSync = originalReadFileSync;
      }
    });
  });
  
  describe('Complete Consistency Check', () => {
    test('checkConsistency returns empty array for fully compliant screen', async () => {
      const mockScreen: ScreenInfo = {
        name: 'CompliantScreen',
        path: '/test/compliant',
        category: 'auth',
        hasInputFields: true,
        hasScrollView: true,
        hasKeyboardAwareScrollView: true,
        components: ['Button', 'Input', 'Text']
      };
      
      // Mock compliant screen content
      const compliantContent = `
        <View style={{ padding: spacing.md }}>
          <Text style={{ color: colors.text.primary }}>
            Welcome
          </Text>
          <Input placeholder="Email" />
          <Button 
            title="Submit" 
            style={{ 
              height: 52, 
              backgroundColor: colors.primary,
              marginTop: spacing.lg
            }}
          />
          <LoadingSpinner size="large" />
          <Text style={{ color: colors.error }}>
            Error message
          </Text>
        </View>
      `;
      
      (fs.readFile as jest.Mock).mockResolvedValue(compliantContent);
      
      const issues = await visualChecker.checkConsistency(mockScreen);
      expect(issues).toEqual([]);
    });
    
    test('checkConsistency detects hardcoded color violations', async () => {
      const mockScreen: ScreenInfo = {
        name: 'NonCompliantScreen',
        path: '/test/non-compliant',
        category: 'auth',
        hasInputFields: true,
        hasScrollView: true,
        hasKeyboardAwareScrollView: true,
        components: ['Button', 'Input', 'Text']
      };
      
      // Mock non-compliant screen with hardcoded colors
      const nonCompliantContent = `
        <View style={{ backgroundColor: "#F5F5F5" }}>
          <Text style={{ color: "black" }}>
            Welcome
          </Text>
          <Button 
            title="Submit" 
            style={{ 
              height: 52, 
              backgroundColor: "blue"
            }}
          />
        </View>
      `;
      
      (fs.readFile as jest.Mock).mockResolvedValue(nonCompliantContent);
      
      const issues = await visualChecker.checkConsistency(mockScreen);
      expect(issues.length).toBeGreaterThan(0);
      
      // Should have theme-violation issues
      const colorIssues = issues.filter(issue => issue.issueType === 'theme-violation');
      expect(colorIssues.length).toBeGreaterThan(0);
      
      // Verify issue details
      colorIssues.forEach(issue => {
        expect(issue.screen).toBe('NonCompliantScreen');
        expect(issue.category).toBe('visual');
        expect(issue.severity).toBe('medium');
        expect(issue.recommendation).toContain('theme token');
      });
    });
    
    test('checkConsistency detects inconsistent button sizing', async () => {
      const mockScreen: ScreenInfo = {
        name: 'ButtonScreen',
        path: '/test/button',
        category: 'auth',
        hasInputFields: true,
        hasScrollView: true,
        hasKeyboardAwareScrollView: true,
        components: ['Button']
      };
      
      // Mock screen with inconsistent button height
      const buttonContent = `
        <View>
          <Button 
            title="Primary" 
            style={{ 
              height: 60, 
              backgroundColor: colors.primary
            }}
          />
          <Button 
            title="Secondary" 
            style={{ 
              height: 48, 
              backgroundColor: colors.secondary
            }}
          />
        </View>
      `;
      
      (fs.readFile as jest.Mock).mockResolvedValue(buttonContent);
      
      const issues = await visualChecker.checkConsistency(mockScreen);
      expect(issues.length).toBeGreaterThan(0);
      
      // Should have inconsistent-sizing issue for the 60px button
      const sizingIssues = issues.filter(issue => 
        issue.issueType === 'inconsistent-sizing' && 
        issue.description.includes('60')
      );
      expect(sizingIssues.length).toBeGreaterThan(0);
    });
    
    test('checkConsistency detects non-standard loading implementation', async () => {
      const mockScreen: ScreenInfo = {
        name: 'LoadingScreen',
        path: '/test/loading',
        category: 'auth',
        hasInputFields: false,
        hasScrollView: false,
        hasKeyboardAwareScrollView: false,
        components: ['View', 'Text']
      };
      
      // Mock screen with custom loading
      const loadingContent = `
        <View>
          {isLoading && (
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text>Loading...</Text>
            </View>
          )}
        </View>
      `;
      
      (fs.readFile as jest.Mock).mockResolvedValue(loadingContent);
      
      const issues = await visualChecker.checkConsistency(mockScreen);
      
      // Should have loading consistency issue
      const loadingIssues = issues.filter(issue => 
        issue.title.includes('loading') || 
        issue.description.includes('loading')
      );
      expect(loadingIssues.length).toBeGreaterThan(0);
      
      loadingIssues.forEach(issue => {
        expect(issue.recommendation).toContain('LoadingSpinner');
        expect(issue.issueType).toBe('inconsistent-sizing');
      });
    });
    
    test('checkConsistency detects hardcoded validation colors', async () => {
      const mockScreen: ScreenInfo = {
        name: 'ValidationScreen',
        path: '/test/validation',
        category: 'auth',
        hasInputFields: true,
        hasScrollView: false,
        hasKeyboardAwareScrollView: false,
        components: ['Text', 'Input']
      };
      
      // Mock screen with hardcoded validation colors
      const validationContent = `
        <View>
          <Input error={hasError} />
          {hasError && (
            <Text style={{ color: "red" }}>
              This field is required
            </Text>
          )}
          {isSuccess && (
            <Text style={{ color: "green" }}>
              Success!
            </Text>
          )}
        </View>
      `;
      
      (fs.readFile as jest.Mock).mockResolvedValue(validationContent);
      
      const issues = await visualChecker.checkConsistency(mockScreen);
      
      // Should have validation issues
      const validationIssues = issues.filter(issue => 
        issue.title.includes('validation') || 
        issue.description.includes('validation')
      );
      expect(validationIssues.length).toBeGreaterThan(0);
      
      validationIssues.forEach(issue => {
        expect(issue.issueType).toBe('theme-violation');
        expect(issue.recommendation).toContain('theme colors');
      });
    });
    
    test('checkConsistency detects non-standard spacing values', async () => {
      const mockScreen: ScreenInfo = {
        name: 'SpacingScreen',
        path: '/test/spacing',
        category: 'auth',
        hasInputFields: false,
        hasScrollView: false,
        hasKeyboardAwareScrollView: false,
        components: ['View', 'Text']
      };
      
      // Mock screen with non-standard spacing
      const spacingContent = `
        <View style={{ margin: 10, padding: 25 }}>
          <Text style={{ marginTop: 7, marginBottom: 13 }}>
            Test content
          </Text>
        </View>
      `;
      
      (fs.readFile as jest.Mock).mockResolvedValue(spacingContent);
      
      const issues = await visualChecker.checkConsistency(mockScreen);
      
      // Should have spacing issues
      const spacingIssues = issues.filter(issue => 
        issue.issueType === 'inconsistent-spacing'
      );
      expect(spacingIssues.length).toBeGreaterThan(0);
      
      spacingIssues.forEach(issue => {
        expect(issue.severity).toBe('low');
        expect(issue.recommendation).toContain('spacing token');
      });
    });
    
    test('checkConsistency handles file read errors gracefully', async () => {
      const mockScreen: ScreenInfo = {
        name: 'ErrorScreen',
        path: '/test/error',
        category: 'auth',
        hasInputFields: false,
        hasScrollView: false,
        hasKeyboardAwareScrollView: false,
        components: ['TestComponent']
      };
      
      // Mock file read error
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));
      
      const issues = await visualChecker.checkConsistency(mockScreen);
      expect(issues).toEqual([]);
    });
  });
  
  describe('Edge Cases', () => {
    test('checkConsistency handles empty screen content', async () => {
      const mockScreen: ScreenInfo = {
        name: 'EmptyScreen',
        path: '/test/empty',
        category: 'auth',
        hasInputFields: false,
        hasScrollView: false,
        hasKeyboardAwareScrollView: false,
        components: []
      };
      
      // Mock empty content
      (fs.readFile as jest.Mock).mockResolvedValue('');
      
      const issues = await visualChecker.checkConsistency(mockScreen);
      expect(issues).toEqual([]);
    });
    
    test('checkConsistency handles screen with only comments', async () => {
      const mockScreen: ScreenInfo = {
        name: 'CommentScreen',
        path: '/test/comment',
        category: 'auth',
        hasInputFields: false,
        hasScrollView: false,
        hasKeyboardAwareScrollView: false,
        components: []
      };
      
      // Mock content with only comments
      const commentContent = `
        // This is a comment
        /* Multi-line comment */
        /**
         * JSDoc comment
         */
      `;
      
      (fs.readFile as jest.Mock).mockResolvedValue(commentContent);
      
      const issues = await visualChecker.checkConsistency(mockScreen);
      expect(issues).toEqual([]);
    });
    
    test('validateThemeUsage handles undefined or null input', () => {
      // @ts-ignore - Testing invalid input
      const isValidNull = visualChecker.validateThemeUsage(null);
      expect(isValidNull).toBe(true); // Should handle gracefully
      
      // @ts-ignore - Testing invalid input
      const isValidUndefined = visualChecker.validateThemeUsage(undefined);
      expect(isValidUndefined).toBe(true); // Should handle gracefully
      
      const isValidEmpty = visualChecker.validateThemeUsage('');
      expect(isValidEmpty).toBe(true);
    });
    
    test('checkButtonConsistency handles undefined or null input', () => {
      // @ts-ignore - Testing invalid input
      const isValidNull = visualChecker.checkButtonConsistency(null);
      expect(isValidNull).toBe(true); // Should handle gracefully
      
      // @ts-ignore - Testing invalid input
      const isValidUndefined = visualChecker.checkButtonConsistency(undefined);
      expect(isValidUndefined).toBe(true); // Should handle gracefully
    });
  });
});