/**
 * SubjectCard Component
 * 
 * Displays subject information in a card format for the OrganizationManager screen.
 * Shows subject name, code, class, academic year, assigned teachers with primary
 * teacher indication, active status, and action buttons.
 * 
 * Requirements: 1.2, 1.3, 4.1, 5.1
 * 
 * @example
 * ```tsx
 * <SubjectCard
 *   subject={subjectWithTeachers}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 *   showActions={true}
 * />
 * ```
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../lib/design-system/ThemeContext';
import { fontWeights } from '../../../lib/design-system/tokens';
import { SubjectItem, TeacherInfo } from '../../../lib/types';
import { ActionButtonsGroup } from '../../common/ActionButtons';

/**
 * SubjectCard component props
 */
export interface SubjectCardProps {
  /** Subject data with teachers, class name, and academic year name */
  subject: SubjectItem & {
    teachers?: TeacherInfo[];
    class_name?: string;
    academic_year_name?: string;
  };
  /** Handler for edit button press */
  onEdit: (subject: SubjectItem) => void;
  /** Handler for delete button press */
  onDelete: (subject: SubjectItem) => void;
  /** Whether to show action buttons (edit/delete) - false for non-admin roles */
  showActions: boolean;
}

/**
 * SubjectCard Component
 * 
 * Displays subject information in card format following FRAMS design patterns.
 * Includes:
 * - Subject name (prominent)
 * - Subject code (secondary)
 * - Class name
 * - Academic year name
 * - Teacher list with primary teacher indicated (★ symbol)
 * - Active status indicator
 * - Edit and delete buttons (conditional on showActions prop)
 */
export default function SubjectCard({
  subject,
  onEdit,
  onDelete,
  showActions,
}: SubjectCardProps) {
  const { 
    tokens, 
    getSurfaceColor, 
    getTextColor, 
    getTextSecondaryColor,
    getInputColor 
  } = useTheme();

  /**
   * Format teacher names with primary teacher indication
   * Primary teacher is prefixed with ★ symbol
   */
  const formatTeachers = (): string => {
    if (!subject.teachers || subject.teachers.length === 0) {
      return 'No teachers assigned';
    }

    return subject.teachers
      .map((teacher) => {
        const prefix = teacher.is_primary ? '★ ' : '';
        return `${prefix}${teacher.full_name}`;
      })
      .join(', ');
  };

  return (
    <View
      style={[
        styles.card, 
        { 
          backgroundColor: getSurfaceColor(),
          marginBottom: tokens.spacing.md,
          borderRadius: tokens.borders.large,
          ...tokens.shadows.md,
        }
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Subject: ${subject.name}, Code: ${subject.code}, Class: ${subject.class_name || 'Unknown'}, Academic Year: ${subject.academic_year_name || 'Unknown'}, Teachers: ${formatTeachers()}, Status: ${subject.is_active ? 'Active' : 'Archived'}`}
    >
      <View style={[styles.cardContent, { padding: tokens.spacing.lg }]}>
        <View style={styles.itemInfo}>
          {/* Subject name and status indicator */}
          <View style={[styles.itemHeader, { marginBottom: tokens.spacing.md }]}>
            <Text
              style={[
                styles.itemName, 
                { 
                  color: getTextColor(),
                  fontSize: tokens.typography.h3.fontSize,
                  fontWeight: tokens.typography.h3.fontWeight,
                  marginRight: tokens.spacing.sm,
                }
              ]}
              numberOfLines={2}
              accessible
              accessibilityRole="text"
              accessibilityLabel={`Subject name: ${subject.name}`}
            >
              {subject.name}
            </Text>
            <View style={[styles.statusContainer, { gap: tokens.spacing.sm }]}>
              {!subject.is_active && (
                <View
                  style={[
                    styles.archivedBadge, 
                    { 
                      backgroundColor: tokens.colors.neutral.gray500,
                      paddingHorizontal: tokens.spacing.sm,
                      paddingVertical: tokens.spacing.xs,
                      borderRadius: tokens.borders.full,
                      gap: tokens.spacing.xs,
                    }
                  ]}
                  accessible
                  accessibilityRole="text"
                  accessibilityLabel="Archived"
                >
                  <Ionicons name="archive" size={12} color={tokens.colors.neutral.white} />
                  <Text 
                    style={[
                      styles.archivedText,
                      {
                        fontSize: tokens.typography.caption.fontSize,
                        fontWeight: fontWeights.semibold,
                        color: tokens.colors.neutral.white,
                      }
                    ]}
                  >
                    Archived
                  </Text>
                </View>
              )}
              <View
                style={styles.statusBadge}
                accessible
                accessibilityRole="text"
                accessibilityLabel={subject.is_active ? 'Active' : 'Inactive'}
              >
                {subject.is_active ? (
                  <View
                    style={[
                      styles.statusIndicator,
                      { 
                        backgroundColor: tokens.colors.success.main,
                        width: 12,
                        height: 12,
                        borderRadius: tokens.borders.full,
                      },
                    ]}
                  />
                ) : (
                  <View
                    style={[
                      styles.statusIndicator,
                      { 
                        backgroundColor: tokens.colors.neutral.gray500,
                        width: 12,
                        height: 12,
                        borderRadius: tokens.borders.full,
                      },
                    ]}
                  />
                )}
              </View>
            </View>
          </View>

          {/* Subject details */}
          <View style={[styles.itemDetails, { gap: tokens.spacing.sm }]}>
            {/* Subject code */}
            <View style={[styles.detailRow, { gap: tokens.spacing.sm }]}>
              <Ionicons
                name="pricetag"
                size={16}
                color={getTextSecondaryColor()}
              />
              <Text
                style={[
                  styles.itemDetail, 
                  { 
                    color: getTextSecondaryColor(),
                    fontSize: tokens.typography.body.fontSize,
                  }
                ]}
                numberOfLines={1}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`Code: ${subject.code}`}
              >
                Code: {subject.code}
              </Text>
            </View>

            {/* Class name */}
            <View style={[styles.detailRow, { gap: tokens.spacing.sm }]}>
              <Ionicons
                name="school"
                size={16}
                color={getTextSecondaryColor()}
              />
              <Text
                style={[
                  styles.itemDetail, 
                  { 
                    color: getTextSecondaryColor(),
                    fontSize: tokens.typography.body.fontSize,
                  }
                ]}
                numberOfLines={1}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`Class: ${subject.class_name || 'Unknown'}`}
              >
                Class: {subject.class_name || 'Unknown'}
              </Text>
            </View>

            {/* Academic year */}
            <View style={[styles.detailRow, { gap: tokens.spacing.sm }]}>
              <Ionicons
                name="calendar"
                size={16}
                color={getTextSecondaryColor()}
              />
              <Text
                style={[
                  styles.itemDetail, 
                  { 
                    color: getTextSecondaryColor(),
                    fontSize: tokens.typography.body.fontSize,
                  }
                ]}
                numberOfLines={1}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`Academic Year: ${subject.academic_year_name || 'Unknown'}`}
              >
                Year: {subject.academic_year_name || 'Unknown'}
              </Text>
            </View>

            {/* Teachers */}
            <View style={[styles.detailRow, { gap: tokens.spacing.sm }]}>
              <Ionicons
                name="people"
                size={16}
                color={getTextSecondaryColor()}
              />
              <Text
                style={[
                  styles.itemDetail, 
                  { 
                    color: getTextSecondaryColor(),
                    fontSize: tokens.typography.body.fontSize,
                  }
                ]}
                numberOfLines={2}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`Teachers: ${formatTeachers()}`}
              >
                {formatTeachers()}
              </Text>
            </View>
          </View>
        </View>

        {/* Action buttons (conditional) */}
        {showActions && (
          <ActionButtonsGroup
            onEdit={() => onEdit(subject)}
            onDelete={() => onDelete(subject)}
            editAccessibilityLabel={`Edit ${subject.name}`}
            editAccessibilityHint="Opens edit form for this subject"
            deleteAccessibilityLabel={`Delete ${subject.name}`}
            deleteAccessibilityHint="Opens delete confirmation for this subject"
          />
        )}
      </View>
    </View>
  );
}

// Note: Most styles are now applied inline using tokens for better theme support
const styles = StyleSheet.create({
  card: {
    // marginBottom, borderRadius, and shadows applied inline using tokens
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    flex: 1,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  archivedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  archivedText: {},
  statusBadge: {
    marginLeft: 0,
  },
  statusIndicator: {},
  itemDetails: {},
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemDetail: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
