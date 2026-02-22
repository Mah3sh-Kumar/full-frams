/**
 * Accessibility Utilities
 * 
 * Provides utilities for ensuring WCAG compliance and accessibility standards.
 */

/**
 * Calculate relative luminance of a color
 * Based on WCAG 2.0 formula
 * 
 * @param hexColor - Hex color string (with or without #)
 * @returns Relative luminance value between 0 and 1
 */
export function getLuminance(hexColor: string): number {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  
  // Apply gamma correction
  const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.0 formula
 * 
 * @param color1 - First hex color string
 * @param color2 - Second hex color string
 * @returns Contrast ratio between 1 and 21
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color combination meets WCAG AA contrast requirements
 * 
 * @param foreground - Foreground hex color
 * @param background - Background hex color
 * @param level - WCAG level ('AA' or 'AAA')
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns True if contrast meets requirements
 */
export function meetsContrastRequirements(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AAA') {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
  }
  
  // AA level
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Validate touch target size meets accessibility standards
 * 
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @param minSize - Minimum size requirement (default 48px per WCAG)
 * @returns True if touch target meets minimum size
 */
export function validateTouchTarget(
  width: number,
  height: number,
  minSize: number = 48
): boolean {
  return width >= minSize && height >= minSize;
}

/**
 * Get the minimum touch target size
 * 
 * @returns Minimum touch target size in pixels
 */
export function getMinTouchTargetSize(): number {
  return 48;
}

/**
 * Calculate required hitSlop to meet minimum touch target
 * 
 * @param currentWidth - Current element width
 * @param currentHeight - Current element height
 * @param minSize - Minimum size requirement
 * @returns HitSlop object with top, right, bottom, left values
 */
export function calculateRequiredHitSlop(
  currentWidth: number,
  currentHeight: number,
  minSize: number = 48
): { top: number; right: number; bottom: number; left: number } {
  const horizontalSlop = Math.max(0, (minSize - currentWidth) / 2);
  const verticalSlop = Math.max(0, (minSize - currentHeight) / 2);
  
  return {
    top: verticalSlop,
    right: horizontalSlop,
    bottom: verticalSlop,
    left: horizontalSlop,
  };
}
