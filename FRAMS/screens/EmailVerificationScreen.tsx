import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import type { StackScreenProps } from '@react-navigation/stack';
import { useTheme } from '../lib/design-system/ThemeContext';
import Button from '../components/design-system/primitives/Button';
import Card from '../components/design-system/primitives/Card';
import { Stack } from '../components/design-system/layout';

type Props = StackScreenProps<any, 'EmailVerification'>;

export default function EmailVerificationScreen({ navigation, route }: Props) {
    const { tokens, getTextColor, getSurfaceColor } = useTheme();
    const email = route.params?.email || '';
    const [resending, setResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [resendError, setResendError] = useState('');

    const handleResendEmail = async () => {
        if (!email) {
            setResendError('Email address not found');
            return;
        }

        setResending(true);
        setResendError('');
        setResendSuccess(false);

        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: email,
            });

            if (error) {
                setResendError(error.message);
            } else {
                setResendSuccess(true);
                setTimeout(() => setResendSuccess(false), 5000);
            }
        } catch (err: any) {
            setResendError(err.message || 'Failed to resend email');
        } finally {
            setResending(false);
        }
    };

    const styles = StyleSheet.create({
        container: {
            flexGrow: 1,
            backgroundColor: tokens.colors.theme.light.background,
            padding: tokens.spacing.lg,
            paddingTop: tokens.spacing.xxl,
        },
        content: {
            alignItems: 'center',
            maxWidth: 500,
            width: '100%',
            alignSelf: 'center',
        },
        iconContainer: {
            width: 100,
            height: 100,
            borderRadius: tokens.borders.radius.full,
            backgroundColor: `${tokens.colors.info.main}15`,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: tokens.spacing.lg,
        },
        title: {
            fontSize: tokens.typography.h1.fontSize,
            fontWeight: tokens.typography.h1.fontWeight,
            color: getTextColor(),
            textAlign: 'center',
            marginBottom: tokens.spacing.sm,
        },
        subtitle: {
            fontSize: tokens.typography.body.fontSize,
            color: tokens.colors.neutral.gray600,
            textAlign: 'center',
            marginBottom: tokens.spacing.xs,
        },
        email: {
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: tokens.colors.primary.main,
            textAlign: 'center',
            marginBottom: tokens.spacing.xl,
        },
        instructionTitle: {
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: getTextColor(),
            marginBottom: tokens.spacing.md,
        },
        instructionItem: {
            flexDirection: 'row',
            marginBottom: tokens.spacing.sm,
        },
        bullet: {
            fontSize: tokens.typography.body.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            marginRight: tokens.spacing.sm,
            color: tokens.colors.primary.main,
        },
        instructionText: {
            flex: 1,
            fontSize: tokens.typography.body.fontSize,
            color: tokens.colors.neutral.gray600,
            lineHeight: 22,
        },
        successCard: {
            backgroundColor: `${tokens.colors.success.main}15`,
            padding: tokens.spacing.md,
            borderRadius: tokens.borders.radius.medium,
            borderLeftWidth: 4,
            borderLeftColor: tokens.colors.success.main,
        },
        successText: {
            color: tokens.colors.success.main,
            fontSize: tokens.typography.body.fontSize,
            textAlign: 'center',
        },
        errorCard: {
            backgroundColor: `${tokens.colors.error.main}15`,
            padding: tokens.spacing.md,
            borderRadius: tokens.borders.radius.medium,
            borderLeftWidth: 4,
            borderLeftColor: tokens.colors.error.main,
        },
        errorText: {
            color: tokens.colors.error.main,
            fontSize: tokens.typography.body.fontSize,
            textAlign: 'center',
        },
        backLink: {
            fontSize: tokens.typography.body.fontSize,
            color: tokens.colors.neutral.gray600,
            textAlign: 'center',
            marginTop: tokens.spacing.sm,
        },
    });

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <Ionicons name="mail-outline" size={48} color={tokens.colors.info.main} />
                </View>

                <Text style={styles.title}>Verify Your Email</Text>
                <Text style={styles.subtitle}>We've sent a verification link to</Text>
                <Text style={styles.email}>{email}</Text>

                <Card variant="default">
                    <View style={{ padding: tokens.spacing.md }}>
                        <Text style={styles.instructionTitle}>Next Steps:</Text>
                        <View style={styles.instructionItem}>
                            <Text style={styles.bullet}>1.</Text>
                            <Text style={styles.instructionText}>
                                Check your email inbox (and spam folder)
                            </Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <Text style={styles.bullet}>2.</Text>
                            <Text style={styles.instructionText}>
                                Click the verification link in the email
                            </Text>
                        </View>
                        <View style={styles.instructionItem}>
                            <Text style={styles.bullet}>3.</Text>
                            <Text style={styles.instructionText}>
                                Return to the app and sign in
                            </Text>
                        </View>
                    </View>
                </Card>

                <Stack spacing="md" style={{ width: '100%', marginTop: tokens.spacing.lg }}>
                    {resendSuccess && (
                        <View style={styles.successCard}>
                            <Text style={styles.successText}>
                                ✓ Verification email sent successfully!
                            </Text>
                        </View>
                    )}

                    {resendError && (
                        <View style={styles.errorCard}>
                            <Text style={styles.errorText}>{resendError}</Text>
                        </View>
                    )}

                    <Button
                        variant="secondary"
                        onPress={handleResendEmail}
                        loading={resending}
                        disabled={resending}
                    >
                        Resend Verification Email
                    </Button>

                    <Button
                        variant="primary"
                        onPress={() => navigation.navigate('SignIn')}
                    >
                        Go to Sign In
                    </Button>

                    <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                        <Text style={styles.backLink}>Back to Sign Up</Text>
                    </TouchableOpacity>
                </Stack>
            </View>
        </ScrollView>
    );
}
