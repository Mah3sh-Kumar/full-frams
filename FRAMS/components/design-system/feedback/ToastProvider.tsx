/**
 * Toast Provider
 * 
 * Context provider for displaying toasts from anywhere in the application.
 * Provides convenience methods for showing different toast types.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Toast, { ToastType } from './Toast';

/**
 * Toast configuration interface
 */
interface ToastConfig {
  type: ToastType;
  message: string;
  duration?: number;
  haptic?: boolean;
}

/**
 * Toast context interface
 */
interface ToastContextType {
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showToast: (config: ToastConfig) => void;
}

/**
 * Toast Context
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Toast Provider Props
 */
interface ToastProviderProps {
  children: ReactNode;
}

/**
 * Toast Provider Component
 * 
 * Wraps the application and provides toast display functionality
 * to all child components via context.
 */
export function ToastProvider({ children }: ToastProviderProps) {
  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);

  /**
   * Show a toast with custom configuration
   */
  const showToast = useCallback((config: ToastConfig) => {
    setToastConfig(config);
  }, []);

  /**
   * Show a success toast
   */
  const showSuccess = useCallback((message: string, duration?: number) => {
    showToast({ type: 'success', message, duration });
  }, [showToast]);

  /**
   * Show an error toast
   */
  const showError = useCallback((message: string, duration?: number) => {
    showToast({ type: 'error', message, duration });
  }, [showToast]);

  /**
   * Show a warning toast
   */
  const showWarning = useCallback((message: string, duration?: number) => {
    showToast({ type: 'warning', message, duration });
  }, [showToast]);

  /**
   * Show an info toast
   */
  const showInfo = useCallback((message: string, duration?: number) => {
    showToast({ type: 'info', message, duration });
  }, [showToast]);

  /**
   * Handle toast dismissal
   */
  const handleDismiss = useCallback(() => {
    setToastConfig(null);
  }, []);

  const value: ToastContextType = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showToast,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toastConfig && (
        <Toast
          type={toastConfig.type}
          message={toastConfig.message}
          duration={toastConfig.duration}
          haptic={toastConfig.haptic}
          onDismiss={handleDismiss}
        />
      )}
    </ToastContext.Provider>
  );
}

/**
 * useToast Hook
 * 
 * Custom hook to access toast functionality from any component.
 * Must be used within a ToastProvider.
 * 
 * @returns ToastContextType
 * 
 * @example
 * const { showSuccess, showError } = useToast();
 * showSuccess('Operation completed!');
 * showError('Something went wrong');
 */
export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
