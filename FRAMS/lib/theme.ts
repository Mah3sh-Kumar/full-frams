import { MD3LightTheme, MD3DarkTheme as PaperDarkTheme, configureFonts } from 'react-native-paper';
import type { MD3Theme } from 'react-native-paper';
import { tokens } from './design-system/tokens';

// Export tokens for backward compatibility and direct usage
export const colors = tokens.colors;
export const typography = tokens.typography;
export const spacing = tokens.spacing;
export const borderRadius = tokens.borders.radius;
export const shadows = tokens.shadows;
export const animation = tokens.motion;

// React Native Paper Light Theme
export const paperTheme: MD3Theme = {
    ...MD3LightTheme,
    roundness: tokens.borders.radius.medium,
    colors: {
        ...MD3LightTheme.colors,
        primary: tokens.colors.primary.main,
        onPrimary: tokens.colors.primary.contrast,
        primaryContainer: tokens.colors.primary.light,
        onPrimaryContainer: tokens.colors.primary.dark,
        secondary: tokens.colors.accent.main,
        onSecondary: tokens.colors.accent.contrast,
        secondaryContainer: tokens.colors.accent.light,
        onSecondaryContainer: tokens.colors.accent.dark,
        tertiary: tokens.colors.info.main,
        onTertiary: tokens.colors.info.contrast,
        tertiaryContainer: tokens.colors.info.light,
        onTertiaryContainer: tokens.colors.info.dark,
        error: tokens.colors.error.main,
        onError: tokens.colors.error.contrast,
        errorContainer: tokens.colors.error.light,
        onErrorContainer: tokens.colors.error.dark,
        background: tokens.colors.theme.light.background,
        onBackground: tokens.colors.theme.light.text,
        surface: tokens.colors.theme.light.surface,
        onSurface: tokens.colors.theme.light.text,
        surfaceVariant: tokens.colors.neutral.gray100,
        onSurfaceVariant: tokens.colors.theme.light.textSecondary,
        outline: tokens.colors.theme.light.border,
        outlineVariant: tokens.colors.neutral.gray200,
        shadow: tokens.colors.neutral.black,
        scrim: tokens.colors.neutral.black,
        inverseSurface: tokens.colors.theme.dark.surface,
        inverseOnSurface: tokens.colors.theme.dark.text,
        inversePrimary: tokens.colors.primary.light,
        elevation: {
            level0: 'transparent',
            level1: tokens.colors.neutral.white,
            level2: tokens.colors.neutral.gray50,
            level3: tokens.colors.neutral.gray100,
            level4: tokens.colors.neutral.gray200,
            level5: tokens.colors.neutral.gray300,
        },
        surfaceDisabled: 'rgba(30, 41, 59, 0.12)',
        onSurfaceDisabled: 'rgba(30, 41, 59, 0.38)',
        backdrop: 'rgba(15, 23, 42, 0.4)',
    },
};

// React Native Paper Dark Theme
export const paperDarkTheme: MD3Theme = {
    ...PaperDarkTheme,
    roundness: tokens.borders.radius.medium,
    colors: {
        ...PaperDarkTheme.colors,
        primary: tokens.colors.primary.light,
        onPrimary: tokens.colors.primary.contrast,
        primaryContainer: tokens.colors.primary.dark,
        onPrimaryContainer: tokens.colors.primary.light,
        secondary: tokens.colors.accent.light,
        onSecondary: tokens.colors.accent.contrast,
        secondaryContainer: tokens.colors.accent.dark,
        onSecondaryContainer: tokens.colors.accent.light,
        tertiary: tokens.colors.info.light,
        onTertiary: tokens.colors.info.contrast,
        tertiaryContainer: tokens.colors.info.dark,
        onTertiaryContainer: tokens.colors.info.light,
        error: tokens.colors.error.light,
        onError: tokens.colors.error.contrast,
        errorContainer: tokens.colors.error.dark,
        onErrorContainer: tokens.colors.error.light,
        background: tokens.colors.theme.dark.background,
        onBackground: tokens.colors.theme.dark.text,
        surface: tokens.colors.theme.dark.surface,
        onSurface: tokens.colors.theme.dark.text,
        surfaceVariant: tokens.colors.neutral.gray800,
        onSurfaceVariant: tokens.colors.theme.dark.textSecondary,
        outline: tokens.colors.theme.dark.border,
        outlineVariant: tokens.colors.neutral.gray700,
        shadow: tokens.colors.neutral.black,
        scrim: tokens.colors.neutral.black,
        inverseSurface: tokens.colors.theme.light.surface,
        inverseOnSurface: tokens.colors.theme.light.text,
        inversePrimary: tokens.colors.primary.main,
        elevation: {
            level0: 'transparent',
            level1: tokens.colors.neutral.gray900,
            level2: tokens.colors.neutral.gray800,
            level3: tokens.colors.neutral.gray700,
            level4: tokens.colors.neutral.gray600,
            level5: tokens.colors.neutral.gray500,
        },
        surfaceDisabled: 'rgba(241, 245, 249, 0.12)',
        onSurfaceDisabled: 'rgba(241, 245, 249, 0.38)',
        backdrop: 'rgba(0, 0, 0, 0.5)',
    },
};

// Export complete theme
export const theme = {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
    animation,
    paperTheme,
    paperDarkTheme,
};

export default theme;
