/**
 * Card Component
 * 
 * A primitive card component with variant support, optional gradient header,
 * and press animations following the design system specifications.
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../../lib/design-system/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Card variant types
 */
export type CardVariant = 'default' | 'glassmorphic' | 'elevated';

/**
 * Card component props
 */
export interface CardProps {
  /** Card variant style */
  variant?: CardVariant;
  /** Show gradient header strip (6px height) */
  headerGradient?: boolean;
  /** Press handler - makes card interactive */
  onPress?: () => void;
  /** Card content */
  children: React.ReactNode;
  /** Optional custom style */
  style?: ViewStyle;
  /** Optional test ID */
  testID?: string;
}

/**
 * Card Component
 * 
 * Implements design system specifications:
 * - Border radius: 16px
 * - Shadow: medium elevation
 * - Optional gradient header strip: 6px height
 * - Press animation: scale(1.02) with 220ms duration
 * - Padding: 16px (md token)
 * 
 * Variants:
 * - default: Standard card with surface color and shadow
 * - glassmorphic: Translucent background with blur effect
 * - elevated: Higher shadow for emphasis
 */
export default function Card({
  variant = 'default',
  headerGradient = false,
  onPress,
  children,
  style,
  testID,
}: CardProps) {
  const { tokens, mode, getRoleColor, getSurfaceColor, getCardColor } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const { reducedMotion } = useTheme();

  /**
   * Handle press in - animate scale up for cards
   */
  const handlePressIn = () => {
    if (reducedMotion || !onPress) return;
    
    Animated.timing(scaleAnim, {
      toValue: 1.02,
      duration: tokens.motion.duration.normal,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Handle press out - animate scale back to normal
   */
  const handlePressOut = () => {
    if (reducedMotion || !onPress) return;
    
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: tokens.motion.duration.normal,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Get shadow style based on variant
   */
  const getShadowStyle = (): ViewStyle => {
    switch (variant) {
      case 'elevated':
        return tokens.shadows.lg;
      case 'glassmorphic':
        return tokens.shadows.sm;
      case 'default':
      default:
        return tokens.shadows.md;
    }
  };

  /**
   * Get background color based on variant
   */
  const getBackgroundColor = (): string => {
    switch (variant) {
      case 'glassmorphic':
        return mode === 'dark' 
          ? 'rgba(30, 41, 59, 0.7)'  // dark surface with 70% opacity
          : 'rgba(255, 255, 255, 0.7)'; // white with 70% opacity
      case 'default':
      case 'elevated':
      default:
        return getCardColor();
    }
  };

  /**
   * Get gradient colors for header strip
   */
  const getGradientColors = (): readonly [string, string] => {
    const roleColor = getRoleColor();
    if (roleColor) {
      return roleColor.gradient;
    }
    return tokens.colors.primary.gradient;
  };

  const cardStyle: ViewStyle = {
    borderRadius: tokens.borders.radius.medium,
    backgroundColor: getBackgroundColor(),
    overflow: 'hidden',
    ...getShadowStyle(),
  };

  const contentStyle: ViewStyle = {
    padding: tokens.spacing.md,
  };

  /**
   * Render card content
   */
  const renderContent = () => (
    <>
      {headerGradient && (
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientHeader}
          testID={testID ? `${testID}-gradient-header` : undefined}
        />
      )}
      <View style={contentStyle}>{children}</View>
    </>
  );

  /**
   * Render card content in container
   */
  const cardElement = (
    <View style={cardStyle}>
      {renderContent()}
    </View>
  );

  // If onPress is provided, wrap in TouchableOpacity with animation
  if (onPress) {
    return (
      <Animated.View
        style={[
          { transform: [{ scale: scaleAnim }] },
          style,
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
          testID={testID}
          accessible={true}
          accessibilityRole="button"
        >
          {cardElement}
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Non-interactive card
  return (
    <View style={style} testID={testID}>
      {cardElement}
    </View>
  );
}

const styles = StyleSheet.create({
  gradientHeader: {
    height: 6,
    width: '100%',
  },
});
