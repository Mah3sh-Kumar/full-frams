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
  main: '#4338ca', // Dark indigo for text/icons - meets 4.5:1 contrast with white
  light: '#e0e7ff', // Light indigo background - for stat cards and badges
  dark: '#3730a3', // Darker indigo for hover states
  gradient: ['#4f46e5', '#4338ca'] as const,
  contrast: '#ffffff',
};

/**
 * Accent Color Token - Cyan
 */
export const accent: ColorToken = {
  main: '#0e7490', // Dark cyan for text/icons - meets 4.5:1 contrast with white
  light: '#cffafe', // Light cyan background - for stat cards and badges
  dark: '#164e63', // Darker cyan for hover states
  gradient: ['#0e7490', '#155e75'] as const,
  contrast: '#ffffff',
};

/**
 * Success Color Token - Green
 */
export const success: ColorToken = {
  main: '#15803d', // Dark green for text/icons - meets 4.5:1 contrast with white
  light: '#dcfce7', // Light green background - for stat cards and badges
  dark: '#14532d', // Darker green for hover states
  gradient: ['#16a34a', '#15803d'] as const,
  contrast: '#ffffff',
};

/**
 * Warning Color Token - Yellow
 */
export const warning: ColorToken = {
  main: '#a16207', // Dark yellow/amber for text/icons - meets 4.5:1 contrast
  light: '#fef3c7', // Light yellow background - for stat cards and badges
  dark: '#78350f', // Darker amber for hover states
  gradient: ['#a16207', '#854d0e'] as const,
  contrast: '#000000',
};

/**
 * Error Color Token - Red
 */
export const error: ColorToken = {
  main: '#b91c1c', // Dark red for text/icons - meets 4.5:1 contrast with white
  light: '#fee2e2', // Light red background - for stat cards and badges
  dark: '#7f1d1d', // Darker red for hover states
  gradient: ['#b91c1c', '#991b1b'] as const,
  contrast: '#ffffff',
};

/**
 * Info Color Token - Blue
 */
export const info: ColorToken = {
  main: '#1d4ed8', // Dark blue for text/icons - meets 4.5:1 contrast with white
  light: '#dbeafe', // Light blue background - for stat cards and badges
  dark: '#1e3a8a', // Darker blue for hover states
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
    main: '#1d4ed8', // Dark blue for text/icons - meets 4.5:1 contrast with white
    light: '#dbeafe', // Light blue background
    dark: '#1e3a8a',
    gradient: ['#2563eb', '#1e40af'] as const,
    contrast: '#ffffff',
  },
  teacher: {
    main: '#047857', // Dark green for text/icons - meets 4.5:1 contrast with white
    light: '#d1fae5', // Light green background
    dark: '#065f46',
    gradient: ['#059669', '#065f46'] as const,
    contrast: '#ffffff',
  },
  admin: {
    main: '#6d28d9', // Dark purple for text/icons - meets 4.5:1 contrast with white
    light: '#ede9fe', // Light purple background
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
