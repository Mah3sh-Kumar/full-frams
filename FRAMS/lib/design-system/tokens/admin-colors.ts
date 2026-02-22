/**
 * Admin-Specific Color Tokens
 * 
 * Extended color palette specifically designed for admin interfaces
 * with enhanced contrast, data visualization colors, and status indicators
 */

import { ColorToken, NeutralColors } from './colors';

export interface AdminColorPalette {
  // Enhanced status colors for admin contexts
  status: {
    active: ColorToken;
    inactive: ColorToken;
    pending: ColorToken;
    suspended: ColorToken;
    online: ColorToken;
    offline: ColorToken;
  };
  
  // Data visualization colors
  data: {
    chartPrimary: string[];
    chartSecondary: string[];
    heatmap: string[];
  };
  
  // Admin interface specific colors
  admin: {
    sidebar: string;
    header: string;
    panel: string;
    widget: ColorToken;
    highlight: string;
  };
  
  // Notification and alert colors
  alerts: {
    info: ColorToken;
    success: ColorToken;
    warning: ColorToken;
    error: ColorToken;
    system: ColorToken;
  };
}

// Enhanced status colors for admin use cases
export const status = {
  active: {
    main: '#10b981',
    light: '#34d399',
    dark: '#047857',
    gradient: ['#10b981', '#059669'] as const,
    contrast: '#ffffff',
  },
  inactive: {
    main: '#9ca3af',
    light: '#d1d5db',
    dark: '#6b7280',
    gradient: ['#9ca3af', '#6b7280'] as const,
    contrast: '#ffffff',
  },
  pending: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    gradient: ['#f59e0b', '#d97706'] as const,
    contrast: '#000000',
  },
  suspended: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    gradient: ['#ef4444', '#dc2626'] as const,
    contrast: '#ffffff',
  },
  online: {
    main: '#10b981',
    light: '#34d399',
    dark: '#047857',
    gradient: ['#10b981', '#059669'] as const,
    contrast: '#ffffff',
  },
  offline: {
    main: '#6b7280',
    light: '#9ca3af',
    dark: '#4b5563',
    gradient: ['#6b7280', '#4b5563'] as const,
    contrast: '#ffffff',
  },
};

// Data visualization color palettes
export const data = {
  chartPrimary: [
    '#4338ca', // primary
    '#0e7490', // accent
    '#15803d', // success
    '#a16207', // warning
    '#b91c1c', // error
    '#1d4ed8', // info
    '#7c3aed', // purple
    '#0d9488', // teal
  ],
  chartSecondary: [
    '#c7d2fe', // light primary
    '#bae6fd', // light accent
    '#bbf7d0', // light success
    '#fef3c7', // light warning
    '#fecaca', // light error
    '#dbeafe', // light info
    '#ddd6fe', // light purple
    '#ccfbf1', // light teal
  ],
  heatmap: [
    '#dcfce7', // lowest
    '#bbf7d0',
    '#86efac',
    '#4ade80',
    '#22c55e',
    '#16a34a',
    '#15803d',
    '#166534', // highest
  ],
};

// Admin interface specific colors
export const admin = {
  sidebar: '#1e293b',
  header: '#ffffff',
  panel: '#f8fafc',
  widget: {
    main: '#ffffff',
    light: '#f1f5f9',
    dark: '#e2e8f0',
    gradient: ['#ffffff', '#f8fafc'] as const,
    contrast: '#0f172a',
  },
  highlight: '#ffedd5',
};

// Enhanced alert colors for admin notifications
export const alerts = {
  info: {
    main: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
    gradient: ['#3b82f6', '#2563eb'] as const,
    contrast: '#ffffff',
  },
  success: {
    main: '#10b981',
    light: '#34d399',
    dark: '#059669',
    gradient: ['#10b981', '#059669'] as const,
    contrast: '#ffffff',
  },
  warning: {
    main: '#f59e0b',
    light: '#fbbf24',
    dark: '#d97706',
    gradient: ['#f59e0b', '#d97706'] as const,
    contrast: '#000000',
  },
  error: {
    main: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    gradient: ['#ef4444', '#dc2626'] as const,
    contrast: '#ffffff',
  },
  system: {
    main: '#8b5cf6',
    light: '#a78bfa',
    dark: '#7c3aed',
    gradient: ['#8b5cf6', '#7c3aed'] as const,
    contrast: '#ffffff',
  },
};

// Complete admin color palette
export const adminColors: AdminColorPalette = {
  status,
  data,
  admin,
  alerts,
};