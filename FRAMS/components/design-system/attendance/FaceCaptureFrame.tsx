/**
 * FaceCaptureFrame Component
 * 
 * An animated frame component for face recognition capture with color-coded
 * border states and real-time feedback messages.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../../lib/design-system/ThemeContext';

/**
 * Face capture state types
 */
export type FaceCaptureState = 'recognized' | 'unknown' | 'lowLight' | 'idle';

/**
 * FaceCaptureFrame component props
 */
export interface FaceCaptureFrameProps {
  /**
   * Current capture state (determines border color)
   */
  state: FaceCaptureState;
  
  /**
   * Feedback message to display
   */
  feedbackMessage?: string;
  
  /**
   * Frame content (camera view)
   */
  children?: React.ReactNode;
  
  /**
   * Optional test ID
   */
  testID?: string;
}

/**
 * Get border color based on capture state
 */
function getBorderColor(state: FaceCaptureState, tokens: any): string {
  switch (state) {
    case 'recognized':
      return tokens.colors.success.main; // Green
    case 'unknown':
      return tokens.colors.error.main; // Red
    case 'lowLight':
      return tokens.colors.warning.main; // Amber
    case 'idle':
    default:
      return tokens.colors.primary.main; // Indigo
  }
}

/**
 * FaceCaptureFrame Component
 * 
 * Displays an animated frame around the face capture zone with:
 * - Color-coded borders based on recognition state
 * - Pulse animation on the border
 * - Real-time feedback messages
 * - Respects reduced motion preferences
 * 
 * @example
 * <FaceCaptureFrame 
 *   state="recognized" 
 *   feedbackMessage="Face recognized!"
 * >
 *   <CameraView />
 * </FaceCaptureFrame>
 */
export default function FaceCaptureFrame({
  state,
  feedbackMessage,
  children,
  testID = 'face-capture-frame',
}: FaceCaptureFrameProps) {
  const { tokens, reducedMotion } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const borderColor = getBorderColor(state, tokens);

  useEffect(() => {
    if (reducedMotion) {
      // No animation in reduced motion mode
      return;
    }

    // Pulse animation for the border
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
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

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, [reducedMotion, pulseAnim, tokens.motion.duration.slow]);

  const frameStyle: ViewStyle = {
    borderWidth: 4,
    borderColor: borderColor,
    borderRadius: tokens.borders.radius.large,
    padding: tokens.spacing.md,
    position: 'relative',
  };

  const animatedFrameStyle = {
    ...frameStyle,
    transform: [{ scale: pulseAnim }],
  };

  const feedbackStyle: TextStyle = {
    color: borderColor,
    fontSize: tokens.typography.body.fontSize,
    fontWeight: tokens.typography.body.fontWeight as any,
    textAlign: 'center',
    marginTop: tokens.spacing.md,
  };

  return (
    <View style={styles.container} testID={testID}>
      {reducedMotion ? (
        <View style={frameStyle} testID={`${testID}-frame`}>
          {children}
        </View>
      ) : (
        <Animated.View style={animatedFrameStyle} testID={`${testID}-frame`}>
          {children}
        </Animated.View>
      )}
      
      {feedbackMessage && (
        <Text 
          style={feedbackStyle} 
          testID={`${testID}-feedback`}
          accessibilityRole="text"
          accessibilityLiveRegion="polite"
        >
          {feedbackMessage}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
