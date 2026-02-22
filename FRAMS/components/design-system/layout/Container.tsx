/**
 * Container Component
 * 
 * A layout component that provides consistent max width and padding
 * for content areas following the design system specifications.
 */

import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../../lib/design-system/ThemeContext';

/**
 * Container component props
 */
export interface ContainerProps {
  /** Container content */
  children: React.ReactNode;
  /** Maximum width for the container (default: 1200) */
  maxWidth?: number;
  /** Padding size using spacing tokens (default: 'md') */
  padding?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /** Optional custom style */
  style?: ViewStyle;
  /** Optional test ID */
  testID?: string;
}

/**
 * Container Component
 * 
 * Provides consistent max width and padding for content areas.
 * Uses design system spacing tokens for padding.
 */
export default function Container({
  children,
  maxWidth = 1200,
  padding = 'md',
  style,
  testID,
}: ContainerProps) {
  const { tokens } = useTheme();

  const containerStyle: ViewStyle = {
    width: '100%',
    maxWidth,
    paddingHorizontal: tokens.spacing[padding],
    alignSelf: 'center',
  };

  return (
    <View style={[containerStyle, style]} testID={testID}>
      {children}
    </View>
  );
}
