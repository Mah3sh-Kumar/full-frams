/**
 * Stack Component
 * 
 * A layout component that arranges children vertically with consistent spacing
 * following the design system specifications.
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../../lib/design-system/ThemeContext';

/**
 * Stack component props
 */
export interface StackProps {
  /** Stack content */
  children: React.ReactNode;
  /** Spacing between children using spacing tokens (default: 'md') */
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /** Optional custom style */
  style?: ViewStyle;
  /** Optional test ID */
  testID?: string;
}

/**
 * Stack Component
 * 
 * Arranges children vertically with consistent spacing.
 * Uses design system spacing tokens for gaps between children.
 */
export default function Stack({
  children,
  spacing = 'md',
  style,
  testID,
}: StackProps) {
  const { tokens } = useTheme();

  const stackStyle: ViewStyle = {
    flexDirection: 'column',
  };

  // Convert children to array and add spacing between elements
  const childArray = React.Children.toArray(children);

  return (
    <View style={[stackStyle, style]} testID={testID}>
      {childArray.map((child, index) => (
        <View
          key={index}
          testID={testID ? `${testID}-child-${index}` : undefined}
          style={index < childArray.length - 1 ? { marginBottom: tokens.spacing[spacing] } : undefined}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
