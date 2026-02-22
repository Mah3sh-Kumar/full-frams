/**
 * Motion Design Tokens
 * 
 * Defines animation timing, easing functions, and transform presets
 * for consistent motion throughout the application.
 */

export interface DurationTokens {
  fast: number;      // 120ms - Quick interactions
  normal: number;    // 220ms - Standard animations
  slow: number;      // 350ms - Page transitions
}

export interface EasingTokens {
  standard: string;  // Standard easing curve
}

export interface TransformTokens {
  cardHover: string;    // Scale transform for card hover
  buttonPress: string;  // Scale transform for button press
}

export interface MotionTokens {
  duration: DurationTokens;
  easing: EasingTokens;
  transforms: TransformTokens;
}

/**
 * Animation Durations
 */
export const duration: DurationTokens = {
  fast: 120,
  normal: 220,
  slow: 350,
};

/**
 * Easing Functions
 */
export const easing: EasingTokens = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

/**
 * Transform Presets
 */
export const transforms: TransformTokens = {
  cardHover: 'scale(1.02)',
  buttonPress: 'scale(0.96)',
};

/**
 * Complete Motion Token System
 */
export const motion: MotionTokens = {
  duration,
  easing,
  transforms,
};
