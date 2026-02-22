/**
 * Design System Tokens
 * 
 * Unified export of all design tokens for the FRAMS design system.
 * This is the single source of truth for all visual design attributes.
 */

import { colors, ColorPalette } from './colors';
import { spacing, SpacingScale, componentSpacing, sectionGap } from './spacing';
import { typography, TypographyScale, fontWeights, fontFamily } from './typography';
import { shadows, ElevationSystem } from './shadows';
import { motion, MotionTokens } from './motion';
import { borders, BorderTokens } from './borders';

/**
 * Complete Design Token Interface
 */
export interface DesignTokens {
  colors: ColorPalette;
  spacing: SpacingScale;
  typography: TypographyScale;
  shadows: ElevationSystem;
  motion: MotionTokens;
  borders: BorderTokens;
}

/**
 * Unified Design Token Export
 */
export const tokens: DesignTokens = {
  colors,
  spacing,
  typography,
  shadows,
  motion,
  borders,
};

/**
 * Export individual token groups for direct access
 */
export {
  colors,
  spacing,
  typography,
  shadows,
  motion,
  borders,
  componentSpacing,
  sectionGap,
  fontWeights,
  fontFamily,
};

/**
 * Export types for TypeScript support
 */
export type {
  ColorPalette,
  SpacingScale,
  TypographyScale,
  ElevationSystem,
  MotionTokens,
  BorderTokens,
};

export default tokens;
