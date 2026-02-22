/**
 * Typography Design Tokens
 * 
 * Defines the complete typography scale including:
 * - Font sizes
 * - Font weights
 * - Line heights
 * - Letter spacing
 */

export interface TypographyStyle {
  fontSize: number;
  lineHeight: number;
  fontWeight: '400' | '500' | '600' | '700';
  letterSpacing: number;
}

export interface TypographyScale {
  display: TypographyStyle;
  h1: TypographyStyle;
  h2: TypographyStyle;
  h3: TypographyStyle;
  body: TypographyStyle;
  caption: TypographyStyle;
}

export interface FontWeights {
  regular: '400';
  medium: '500';
  semibold: '600';
  bold: '700';
}

/**
 * Font Weights
 */
export const fontWeights: FontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

/**
 * Typography Scale
 * 
 * Display: 32px - Large headings, hero text
 * H1: 26px - Primary headings
 * H2: 22px - Secondary headings
 * H3: 18px - Tertiary headings
 * Body: 15px - Body text, paragraphs
 * Caption: 12px - Small text, labels
 */
export const typography: TypographyScale = {
  display: {
    fontSize: 32,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  h2: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  h3: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    letterSpacing: 0,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '400',
    letterSpacing: 0,
  },
  caption: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: '400',
    letterSpacing: 0.3,
  },
};

/**
 * Font Family
 * Using system fonts for optimal performance and native feel
 */
export const fontFamily = {
  regular: 'System',
  medium: 'System',
  semibold: 'System',
  bold: 'System',
};
