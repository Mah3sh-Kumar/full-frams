/**
 * Spacing Design Tokens
 * 
 * Implements the 8pt grid system with base unit of 4px.
 * All spacing values are multiples of 4 to ensure consistent alignment.
 */

export interface SpacingScale {
  xs: number;    // 4px - Extra small
  sm: number;    // 8px - Small
  md: number;    // 16px - Medium
  lg: number;    // 24px - Large
  xl: number;    // 32px - Extra large
  xxl: number;   // 48px - Extra extra large
}

/**
 * Spacing Scale following 8pt grid system
 * Base unit: 4px
 */
export const spacing: SpacingScale = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

/**
 * Section gaps for larger layout spacing
 */
export const sectionGap = 24;

/**
 * Component-specific spacing
 */
export const componentSpacing = {
  buttonPadding: {
    horizontal: 24,
    vertical: 12,
  },
  inputPadding: {
    horizontal: 16,
    vertical: 16,
  },
  cardPadding: 16,
  containerPadding: 16,
};
