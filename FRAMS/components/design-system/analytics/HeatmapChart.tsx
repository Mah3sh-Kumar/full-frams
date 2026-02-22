/**
 * HeatmapChart Component
 * 
 * A weekly attendance heatmap visualization component that displays
 * attendance data in a grid format with color-coded cells.
 * Used for analytics dashboards to show attendance patterns.
 */

import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../../lib/design-system/ThemeContext';

/**
 * Data point for a single day in the heatmap
 */
export interface HeatmapDataPoint {
  /** Day of week (0-6, where 0 is Sunday) */
  day: number;
  /** Week number (0-based index) */
  week: number;
  /** Attendance value (0-100) */
  value: number;
  /** Optional label for the cell */
  label?: string;
}

/**
 * HeatmapChart component props
 */
export interface HeatmapChartProps {
  /** Array of data points to display */
  data: HeatmapDataPoint[];
  /** Number of weeks to display (default: 4) */
  weeks?: number;
  /** Optional custom style */
  style?: ViewStyle;
  /** Optional test ID */
  testID?: string;
  /** Show day labels (default: true) */
  showDayLabels?: boolean;
  /** Show week labels (default: false) */
  showWeekLabels?: boolean;
}

/**
 * HeatmapChart Component
 * 
 * Implements design system specifications:
 * - Weekly attendance heatmap visualization
 * - Color-coded cells based on attendance percentage
 * - Responsive layout with design tokens
 * - Spacing: 4px gap between cells (xs token)
 * - Border radius: 8px (small token)
 * 
 * Requirements:
 * - 8.2: Weekly attendance data heatmap visualization
 */
export default function HeatmapChart({
  data,
  weeks = 4,
  style,
  testID,
  showDayLabels = true,
  showWeekLabels = false,
}: HeatmapChartProps) {
  const { tokens, mode } = useTheme();

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const cellSize = 32;
  const cellGap = tokens.spacing.xs;

  /**
   * Get color for a cell based on attendance value
   */
  const getCellColor = (value: number): string => {
    if (value >= 90) {
      return tokens.colors.success.main;
    } else if (value >= 75) {
      return tokens.colors.success.light;
    } else if (value >= 60) {
      return tokens.colors.warning.main;
    } else if (value >= 40) {
      return tokens.colors.warning.light;
    } else if (value > 0) {
      return tokens.colors.error.main;
    } else {
      // Empty cell
      return mode === 'dark'
        ? tokens.colors.neutral.gray700
        : tokens.colors.neutral.gray200;
    }
  };

  /**
   * Get data point for specific day and week
   */
  const getDataPoint = (day: number, week: number): HeatmapDataPoint | null => {
    return data.find(d => d.day === day && d.week === week) || null;
  };

  /**
   * Render empty state when no data
   */
  if (!data || data.length === 0) {
    const emptyStateStyle: ViewStyle = {
      padding: tokens.spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: mode === 'dark'
        ? tokens.colors.neutral.gray800
        : tokens.colors.neutral.gray100,
      borderRadius: tokens.borders.radius.medium,
    };

    const emptyTextStyle: TextStyle = {
      fontSize: tokens.typography.body.fontSize,
      color: mode === 'dark'
        ? tokens.colors.theme.dark.textSecondary
        : tokens.colors.theme.light.textSecondary,
    };

    return (
      <View style={[emptyStateStyle, style]} testID={testID}>
        <Text style={emptyTextStyle}>No attendance data available</Text>
      </View>
    );
  }

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
  };

  const dayLabelsContainerStyle: ViewStyle = {
    marginRight: tokens.spacing.sm,
    justifyContent: 'space-between',
  };

  const dayLabelStyle: TextStyle = {
    fontSize: tokens.typography.caption.fontSize,
    color: mode === 'dark'
      ? tokens.colors.theme.dark.textSecondary
      : tokens.colors.theme.light.textSecondary,
    height: cellSize,
    lineHeight: cellSize,
    textAlign: 'center',
  };

  const heatmapGridStyle: ViewStyle = {
    flexDirection: 'row',
    gap: cellGap,
  };

  const weekColumnStyle: ViewStyle = {
    gap: cellGap,
  };

  const cellStyle = (value: number): ViewStyle => ({
    width: cellSize,
    height: cellSize,
    backgroundColor: getCellColor(value),
    borderRadius: tokens.borders.radius.small,
  });

  return (
    <View style={[containerStyle, style]} testID={testID}>
      {showDayLabels && (
        <View style={dayLabelsContainerStyle}>
          {dayLabels.map((label, index) => (
            <Text key={`day-label-${index}`} style={dayLabelStyle}>
              {label}
            </Text>
          ))}
        </View>
      )}
      
      <View style={heatmapGridStyle}>
        {Array.from({ length: weeks }).map((_, weekIndex) => (
          <View key={`week-${weekIndex}`} style={weekColumnStyle}>
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              const dataPoint = getDataPoint(dayIndex, weekIndex);
              const value = dataPoint?.value || 0;
              
              return (
                <View
                  key={`cell-${weekIndex}-${dayIndex}`}
                  style={cellStyle(value)}
                  testID={`heatmap-cell-${weekIndex}-${dayIndex}`}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
