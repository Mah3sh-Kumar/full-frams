import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../lib/design-system/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundaryInternal extends Component<Props & { theme: any }, State> {
  constructor(props: Props & { theme: any }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    const { theme } = this.props;
    const isDark = theme.mode === 'dark';

    if (this.state.hasError) {
      return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.getBackgroundColor() }]}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle-outline" size={80} color={theme.tokens.colors.feedback.error} />
            </View>
            
            <Text style={[styles.title, { color: theme.getTextColor() }]}>
              Oops! Something went wrong.
            </Text>
            <Text style={[styles.subtitle, { color: theme.getTextSecondaryColor() }]}>
              The app encountered an unexpected error. Our team has been notified.
            </Text>
            
            <View style={[
              styles.errorBox, 
              { 
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
                borderColor: theme.tokens.colors.feedback.error + '40'
              }
            ]}>
              <Text style={[styles.errorLabel, { color: theme.tokens.colors.feedback.error }]}>
                Error Details:
              </Text>
              <Text style={[styles.errorText, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
                {this.state.error?.name}: {this.state.error?.message}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme.tokens.colors.brand.primary }]} 
              onPress={this.resetError}
            >
              <Ionicons name="refresh-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

// Default theme values for when ThemeProvider is not available
const defaultTheme = {
  mode: 'light',
  tokens: {
    colors: {
      feedback: { error: '#b91c1c' },
      brand: { primary: '#4338ca' }
    }
  },
  getBackgroundColor: () => '#f8fafc',
  getTextColor: () => '#0f172a',
  getTextSecondaryColor: () => '#64748b'
};

const ErrorBoundary = (props: Props) => {
  let theme;
  try {
    theme = useTheme();
  } catch (e) {
    // ThemeProvider not available yet, use defaults
    theme = defaultTheme;
  }
  return <ErrorBoundaryInternal {...props} theme={theme} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 32,
    width: '100%',
  },
  errorLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  errorText: {
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorBoundary;
