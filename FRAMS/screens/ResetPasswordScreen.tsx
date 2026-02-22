import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { validatePassword } from '../lib/validation';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';
import type { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../lib/types';
import { useTheme } from '../lib/design-system/ThemeContext';
import Button from '../components/design-system/primitives/Button';
import Input from '../components/design-system/primitives/Input';
import { Stack } from '../components/design-system/layout';

type Props = StackScreenProps<RootStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation, route }: Props) {
    const { tokens, getTextColor, getSurfaceColor } = useTheme();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const tokenParam = route.params?.token;
        if (tokenParam) {
            setToken(tokenParam);
        } else {
            setErrorMsg('Invalid or missing reset token. Please request a new password reset link.');
            setTimeout(() => {
                navigation.replace('ForgotPassword');
            }, 3000);
        }
    }, [route.params]);

    const checkPasswordMatch = (): boolean => {
        return password === confirmPassword;
    };

    const handleResetPassword = async () => {
        setErrorMsg('');
        setSuccessMsg('');

        const validation = validatePassword(password);
        if (!validation.isValid) {
            setErrorMsg(validation.errors.join('. '));
            return;
        }

        if (!checkPasswordMatch()) {
            setErrorMsg('Passwords do not match');
            return;
        }

        if (!token) {
            setErrorMsg('Invalid reset token. Please request a new password reset link.');
            return;
        }

        setIsSubmitting(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password,
            });

            if (error) {
                if (error.message.toLowerCase().includes('token') || 
                    error.message.toLowerCase().includes('expired')) {
                    setErrorMsg('Your reset link has expired. Please request a new one.');
                    setTimeout(() => {
                        navigation.replace('ForgotPassword');
                    }, 3000);
                } else {
                    setErrorMsg(error.message);
                }
            } else {
                setSuccessMsg('Password updated successfully! Redirecting to sign in...');
                setTimeout(() => {
                    navigation.replace('SignIn');
                }, 2000);
            }
        } catch (error: any) {
            setErrorMsg(error.message || 'An error occurred while resetting your password');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = () => {
        const validation = validatePassword(password);
        return validation.isValid && checkPasswordMatch() && !isSubmitting;
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: tokens.colors.theme.light.background,
        },
        scrollContent: {
            flexGrow: 1,
            justifyContent: 'center',
            padding: tokens.spacing.lg,
        },
        content: {
            maxWidth: 400,
            width: '100%',
            alignSelf: 'center',
        },
        title: {
            fontSize: tokens.typography.h1.fontSize,
            fontWeight: tokens.typography.h1.fontWeight,
            color: getTextColor(),
            textAlign: 'center',
            marginBottom: tokens.spacing.xs,
        },
        subtitle: {
            fontSize: tokens.typography.body.fontSize,
            color: tokens.colors.neutral.gray600,
            textAlign: 'center',
            marginBottom: tokens.spacing.xl,
        },
        errorText: {
            fontSize: tokens.typography.body.fontSize,
            color: tokens.colors.error.main,
            textAlign: 'center',
            marginTop: tokens.spacing.md,
        },
        successText: {
            fontSize: tokens.typography.body.fontSize,
            color: tokens.colors.success.main,
            textAlign: 'center',
            marginTop: tokens.spacing.md,
        },
        backLink: {
            fontSize: tokens.typography.body.fontSize,
            color: tokens.colors.primary.main,
            fontWeight: tokens.typography.h3.fontWeight,
            textAlign: 'center',
            marginTop: tokens.spacing.lg,
        },
    });

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    <Text style={styles.title}>Set New Password</Text>
                    <Text style={styles.subtitle}>
                        Enter your new password below. Make sure it's at least 8 characters long.
                    </Text>

                    <Stack spacing="md">
                        <Input
                            label="New Password"
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setErrorMsg('');
                                setSuccessMsg('');
                            }}
                            secureTextEntry={!showPassword}
                            autoCapitalize="none"
                            disabled={isSubmitting}
                            error={!!errorMsg && !password ? 'Password is required' : undefined}
                            rightIcon={
                                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                    <Ionicons 
                                        name={showPassword ? 'eye-off-outline' : 'eye-outline'} 
                                        size={24} 
                                        color={tokens.colors.neutral.gray500} 
                                    />
                                </TouchableOpacity>
                            }
                        />

                        {password ? (
                            <PasswordStrengthIndicator password={password} />
                        ) : null}

                        <Input
                            label="Confirm Password"
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                setErrorMsg('');
                                setSuccessMsg('');
                            }}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            disabled={isSubmitting}
                            error={!!errorMsg && !confirmPassword ? 'Please confirm password' : undefined}
                            rightIcon={
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons 
                                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                                        size={24} 
                                        color={tokens.colors.neutral.gray500} 
                                    />
                                </TouchableOpacity>
                            }
                        />

                        {errorMsg ? (
                            <Text style={styles.errorText}>{errorMsg}</Text>
                        ) : null}

                        {successMsg ? (
                            <Text style={styles.successText}>{successMsg}</Text>
                        ) : null}

                        <Button
                            variant="primary"
                            onPress={handleResetPassword}
                            loading={isSubmitting}
                            disabled={!isFormValid()}
                        >
                            Reset Password
                        </Button>

                        <TouchableOpacity
                            onPress={() => navigation.navigate('SignIn')}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.backLink}>Back to Sign In</Text>
                        </TouchableOpacity>
                    </Stack>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}
