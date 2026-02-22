import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, LogBox } from 'react-native';
import { Snackbar } from 'react-native-paper';
import { useTheme } from '../lib/design-system/ThemeContext';

// Suppress LogBox visual notifications - we'll show our own toast notifications
LogBox.ignoreAllLogs(true);

interface ToastContextType {
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
    showInfo: (message: string) => void;
    showWarning: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Default tokens for when ThemeProvider is not available
const defaultTokens = {
    colors: {
        success: { main: '#15803d', contrast: '#ffffff' },
        error: { main: '#b91c1c', contrast: '#ffffff' },
        warning: { main: '#a16207', contrast: '#000000' },
        info: { main: '#1d4ed8', contrast: '#ffffff' }
    }
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<'success' | 'error' | 'info' | 'warning'>('info');
    const logBoxHandlerRef = useRef<((args: { message: string; type: 'error' | 'warn' | 'info' }) => void) | null>(null);
    
    // Use theme safely with error boundary fallback
    let theme;
    try {
        theme = useTheme();
    } catch (error) {
        // If outside ThemeProvider, use default tokens
        theme = null;
    }
    
    const tokens = theme?.tokens || defaultTokens;
    const mode = theme?.mode || 'light';
    const isThemeReadyRef = useRef(!!theme);

    const showToast = useCallback((msg: string, toastType: 'success' | 'error' | 'info' | 'warning') => {
        // Limit message length for better UI display
        const truncatedMsg = msg.length > 150 ? msg.substring(0, 150) + '...' : msg;
        setMessage(truncatedMsg);
        setType(toastType);
        setVisible(true);
    }, []);

    const showSuccess = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
    const showError = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
    const showInfo = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);
    const showWarning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);

    const getToastStyle = () => {
        switch (type) {
            case 'success':
                return {
                    backgroundColor: tokens.colors.success.main,
                    contrastColor: tokens.colors.success.contrast,
                    icon: 'checkmark-circle-outline'
                };
            case 'error':
                return {
                    backgroundColor: tokens.colors.error.main,
                    contrastColor: tokens.colors.error.contrast,
                    icon: 'alert-circle-outline'
                };
            case 'warning':
                return {
                    backgroundColor: tokens.colors.warning?.main || '#F59E0B',
                    contrastColor: tokens.colors.warning?.contrast || '#FFFFFF',
                    icon: 'warning-outline'
                };
            case 'info':
            default:
                return {
                    backgroundColor: tokens.colors.info.main,
                    contrastColor: tokens.colors.info.contrast,
                    icon: 'information-circle-outline'
                };
        }
    };

    // LogBox error handling - intercept all console errors/warnings and show toast
    useEffect(() => {
        // Only intercept logs if theme is ready to avoid circular issues
        if (!isThemeReadyRef.current) {
            return;
        }

        // Store reference to showError for use in handler
        logBoxHandlerRef.current = ({ message, type: logType }) => {
            if (logType === 'error') {
                showToast(message, 'error');
            } else if (logType === 'warn') {
                showToast(message, 'warning');
            } else {
                showToast(message, 'info');
            }
        };

        // Override console methods to show toast notifications
        const originalLogError = console.error;
        const originalLogWarn = console.warn;

        console.error = (...args: any[]) => {
            originalLogError.apply(console, args);
            // Skip theme-related errors to avoid loops
            const message = args.map(arg => 
                typeof arg === 'string' ? arg : arg instanceof Error ? arg.message : String(arg)
            ).join(' ');
            if (message && !message.includes('useTheme must be used within a ThemeProvider') && logBoxHandlerRef.current) {
                logBoxHandlerRef.current({ message, type: 'error' });
            }
        };

        console.warn = (...args: any[]) => {
            originalLogWarn.apply(console, args);
            const message = args.map(arg => 
                typeof arg === 'string' ? arg : arg instanceof Error ? arg.message : String(arg)
            ).join(' ');
            if (message && logBoxHandlerRef.current) {
                logBoxHandlerRef.current({ message, type: 'warn' });
            }
        };

        return () => {
            console.error = originalLogError;
            console.warn = originalLogWarn;
        };
    }, [showToast]);

    const toastStyle = getToastStyle();

    return (
        <ToastContext.Provider value={{ showSuccess, showError, showInfo, showWarning }}>
            {children}
            <Snackbar
                visible={visible}
                onDismiss={() => setVisible(false)}
                duration={type === 'error' ? 5000 : 3000}
                style={[
                    styles.snackbar, 
                    { 
                        backgroundColor: toastStyle.backgroundColor,
                        borderLeftWidth: 4,
                        borderLeftColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'
                    }
                ]}
                action={{
                    label: 'Close',
                    onPress: () => setVisible(false),
                    textColor: toastStyle.contrastColor,
                }}
            >
                <Animated.Text 
                    style={{ 
                        color: toastStyle.contrastColor,
                        fontWeight: type === 'error' ? '600' : '400'
                    }}
                    numberOfLines={3}
                >
                    {message}
                </Animated.Text>
            </Snackbar>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

const styles = StyleSheet.create({
    snackbar: {
        marginBottom: 20,
        marginHorizontal: 16,
        borderRadius: 8,
    },
});
