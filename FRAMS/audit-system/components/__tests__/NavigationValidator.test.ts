/**
 * Unit Tests for Navigation Validator
 * Tests navigation flow validation logic
 */

import { NavigationValidator } from '../NavigationValidator';
import * as path from 'path';

describe('NavigationValidator', () => {
  const appPath = path.join(process.cwd(), 'App.tsx');
  let validator: NavigationValidator;

  beforeEach(() => {
    validator = new NavigationValidator(appPath);
  });

  describe('validateNavigationFlows', () => {
    test('should return an array of navigation issues', async () => {
      const issues = await validator.validateNavigationFlows();
      
      expect(Array.isArray(issues)).toBe(true);
      
      // Each issue should have required fields
      issues.forEach(issue => {
        expect(issue).toHaveProperty('id');
        expect(issue).toHaveProperty('screen');
        expect(issue).toHaveProperty('category');
        expect(issue).toHaveProperty('issueType');
        expect(issue).toHaveProperty('severity');
        expect(issue).toHaveProperty('title');
        expect(issue).toHaveProperty('description');
        expect(issue).toHaveProperty('reproductionSteps');
        expect(issue).toHaveProperty('recommendation');
        expect(issue).toHaveProperty('flow');
        expect(issue).toHaveProperty('expectedBehavior');
        expect(issue).toHaveProperty('actualBehavior');
        expect(issue.category).toBe('navigation');
      });
    });

    test('should detect navigation issues if they exist', async () => {
      const issues = await validator.validateNavigationFlows();
      
      // The validator should be able to detect various types of issues
      const issueTypes = issues.map(issue => issue.issueType);
      const validIssueTypes = [
        'dead-end',
        'inconsistent-transition',
        'back-button-failure',
        'state-reset-failure'
      ];
      
      issueTypes.forEach(type => {
        expect(validIssueTypes).toContain(type);
      });
    });
  });

  describe('testLoginFlow', () => {
    test('should validate login flow for admin role', async () => {
      const result = await validator.testLoginFlow('admin');
      expect(typeof result).toBe('boolean');
    });

    test('should validate login flow for teacher role', async () => {
      const result = await validator.testLoginFlow('teacher');
      expect(typeof result).toBe('boolean');
    });

    test('should validate login flow for student role', async () => {
      const result = await validator.testLoginFlow('student');
      expect(typeof result).toBe('boolean');
    });

    test('should return true for properly configured login flows', async () => {
      // The FRAMS app has proper login flows configured
      const adminFlow = await validator.testLoginFlow('admin');
      const teacherFlow = await validator.testLoginFlow('teacher');
      const studentFlow = await validator.testLoginFlow('student');
      
      expect(adminFlow).toBe(true);
      expect(teacherFlow).toBe(true);
      expect(studentFlow).toBe(true);
    });
  });

  describe('testLogoutFlow', () => {
    test('should validate logout flow', async () => {
      const result = await validator.testLogoutFlow();
      expect(typeof result).toBe('boolean');
    });

    test('should return true for properly configured logout flow', async () => {
      // The FRAMS app has proper logout flow with auth state management
      const result = await validator.testLogoutFlow();
      expect(result).toBe(true);
    });
  });

  describe('testBackButtonBehavior', () => {
    test('should validate back button for Dashboard screen', async () => {
      const result = await validator.testBackButtonBehavior('Dashboard');
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true); // Dashboard is root, back button exits app
    });

    test('should validate back button for Profile screen', async () => {
      const result = await validator.testBackButtonBehavior('Profile');
      expect(typeof result).toBe('boolean');
    });

    test('should validate back button for Settings screen', async () => {
      const result = await validator.testBackButtonBehavior('Settings');
      expect(typeof result).toBe('boolean');
    });

    test('should return false for non-existent screens', async () => {
      const result = await validator.testBackButtonBehavior('NonExistentScreen');
      expect(result).toBe(false);
    });

    test('should return true for screens with incoming navigation flows', async () => {
      // Profile, Settings, Notifications should all have incoming flows from Dashboard
      const profileResult = await validator.testBackButtonBehavior('Profile');
      const settingsResult = await validator.testBackButtonBehavior('Settings');
      const notificationsResult = await validator.testBackButtonBehavior('Notifications');
      
      expect(profileResult).toBe(true);
      expect(settingsResult).toBe(true);
      expect(notificationsResult).toBe(true);
    });
  });

  describe('testDeepLinking', () => {
    test('should validate deep linking functionality', async () => {
      const result = await validator.testDeepLinking();
      expect(typeof result).toBe('boolean');
    });

    test('should return true for properly configured deep linking', async () => {
      // The FRAMS app has deep linking configured for password reset
      const result = await validator.testDeepLinking();
      expect(result).toBe(true);
    });
  });

  describe('issue generation', () => {
    test('should generate unique IDs for each issue', async () => {
      const issues = await validator.validateNavigationFlows();
      
      if (issues.length > 1) {
        const ids = issues.map(issue => issue.id);
        const uniqueIds = new Set(ids);
        expect(uniqueIds.size).toBe(ids.length);
      }
    });

    test('should include reproduction steps for all issues', async () => {
      const issues = await validator.validateNavigationFlows();
      
      issues.forEach(issue => {
        expect(Array.isArray(issue.reproductionSteps)).toBe(true);
        expect(issue.reproductionSteps.length).toBeGreaterThan(0);
        issue.reproductionSteps.forEach(step => {
          expect(typeof step).toBe('string');
          expect(step.length).toBeGreaterThan(0);
        });
      });
    });

    test('should include recommendations for all issues', async () => {
      const issues = await validator.validateNavigationFlows();
      
      issues.forEach(issue => {
        expect(typeof issue.recommendation).toBe('string');
        expect(issue.recommendation.length).toBeGreaterThan(0);
      });
    });

    test('should assign appropriate severity levels', async () => {
      const issues = await validator.validateNavigationFlows();
      
      const validSeverities = ['critical', 'high', 'medium', 'low'];
      
      issues.forEach(issue => {
        expect(validSeverities).toContain(issue.severity);
      });
    });
  });

  describe('navigation mapping', () => {
    test('should build navigation map from App.tsx', async () => {
      // Trigger navigation map building by calling validateNavigationFlows
      await validator.validateNavigationFlows();
      
      // The validator should have processed the App.tsx file
      // We can verify this by checking that the methods work correctly
      const loginFlow = await validator.testLoginFlow('admin');
      expect(typeof loginFlow).toBe('boolean');
    });

    test('should identify key screens in the application', async () => {
      await validator.validateNavigationFlows();
      
      // Test that key screens are recognized
      const dashboardBack = await validator.testBackButtonBehavior('Dashboard');
      const profileBack = await validator.testBackButtonBehavior('Profile');
      
      expect(dashboardBack).toBe(true);
      expect(profileBack).toBe(true);
    });
  });

  describe('error handling', () => {
    test('should handle invalid app path gracefully', async () => {
      const invalidValidator = new NavigationValidator('/invalid/path/App.tsx');
      
      // Should not throw, but return empty or handle gracefully
      await expect(invalidValidator.validateNavigationFlows()).resolves.toBeDefined();
    });

    test('should handle missing screens gracefully', async () => {
      const result = await validator.testBackButtonBehavior('NonExistentScreen123');
      expect(result).toBe(false);
    });
  });

  describe('flow validation', () => {
    test('should validate that SignIn can navigate to Dashboard', async () => {
      const adminFlow = await validator.testLoginFlow('admin');
      expect(adminFlow).toBe(true);
    });

    test('should validate that authenticated screens are accessible', async () => {
      await validator.validateNavigationFlows();
      
      // Common authenticated screens should be accessible
      const profileBack = await validator.testBackButtonBehavior('Profile');
      const settingsBack = await validator.testBackButtonBehavior('Settings');
      
      expect(profileBack).toBe(true);
      expect(settingsBack).toBe(true);
    });

    test('should validate that auth state management exists', async () => {
      const logoutFlow = await validator.testLogoutFlow();
      expect(logoutFlow).toBe(true);
    });
  });
});
