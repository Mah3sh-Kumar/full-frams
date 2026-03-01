/**
 * AcademicYearTransitionDialog Component
 * 
 * Dialog for copying subjects from one academic year to another.
 * Allows admin to select source and target academic years.
 * 
 * Requirements: 23.1, 23.2
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../../../lib/design-system/ThemeContext';
import { fontWeights } from '../../../lib/design-system/tokens';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { AcademicYearItem } from '../../../lib/types';
import { supabase } from '../../../lib/supabase';

interface AcademicYearTransitionDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (sourceYearId: string, targetYearId: string) => Promise<void>;
}

export default function AcademicYearTransitionDialog({
  visible,
  onClose,
  onConfirm,
}: AcademicYearTransitionDialogProps) {
  const { 
    tokens, 
    getTextColor, 
    getSurfaceColor, 
    getTextSecondaryColor,
    getBackgroundColor 
  } = useTheme();
  const [academicYears, setAcademicYears] = useState<AcademicYearItem[]>([]);
  const [sourceYearId, setSourceYearId] = useState<string>('');
  const [targetYearId, setTargetYearId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingYears, setLoadingYears] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchAcademicYears();
    }
  }, [visible]);

  const fetchAcademicYears = async () => {
    setLoadingYears(true);
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        console.error('Error fetching academic years:', error);
        Alert.alert('Error', 'Failed to load academic years');
        return;
      }

      setAcademicYears(data || []);
      
      // Set default values if available
      if (data && data.length > 0) {
        // Default source to current year if available
        const currentYear = data.find(y => y.is_current);
        if (currentYear) {
          setSourceYearId(currentYear.id);
        } else {
          setSourceYearId(data[0].id);
        }
        
        // Default target to the next year if available
        if (data.length > 1) {
          setTargetYearId(data[1].id);
        }
      }
    } catch (error: any) {
      console.error('Exception fetching academic years:', error);
      Alert.alert('Error', 'Failed to load academic years');
    } finally {
      setLoadingYears(false);
    }
  };

  const handleConfirm = async () => {
    // Validation
    if (!sourceYearId || !targetYearId) {
      Alert.alert('Validation Error', 'Please select both source and target academic years');
      return;
    }

    if (sourceYearId === targetYearId) {
      Alert.alert('Validation Error', 'Source and target academic years must be different');
      return;
    }

    setLoading(true);
    try {
      await onConfirm(sourceYearId, targetYearId);
      onClose();
    } catch (error: any) {
      // Error handling is done in the parent component
      console.error('Error in handleConfirm:', error);
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: tokens.spacing.xl,
    },
    dialogContainer: {
      width: '100%',
      maxWidth: 400,
      borderRadius: tokens.borders.large,
      padding: tokens.spacing.xl,
      ...tokens.shadows.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: tokens.spacing.lg,
    },
    title: {
      fontSize: tokens.typography.h2.fontSize,
      fontWeight: tokens.typography.h2.fontWeight,
    },
    closeButton: {
      padding: tokens.spacing.xs,
    },
    content: {
      marginBottom: tokens.spacing.xl,
    },
    description: {
      fontSize: tokens.typography.body.fontSize,
      marginBottom: tokens.spacing.lg,
      lineHeight: 20,
    },
    fieldContainer: {
      marginBottom: tokens.spacing.md,
    },
    label: {
      fontSize: tokens.typography.body.fontSize,
      fontWeight: fontWeights.semibold,
      marginBottom: tokens.spacing.sm,
    },
    pickerContainer: {
      borderWidth: 1,
      borderRadius: tokens.borders.medium,
      overflow: 'hidden',
    },
    picker: {
      height: 50,
    },
    actions: {
      flexDirection: 'row',
      gap: tokens.spacing.md,
    },
    button: {
      flex: 1,
      paddingVertical: tokens.spacing.md,
      paddingHorizontal: tokens.spacing.md,
      borderRadius: tokens.borders.medium,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cancelButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
    },
    confirmButton: {
      backgroundColor: tokens.colors.primary.main,
    },
    buttonText: {
      fontSize: tokens.typography.body.fontSize,
      fontWeight: fontWeights.semibold,
    },
    cancelButtonText: {
      color: getTextColor(),
    },
    confirmButtonText: {
      color: tokens.colors.neutral.white,
    },
    loadingContainer: {
      padding: tokens.spacing.xxl,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: tokens.spacing.md,
      fontSize: tokens.typography.body.fontSize,
    },
  });

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      transparent
      animationType="fade"
      statusBarTranslucent
      accessible
      accessibilityViewIsModal
    >
      <View 
        style={styles.modalOverlay}
        accessible
        accessibilityRole="none"
        accessibilityLabel="Academic year transition dialog"
      >
        <View style={[styles.dialogContainer, { backgroundColor: getSurfaceColor() }]}>
          <View style={styles.header}>
            <Text 
              style={[styles.title, { color: getTextColor() }]}
              accessible
              accessibilityRole="header"
            >
              Academic Year Transition
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              disabled={loading}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
              accessibilityHint="Closes the academic year transition dialog"
            >
              <Ionicons name="close" size={24} color={getTextSecondaryColor()} />
            </TouchableOpacity>
          </View>

          {loadingYears ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={tokens.colors.primary.main} />
              <Text style={[styles.loadingText, { color: getTextSecondaryColor() }]}>
                Loading academic years...
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.content}>
                <Text 
                  style={[styles.description, { color: getTextSecondaryColor() }]}
                  accessible
                  accessibilityRole="text"
                >
                  Copy all active subjects from one academic year to another. This will preserve subject names, codes, class associations, and teacher assignments.
                </Text>

                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: getTextColor() }]}>
                    Source Academic Year
                  </Text>
                  <View 
                    style={[styles.pickerContainer, { borderColor: getTextSecondaryColor() }]}
                    accessible
                    accessibilityRole="none"
                    accessibilityLabel="Source academic year picker"
                  >
                    <Picker
                      selectedValue={sourceYearId}
                      onValueChange={(value) => setSourceYearId(value)}
                      style={[styles.picker, { color: getTextColor() }]}
                      enabled={!loading}
                      accessible
                      accessibilityLabel="Source academic year"
                      accessibilityHint="Select the academic year to copy subjects from"
                    >
                      <Picker.Item label="Select source year..." value="" />
                      {academicYears.map((year) => (
                        <Picker.Item
                          key={year.id}
                          label={`${year.name}${year.is_current ? ' (Current)' : ''}`}
                          value={year.id}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={[styles.label, { color: getTextColor() }]}>
                    Target Academic Year
                  </Text>
                  <View 
                    style={[styles.pickerContainer, { borderColor: getTextSecondaryColor() }]}
                    accessible
                    accessibilityRole="none"
                    accessibilityLabel="Target academic year picker"
                  >
                    <Picker
                      selectedValue={targetYearId}
                      onValueChange={(value) => setTargetYearId(value)}
                      style={[styles.picker, { color: getTextColor() }]}
                      enabled={!loading}
                      accessible
                      accessibilityLabel="Target academic year"
                      accessibilityHint="Select the academic year to copy subjects to"
                    >
                      <Picker.Item label="Select target year..." value="" />
                      {academicYears.map((year) => (
                        <Picker.Item
                          key={year.id}
                          label={`${year.name}${year.is_current ? ' (Current)' : ''}`}
                          value={year.id}
                        />
                      ))}
                    </Picker>
                  </View>
                </View>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.button, styles.cancelButton, { borderColor: getTextSecondaryColor() }]}
                  disabled={loading}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  accessibilityHint="Closes the dialog without copying subjects"
                >
                  <Text style={[styles.buttonText, styles.cancelButtonText]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleConfirm}
                  style={[styles.button, styles.confirmButton]}
                  disabled={loading || !sourceYearId || !targetYearId}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Proceed with transition"
                  accessibilityHint="Copies all subjects from source year to target year"
                  accessibilityState={{ disabled: loading || !sourceYearId || !targetYearId }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.buttonText, styles.confirmButtonText]}>
                      Proceed
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
