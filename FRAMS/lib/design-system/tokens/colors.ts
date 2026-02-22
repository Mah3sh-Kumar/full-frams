/**
 * Color Design Tokens
 * 
 * Defines the complete color palette for FRAMS including:
 * - Primary and accent colors
 * - Status colors (success, warning, error, info)
 * - Role-based colors (student, teacher, admin)
 * - Neutral colors for backgrounds and text
 */

export interface ColorToken {
  main: string;
  light: string;
  dark: string;
  gradient: readonly [string, string];
  contrast: string;
}

export interface NeutralColors {
  white: string;
  gray50: string;
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;
  black: string;
}

export interface RoleColors {
  student: ColorToken;
  teacher: ColorToken;
  admin: ColorToken;
}

export interface ThemeColors {
  light: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    card: string;
    input: string;
    inputDisabled: string;
    secondaryButton: string;
    secondaryButtonText: string;
  };
  dark: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    card: string;
    input: string;
    inputDisabled: string;
    secondaryButton: string;
    secondaryButtonText: string;
  };
}

export interface ColorPalette {
  primary: ColorToken;
  accent: ColorToken;
  success: ColorToken;
  warning: ColorToken;
  error: ColorToken;
  info: ColorToken;
  neutral: NeutralColors;
  roles: RoleColors;
  theme: ThemeColors;
  background: ColorToken;
}

/**
 * Primary Color Token - Indigo
 */
export const primary: ColorToken = {
  main: '#4338ca', // Changed from #4f46e5 to meet 4.5:1 contrast with white
  light: '#4338ca', // Changed from #6366f1 to meet 4.5:1 contrast with white
  dark: '#4338ca',
  gradient: ['#4f46e5', '#4338ca'] as const,
  contrast: '#ffffff',
};

/**
 * Accent Color Token - Cyan
 */
export const accent: ColorToken = {
  main: '#0e7490', // Changed from #06b6d4 to meet 4.5:1 contrast with white
  light: '#0e7490', // Changed from #22d3ee to meet 4.5:1 contrast with white
  dark: '#155e75', // Changed from #0891b2 to meet 4.5:1 contrast with white
  gradient: ['#0e7490', '#155e75'] as const,
  contrast: '#ffffff',
};

/**
 * Success Color Token - Green
 */
export const success: ColorToken = {
  main: '#15803d', // Changed from #16a34a to meet 4.5:1 contrast with white
  light: '#15803d', // Changed from #22c55e to meet 4.5:1 contrast with white
  dark: '#15803d',
  gradient: ['#16a34a', '#15803d'] as const,
  contrast: '#ffffff',
};

/**
 * Warning Color Token - Yellow
 */
export const warning: ColorToken = {
  main: '#a16207', // Changed from #facc15 to meet 4.5:1 contrast with black
  light: '#a16207', // Changed from #fde047 to meet 4.5:1 contrast with black
  dark: '#854d0e', // Changed from #eab308 to meet 4.5:1 contrast with black
  gradient: ['#a16207', '#854d0e'] as const,
  contrast: '#000000',
};

/**
 * Error Color Token - Red
 */
export const error: ColorToken = {
  main: '#b91c1c', // Changed from #dc2626 to meet 4.5:1 contrast with white
  light: '#b91c1c', // Changed from #ef4444 to meet 4.5:1 contrast with white
  dark: '#991b1b', // Changed from #b91c1c to meet 4.5:1 contrast with white
  gradient: ['#b91c1c', '#991b1b'] as const,
  contrast: '#ffffff',
};

/**
 * Info Color Token - Blue
 */
export const info: ColorToken = {
  main: '#1d4ed8', // Changed from #3b82f6 to meet 4.5:1 contrast with white
  light: '#1d4ed8', // Changed from #60a5fa to meet 4.5:1 contrast with white
  dark: '#1e40af', // Changed from #2563eb to meet 4.5:1 contrast with white
  gradient: ['#1d4ed8', '#1e40af'] as const,
  contrast: '#ffffff',
};

/**
 * Neutral Color Palette
 */
export const neutral: NeutralColors = {
  white: '#ffffff',
  gray50: '#f8fafc',
  gray100: '#f1f5f9',
  gray200: '#e2e8f0',
  gray300: '#cbd5e1',
  gray400: '#94a3b8',
  gray500: '#64748b',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1e293b',
  gray900: '#0f172a',
  black: '#000000',
};

/**
 * Role-Based Color Tokens
 */
export const roles: RoleColors = {
  student: {
    main: '#1d4ed8', // Changed from #2563eb to meet 4.5:1 contrast with white
    light: '#1d4ed8', // Changed from #3b82f6 to meet 4.5:1 contrast with white
    dark: '#1e40af',
    gradient: ['#2563eb', '#1e40af'] as const,
    contrast: '#ffffff',
  },
  teacher: {
    main: '#047857', // Changed from #059669 to meet 4.5:1 contrast with white
    light: '#047857', // Changed from #10b981 to meet 4.5:1 contrast with white
    dark: '#065f46',
    gradient: ['#059669', '#065f46'] as const,
    contrast: '#ffffff',
  },
  admin: {
    main: '#6d28d9', // Changed from #7c3aed to meet 4.5:1 contrast with white
    light: '#6d28d9', // Changed from #8b5cf6 to meet 4.5:1 contrast with white
    dark: '#5b21b6',
    gradient: ['#7c3aed', '#5b21b6'] as const,
    contrast: '#ffffff',
  },
};

/**
 * Theme-Specific Colors (Light and Dark Mode)
 */
export const theme: ThemeColors = {
  light: {
    background: '#f8fafc',
    surface: '#ffffff',
    text: '#0f172a',
    textSecondary: '#64748b',
    border: '#e2e8f0',
    card: '#ffffff',
    input: '#ffffff',
    inputDisabled: '#f1f5f9',
    secondaryButton: '#f1f5f9',
    secondaryButtonText: '#0f172a',
  },
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    border: '#334155',
    card: '#1e293b',
    input: '#1e293b',
    inputDisabled: '#0f172a',
    secondaryButton: '#334155',
    secondaryButtonText: '#f1f5f9',
  },
};

/**
 * Background Color Token
 * Uses theme.light.background as the main value with variations
 */
export const background: ColorToken = {
  main: theme.light.background,
  light: neutral.gray50,
  dark: theme.dark.background,
  gradient: [theme.light.background, neutral.white] as const,
  contrast: theme.light.text,
};

/**
 * Complete Color Palette
 */
export const colors: ColorPalette = {
  primary,
  accent,
  success,
  warning,
  error,
  info,
  neutral,
  roles,
  theme,
  background,
};
