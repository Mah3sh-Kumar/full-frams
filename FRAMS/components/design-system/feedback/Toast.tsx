/**
 * Toast Component
 * 
 * A feedback component that displays temporary messages with type variants,
 * auto-dismiss functionality, animations, and haptic feedback.
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../lib/design-system/ThemeContext';

/**
 * Toast type variants
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast component props
 */
export interface ToastProps {
  /** Type of toast - determines color and icon */
  type: ToastType;
  /** Message to display */
  message: string;
  /** Duration in milliseconds before auto-dismiss (default: 3000) */
  duration?: number;
  /** Callback when toast is dismissed */
  onDismiss: () => void;
  /** Enable haptic feedback (default: true) */
  haptic?: boolean;
  /** Optional test ID */
  testID?: string;
}

/**
 * Toast Component
 * 
 * Implements design system specifications:
 * - Type variants: success (green), error (red), warning (yellow), info (blue)
 * - Auto-dismiss with configurable duration (default 3-5 seconds)
 * - Shake animation for errors
 * - Haptic feedback integration
 * - Top positioning
 * - Design tokens for colors and animations
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
export default function Toast({
  type,
  message,
  duration = 3000,
  onDismiss,
  haptic = true,
  testID,
}: ToastProps) {
  const { tokens, reducedMotion } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(-100)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  /**
   * Trigger haptic feedback based on toast type
   */
  const triggerHaptic = () => {
    if (!haptic || Platform.OS === 'web') return;

    try {
      switch (type) {
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'error':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case 'warning':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'info':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
      }
    } catch (error) {
      // Haptics not supported on this device
      console.warn('Haptics not supported:', error);
    }
  };

  /**
   * Animate toast entrance
   */
  const animateIn = () => {
    const animationDuration = reducedMotion ? 0 : tokens.motion.duration.normal;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Animate shake for error toasts
   */
  const animateShake = () => {
    if (reducedMotion) return;

    const shakeSequence = [
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ];

    Animated.sequence(shakeSequence).start();
  };

  /**
   * Animate toast exit
   */
  const animateOut = () => {
    const animationDuration = reducedMotion ? 0 : tokens.motion.duration.fast;

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: animationDuration,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -100,
        duration: animationDuration,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  /**
   * Initialize toast on mount
   */
  useEffect(() => {
    triggerHaptic();
    animateIn();

    // Shake animation for errors
    if (type === 'error') {
      setTimeout(() => {
        animateShake();
      }, tokens.motion.duration.normal);
    }

    // Auto-dismiss timer
    const timer = setTimeout(() => {
      animateOut();
    }, duration);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  /**
   * Get background color based on toast type
   */
  const getBackgroundColor = (): string => {
    switch (type) {
      case 'success':
        return tokens.colors.success.main;
      case 'error':
        return tokens.colors.error.main;
      case 'warning':
        return tokens.colors.warning.main;
      case 'info':
        return tokens.colors.info.main;
      default:
        return tokens.colors.info.main;
    }
  };

  /**
   * Get text color based on toast type
   */
  const getTextColor = (): string => {
    switch (type) {
      case 'success':
        return tokens.colors.success.contrast;
      case 'error':
        return tokens.colors.error.contrast;
      case 'warning':
        return tokens.colors.warning.contrast;
      case 'info':
        return tokens.colors.info.contrast;
      default:
        return tokens.colors.info.contrast;
    }
  };

  /**
   * Get icon emoji based on toast type
   */
  const getIcon = (): string => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  const containerStyle: ViewStyle = {
    backgroundColor: getBackgroundColor(),
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.borders.radius.medium,
    minHeight: 48,
    ...tokens.shadows.md,
  };

  return (
    <Animated.View
      style={[
        styles.container,
        containerStyle,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: translateYAnim },
            { translateX: shakeAnim },
          ],
        },
      ]}
      testID={testID}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.icon,
            {
              color: getTextColor(),
              fontSize: tokens.typography.h3.fontSize,
            },
          ]}
        >
          {getIcon()}
        </Text>
        <Text
          style={[
            styles.message,
            {
              color: getTextColor(),
              fontSize: tokens.typography.body.fontSize,
              fontWeight: tokens.typography.body.fontWeight,
            },
          ]}
        >
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
  },
});
