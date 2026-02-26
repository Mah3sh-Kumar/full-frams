/**
 * Unit tests for audit system helper functions
 */

import {
  generateIssueId,
  calculateSeverityScore,
  mapScoreToSeverity,
  sortIssuesBySeverity,
  extractComponentName,
  sanitizeFilePath,
} from '../../utils/helpers';
import { Issue } from '../../types';

describe('Audit System Helpers', () => {
  describe('generateIssueId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateIssueId();
      const id2 = generateIssueId();
      
      expect(id1).toMatch(/^issue-\d+-[a-z0-9]+$/);
      expect(id2).toMatch(/^issue-\d+-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('calculateSeverityScore', () => {
    it('should calculate weighted average correctly', () => {
      const score = calculateSeverityScore(100, 80, 60);
      // 100 * 0.5 + 80 * 0.3 + 60 * 0.2 = 50 + 24 + 12 = 86
      expect(score).toBe(86);
    });

    it('should handle zero values', () => {
      const score = calculateSeverityScore(0, 0, 0);
      expect(score).toBe(0);
    });
  });

  describe('mapScoreToSeverity', () => {
    it('should map scores to correct severity levels', () => {
      expect(mapScoreToSeverity(95)).toBe('critical');
      expect(mapScoreToSeverity(90)).toBe('critical');
      expect(mapScoreToSeverity(85)).toBe('high');
      expect(mapScoreToSeverity(70)).toBe('high');
      expect(mapScoreToSeverity(55)).toBe('medium');
      expect(mapScoreToSeverity(40)).toBe('medium');
      expect(mapScoreToSeverity(25)).toBe('low');
      expect(mapScoreToSeverity(0)).toBe('low');
    });
  });

  describe('sortIssuesBySeverity', () => {
    it('should sort issues by severity (critical first)', () => {
      const issues: Issue[] = [
        { severity: 'low', screen: 'A' } as Issue,
        { severity: 'critical', screen: 'B' } as Issue,
        { severity: 'medium', screen: 'C' } as Issue,
        { severity: 'high', screen: 'D' } as Issue,
      ];

      const sorted = sortIssuesBySeverity(issues);

      expect(sorted[0].severity).toBe('critical');
      expect(sorted[1].severity).toBe('high');
      expect(sorted[2].severity).toBe('medium');
      expect(sorted[3].severity).toBe('low');
    });

    it('should not mutate original array', () => {
      const issues: Issue[] = [
        { severity: 'low', screen: 'A' } as Issue,
        { severity: 'critical', screen: 'B' } as Issue,
      ];

      const sorted = sortIssuesBySeverity(issues);

      expect(issues[0].severity).toBe('low');
      expect(sorted[0].severity).toBe('critical');
    });
  });

  describe('extractComponentName', () => {
    it('should extract component name from file path', () => {
      expect(extractComponentName('screens/SignInScreen.tsx')).toBe('SignInScreen');
      expect(extractComponentName('components/Button.ts')).toBe('Button');
      expect(extractComponentName('lib/helpers.js')).toBe('helpers');
    });

    it('should handle paths with multiple directories', () => {
      expect(extractComponentName('src/screens/admin/UserManagement.tsx')).toBe('UserManagement');
    });
  });

  describe('sanitizeFilePath', () => {
    it('should convert backslashes to forward slashes', () => {
      expect(sanitizeFilePath('screens\\SignInScreen.tsx')).toBe('screens/SignInScreen.tsx');
      expect(sanitizeFilePath('src\\components\\Button.tsx')).toBe('src/components/Button.tsx');
    });

    it('should leave forward slashes unchanged', () => {
      expect(sanitizeFilePath('screens/SignInScreen.tsx')).toBe('screens/SignInScreen.tsx');
    });
  });
});
