import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import * as SecureStore from 'expo-secure-store';
import type { StackScreenProps } from '@react-navigation/stack';
import { isValidEmail } from '../lib/validation';
import { RootStackParamList } from '../lib/types';
import { useTheme } from '../lib/design-system/ThemeContext';
import Button from '../components/design-system/primitives/Button';
import Input from '../components/design-system/primitives/Input';
import { Stack } from '../components/design-system/layout';
import GradientBackground from '../components/GradientBackground';
import KeyboardAwareScrollView from '../components/KeyboardAwareScrollView';

type Props = StackScreenProps<RootStackParamList, 'SignIn'>;

export default function SignInScreen({ navigation }: Props) {
    const { signIn, loading } = useAuth();
    const { tokens, mode, getSurfaceColor, getTextColor, getTextSecondaryColor, getBackgroundColor } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    useEffect(() => {
        // Load credentials asynchronously without blocking render
        loadSavedCredentials();
    }, []);

    const loadSavedCredentials = useCallback(async () => {
        try {
            const savedEmail = await SecureStore.getItemAsync('saved_email');
            if (savedEmail) {
                setEmail(savedEmail);
                setRememberMe(true);
                // Load password separately to avoid blocking
                SecureStore.getItemAsync('saved_password').then(savedPassword => {
                    if (savedPassword) setPassword(savedPassword);
                });
            }
        } catch (error) {
            console.log('Error loading saved credentials:', error);
        }
    }, []);

    const handleEmailChange = useCallback((text: string) => {
        setEmail(text);
        if (errorMsg) setErrorMsg('');
    }, [errorMsg]);

    const handlePasswordChange = useCallback((text: string) => {
        setPassword(text);
        if (errorMsg) setErrorMsg('');
    }, [errorMsg]);

    const handleSignIn = useCallback(async () => {
        setErrorMsg('');

        if (!email || !password) {
            setErrorMsg('Please fill in all fields');
            return;
        }

        if (!isValidEmail(email)) {
            setErrorMsg('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);

        const { error } = await signIn(email, password);

        if (error) {
            // Check if error is related to email verification
            if (error.toLowerCase().includes('email') && error.toLowerCase().includes('confirm')) {
                setErrorMsg('Please verify your email before signing in. Check your inbox for the verification link.');
            } else if (error.includes('Invalid login credentials')) {
                setErrorMsg('Invalid email or password. Please try again.');
            } else {
                setErrorMsg(error);
            }
            setIsSubmitting(false);
        } else {
            // Save credentials asynchronously without blocking navigation
            if (rememberMe) {
                SecureStore.setItemAsync('saved_email', email).catch(err =>
                    console.log('Error saving email:', err)
                );
                SecureStore.setItemAsync('saved_password', password).catch(err =>
                    console.log('Error saving password:', err)
                );
            } else {
                SecureStore.deleteItemAsync('saved_email').catch(err =>
                    console.log('Error clearing email:', err)
                );
                SecureStore.deleteItemAsync('saved_password').catch(err =>
                    console.log('Error clearing password:', err)
                );
            }
            setIsSubmitting(false);
        }
    }, [email, password, rememberMe, signIn]);

    return (
        <GradientBackground>
            <View style={{ flex: 1, backgroundColor: getBackgroundColor() }}>
                <KeyboardAwareScrollView
                    contentContainerStyle={styles.scrollContent}
                    extraScrollHeight={20}
                    enableAutomaticScroll={true}
                >
                <View style={styles.content}>
                    <Text style={[styles.title, { color: getTextColor() }]}>Welcome Back</Text>
                    <Text style={[styles.subtitle, { color: getTextSecondaryColor() }]}>Sign in to continue</Text>
                    
                    {/* App Branding/Logo */}
                    <View style={styles.logoContainer}>
                        <View style={[styles.logoCircle, { backgroundColor: tokens.colors.primary.main }]}> 
                            <Ionicons name="school" size={40} color="#FFFFFF" />
                        </View>
                        <Text style={[styles.appName, { color: getTextColor() }]}>FRAMS</Text>
                        <Text style={[styles.appTagline, { color: getTextSecondaryColor() }]}>Face Recognition Attendance Management System</Text>
                    </View>

                    <Stack spacing="md">
                        <Input
                            label="Email"
                            value={email}
                            onChangeText={handleEmailChange}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            disabled={isSubmitting || loading}
                            error={!!errorMsg && !email ? 'Email is required' : undefined}
                            returnKeyType="next"
                        />

                        <Input
                            label="Password"
                            value={password}
                            onChangeText={handlePasswordChange}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            disabled={isSubmitting || loading}
                            error={!!errorMsg && !password ? 'Password is required' : undefined}
                            returnKeyType="done"
                            rightIcon={
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                        size={24}
                                        color={getTextSecondaryColor()}
                                    />
                                </TouchableOpacity>
                            }
                        />

                        <View style={styles.forgotPasswordContainer}>
                            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                                <Text style={[styles.forgotPasswordText, { color: tokens.colors.primary.main }]}>
                                    Forgot Password?
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {errorMsg ? (
                            <Text style={[styles.errorText, { color: tokens.colors.error.main }]}>{errorMsg}</Text>
                        ) : null}

                        <View style={styles.rememberMeContainer}>
                            <TouchableOpacity
                                style={styles.checkboxContainer}
                                onPress={() => setRememberMe(!rememberMe)}
                                disabled={isSubmitting || loading}
                                accessible
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: rememberMe }}
                            >
                                <View style={[
                                    styles.checkbox,
                                    { borderColor: tokens.colors.primary.main },
                                    rememberMe && { backgroundColor: tokens.colors.primary.main, borderColor: tokens.colors.primary.main }
                                ]}>
                                    {rememberMe && (
                                        <Ionicons 
                                            name="checkmark" 
                                            size={16} 
                                            color="#FFFFFF" 
                                        />
                                    )}
                                </View>
                                <Text style={[styles.rememberMeText, { color: getTextColor() }]}>Remember Me</Text>
                            </TouchableOpacity>
                        </View>

                        <Button
                            variant="primary"
                            onPress={handleSignIn}
                            loading={isSubmitting || loading}
                            disabled={isSubmitting || loading || !email || !password}
                        >
                            Sign In
                        </Button>

                        <View style={styles.signUpContainer}>
                            <Text style={[styles.signUpText, { color: getTextSecondaryColor() }]}>Don't have an account? </Text>
                            <TouchableOpacity
                                onPress={() => navigation.navigate('SignUp')}
                                disabled={isSubmitting || loading}
                            >
                                <Text style={[styles.signUpLink, { color: tokens.colors.primary.main }]}>Sign Up</Text>
                            </TouchableOpacity>
                        </View>
                    </Stack>
                </View>
                </KeyboardAwareScrollView>
            </View>
        </GradientBackground>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 16,
    },
    content: {
        maxWidth: 400,
        width: '100%',
        alignSelf: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 8,
    },
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    appName: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 4,
    },
    appTagline: {
        fontSize: 14,
        textAlign: 'center',
        opacity: 0.8,
    },
    errorText: {
        fontSize: 14,
        marginTop: 4,
        textAlign: 'center',
    },
    rememberMeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    rememberMeText: {
        fontSize: 16,
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    signUpText: {
        fontSize: 16,
    },
    signUpLink: {
        fontSize: 16,
        fontWeight: '600',
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginTop: -8,
        marginBottom: 8,
    },
    forgotPasswordText: {
        fontSize: 14,
        fontWeight: '500',
    },
});


