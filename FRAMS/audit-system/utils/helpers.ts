/**
 * Audit System Utility Functions
 * Helper functions for common audit operations
 */

import { IssueSeverity, Issue } from '../types';

/**
 * Generate a unique ID for an issue
 */
export function generateIssueId(): string {
  return `issue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Calculate severity score based on issue characteristics
 */
export function calculateSeverityScore(
  impact: number,
  frequency: number,
  userExperience: number
): number {
  // Weighted average: impact (50%), frequency (30%), user experience (20%)
  return impact * 0.5 + frequency * 0.3 + userExperience * 0.2;
}

/**
 * Map severity score to severity level
 */
export function mapScoreToSeverity(score: number): IssueSeverity {
  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/**
 * Sort issues by severity (critical first)
 */
export function sortIssuesBySeverity(issues: Issue[]): Issue[] {
  const severityOrder: Record<IssueSeverity, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...issues].sort((a, b) => {
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Group issues by screen
 */
export function groupIssuesByScreen(issues: Issue[]): Map<string, Issue[]> {
  const grouped = new Map<string, Issue[]>();

  for (const issue of issues) {
    const screenIssues = grouped.get(issue.screen) || [];
    screenIssues.push(issue);
    grouped.set(issue.screen, screenIssues);
  }

  return grouped;
}

/**
 * Group issues by category
 */
export function groupIssuesByCategory(issues: Issue[]): Map<string, Issue[]> {
  const grouped = new Map<string, Issue[]>();

  for (const issue of issues) {
    const categoryIssues = grouped.get(issue.category) || [];
    categoryIssues.push(issue);
    grouped.set(issue.category, categoryIssues);
  }

  return grouped;
}

/**
 * Format reproduction steps as numbered list
 */
export function formatReproductionSteps(steps: string[]): string {
  return steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
}

/**
 * Sanitize file path for cross-platform compatibility
 */
export function sanitizeFilePath(path: string): string {
  return path.replace(/\\/g, '/');
}

/**
 * Extract component name from file path
 */
export function extractComponentName(filePath: string): string {
  const fileName = filePath.split('/').pop() || '';
  return fileName.replace(/\.(tsx?|jsx?)$/, '');
}
