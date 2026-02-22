/**
 * Admin-Specific Typography Tokens
 * 
 * Enhanced typography system for admin interfaces with better hierarchy,
 * readability, and professional appearance
 */

export interface AdminTypographyScale {
  // Admin-specific heading levels
  admin: {
    display: {
      large: TextStyle;
      medium: TextStyle;
      small: TextStyle;
    };
    headline: {
      large: TextStyle;
      medium: TextStyle;
      small: TextStyle;
    };
    title: {
      large: TextStyle;
      medium: TextStyle;
      small: TextStyle;
    };
  };
  
  // Data display typography
  data: {
    metric: TextStyle;
    label: TextStyle;
    value: TextStyle;
    caption: TextStyle;
  };
  
  // Interface text styles
  interface: {
    menuItem: TextStyle;
    button: TextStyle;
    badge: TextStyle;
    tooltip: TextStyle;
  };
}

interface TextStyle {
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  lineHeight: number;
  letterSpacing?: number;
}

// Admin display typography - for prominent headers and titles
export const display = {
  large: {
    fontSize: 57,
    fontWeight: 400 as const,
    lineHeight: 64,
    letterSpacing: -0.25,
  },
  medium: {
    fontSize: 45,
    fontWeight: 400 as const,
    lineHeight: 52,
    letterSpacing: 0,
  },
  small: {
    fontSize: 36,
    fontWeight: 400 as const,
    lineHeight: 44,
    letterSpacing: 0,
  },
};

// Admin headline typography - for section headers
export const headline = {
  large: {
    fontSize: 32,
    fontWeight: 400 as const,
    lineHeight: 40,
    letterSpacing: 0,
  },
  medium: {
    fontSize: 28,
    fontWeight: 400 as const,
    lineHeight: 36,
    letterSpacing: 0,
  },
  small: {
    fontSize: 24,
    fontWeight: 400 as const,
    lineHeight: 32,
    letterSpacing: 0,
  },
};

// Admin title typography - for card titles and subsections
export const title = {
  large: {
    fontSize: 22,
    fontWeight: 400 as const,
    lineHeight: 28,
    letterSpacing: 0,
  },
  medium: {
    fontSize: 16,
    fontWeight: 500 as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  small: {
    fontSize: 14,
    fontWeight: 500 as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
};

// Data display typography - for metrics and statistics
export const data = {
  metric: {
    fontSize: 36,
    fontWeight: 300 as const,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 14,
    fontWeight: 500 as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  value: {
    fontSize: 16,
    fontWeight: 400 as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  caption: {
    fontSize: 12,
    fontWeight: 400 as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
};

// Interface typography - for UI controls and navigation
export const interfaceStyles = {
  menuItem: {
    fontSize: 14,
    fontWeight: 500 as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  button: {
    fontSize: 14,
    fontWeight: 500 as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  badge: {
    fontSize: 12,
    fontWeight: 600 as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  tooltip: {
    fontSize: 12,
    fontWeight: 400 as const,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
};

// Complete admin typography scale
export const adminTypography: AdminTypographyScale = {
  admin: {
    display,
    headline,
    title,
  },
  data,
  interface: interfaceStyles,
};

// Utility functions for common admin text styles
export const adminTextPresets = {
  pageHeader: {
    ...headline.large,
    fontWeight: 500 as const,
  },
  sectionHeader: {
    ...title.large,
    fontWeight: 600 as const,
  },
  cardTitle: {
    ...title.medium,
    fontWeight: 600 as const,
  },
  statLabel: {
    ...data.label,
    fontWeight: 600 as const,
  },
  statValue: {
    ...data.metric,
    fontWeight: 300 as const,
  },
  body: {
    fontSize: 16,
    fontWeight: 400 as const,
    lineHeight: 24,
    letterSpacing: 0.15,
  },
  caption: {
    ...data.caption,
    fontWeight: 500 as const,
  },
};