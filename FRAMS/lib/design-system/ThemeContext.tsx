/**
 * Theme Context and Provider
 * 
 * Provides theme configuration, tokens, and theme switching functionality
 * to all components in the application.
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AccessibilityInfo } from 'react-native';
import { DesignTokens, tokens } from './tokens';
import { ColorToken } from './tokens/colors';

/**
 * Theme mode type
 */
export type ThemeMode = 'light' | 'dark';

/**
 * User role type
 */
export type UserRole = 'student' | 'teacher' | 'admin' | null;

/**
 * Theme configuration interface
 */
export interface ThemeConfig {
  mode: ThemeMode;
  role: UserRole;
  reducedMotion: boolean;
}

/**
 * Theme context value interface
 */
export interface ThemeContextValue {
  mode: ThemeMode;
  role: UserRole;
  tokens: DesignTokens;
  toggleMode: () => void;
  setRole: (role: UserRole) => void;
  reducedMotion: boolean;
  getRoleColor: () => ColorToken | null;
  getBackgroundColor: () => string;
  getSurfaceColor: () => string;
  getTextColor: () => string;
  getTextSecondaryColor: () => string;
  getBorderColor: () => string;
  getCardColor: () => string;
  getInputColor: () => string;
  getInputDisabledColor: () => string;
  getSecondaryButtonColor: () => string;
  getSecondaryButtonTextColor: () => string;
}

/**
 * Storage key for theme configuration
 */
const THEME_STORAGE_KEY = '@frams_theme_config';

/**
 * Default theme configuration
 */
const defaultThemeConfig: ThemeConfig = {
  mode: 'light',
  role: null,
  reducedMotion: false,
};

/**
 * Theme Context
 */
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Theme Provider Props
 */
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Theme Provider Component
 * 
 * Wraps the application and provides theme context to all child components.
 * Handles theme persistence, mode switching, role switching, and reduced motion detection.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setMode] = useState<ThemeMode>(defaultThemeConfig.mode);
  const [role, setRoleState] = useState<UserRole>(defaultThemeConfig.role);
  const [reducedMotion, setReducedMotion] = useState<boolean>(defaultThemeConfig.reducedMotion);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load theme configuration from AsyncStorage on mount
   */
  useEffect(() => {
    // Load config and detect reduced motion in parallel
    Promise.all([loadThemeConfig(), detectReducedMotion()]);
  }, []);

  /**
   * Save theme configuration whenever it changes (debounced)
   */
  useEffect(() => {
    if (!isLoading) {
      // Debounce saves to avoid excessive writes
      const timer = setTimeout(() => {
        saveThemeConfig();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [mode, role, isLoading]);

  /**
   * Load theme configuration from storage
   */
  const loadThemeConfig = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const config: ThemeConfig = JSON.parse(stored);
        setMode(config.mode || defaultThemeConfig.mode);
        setRoleState(config.role || defaultThemeConfig.role);
        // Don't load reducedMotion from storage, always detect from system
      }
    } catch (error) {
      console.error('Error loading theme config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Save theme configuration to storage
   */
  const saveThemeConfig = async () => {
    try {
      const config: ThemeConfig = {
        mode,
        role,
        reducedMotion, // Save for reference, but always detect on load
      };
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving theme config:', error);
    }
  };

  /**
   * Detect reduced motion preference from system
   */
  const detectReducedMotion = async () => {
    try {
      const isReduceMotionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReducedMotion(isReduceMotionEnabled);

      // Listen for changes
      const subscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        setReducedMotion
      );

      return () => {
        subscription.remove();
      };
    } catch (error) {
      console.error('Error detecting reduced motion:', error);
      setReducedMotion(false);
    }
  };

  /**
   * Toggle between light and dark mode
   */
  const toggleMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  /**
   * Set user role
   */
  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
  };

  /**
   * Get role-specific color token
   */
  const getRoleColor = (): ColorToken | null => {
    if (!role) return null;
    return tokens.colors.roles[role];
  };

  /**
   * Get background color based on current mode
   */
  const getBackgroundColor = (): string => {
    return tokens.colors.theme[mode].background;
  };

  /**
   * Get surface color based on current mode
   */
  const getSurfaceColor = (): string => {
    return tokens.colors.theme[mode].surface;
  };

  /**
   * Get text color based on current mode
   */
  const getTextColor = (): string => {
    return tokens.colors.theme[mode].text;
  };

  /**
   * Get secondary text color based on current mode
   */
  const getTextSecondaryColor = (): string => {
    return tokens.colors.theme[mode].textSecondary;
  };

  /**
   * Get border color based on current mode
   */
  const getBorderColor = (): string => {
    return tokens.colors.theme[mode].border;
  };

  /**
   * Get card color based on current mode
   */
  const getCardColor = (): string => {
    return tokens.colors.theme[mode].card;
  };

  /**
   * Get input color based on current mode
   */
  const getInputColor = (): string => {
    return tokens.colors.theme[mode].input;
  };

  /**
   * Get input disabled color based on current mode
   */
  const getInputDisabledColor = (): string => {
    return tokens.colors.theme[mode].inputDisabled;
  };

  /**
   * Get secondary button color based on current mode
   */
  const getSecondaryButtonColor = (): string => {
    return tokens.colors.theme[mode].secondaryButton;
  };

  /**
   * Get secondary button text color based on current mode
   */
  const getSecondaryButtonTextColor = (): string => {
    return tokens.colors.theme[mode].secondaryButtonText;
  };

  const value: ThemeContextValue = {
    mode,
    role,
    tokens,
    toggleMode,
    setRole,
    reducedMotion,
    getRoleColor,
    getBackgroundColor,
    getSurfaceColor,
    getTextColor,
    getTextSecondaryColor,
    getBorderColor,
    getCardColor,
    getInputColor,
    getInputDisabledColor,
    getSecondaryButtonColor,
    getSecondaryButtonTextColor,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * useTheme Hook
 * 
 * Custom hook to consume theme context in components.
 * Throws an error if used outside of ThemeProvider.
 * 
 * @returns ThemeContextValue
 * 
 * @example
 * const { tokens, mode, role, toggleMode } = useTheme();
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
