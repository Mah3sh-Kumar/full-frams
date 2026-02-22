/**
 * Animation Utilities
 * 
 * Provides standard animation presets, reduced motion wrapper,
 * and native driver helpers for consistent animations throughout the application.
 */

import { Animated, InteractionManager } from 'react-native';
import { motion } from './tokens/motion';

/**
 * Animation configuration interface
 */
export interface AnimationConfig {
  toValue: number;
  duration: number;
  easing?: (value: number) => number;
  useNativeDriver?: boolean;
  delay?: number;
}

/**
 * Standard animation presets
 */
export const animationPresets = {
  /**
   * Card hover animation
   * Scale up slightly with smooth timing
   */
  cardHover: (animatedValue: Animated.Value, reducedMotion: boolean = false): Animated.CompositeAnimation => {
    return Animated.timing(animatedValue, {
      toValue: 1.02,
      duration: reducedMotion ? 0 : motion.duration.normal,
      useNativeDriver: true,
    });
  },

  /**
   * Card hover out animation
   * Return to normal scale
   */
  cardHoverOut: (animatedValue: Animated.Value, reducedMotion: boolean = false): Animated.CompositeAnimation => {
    return Animated.timing(animatedValue, {
      toValue: 1,
      duration: reducedMotion ? 0 : motion.duration.normal,
      useNativeDriver: true,
    });
  },

  /**
   * Button press animation
   * Scale down slightly for press feedback
   */
  buttonPress: (animatedValue: Animated.Value, reducedMotion: boolean = false): Animated.CompositeAnimation => {
    return Animated.timing(animatedValue, {
      toValue: 0.96,
      duration: reducedMotion ? 0 : motion.duration.fast,
      useNativeDriver: true,
    });
  },

  /**
   * Button release animation
   * Return to normal scale
   */
  buttonRelease: (animatedValue: Animated.Value, reducedMotion: boolean = false): Animated.CompositeAnimation => {
    return Animated.timing(animatedValue, {
      toValue: 1,
      duration: reducedMotion ? 0 : motion.duration.fast,
      useNativeDriver: true,
    });
  },

  /**
   * Page transition fade in
   * Fade from transparent to opaque
   */
  pageTransitionFadeIn: (animatedValue: Animated.Value, reducedMotion: boolean = false): Animated.CompositeAnimation => {
    return Animated.timing(animatedValue, {
      toValue: 1,
      duration: reducedMotion ? 0 : motion.duration.slow,
      useNativeDriver: true,
    });
  },

  /**
   * Page transition fade out
   * Fade from opaque to transparent
   */
  pageTransitionFadeOut: (animatedValue: Animated.Value, reducedMotion: boolean = false): Animated.CompositeAnimation => {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration: reducedMotion ? 0 : motion.duration.slow,
      useNativeDriver: true,
    });
  },

  /**
   * Page transition slide up
   * Slide from bottom with fade
   */
  pageTransitionSlideUp: (
    opacityValue: Animated.Value,
    translateValue: Animated.Value,
    reducedMotion: boolean = false
  ): Animated.CompositeAnimation => {
    return Animated.parallel([
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: reducedMotion ? 0 : motion.duration.slow,
        useNativeDriver: true,
      }),
      Animated.timing(translateValue, {
        toValue: 0,
        duration: reducedMotion ? 0 : motion.duration.slow,
        useNativeDriver: true,
      }),
    ]);
  },
};

/**
 * Reduced motion wrapper
 * 
 * Wraps an animation and returns either the animation or a no-op
 * based on the reducedMotion preference.
 * 
 * @param animation - The animation to wrap
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns The animation or a no-op animation
 */
export function withReducedMotion(
  animation: Animated.CompositeAnimation,
  reducedMotion: boolean
): Animated.CompositeAnimation {
  if (reducedMotion) {
    // Return a no-op animation that completes immediately
    return {
      start: (callback?: Animated.EndCallback) => {
        if (callback) {
          callback({ finished: true });
        }
      },
      stop: () => {},
      reset: () => {},
    } as Animated.CompositeAnimation;
  }
  return animation;
}

/**
 * Create animation with reduced motion support
 * 
 * Helper function to create an animation that respects reduced motion preferences.
 * 
 * @param animatedValue - The animated value to animate
 * @param config - Animation configuration
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns Animated.CompositeAnimation
 */
export function createAnimation(
  animatedValue: Animated.Value,
  config: AnimationConfig,
  reducedMotion: boolean = false
): Animated.CompositeAnimation {
  const finalConfig = {
    ...config,
    duration: reducedMotion ? 0 : config.duration,
    useNativeDriver: config.useNativeDriver !== false, // Default to true
  };

  return Animated.timing(animatedValue, finalConfig);
}

/**
 * Native driver helper
 * 
 * Ensures animations use the native driver when possible.
 * Only transform and opacity can use native driver.
 * 
 * @param config - Animation configuration
 * @returns Updated configuration with useNativeDriver set appropriately
 */
export function withNativeDriver(config: AnimationConfig): AnimationConfig {
  return {
    ...config,
    useNativeDriver: true,
  };
}

/**
 * Check if a property can use native driver
 * 
 * Only transform and opacity properties can use native driver.
 * Layout properties (width, height, padding, etc.) cannot.
 * 
 * @param property - The property name to check
 * @returns Whether the property can use native driver
 */
export function canUseNativeDriver(property: string): boolean {
  const nativeDriverProperties = [
    'opacity',
    'transform',
    'translateX',
    'translateY',
    'scale',
    'scaleX',
    'scaleY',
    'rotate',
    'rotateX',
    'rotateY',
    'rotateZ',
  ];

  return nativeDriverProperties.includes(property);
}

/**
 * Defer animation until after interactions
 * 
 * Useful for non-critical animations that shouldn't block user interactions.
 * 
 * @param animation - The animation to defer
 * @returns Promise that resolves when animation completes
 */
export function deferAnimation(
  animation: Animated.CompositeAnimation
): Promise<void> {
  return new Promise((resolve) => {
    InteractionManager.runAfterInteractions(() => {
      animation.start(() => {
        resolve();
      });
    });
  });
}

/**
 * Spring animation with reduced motion support
 * 
 * Creates a spring animation that respects reduced motion preferences.
 * 
 * @param animatedValue - The animated value to animate
 * @param toValue - Target value
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns Animated.CompositeAnimation
 */
export function createSpring(
  animatedValue: Animated.Value,
  toValue: number,
  reducedMotion: boolean = false
): Animated.CompositeAnimation {
  if (reducedMotion) {
    // Use timing with 0 duration for reduced motion
    return Animated.timing(animatedValue, {
      toValue,
      duration: 0,
      useNativeDriver: true,
    });
  }

  return Animated.spring(animatedValue, {
    toValue,
    useNativeDriver: true,
    tension: 40,
    friction: 7,
  });
}

/**
 * Sequence animations with reduced motion support
 * 
 * Creates a sequence of animations that respects reduced motion preferences.
 * 
 * @param animations - Array of animations to sequence
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns Animated.CompositeAnimation
 */
export function createSequence(
  animations: Animated.CompositeAnimation[],
  reducedMotion: boolean = false
): Animated.CompositeAnimation {
  if (reducedMotion) {
    // Return a no-op animation
    return {
      start: (callback?: Animated.EndCallback) => {
        if (callback) {
          callback({ finished: true });
        }
      },
      stop: () => {},
      reset: () => {},
    } as Animated.CompositeAnimation;
  }

  return Animated.sequence(animations);
}

/**
 * Parallel animations with reduced motion support
 * 
 * Creates parallel animations that respect reduced motion preferences.
 * 
 * @param animations - Array of animations to run in parallel
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns Animated.CompositeAnimation
 */
export function createParallel(
  animations: Animated.CompositeAnimation[],
  reducedMotion: boolean = false
): Animated.CompositeAnimation {
  if (reducedMotion) {
    // Return a no-op animation
    return {
      start: (callback?: Animated.EndCallback) => {
        if (callback) {
          callback({ finished: true });
        }
      },
      stop: () => {},
      reset: () => {},
    } as Animated.CompositeAnimation;
  }

  return Animated.parallel(animations);
}

/**
 * Get animation duration based on reduced motion preference
 * 
 * @param duration - The normal duration
 * @param reducedMotion - Whether reduced motion is enabled
 * @returns The duration (0 if reduced motion is enabled)
 */
export function getAnimationDuration(
  duration: number,
  reducedMotion: boolean = false
): number {
  return reducedMotion ? 0 : duration;
}

/**
 * Extract easing function from cubic-bezier string
 * 
 * Parses a cubic-bezier string and returns the values.
 * 
 * @param easingString - The easing string (e.g., 'cubic-bezier(0.4, 0, 0.2, 1)')
 * @returns Array of four numbers or null if invalid
 */
export function parseEasing(easingString: string): number[] | null {
  // Updated regex to handle scientific notation (e.g., 5e-324)
  const match = easingString.match(/cubic-bezier\(([\d.eE+-]+),\s*([\d.eE+-]+),\s*([\d.eE+-]+),\s*([\d.eE+-]+)\)/);
  if (!match) return null;
  
  return [
    parseFloat(match[1]),
    parseFloat(match[2]),
    parseFloat(match[3]),
    parseFloat(match[4]),
  ];
}

/**
 * Validate easing function format
 * 
 * Checks if an easing string is in the correct cubic-bezier format.
 * 
 * @param easingString - The easing string to validate
 * @returns Whether the easing string is valid
 */
export function isValidEasing(easingString: string): boolean {
  return parseEasing(easingString) !== null;
}
