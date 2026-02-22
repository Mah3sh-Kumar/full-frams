/**
 * LoadingSpinner Component
 * 
 * A loading indicator with skeleton shimmer animation and size variants.
 * Respects reduced motion preferences and uses design tokens for consistency.
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../../lib/design-system/ThemeContext';

export type LoadingSpinnerSize = 'small' | 'medium' | 'large';

export interface LoadingSpinnerProps {
  /**
   * Size variant of the spinner
   * @default 'medium'
   */
  size?: LoadingSpinnerSize;
  
  /**
   * Custom color for the spinner (overrides theme color)
   */
  color?: string;
  
  /**
   * Test ID for testing
   */
  testID?: string;
}

/**
 * Get spinner dimensions based on size
 */
function getSpinnerDimensions(size: LoadingSpinnerSize): number {
  switch (size) {
    case 'small':
      return 24;
    case 'large':
      return 64;
    case 'medium':
    default:
      return 40;
  }
}

/**
 * LoadingSpinner Component
 * 
 * Displays an animated loading indicator with shimmer effect.
 * Automatically respects reduced motion preferences.
 * 
 * @example
 * <LoadingSpinner size="medium" />
 * <LoadingSpinner size="large" color="#4f46e5" />
 */
export default function LoadingSpinner({
  size = 'medium',
  color,
  testID = 'loading-spinner',
}: LoadingSpinnerProps) {
  const { tokens, reducedMotion } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const spinnerColor = color || tokens.colors.primary.main;
  const dimensions = getSpinnerDimensions(size);

  useEffect(() => {
    if (reducedMotion) {
      // No animation in reduced motion mode
      return;
    }

    // Shimmer animation (opacity pulse)
    const shimmerAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: tokens.motion.duration.slow,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: tokens.motion.duration.slow,
          useNativeDriver: true,
        }),
      ])
    );

    // Rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    );

    shimmerAnimation.start();
    rotateAnimation.start();

    return () => {
      shimmerAnimation.stop();
      rotateAnimation.stop();
    };
  }, [reducedMotion, shimmerAnim, rotateAnim, tokens.motion.duration.slow]);

  // Interpolate opacity for shimmer effect
  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  // Interpolate rotation
  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const staticSpinnerStyle: ViewStyle = {
    width: dimensions,
    height: dimensions,
    borderRadius: dimensions / 2,
    borderWidth: dimensions / 8,
    borderColor: spinnerColor,
    borderTopColor: 'transparent',
    opacity: 1,
  };

  const animatedSpinnerStyle = {
    width: dimensions,
    height: dimensions,
    borderRadius: dimensions / 2,
    borderWidth: dimensions / 8,
    borderColor: spinnerColor,
    borderTopColor: 'transparent',
    opacity: shimmerOpacity,
    transform: [{ rotate: rotation }],
  };

  return (
    <View style={styles.container} testID={testID}>
      {reducedMotion ? (
        <View style={staticSpinnerStyle} testID={`${testID}-animated`} />
      ) : (
        <Animated.View style={animatedSpinnerStyle} testID={`${testID}-animated`} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
