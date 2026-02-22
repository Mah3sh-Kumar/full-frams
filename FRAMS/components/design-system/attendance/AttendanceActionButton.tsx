/**
 * AttendanceActionButton Component
 * 
 * A circular action button for attendance workflows with gradient glow effect
 * and pulse animation.
 */

import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../../lib/design-system/ThemeContext';

/**
 * AttendanceActionButton component props
 */
export interface AttendanceActionButtonProps {
  /**
   * Press handler
   */
  onPress: () => void;
  
  /**
   * Button content (icon or text)
   */
  children?: React.ReactNode;
  
  /**
   * Optional test ID
   */
  testID?: string;
  
  /**
   * Disabled state
   */
  disabled?: boolean;
}

/**
 * AttendanceActionButton Component
 * 
 * Displays a circular 72px button with:
 * - Gradient glow effect
 * - Pulse animation
 * - Design token integration
 * - Respects reduced motion preferences
 * 
 * @example
 * <AttendanceActionButton onPress={handleCapture}>
 *   <Icon name="camera" />
 * </AttendanceActionButton>
 */
export default function AttendanceActionButton({
  onPress,
  children,
  testID = 'attendance-action-button',
  disabled = false,
}: AttendanceActionButtonProps) {
  const { tokens, reducedMotion } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (reducedMotion || disabled) {
      // No animation in reduced motion mode or when disabled
      return;
    }

    // Pulse animation for the button
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: tokens.motion.duration.slow,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: tokens.motion.duration.slow,
          useNativeDriver: true,
        }),
      ])
    );

    // Glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: tokens.motion.duration.slow * 2,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.6,
          duration: tokens.motion.duration.slow * 2,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    glowAnimation.start();

    return () => {
      pulseAnimation.stop();
      glowAnimation.stop();
    };
  }, [reducedMotion, disabled, pulseAnim, glowAnim, tokens.motion.duration.slow]);

  const buttonStyle: ViewStyle = {
    width: 72,
    height: 72,
    borderRadius: 36, // Half of 72 for perfect circle
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
  };

  const animatedButtonStyle = {
    ...buttonStyle,
    transform: [{ scale: pulseAnim }],
  };

  const glowStyle: ViewStyle = {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    ...tokens.shadows.lg,
  };

  const animatedGlowStyle = {
    ...glowStyle,
    opacity: glowAnim,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel="Attendance action"
    >
      {/* Gradient glow effect */}
      {!reducedMotion && !disabled && (
        <Animated.View style={animatedGlowStyle} testID={`${testID}-glow`}>
          <LinearGradient
            colors={tokens.colors.primary.gradient}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </Animated.View>
      )}
      
      {/* Main button */}
      {reducedMotion || disabled ? (
        <LinearGradient
          colors={tokens.colors.primary.gradient}
          style={buttonStyle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          testID={`${testID}-gradient`}
        >
          {children}
        </LinearGradient>
      ) : (
        <Animated.View style={animatedButtonStyle}>
          <LinearGradient
            colors={tokens.colors.primary.gradient}
            style={styles.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            testID={`${testID}-gradient`}
          >
            {children}
          </LinearGradient>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
