/**
 * StudentProfileCard Component
 * 
 * A card component for displaying student profile information with avatar,
 * status badge, and attendance statistics micro chart.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../../lib/design-system/ThemeContext';

/**
 * Attendance statistics data
 */
export interface AttendanceStats {
  present: number;
  absent: number;
  total: number;
}

/**
 * Student status types
 */
export type StudentStatus = 'present' | 'absent' | 'late' | 'pending';

/**
 * StudentProfileCard component props
 */
export interface StudentProfileCardProps {
  /**
   * Student name
   */
  name: string;
  
  /**
   * Student ID or roll number
   */
  studentId: string;
  
  /**
   * Current attendance status
   */
  status: StudentStatus;
  
  /**
   * Attendance statistics
   */
  attendanceStats: AttendanceStats;
  
  /**
   * Avatar URL or initials
   */
  avatar?: string;
  
  /**
   * Optional test ID
   */
  testID?: string;
}

/**
 * Get status badge color based on student status
 */
function getStatusColor(status: StudentStatus, tokens: any): string {
  switch (status) {
    case 'present':
      return tokens.colors.success.main;
    case 'absent':
      return tokens.colors.error.main;
    case 'late':
      return tokens.colors.warning.main;
    case 'pending':
    default:
      return tokens.colors.neutral.gray400;
  }
}

/**
 * Get status label text
 */
function getStatusLabel(status: StudentStatus): string {
  switch (status) {
    case 'present':
      return 'Present';
    case 'absent':
      return 'Absent';
    case 'late':
      return 'Late';
    case 'pending':
    default:
      return 'Pending';
  }
}

/**
 * StudentProfileCard Component
 * 
 * Displays student profile information with:
 * - Avatar circle (with initials fallback)
 * - Status badge with color coding
 * - Attendance statistics micro chart
 * - Design token integration
 * 
 * @example
 * <StudentProfileCard
 *   name="John Doe"
 *   studentId="12345"
 *   status="present"
 *   attendanceStats={{ present: 18, absent: 2, total: 20 }}
 * />
 */
export default function StudentProfileCard({
  name,
  studentId,
  status,
  attendanceStats,
  avatar,
  testID = 'student-profile-card',
}: StudentProfileCardProps) {
  const { tokens, getSurfaceColor, getTextColor, getTextSecondaryColor, getBorderColor } = useTheme();
  
  const statusColor = getStatusColor(status, tokens);
  const statusLabel = getStatusLabel(status);
  const attendancePercentage = attendanceStats.total > 0 
    ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
    : 0;
  
  // Get initials from name for avatar fallback
  const initials = name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const cardStyle: ViewStyle = {
    backgroundColor: getSurfaceColor(),
    borderRadius: tokens.borders.radius.medium,
    padding: tokens.spacing.md,
    borderWidth: 1,
    borderColor: getBorderColor(),
    ...tokens.shadows.sm,
  };

  const avatarStyle: ViewStyle = {
    width: 48,
    height: 48,
    borderRadius: 24, // Half of 48 for perfect circle
    backgroundColor: tokens.colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: tokens.spacing.md,
  };

  const avatarTextStyle: TextStyle = {
    color: tokens.colors.primary.contrast,
    fontSize: tokens.typography.body.fontSize,
    fontWeight: tokens.typography.h3.fontWeight as any,
  };

  const nameStyle: TextStyle = {
    color: getTextColor(),
    fontSize: tokens.typography.body.fontSize,
    fontWeight: tokens.typography.h3.fontWeight as any,
    marginBottom: tokens.spacing.xs,
  };

  const studentIdStyle: TextStyle = {
    color: getTextSecondaryColor(),
    fontSize: tokens.typography.caption.fontSize,
    marginBottom: tokens.spacing.sm,
  };

  const statusBadgeStyle: ViewStyle = {
    backgroundColor: statusColor,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.borders.radius.small,
    alignSelf: 'flex-start',
    marginBottom: tokens.spacing.sm,
  };

  const statusTextStyle: TextStyle = {
    color: tokens.colors.neutral.white,
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: tokens.typography.body.fontWeight as any,
  };

  const statsContainerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: tokens.spacing.sm,
  };

  const chartBarStyle: ViewStyle = {
    height: 8,
    borderRadius: tokens.borders.radius.small,
    flex: 1,
    backgroundColor: tokens.colors.neutral.gray200,
    overflow: 'hidden',
  };

  const chartFillStyle: ViewStyle = {
    height: '100%',
    backgroundColor: tokens.colors.success.main,
    width: `${attendancePercentage}%`,
  };

  const percentageTextStyle: TextStyle = {
    color: getTextColor(),
    fontSize: tokens.typography.caption.fontSize,
    fontWeight: tokens.typography.h3.fontWeight as any,
    marginLeft: tokens.spacing.sm,
    minWidth: 40,
  };

  const headerRowStyle: ViewStyle = {
    ...styles.headerRow,
    marginBottom: tokens.spacing.sm,
  };

  return (
    <View style={cardStyle} testID={testID}>
      <View style={headerRowStyle}>
        {/* Avatar Circle */}
        <View style={avatarStyle} testID={`${testID}-avatar`}>
          <Text style={avatarTextStyle}>{initials}</Text>
        </View>
        
        {/* Student Info */}
        <View style={styles.infoContainer}>
          <Text style={nameStyle} testID={`${testID}-name`}>
            {name}
          </Text>
          <Text style={studentIdStyle} testID={`${testID}-student-id`}>
            ID: {studentId}
          </Text>
        </View>
      </View>
      
      {/* Status Badge */}
      <View style={statusBadgeStyle} testID={`${testID}-status-badge`}>
        <Text style={statusTextStyle}>{statusLabel}</Text>
      </View>
      
      {/* Attendance Stats Micro Chart */}
      <View style={statsContainerStyle} testID={`${testID}-stats`}>
        <View style={chartBarStyle}>
          <View style={chartFillStyle} testID={`${testID}-chart-fill`} />
        </View>
        <Text style={percentageTextStyle} testID={`${testID}-percentage`}>
          {attendancePercentage}%
        </Text>
      </View>
      
      {/* Stats Text */}
      <Text 
        style={[studentIdStyle, { marginTop: tokens.spacing.xs, marginBottom: 0 }]}
        testID={`${testID}-stats-text`}
      >
        {attendanceStats.present}/{attendanceStats.total} classes attended
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
});
