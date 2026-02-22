/**
 * Migration helpers for transitioning from old theme to new design system
 * These utilities help map old theme values to new design tokens
 */

import { tokens } from './tokens';

/**
 * Maps old spacing values to new design tokens
 */
export const mapSpacing = {
  xs: tokens.spacing.xs,
  sm: tokens.spacing.sm,
  md: tokens.spacing.md,
  lg: tokens.spacing.lg,
  xl: tokens.spacing.xl,
  xxl: tokens.spacing.xxl,
};

/**
 * Maps old typography sizes to new design tokens
 */
export const mapTypography = {
  xs: tokens.typography.caption,
  sm: tokens.typography.caption,
  md: tokens.typography.body,
  lg: tokens.typography.h3,
  xl: tokens.typography.h2,
  xxl: tokens.typography.h2,
  xxxl: tokens.typography.h1,
};

/**
 * Maps old border radius to new design tokens
 */
export const mapBorderRadius = {
  sm: tokens.borders.radius.small,
  md: tokens.borders.radius.small,
  lg: tokens.borders.radius.medium,
  xl: tokens.borders.radius.medium,
  full: tokens.borders.radius.full,
};

/**
 * Maps old shadow values to new design tokens
 */
export const mapShadows = {
  sm: tokens.shadows.sm,
  md: tokens.shadows.md,
  lg: tokens.shadows.lg,
  xl: tokens.shadows.lg,
};
