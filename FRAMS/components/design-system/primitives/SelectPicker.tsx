/**
 * SelectPicker Component
 * 
 * An enhanced picker component specifically designed for class levels and departments
 * with improved visual design, icons, and better user experience.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

type IoniconsName = ComponentProps<typeof Ionicons>['name'];
import { useTheme } from '../../../lib/design-system/ThemeContext';

export interface SelectPickerItem<T = string> {
  label: string;
  value: T;
  icon?: IoniconsName;
  description?: string;
  disabled?: boolean;
}

export interface SelectPickerProps<T = string> {
  label: string;
  value: T;
  items: SelectPickerItem<T>[];
  onValueChange: (value: T) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  searchable?: boolean;
  testID?: string;
  variant?: 'default' | 'academic' | 'department';
}

function SelectPicker<T = string>({
  label,
  value,
  items,
  onValueChange,
  error,
  disabled = false,
  placeholder = 'Select an option',
  searchable = false,
  testID,
  variant = 'default',
}: SelectPickerProps<T>) {
  const { tokens, mode, getTextColor, getTextSecondaryColor, getSurfaceColor, getInputColor, getInputDisabledColor, getBorderColor } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  // Find the selected item to display its label
  const selectedItem = useMemo(() => {
    return items.find(item => item.value === value);
  }, [items, value]);

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!Array.isArray(items)) {
      return [];
    }
    
    const trimmedQuery = searchQuery.trim();
    if (!searchable || !trimmedQuery) {
      return items;
    }
    
    const query = trimmedQuery.toLowerCase();
    return items.filter(item => 
      item && 
      item.label && 
      (item.label.toLowerCase().includes(query) ||
      (item.description && item.description.toLowerCase().includes(query)))
    );
  }, [items, searchQuery, searchable]);

  // Determine if search should be shown
  const shouldShowSearch = searchable || items.length > 8;

  const handleSelect = (itemValue: T) => {
    onValueChange(itemValue);
    setModalVisible(false);
    setSearchQuery('');
  };

  const handleOpen = () => {
    if (!disabled) {
      setModalVisible(true);
    }
  };

  const handleClose = () => {
    setModalVisible(false);
    setSearchQuery('');
    setSearchFocused(false);
  };

  // Get icon for variant
  const getVariantIcon = (): IoniconsName => {
    switch (variant) {
      case 'academic':
        return 'school-outline';
      case 'department':
        return 'business-outline';
      default:
        return 'list-outline';
    }
  };

  // Get default icons for items based on variant
  const getItemIcon = (item: SelectPickerItem<T>): IoniconsName => {
    if (item.icon) return item.icon;
    
    if (variant === 'academic') {
      const valueStr = String(item.value);
      if (valueStr.includes('class_')) return 'library-outline';
      if (valueStr.includes('grad_')) return 'school-outline';
    }
    
    if (variant === 'department') {
      const label = item.label.toLowerCase();
      if (label.includes('computer') || label.includes('information')) return 'laptop-outline';
      if (label.includes('engineering')) return 'construct-outline';
      if (label.includes('mathematics') || label.includes('physics')) return 'calculator-outline';
      if (label.includes('biology') || label.includes('chemistry')) return 'flask-outline';
      if (label.includes('english') || label.includes('history')) return 'book-outline';
      if (label.includes('commerce') || label.includes('economics')) return 'trending-up-outline';
      return 'briefcase-outline';
    }
    
    return 'ellipse-outline';
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
      backgroundColor: disabled ? getInputDisabledColor() : getInputColor(),
      borderRadius: 14,
      borderWidth: 1,
      borderColor: error ? tokens.colors.error.main : getBorderColor(),
      paddingHorizontal: 16,
      paddingVertical: 14,
      minHeight: 52,
      shadowColor: tokens.colors.primary.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0,
      shadowRadius: 8,
      elevation: 0,
    },
    pickerButtonFocused: {
      borderColor: tokens.colors.primary.main,
      shadowOpacity: 0.1,
      elevation: 2,
    },
    pickerButtonDisabled: {
      opacity: 0.6,
    },
    pickerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    pickerIcon: {
      marginRight: 12,
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
    chevronIcon: {
      marginLeft: 8,
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
      width: '90%',
      maxWidth: 400,
      maxHeight: '80%',
      backgroundColor: getSurfaceColor(),
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 12,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: getBorderColor(),
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: getTextColor(),
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: mode === 'dark' ? tokens.colors.neutral.gray800 : tokens.colors.neutral.gray100,
    },
    searchContainer: {
      marginBottom: 12,
    },
    searchInput: {
      backgroundColor: mode === 'dark' ? tokens.colors.neutral.gray900 : tokens.colors.neutral.gray50,
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
      height: 300,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderRadius: 10,
      marginBottom: 4,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: 'transparent',
      minHeight: 60,
    },
    listItemSelected: {
      backgroundColor: tokens.colors.primary.main,
      borderColor: tokens.colors.primary.main,
      shadowColor: tokens.colors.primary.main,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 3,
    },
    listItemDisabled: {
      opacity: 0.4,
    },
    listItemIcon: {
      marginRight: 10,
      width: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    listItemContent: {
      flex: 1,
      paddingRight: 8,
    },
    listItemText: {
      fontSize: 15,
      color: getTextColor(),
      fontWeight: '500',
      marginBottom: 2,
    },
    listItemTextSelected: {
      fontWeight: '700',
      color: '#FFFFFF',
      fontSize: 15,
    },
    listItemDescription: {
      fontSize: 12,
      color: getTextSecondaryColor(),
      opacity: 0.8,
      lineHeight: 16,
    },
    listItemDescriptionSelected: {
      fontSize: 12,
      color: '#FFFFFF',
      opacity: 0.9,
      fontWeight: '400',
      lineHeight: 16,
    },
    checkIcon: {
      marginLeft: 8,
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
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
          modalVisible && !error && styles.pickerButtonFocused,
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
        <View style={styles.pickerContent}>
          <View style={styles.pickerIcon}>
            <Ionicons
              name={selectedItem ? getItemIcon(selectedItem) : getVariantIcon()}
              size={20}
              color={selectedItem ? tokens.colors.primary.main : getTextSecondaryColor()}
            />
          </View>
          <Text
            style={[
              styles.pickerText,
              !selectedItem && styles.placeholderText,
            ]}
            testID={testID ? `${testID}-value` : undefined}
          >
            {selectedItem ? selectedItem.label : placeholder}
          </Text>
        </View>
        <View style={styles.chevronIcon}>
          <Ionicons
            name={modalVisible ? "chevron-up" : "chevron-down"}
            size={20}
            color={disabled ? tokens.colors.neutral.gray400 : modalVisible ? tokens.colors.primary.main : getTextSecondaryColor()}
          />
        </View>
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
                  <Ionicons name="close" size={18} color={getTextSecondaryColor()} />
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
                {filteredItems.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No items available</Text>
                  </View>
                ) : (
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
                        <View style={styles.listItemIcon}>
                          <Ionicons
                            name={getItemIcon(item)}
                            size={18}
                            color={isSelected ? '#FFFFFF' : getTextSecondaryColor()}
                          />
                        </View>
                        <View style={styles.listItemContent}>
                          <Text
                            style={[
                              styles.listItemText,
                              isSelected && styles.listItemTextSelected,
                            ]}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {item.label}
                          </Text>
                          {item.description && (
                            <Text 
                              style={[
                                styles.listItemDescription,
                                isSelected && styles.listItemDescriptionSelected,
                              ]}
                              numberOfLines={2}
                              ellipsizeMode="tail"
                            >
                              {item.description}
                            </Text>
                          )}
                        </View>
                        {isSelected && (
                          <View style={styles.checkIcon}>
                            <Ionicons
                              name="checkmark-circle"
                              size={20}
                              color="#FFFFFF"
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
                )}
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

export default SelectPicker;