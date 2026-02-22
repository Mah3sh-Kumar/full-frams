/**
 * Row Component
 * 
 * A layout component that arranges children horizontally with consistent spacing
 * following the design system specifications.
 */

import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../../../lib/design-system/ThemeContext';

/**
 * Row component props
 */
export interface RowProps {
  /** Row content */
  children: React.ReactNode;
  /** Spacing between children using spacing tokens (default: 'md') */
  spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  /** Horizontal alignment of children */
  align?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  /** Vertical alignment of children */
  verticalAlign?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  /** Optional custom style */
  style?: ViewStyle;
  /** Optional test ID */
  testID?: string;
}

/**
 * Row Component
 * 
 * Arranges children horizontally with consistent spacing.
 * Uses design system spacing tokens for gaps between children.
 */
export default function Row({
  children,
  spacing = 'md',
  align = 'flex-start',
  verticalAlign = 'center',
  style,
  testID,
}: RowProps) {
  const { tokens } = useTheme();

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: align,
    alignItems: verticalAlign,
  };

  // Convert children to array and add spacing between elements
  const childArray = React.Children.toArray(children);

  return (
    <View style={[rowStyle, style]} testID={testID}>
      {childArray.map((child, index) => (
        <View
          key={index}
          testID={testID ? `${testID}-child-${index}` : undefined}
          style={index < childArray.length - 1 ? { marginRight: tokens.spacing[spacing] } : undefined}
        >
          {child}
        </View>
      ))}
    </View>
  );
}
