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
 * - Spacing: 6px gap between cells
 * - Border radius: 6px
 * - Enhanced visual design with shadows and labels
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
  showWeekLabels = true,
}: HeatmapChartProps) {
  const { tokens, mode } = useTheme();

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const cellSize = 36;
  const cellGap = 6;

  /**
   * Get color for a cell based on attendance value
   */
  const getCellColor = (value: number): string => {
    if (value >= 90) {
      return tokens.colors.success.main;
    } else if (value >= 75) {
      return '#86EFAC'; // Light green
    } else if (value >= 60) {
      return tokens.colors.warning.main;
    } else if (value >= 40) {
      return '#FCD34D'; // Light yellow
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
    paddingVertical: tokens.spacing.sm,
  };

  const dayLabelsContainerStyle: ViewStyle = {
    flexDirection: 'row',
    marginBottom: tokens.spacing.sm,
    paddingLeft: showWeekLabels ? 36 : 0,
  };

  const dayLabelStyle: TextStyle = {
    fontSize: 11,
    fontWeight: '600',
    color: mode === 'dark'
      ? tokens.colors.theme.dark.textSecondary
      : tokens.colors.theme.light.textSecondary,
    width: cellSize,
    textAlign: 'center',
    marginRight: cellGap,
  };

  const heatmapGridStyle: ViewStyle = {
    flexDirection: 'column',
    gap: cellGap,
  };

  const weekRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cellGap,
  };

  const weekLabelStyle: TextStyle = {
    fontSize: 10,
    fontWeight: '600',
    color: mode === 'dark'
      ? tokens.colors.theme.dark.textSecondary
      : tokens.colors.theme.light.textSecondary,
    width: 26,
    textAlign: 'right',
    marginRight: 8,
  };

  const cellStyle = (value: number): ViewStyle => ({
    width: cellSize,
    height: cellSize,
    backgroundColor: getCellColor(value),
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  });

  const legendContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: tokens.spacing.md,
    gap: tokens.spacing.sm,
  };

  const legendItemStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  };

  const legendBoxStyle = (color: string): ViewStyle => ({
    width: 16,
    height: 16,
    backgroundColor: color,
    borderRadius: 4,
  });

  const legendTextStyle: TextStyle = {
    fontSize: 11,
    color: mode === 'dark'
      ? tokens.colors.theme.dark.textSecondary
      : tokens.colors.theme.light.textSecondary,
  };

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
          <View key={`week-${weekIndex}`} style={weekRowStyle}>
            {showWeekLabels && (
              <Text style={weekLabelStyle}>W{weeks - weekIndex}</Text>
            )}
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

      {/* Legend */}
      <View style={legendContainerStyle}>
        <View style={legendItemStyle}>
          <View style={legendBoxStyle(tokens.colors.success.main)} />
          <Text style={legendTextStyle}>90%+</Text>
        </View>
        <View style={legendItemStyle}>
          <View style={legendBoxStyle('#86EFAC')} />
          <Text style={legendTextStyle}>75-89%</Text>
        </View>
        <View style={legendItemStyle}>
          <View style={legendBoxStyle(tokens.colors.warning.main)} />
          <Text style={legendTextStyle}>60-74%</Text>
        </View>
        <View style={legendItemStyle}>
          <View style={legendBoxStyle('#FCD34D')} />
          <Text style={legendTextStyle}>40-59%</Text>
        </View>
        <View style={legendItemStyle}>
          <View style={legendBoxStyle(tokens.colors.error.main)} />
          <Text style={legendTextStyle}>&lt;40%</Text>
        </View>
      </View>
    </View>
  );
}
