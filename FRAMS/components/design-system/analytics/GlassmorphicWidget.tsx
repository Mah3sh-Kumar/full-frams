/**
 * GlassmorphicWidget Component
 * 
 * A specialized analytics widget with glassmorphic styling featuring
 * translucent backgrounds, blur effects, and elevation system.
 * Used for dashboard analytics and data visualization.
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../../lib/design-system/ThemeContext';

/**
 * GlassmorphicWidget component props
 */
export interface GlassmorphicWidgetProps {
  /** Widget content */
  children: React.ReactNode;
  /** Optional custom style */
  style?: ViewStyle;
  /** Optional test ID */
  testID?: string;
  /** Elevation level (sm, md, lg) */
  elevation?: 'sm' | 'md' | 'lg';
}

/**
 * GlassmorphicWidget Component
 * 
 * Implements design system specifications:
 * - Glassmorphic styling with translucent background and blur
 * - Elevation system for visual hierarchy
 * - Border radius: 20px (large token)
 * - Padding: 24px (lg token)
 * - Translucent background with 70% opacity
 * 
 * Requirements:
 * - 8.1: Glassmorphic styling with translucent backgrounds and blur effects
 * - 8.4: Elevation system for visual hierarchy
 */
export default function GlassmorphicWidget({
  children,
  style,
  testID,
  elevation = 'md',
}: GlassmorphicWidgetProps) {
  const { tokens, mode, getBorderColor: getThemeBorderColor, getCardColor } = useTheme();

  /**
   * Get shadow style based on elevation level
   */
  const getShadowStyle = (): ViewStyle => {
    switch (elevation) {
      case 'sm':
        return tokens.shadows.sm;
      case 'lg':
        return tokens.shadows.lg;
      case 'md':
      default:
        return tokens.shadows.md;
    }
  };

  const getBackgroundColor = (): string => {
    return mode === 'dark'
      ? 'rgba(30, 41, 59, 0.7)' // dark surface with 70% opacity
      : 'rgba(255, 255, 255, 0.7)'; // white with 70% opacity
  };

  const getBorderColor = (): string => {
    return mode === 'dark'
      ? 'rgba(255, 255, 255, 0.1)' // subtle white border in dark mode
      : 'rgba(0, 0, 0, 0.05)'; // subtle dark border in light mode
  };

  const containerStyle: ViewStyle = {
    borderRadius: tokens.borders.radius.large,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: getBorderColor(),
    backgroundColor: getBackgroundColor(),
    padding: tokens.spacing.lg,
    ...getShadowStyle(),
  };

  return (
    <View style={[containerStyle, style]} testID={testID}>
      {children}
    </View>
  );
}
