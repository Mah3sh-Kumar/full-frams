/**
 * SelectPicker Component
 * 
 * An enhanced picker component with improved visual design, smooth animations,
 * better accessibility, and polished user experience.
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, FlatList, Dimensions, Animated, Platform } from 'react-native';
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
  
  // Animation values
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

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
    handleClose();
  };

  const handleOpen = () => {
    if (!disabled) {
      setModalVisible(true);
      // Animate modal entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handleClose = () => {
    // Animate modal exit
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
      setSearchQuery('');
      setSearchFocused(false);
    });
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
      marginBottom: 6,
      color: error ? tokens.colors.error.main : getTextColor(),
    },
    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: disabled ? getInputDisabledColor() : getInputColor(),
      borderRadius: 12,
      borderWidth: 1,
      borderColor: error ? tokens.colors.error.main : getBorderColor(),
      paddingHorizontal: 16,
      paddingVertical: 14,
      minHeight: 52,
    },
    pickerButtonFocused: {
      borderColor: tokens.colors.primary.main,
      borderWidth: 1.5,
      backgroundColor: getSurfaceColor(),
    },
    pickerButtonDisabled: {
      opacity: 0.5,
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
      fontSize: 13,
      color: tokens.colors.error.main,
      marginTop: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      width: '90%',
      maxWidth: 420,
      maxHeight: Math.min(Dimensions.get('window').height * 0.75, Dimensions.get('window').height - 100),
      backgroundColor: getSurfaceColor(),
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
        },
        android: {
          elevation: 8,
        },
      }),
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: getTextColor(),
    },
    closeButton: {
      padding: 6,
      borderRadius: 16,
      backgroundColor: 'transparent',
    },
    searchContainer: {
      marginBottom: 12,
    },
    searchInput: {
      backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      fontSize: 15,
      color: getTextColor(),
      borderWidth: 1,
      borderColor: 'transparent',
      textAlign: 'left',
      writingDirection: 'ltr',
    },
    searchInputFocused: {
      borderColor: tokens.colors.primary.main,
      backgroundColor: getSurfaceColor(),
    },
    listContainer: {
      maxHeight: Math.min(Dimensions.get('window').height * 0.5, 400),
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
      minHeight: 52,
    },
    listItemSelected: {
      backgroundColor: mode === 'dark' ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.08)',
      borderBottomColor: 'transparent',
    },
    listItemDisabled: {
      opacity: 0.4,
    },
    listItemIcon: {
      marginRight: 12,
    },
    listItemContent: {
      flex: 1,
      paddingRight: 8,
    },
    listItemText: {
      fontSize: 16,
      color: getTextColor(),
      fontWeight: '500',
      marginBottom: 2,
    },
    listItemTextSelected: {
      fontWeight: '600',
      color: tokens.colors.primary.main,
      fontSize: 16,
    },
    listItemDescription: {
      fontSize: 13,
      color: getTextSecondaryColor(),
      opacity: 0.7,
      lineHeight: 17,
      fontWeight: '400',
    },
    listItemDescriptionSelected: {
      fontSize: 13,
      color: getTextSecondaryColor(),
      opacity: 0.8,
      fontWeight: '400',
      lineHeight: 17,
    },
    checkIcon: {
      marginLeft: 8,
    },
    emptyState: {
      padding: 32,
      alignItems: 'center',
    },
    emptyStateIcon: {
      marginBottom: 12,
    },
    emptyStateText: {
      fontSize: 15,
      color: getTextSecondaryColor(),
      textAlign: 'center',
      fontWeight: '500',
    },
    emptyStateSubtext: {
      fontSize: 13,
      color: getTextSecondaryColor(),
      textAlign: 'center',
      marginTop: 4,
      opacity: 0.7,
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
        animationType="none"
        onRequestClose={handleClose}
        testID={testID ? `${testID}-modal` : undefined}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={handleClose}
          >
            <Animated.View
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
              }}
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
                            color={isSelected ? tokens.colors.primary.main : getTextSecondaryColor()}
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
                              name="checkmark"
                              size={20}
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
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
      </Modal>
    </View>
  );
}

export default SelectPicker;