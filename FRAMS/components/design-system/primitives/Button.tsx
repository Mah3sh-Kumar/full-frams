/**
 * Button Component
 * 
 * A primitive button component with variant support, loading states,
 * and press animations following the design system specifications.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  Animated,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../../lib/design-system/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * Button variant types
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/**
 * Button size types
 */
export type ButtonSize = 'small' | 'medium' | 'large';

/**
 * Button component props
 */
export interface ButtonProps {
  /** Button variant style */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Loading state - shows spinner and disables interaction */
  loading?: boolean;
  /** Disabled state - prevents interaction */
  disabled?: boolean;
  /** Optional icon component */
  icon?: React.ReactNode;
  /** Press handler */
  onPress: () => void;
  /** Button text */
  children: React.ReactNode;
  /** Optional custom style */
  style?: ViewStyle;
  /** Optional test ID */
  testID?: string;
}

/**
 * Button Component
 * 
 * Implements design system specifications:
 * - Height: 48px (medium), with size variants
 * - Border radius: 14px (medium token)
 * - Font: Semibold 15px
 * - Gradient backgrounds for primary variant
 * - Press animation: scale(0.96) with 120ms duration
 * - Minimum 48x48px touch target for accessibility
 */
export default function Button({
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  onPress,
  children,
  style,
  testID,
}: ButtonProps) {
  const { tokens, reducedMotion, getSecondaryButtonColor, getSecondaryButtonTextColor } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  /**
   * Handle press in - animate scale down
   */
  const handlePressIn = () => {
    if (reducedMotion) return;
    
    Animated.timing(scaleAnim, {
      toValue: 0.96,
      duration: tokens.motion.duration.fast,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Handle press out - animate scale back to normal
   */
  const handlePressOut = () => {
    if (reducedMotion) return;
    
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: tokens.motion.duration.fast,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Get button height based on size
   */
  const getHeight = (): number => {
    switch (size) {
      case 'small':
        return 40;
      case 'large':
        return 56;
      case 'medium':
      default:
        return 48;
    }
  };

  /**
   * Get horizontal padding based on size
   */
  const getHorizontalPadding = (): number => {
    switch (size) {
      case 'small':
        return tokens.spacing.md;
      case 'large':
        return tokens.spacing.xl;
      case 'medium':
      default:
        return tokens.spacing.lg;
    }
  };

  /**
   * Get font size based on size
   */
  const getFontSize = (): number => {
    switch (size) {
      case 'small':
        return tokens.typography.caption.fontSize;
      case 'large':
        return tokens.typography.h3.fontSize;
      case 'medium':
      default:
        return tokens.typography.body.fontSize;
    }
  };

  /**
   * Get background color based on variant and state
   */
  const getBackgroundColor = (): string => {
    if (disabled) {
      return tokens.colors.neutral.gray300;
    }

    switch (variant) {
      case 'secondary':
        return getSecondaryButtonColor();
      case 'danger':
        return tokens.colors.error.main;
      case 'ghost':
        return 'transparent';
      case 'primary':
      default:
        return tokens.colors.primary.main;
    }
  };

  /**
   * Get text color based on variant and state
   */
  const getTextColor = (): string => {
    if (disabled) {
      return tokens.colors.neutral.gray500;
    }

    switch (variant) {
      case 'secondary':
        return getSecondaryButtonTextColor();
      case 'ghost':
        return tokens.colors.primary.main;
      case 'primary':
      case 'danger':
      default:
        return tokens.colors.neutral.white;
    }
  };

  /**
   * Check if button should use gradient background
   */
  const shouldUseGradient = (): boolean => {
    return variant === 'primary' && !disabled;
  };

  /**
   * Get gradient colors for primary variant
   */
  const getGradientColors = (): readonly [string, string] => {
    return tokens.colors.primary.gradient;
  };

  const isDisabled = disabled || loading;

  const buttonStyle: ViewStyle = {
    height: getHeight(),
    paddingHorizontal: getHorizontalPadding(),
    borderRadius: tokens.borders.radius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48, // Ensure minimum touch target width
    ...(!shouldUseGradient() && {
      backgroundColor: getBackgroundColor(),
    }),
    ...(variant === 'ghost' && {
      borderWidth: tokens.borders.width.thin,
      borderColor: tokens.colors.primary.main,
    }),
  };

  const textStyle: TextStyle = {
    fontSize: getFontSize(),
    fontWeight: tokens.typography.body.fontWeight === '600' ? '600' : '600',
    color: getTextColor(),
    marginLeft: icon ? tokens.spacing.sm : 0,
  };

  const content = (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getTextColor()}
          testID={testID ? `${testID}-spinner` : undefined}
        />
      ) : (
        <>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={textStyle}>{children}</Text>
        </>
      )}
    </View>
  );

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
        disabled={isDisabled}
        activeOpacity={0.8}
        testID={testID}
        accessible={true}
        accessibilityRole="button"
        accessibilityState={{
          disabled: isDisabled,
          busy: loading,
        }}
        accessibilityLabel={typeof children === 'string' ? children : undefined}
      >
        {shouldUseGradient() ? (
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={buttonStyle}
          >
            {content}
          </LinearGradient>
        ) : (
          <View style={buttonStyle}>{content}</View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
});
