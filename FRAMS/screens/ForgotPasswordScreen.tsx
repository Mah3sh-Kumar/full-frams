import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { isValidEmail } from '../lib/validation';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../lib/design-system/ThemeContext';
import Button from '../components/design-system/primitives/Button';
import Input from '../components/design-system/primitives/Input';
import Card from '../components/design-system/primitives/Card';
import { Stack } from '../components/design-system/layout';

type Props = StackScreenProps<any, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
    const { tokens, getTextColor, getSurfaceColor, getBackgroundColor, getTextSecondaryColor } = useTheme();
    const [email, setEmail] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailValid, setEmailValid] = useState<boolean | null>(null);

    const handleEmailChange = useCallback((text: string) => {
        setEmail(text);
        setEmailValid(text ? isValidEmail(text) : null);
        setErrorMsg('');
        setSuccessMsg('');
    }, []);

    const handleResetPassword = async () => {
        setErrorMsg('');
        setSuccessMsg('');

        if (!email) {
            setErrorMsg('Please enter your email address');
            return;
        }

        if (!isValidEmail(email)) {
            setErrorMsg('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('=== PASSWORD RESET DEBUG ===');
            console.log('Email:', email);
            console.log('Redirect URL:', 'myapp://reset-password');
            console.log('Timestamp:', new Date().toISOString());

            const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: 'myapp://reset-password',
            });

            console.log('=== SUPABASE RESPONSE ===');
            console.log('Full Response:', JSON.stringify({ data, error }, null, 2));
            console.log('Error Details:', error ? {
                message: error.message,
                status: error.status,
                name: error.name,
            } : 'No error');

            if (error) {
                console.error('❌ Password reset error:', error);

                // Provide more helpful error messages
                let userMessage = error.message;

                if (error.message.includes('rate limit')) {
                    userMessage = 'Too many reset attempts. Please wait and try again. (Rate limit: 30 emails/hour)';
                } else if (error.message.includes('Invalid')) {
                    userMessage = 'Invalid email address or user not found. Please check your email and try again.';
                } else if (error.message.includes('redirect')) {
                    userMessage = 'Configuration error. Please contact support. (Redirect URL not whitelisted)';
                }

                setErrorMsg(userMessage);
            } else {
                console.log('✅ Password reset email request sent successfully');
                console.log('⚠️  IMPORTANT CHECKS:');
                console.log('1. Check your email inbox AND spam/junk folder');
                console.log('2. Email may take 5-10 minutes to arrive');
                console.log('3. Verify redirect URL is whitelisted in Supabase dashboard');
                console.log('4. Check Supabase SMTP configuration');
                console.log('5. Verify email template is enabled');
                console.log('6. Rate limit: 30 emails per hour');

                setSuccessMsg(
                    'Password reset instructions have been sent to your email. ' +
                    'Please check your inbox AND spam folder. ' +
                    'Email may take 5-10 minutes to arrive. ' +
                    'If you don\'t receive it, check Supabase configuration.'
                );
                setTimeout(() => {
                    navigation.goBack();
                }, 5000);
            }
        } catch (error: any) {
            console.error('❌ Password reset exception:', error);
            console.error('Exception details:', {
                message: error.message,
                stack: error.stack,
                name: error.name,
            });
            setErrorMsg(error.message || 'An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
            console.log('=== END PASSWORD RESET DEBUG ===');
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: getBackgroundColor(),
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
            color: getTextSecondaryColor(),
            textAlign: 'center',
            marginBottom: tokens.spacing.xl,
        },
        successText: {
            fontSize: tokens.typography.body.fontSize,
            color: tokens.colors.success.main,
            textAlign: 'center',
            marginTop: tokens.spacing.md,
            lineHeight: 22,
        },
        backLink: {
            fontSize: tokens.typography.body.fontSize,
            color: tokens.colors.primary.main,
            fontWeight: tokens.typography.h3.fontWeight,
            textAlign: 'center',
            marginTop: tokens.spacing.lg,
        },
        backButton: {
            alignSelf: 'flex-start',
            marginBottom: tokens.spacing.md,
            padding: tokens.spacing.sm,
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
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}
                        disabled={isSubmitting}
                    >
                        <Ionicons name="arrow-back" size={24} color={getTextColor()} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Reset Password</Text>
                    <Text style={styles.subtitle}>
                        Enter your email address and we'll send you instructions to reset your password.
                    </Text>

                    <Stack spacing="md">
                        <Input
                            label="Email"
                            value={email}
                            onChangeText={handleEmailChange}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            disabled={isSubmitting}
                            error={errorMsg}
                            rightIcon={
                                emailValid === true ? (
                                    <Ionicons name="checkmark-circle" size={24} color={tokens.colors.success.main} />
                                ) : emailValid === false ? (
                                    <Ionicons name="close-circle" size={24} color={tokens.colors.error.main} />
                                ) : null
                            }
                        />

                        {successMsg ? (
                            <Text style={styles.successText}>{successMsg}</Text>
                        ) : null}

                        <Button
                            variant="primary"
                            onPress={handleResetPassword}
                            loading={isSubmitting}
                            disabled={isSubmitting || !email}
                        >
                            Send Reset Link
                        </Button>

                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
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
