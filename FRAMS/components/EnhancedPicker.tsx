/**
 * EnhancedPicker Component
 * 
 * An improved picker component with proper state management, visual feedback,
 * search functionality, and accessibility features. Fixes the value display
 * issues present in the standard React Native Picker.
 * 
 * Features:
 * - Controlled component with proper value display
 * - Automatic search for lists with >10 items
 * - Visual feedback on selection
 * - Error state support
 * - Full accessibility support (screen readers, keyboard navigation)
 * - Modal-based selection for better UX
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.3, 4.4, 4.6
 * 
 * @example
 * ```tsx
 * <EnhancedPicker
 *   label="Class"
 *   value={selectedClass}
 *   items={[
 *     { label: 'Grade 1', value: 'grade_1' },
 *     { label: 'Grade 2', value: 'grade_2' },
 *   ]}
 *   onValueChange={setSelectedClass}
 *   error={errors.class}
 *   searchable
 * />
 * ```
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/design-system/ThemeContext';

/**
 * Represents a single item in the picker dropdown
 * @template T - Type of the value (defaults to string)
 */
export interface PickerItem<T = string> {
  /** Display text shown to the user */
  label: string;
  /** Internal value used for selection */
  value: T;
  /** Whether this item can be selected */
  disabled?: boolean;
}

/**
 * Props for the EnhancedPicker component
 * @template T - Type of the value (defaults to string)
 */
export interface EnhancedPickerProps<T = string> {
  /** Label displayed above the picker */
  label: string;
  /** Currently selected value */
  value: T;
  /** Array of items to display in the picker */
  items: PickerItem<T>[];
  /** Callback fired when selection changes */
  onValueChange: (value: T) => void;
  /** Error message to display below the picker */
  error?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Placeholder text when no value is selected */
  placeholder?: string;
  /** Enable search functionality (auto-enabled for >10 items) */
  searchable?: boolean;
  /** Test ID for automated testing */
  testID?: string;
}

function EnhancedPicker<T = string>({
  label,
  value,
  items,
  onValueChange,
  error,
  disabled = false,
  placeholder = 'Select an option',
  searchable = false,
  testID,
}: EnhancedPickerProps<T>) {
  const { tokens, getTextColor, getTextSecondaryColor, getSurfaceColor, getBackgroundColor, getBorderColor, mode } = useTheme();
  const isDark = mode === 'dark';
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [buttonFocused, setButtonFocused] = useState(false);

  // Find the selected item to display its label
  const selectedItem = useMemo(() => {
    return items.find(item => item.value === value);
  }, [items, value]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    if (!searchable || !trimmedQuery) {
      return items;
    }
    const query = trimmedQuery.toLowerCase();
    return items.filter(item => 
      item.label.toLowerCase().includes(query)
    );
  }, [items, searchQuery, searchable]);

  // Determine if search should be shown (more than 10 items)
  const shouldShowSearch = searchable || items.length > 10;

  const handleSelect = (itemValue: T) => {
    onValueChange(itemValue);
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleOpen = () => {
    if (!disabled) {
      setModalVisible(true);
      setButtonFocused(true);
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    setSearchQuery('');
    setSearchFocused(false);
    setButtonFocused(false);
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 4,
      color: error ? tokens.colors.error.main : getTextColor(),
    },
    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: disabled 
        ? (isDark ? tokens.colors.neutral.gray800 : tokens.colors.neutral.gray100) 
        : getSurfaceColor(),
      borderRadius: 14,
      borderWidth: 1,
      borderColor: error ? tokens.colors.error.main : getBorderColor(),
      paddingHorizontal: 16,
      paddingVertical: 14,
      minHeight: 52,
      shadowColor: tokens.colors.primary.main,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 8,
      elevation: 0,
    },
    pickerButtonFocused: {
      borderColor: tokens.colors.primary.main,
      shadowOpacity: 0.15,
      elevation: 2,
    },
    pickerButtonDisabled: {
      opacity: 0.6,
    },
    pickerText: {
      fontSize: 16,
      color: disabled ? tokens.colors.neutral.gray500 : getTextColor(),
      flex: 1,
      fontWeight: '500',
    },
    placeholderText: {
      color: getTextSecondaryColor(),
      fontWeight: '400',
    },
    errorText: {
      fontSize: 14,
      color: tokens.colors.error.main,
      marginTop: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '92%',
      maxHeight: '85%',
      backgroundColor: getSurfaceColor(),
      borderRadius: 20,
      padding: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 10,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: getBorderColor(),
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: getTextColor(),
    },
    closeButton: {
      padding: 4,
      borderRadius: 20,
      backgroundColor: isDark ? tokens.colors.neutral.gray800 : tokens.colors.neutral.gray100,
    },
    searchContainer: {
      marginBottom: 16,
    },
    searchInput: {
      backgroundColor: isDark ? tokens.colors.neutral.gray900 : tokens.colors.neutral.gray50,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: getTextColor(),
      borderWidth: 1,
      borderColor: getBorderColor(),
    },
    searchInputFocused: {
      borderColor: tokens.colors.primary.main,
      backgroundColor: getSurfaceColor(),
    },
    listContainer: {
      maxHeight: 400,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderRadius: 12,
      marginBottom: 4,
      backgroundColor: 'transparent',
    },
    listItemHover: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : tokens.colors.neutral.gray50,
    },
    listItemSelected: {
      backgroundColor: tokens.colors.primary.light,
      borderWidth: 1,
      borderColor: tokens.colors.primary.main,
    },
    listItemDisabled: {
      opacity: 0.4,
    },
    listItemText: {
      fontSize: 16,
      color: getTextColor(),
      flex: 1,
      fontWeight: '500',
    },
    listItemTextSelected: {
      fontWeight: '600',
      color: tokens.colors.primary.main,
    },
    checkIcon: {
      marginLeft: 12,
    },
    emptyState: {
      padding: 40,
      alignItems: 'center',
    },
    emptyStateIcon: {
      marginBottom: 12,
    },
    emptyStateText: {
      fontSize: 16,
      color: getTextSecondaryColor(),
      textAlign: 'center',
      fontWeight: '500',
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: getTextSecondaryColor(),
      textAlign: 'center',
      marginTop: 4,
      opacity: 0.8,
    },
  });

  return (
    <View style={styles.container} testID={testID}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        style={[
          styles.pickerButton, 
          buttonFocused && !error && styles.pickerButtonFocused,
          disabled && styles.pickerButtonDisabled
        ]}
        onPress={handleOpen}
        disabled={disabled}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`${label} picker`}
        accessibilityHint={`Opens ${label} selection menu`}
        accessibilityState={{ disabled }}
        testID={testID ? `${testID}-button` : undefined}
      >
        <Text
          style={[
            styles.pickerText,
            !selectedItem && styles.placeholderText,
          ]}
          testID={testID ? `${testID}-value` : undefined}
        >
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Ionicons
          name={modalVisible ? "chevron-up" : "chevron-down"}
          size={22}
          color={disabled ? tokens.colors.neutral.gray400 : buttonFocused ? tokens.colors.primary.main : getTextSecondaryColor()}
        />
      </TouchableOpacity>
      {error && (
        <Text style={styles.errorText} testID={testID ? `${testID}-error` : undefined}>
          {error}
        </Text>
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleClose}
        testID={testID ? `${testID}-modal` : undefined}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e?.stopPropagation?.()}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select {label}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Close picker"
                >
                  <Ionicons name="close" size={20} color={getTextSecondaryColor()} />
                </TouchableOpacity>
              </View>

              {shouldShowSearch && (
                <View style={styles.searchContainer}>
                  <TextInput
                    style={[
                      styles.searchInput,
                      searchFocused && styles.searchInputFocused
                    ]}
                    placeholder={`Search ${label.toLowerCase()}...`}
                    placeholderTextColor={getTextSecondaryColor()}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    testID={testID ? `${testID}-search` : undefined}
                  />
                </View>
              )}

              <View style={styles.listContainer}>
                <FlatList
                  data={filteredItems}
                  keyExtractor={(item, index) => `${item.value}-${index}`}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item }) => {
                    const isSelected = item.value === value;
                    return (
                      <TouchableOpacity
                        style={[
                          styles.listItem,
                          isSelected && styles.listItemSelected,
                          item.disabled && styles.listItemDisabled,
                        ]}
                        onPress={() => handleSelect(item.value)}
                        disabled={item.disabled}
                        accessible
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                        accessibilityState={{ selected: isSelected, disabled: item.disabled }}
                        testID={testID ? `${testID}-item-${item.value}` : undefined}
                      >
                        <Text
                          style={[
                            styles.listItemText,
                            isSelected && styles.listItemTextSelected,
                          ]}
                        >
                          {item.label}
                        </Text>
                        {isSelected && (
                          <View style={styles.checkIcon}>
                            <Ionicons
                              name="checkmark-circle"
                              size={22}
                              color={tokens.colors.primary.main}
                            />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyState}>
                      <View style={styles.emptyStateIcon}>
                        <Ionicons
                          name="search-outline"
                          size={48}
                          color={getTextSecondaryColor()}
                        />
                      </View>
                      <Text style={styles.emptyStateText}>
                        No {label.toLowerCase()} found
                      </Text>
                      <Text style={styles.emptyStateSubtext}>
                        Try adjusting your search terms
                      </Text>
                    </View>
                  }
                  testID={testID ? `${testID}-list` : undefined}
                />
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default EnhancedPicker;
