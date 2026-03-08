import 'react-native-gesture-handler';
import React, { useEffect, useRef, lazy, Suspense } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from './lib/types';
import { Provider as PaperProvider } from 'react-native-paper';
import { AuthProvider, useAuth } from './context/AuthContext';
import { View, ActivityIndicator, Linking } from 'react-native';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { paperTheme, paperDarkTheme } from './lib/theme';
import { parseDeepLink } from './lib/deeplink';
import type { NavigationContainerRef } from '@react-navigation/native';
import { ThemeProvider, useTheme } from './lib/design-system/ThemeContext';
import { tokens } from './lib/design-system/tokens';

// Auth Screens - Load immediately (needed for initial render)
import SignInScreen from './screens/SignInScreen';
import SignUpScreen from './screens/SignUpScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import EmailVerificationScreen from './screens/EmailVerificationScreen';
import UnverifiedScreen from './screens/UnverifiedScreen';

// Common Screens - Load immediately
import DashboardScreen from './screens/DashboardScreen';
import ProfileScreen from './screens/ProfileScreen';
import NotificationsScreen from './screens/NotificationsScreen';
import SettingsScreen from './screens/SettingsScreen';
import PrivacyPolicyScreen from './screens/PrivacyPolicyScreen';
import TermsScreen from './screens/TermsScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';

// Student Screens - Load immediately
import AttendanceScreen from './screens/student/AttendanceScreen';
import AssignmentScreen from './screens/student/AssignmentScreen';

// Teacher Screens - Load immediately
import AttendanceManager from './screens/teacher/AttendanceManager';
import AssignmentManager from './screens/teacher/AssignmentManager';
import MarksReviewManager from './screens/teacher/MarksReviewManager';

// Admin Screens - Load immediately
import UserManagement from './screens/admin/UserManagement';
import OrganizationManager from './screens/admin/OrganizationManager';
import AuditLogsScreen from './screens/admin/AuditLogsScreen';
import VerificationDashboard from './screens/admin/VerificationDashboard';
import ReportsScreen from './screens/admin/ReportsScreen';
import AssignSubjects from './screens/admin/AssignSubjects';
import DebugUsers from './screens/admin/DebugUsers';

// Teacher Screens - Additional
import AssignedSubjects from './screens/teacher/AssignedSubjects';

const Stack = createStackNavigator<RootStackParamList>();

function Navigation() {
  const { session, role, isVerified, loading } = useAuth();
  const { setRole: setThemeRole, mode } = useTheme();
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

  // Sync role from AuthContext to ThemeContext
  useEffect(() => {
    if (role) {
      setThemeRole(role as 'student' | 'teacher' | 'admin');
    } else {
      setThemeRole(null);
    }
  }, [role, setThemeRole]);

  useEffect(() => {
    // Handle deep links when app is already open
    const handleDeepLink = (event: { url: string }) => {
      handleUrl(event.url);
    };

    // Get initial URL (when app opens from a link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl(url);
      }
    });

    // Listen for deep links while app is open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  const handleUrl = (url: string) => {
    const parsed = parseDeepLink(url);

    if (!parsed) {
      console.error('Failed to parse deep link:', url);
      return;
    }

    // Handle password reset deep link
    if (parsed.route === 'reset-password') {
      const token = parsed.params.token;
      if (token && navigationRef.current) {
        navigationRef.current.navigate('ResetPassword', { token });
      } else {
        // No token, redirect to forgot password
        if (navigationRef.current) {
          navigationRef.current.navigate('ForgotPassword');
        }
      }
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: mode === 'dark' ? tokens.colors.theme.dark.background : tokens.colors.theme.light.background }}>
        <ActivityIndicator size="large" color={mode === 'dark' ? tokens.colors.neutral.white : tokens.colors.primary.main} />
      </View>
    );
  }

  const darkTheme = {
    dark: true,
    colors: {
      primary: tokens.colors.primary.light,
      background: tokens.colors.theme.dark.background,
      card: tokens.colors.theme.dark.surface,
      text: tokens.colors.theme.dark.text,
      border: tokens.colors.theme.dark.border,
      notification: tokens.colors.error.light,
    },
    fonts: {
      regular: {
        fontFamily: 'System',
        fontWeight: '400' as const,
      },
      medium: {
        fontFamily: 'System',
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: 'System',
        fontWeight: '700' as const,
      },
      heavy: {
        fontFamily: 'System',
        fontWeight: '900' as const,
      },
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={mode === 'dark' ? darkTheme : undefined}>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: mode === 'dark' ? '#1e293b' : '#ffffff' }, headerTintColor: mode === 'dark' ? '#f1f5f9' : '#000000' }}>
        {!session || !session.user ? (
          // Auth Stack - Unauthenticated Users
          <>
            <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{
                title: 'Create Account',
                headerBackTitle: 'Back'
              }}
            />
            <Stack.Screen
              name="EmailVerification"
              component={EmailVerificationScreen}
              options={{
                title: 'Verify Email',
                headerBackTitle: 'Back'
              }}
            />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
              options={{
                title: 'Reset Password',
                headerBackTitle: 'Back'
              }}
            />
            <Stack.Screen
              name="ResetPassword"
              component={ResetPasswordScreen}
              options={{
                title: 'Set New Password',
                headerBackTitle: 'Back'
              }}
            />
          </>
        ) : !isVerified && role !== 'admin' ? (
          // Authenticated but Unverified Users (except admins)
          <>
            <Stack.Screen
              name="Unverified"
              component={UnverifiedScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : (
          // Authenticated and Verified Users - Role-based Stacks
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />

            {/* Common Screens */}
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Notifications" 
              component={NotificationsScreen} 
              options={{
                headerStyle: { 
                  backgroundColor: role === 'student' 
                    ? tokens.colors.roles.student.main 
                    : role === 'teacher' 
                    ? tokens.colors.roles.teacher.main 
                    : tokens.colors.roles.admin.main,
                  elevation: 0,
                  shadowOpacity: 0,
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                  fontWeight: '600',
                },
                headerLeft: () => null,
              }}
            />
            <Stack.Screen 
              name="Settings" 
              component={SettingsScreen} 
              options={{
                headerStyle: { 
                  backgroundColor: role === 'student' 
                    ? tokens.colors.roles.student.main 
                    : role === 'teacher' 
                    ? tokens.colors.roles.teacher.main 
                    : tokens.colors.roles.admin.main,
                  elevation: 0,
                  shadowOpacity: 0,
                },
                headerTintColor: '#FFFFFF',
                headerTitleStyle: {
                  fontWeight: '600',
                },
                headerLeft: () => null,
              }}
            />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} options={{ title: 'Privacy Policy' }} />
            <Stack.Screen name="Terms" component={TermsScreen} options={{ title: 'Terms of Service' }} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ title: 'Change Password' }} />

            {/* Student Stack */}
            {role === 'student' && (
              <>
                <Stack.Screen 
                  name="Attendance" 
                  component={AttendanceScreen}
                  options={{
                    headerStyle: { 
                      backgroundColor: tokens.colors.roles.student.main,
                      elevation: 0,
                      shadowOpacity: 0,
                    },
                    headerTintColor: '#FFFFFF',
                    headerTitleStyle: {
                      fontWeight: '600',
                    },
                    headerLeft: () => null,
                  }}
                />
                <Stack.Screen 
                  name="Assignments" 
                  component={AssignmentScreen}
                  options={{
                    headerStyle: { 
                      backgroundColor: tokens.colors.roles.student.main,
                      elevation: 0,
                      shadowOpacity: 0,
                    },
                    headerTintColor: '#FFFFFF',
                    headerTitleStyle: {
                      fontWeight: '600',
                    },
                    headerLeft: () => null,
                  }}
                />
              </>
            )}

            {/* Teacher Stack */}
            {role === 'teacher' && (
              <>
                <Stack.Screen 
                  name="AttendanceManager" 
                  component={AttendanceManager}
                  options={{
                    title: 'Attendance Manager',
                    headerStyle: { 
                      backgroundColor: tokens.colors.roles.teacher.main,
                      elevation: 0,
                      shadowOpacity: 0,
                    },
                    headerTintColor: '#FFFFFF',
                    headerTitleStyle: {
                      fontWeight: '600',
                    },
                    headerLeft: () => null,
                  }}
                />
                <Stack.Screen 
                  name="AssignmentManager" 
                  component={AssignmentManager}
                  options={{
                    title: 'Assignment Manager',
                    headerStyle: { 
                      backgroundColor: tokens.colors.roles.teacher.main,
                      elevation: 0,
                      shadowOpacity: 0,
                    },
                    headerTintColor: '#FFFFFF',
                    headerTitleStyle: {
                      fontWeight: '600',
                    },
                    headerLeft: () => null,
                  }}
                />
                <Stack.Screen 
                  name="MarksReviewManager" 
                  component={MarksReviewManager}
                  options={{
                    title: 'Marks Review',
                    headerStyle: { 
                      backgroundColor: tokens.colors.roles.teacher.main,
                      elevation: 0,
                      shadowOpacity: 0,
                    },
                    headerTintColor: '#FFFFFF',
                    headerTitleStyle: {
                      fontWeight: '600',
                    },
                    headerLeft: () => null,
                  }}
                />
                <Stack.Screen 
                  name="AssignedSubjects" 
                  component={AssignedSubjects}
                  options={{
                    title: 'Assigned Subjects',
                    headerStyle: { 
                      backgroundColor: tokens.colors.roles.teacher.main,
                      elevation: 0,
                      shadowOpacity: 0,
                    },
                    headerTintColor: '#FFFFFF',
                    headerTitleStyle: {
                      fontWeight: '600',
                    },
                    headerLeft: () => null,
                  }}
                />
              </>
            )}

            {/* Admin Stack */}
            {role === 'admin' && (
              <>
                <Stack.Screen name="UserManagement" component={UserManagement} options={{ headerShown: false }} />
                <Stack.Screen name="OrganizationManager" component={OrganizationManager} options={{ headerShown: false }} />
                <Stack.Screen name="AuditLogs" component={AuditLogsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="VerificationDashboard" component={VerificationDashboard} options={{ title: 'User Verification' }} />
                <Stack.Screen name="Reports" component={ReportsScreen} options={{ headerShown: false }} />
                <Stack.Screen name="AssignSubjects" component={AssignSubjects} options={{ headerShown: false }} />
                <Stack.Screen name="DebugUsers" component={DebugUsers} options={{ headerShown: false }} />
              </>
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function ThemedApp() {
  const { mode } = useTheme();
  const theme = mode === 'dark' ? paperDarkTheme : paperTheme;

  return (
    <PaperProvider theme={theme}>
      <ToastProvider>
        <AuthProvider>
          <Navigation />
        </AuthProvider>
      </ToastProvider>
    </PaperProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </ErrorBoundary>
  );
}
