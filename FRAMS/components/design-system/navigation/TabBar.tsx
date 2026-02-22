/**
 * TabBar Component
 * 
 * A bottom navigation tab bar component with floating effect, active tab highlight,
 * and smooth tab switching animations following the design system specifications.
 */

import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../../lib/design-system/ThemeContext';

/**
 * Tab item interface
 */
export interface TabItem {
  /** Unique identifier for the tab */
  id: string;
  /** Tab label text */
  label: string;
  /** Optional icon component */
  icon?: React.ReactNode;
}

/**
 * TabBar component props
 */
export interface TabBarProps {
  /** Array of tab items */
  tabs: TabItem[];
  /** Currently active tab ID */
  activeTab: string;
  /** Callback when tab is pressed */
  onTabPress: (tabId: string) => void;
  /** Optional custom style */
  style?: ViewStyle;
  /** Optional test ID */
  testID?: string;
}

/**
 * TabBar Component
 * 
 * Implements design system specifications:
 * - Height: 72px
 * - Floating effect with medium shadow
 * - Active tab highlight pill with smooth animation
 * - Smooth tab switching animation (220ms duration)
 * - Uses design tokens for colors, spacing, and motion
 * 
 * Requirements: 3.4, 4.3
 */
export default function TabBar({
  tabs,
  activeTab,
  onTabPress,
  style,
  testID,
}: TabBarProps) {
  const { tokens, mode, reducedMotion, getSurfaceColor, getTextColor, getTextSecondaryColor } = useTheme();
  
  // Animation value for the active tab indicator
  const indicatorPosition = useRef(new Animated.Value(0)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  
  // Track initialization state to avoid accessing private _value property
  const isInitialized = useRef(false);
  
  // Track tab layouts for indicator positioning
  const tabLayouts = useRef<{ [key: string]: { x: number; width: number } }>({});

  /**
   * Update indicator position when active tab changes
   */
  useEffect(() => {
    const activeTabLayout = tabLayouts.current[activeTab];
    if (activeTabLayout) {
      const duration = reducedMotion ? 0 : tokens.motion.duration.normal;
      
      Animated.parallel([
        Animated.timing(indicatorPosition, {
          toValue: activeTabLayout.x,
          duration,
          useNativeDriver: false,
        }),
        Animated.timing(indicatorWidth, {
          toValue: activeTabLayout.width,
          duration,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [activeTab, reducedMotion]);

  /**
   * Handle tab layout measurement
   */
  const handleTabLayout = (tabId: string, x: number, width: number) => {
    tabLayouts.current[tabId] = { x, width };
    
    // Initialize indicator position for the first active tab
    if (tabId === activeTab && !isInitialized.current) {
      indicatorPosition.setValue(x);
      indicatorWidth.setValue(width);
      isInitialized.current = true;
    }
  };

  /**
   * Handle tab press
   */
  const handlePress = (tabId: string) => {
    if (tabId !== activeTab) {
      onTabPress(tabId);
    }
  };

  const containerStyle: ViewStyle = {
    height: 72,
    backgroundColor: getSurfaceColor(),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing.md,
    ...tokens.shadows.md,
    borderTopWidth: 1,
    borderTopColor: tokens.colors.theme[mode].border,
  };

  const indicatorStyle: ViewStyle = {
    position: 'absolute',
    height: 40,
    backgroundColor: tokens.colors.primary.main,
    borderRadius: tokens.borders.radius.full,
    opacity: 0.12,
  };

  return (
    <View style={[containerStyle, style]} testID={testID}>
      {/* Active tab indicator pill */}
      <Animated.View
        style={[
          indicatorStyle,
          {
            left: indicatorPosition,
            width: indicatorWidth,
          },
        ]}
        testID={testID ? `${testID}-indicator` : undefined}
      />
      
      {/* Tab items */}
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTab;
        
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => handlePress(tab.id)}
            onLayout={(event) => {
              const { x, width } = event.nativeEvent.layout;
              handleTabLayout(tab.id, x, width);
            }}
            style={styles.tabItem}
            activeOpacity={0.7}
            testID={testID ? `${testID}-tab-${tab.id}` : undefined}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            {tab.icon && (
              <View style={styles.iconContainer}>
                {tab.icon}
              </View>
            )}
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isActive ? getTextColor() : getTextSecondaryColor(),
                  fontSize: tokens.typography.body.fontSize,
                  fontWeight: isActive ? '600' : '400',
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    minWidth: 48, // Ensure minimum touch target
  },
  iconContainer: {
    marginRight: 6,
  },
  tabLabel: {
    textAlign: 'center',
  },
});
