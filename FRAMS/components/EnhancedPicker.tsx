/**
 * EnhancedPicker Component
 * 
 * An improved picker component with modern design, smooth animations,
 * search functionality, and accessibility features.
 * 
 * Features:
 * - Smooth spring animations
 * - Modern visual design with icons
 * - Automatic search for lists with >10 items
 * - Visual feedback on selection
 * - Error state support
 * - Full accessibility support
 * - Platform-specific optimizations
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, FlatList, Animated, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/design-system/ThemeContext';

export interface PickerItem<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
  icon?: string;
}

export interface EnhancedPickerProps<T = string> {
  label: string;
  value: T;
  items: PickerItem<T>[];
  onValueChange: (value: T) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  searchable?: boolean;
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
  const { tokens, getTextColor, getTextSecondaryColor, getSurfaceColor, getInputColor, getInputDisabledColor, getBorderColor, mode } = useTheme();
  const isDark = mode === 'dark';
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Animation values
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  const selectedItem = useMemo(() => {
    return items.find(item => item.value === value);
  }, [items, value]);

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

  const shouldShowSearch = searchable || items.length > 10;

  const handleSelect = (itemValue: T) => {
    onValueChange(itemValue);
    handleClose();
  };

  const handleOpen = () => {
    if (!disabled) {
      setModalVisible(true);
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
      borderRadius: 16,
      borderWidth: 2,
      borderColor: error ? tokens.colors.error.main : getBorderColor(),
      paddingHorizontal: 18,
      paddingVertical: 16,
      minHeight: 56,
      ...Platform.select({
        ios: {
          shadowColor: tokens.colors.primary.main,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0,
          shadowRadius: 8,
        },
        android: {
          elevation: 0,
        },
      }),
    },
    pickerButtonFocused: {
      borderColor: tokens.colors.primary.main,
      borderWidth: 2.5,
      backgroundColor: getSurfaceColor(),
      ...Platform.select({
        ios: {
          shadowOpacity: 0.2,
        },
        android: {
          elevation: 4,
        },
      }),
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
      marginRight: 14,
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
      alignItems: 'center',
      justifyContent: 'center',
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
      maxWidth: 420,
      maxHeight: Math.min(Dimensions.get('window').height * 0.75, Dimensions.get('window').height - 100),
      backgroundColor: getSurfaceColor(),
      borderRadius: 24,
      padding: 20,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.4,
          shadowRadius: 24,
        },
        android: {
          elevation: 16,
        },
      }),
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
      backgroundColor: isDark ? tokens.colors.neutral.gray800 : tokens.colors.neutral.gray100,
    },
    searchContainer: {
      marginBottom: 12,
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
      maxHeight: Math.min(Dimensions.get('window').height * 0.5, 400),
      paddingBottom: 16,
    },
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 14,
      marginBottom: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
      borderWidth: 2,
      borderColor: 'transparent',
      minHeight: 68,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
        },
        android: {
          elevation: 1,
        },
      }),
    },
    listItemSelected: {
      backgroundColor: tokens.colors.primary.main,
      borderColor: tokens.colors.primary.main,
      ...Platform.select({
        ios: {
          shadowColor: tokens.colors.primary.main,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
        },
        android: {
          elevation: 8,
        },
      }),
    },
    listItemDisabled: {
      opacity: 0.4,
    },
    listItemIcon: {
      marginRight: 14,
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
    listItemContent: {
      flex: 1,
      paddingRight: 8,
    },
    listItemText: {
      fontSize: 16,
      color: getTextColor(),
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    listItemTextSelected: {
      fontWeight: '700',
      color: '#FFFFFF',
      fontSize: 16,
      letterSpacing: 0.3,
    },
    checkIcon: {
      marginLeft: 10,
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
              name="list-outline"
              size={22}
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
                    <FlatList
                      data={filteredItems}
                      keyExtractor={(item, index) => `${item.value}-${index}`}
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{ paddingBottom: 8 }}
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
                                name="ellipse"
                                size={20}
                                color={isSelected ? '#FFFFFF' : tokens.colors.primary.main}
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

export default EnhancedPicker;
