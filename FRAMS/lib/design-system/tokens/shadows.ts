/**
 * Shadow/Elevation Design Tokens
 * 
 * Defines the elevation system with three levels of shadows
 * for creating visual hierarchy and depth.
 */

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: {
    width: number;
    height: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ElevationSystem {
  sm: ShadowStyle;
  md: ShadowStyle;
  lg: ShadowStyle;
}

/**
 * Elevation System
 * 
 * Small: Subtle elevation for cards and buttons
 * Medium: Standard elevation for floating elements
 * Large: High elevation for modals and overlays
 */
export const shadows: ElevationSystem = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 8,
  },
};
