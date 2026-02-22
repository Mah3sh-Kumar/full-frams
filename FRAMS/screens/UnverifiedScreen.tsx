import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../lib/design-system/ThemeContext';
import Button from '../components/design-system/primitives/Button';
import Card from '../components/design-system/primitives/Card';
import GradientBackground from '../components/GradientBackground';

export default function UnverifiedScreen() {
    const { signOut, user } = useAuth();
    const { tokens, getTextColor, getTextSecondaryColor, mode } = useTheme();
    const isDark = mode === 'dark';

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: tokens.spacing.lg,
        },
        cardContent: {
            padding: tokens.spacing.lg,
        },
        iconContainer: {
            alignItems: 'center',
            marginBottom: tokens.spacing.lg,
        },
        icon: {
            fontSize: 64,
        },
        title: {
            fontSize: tokens.typography.h1.fontSize,
            fontWeight: tokens.typography.h1.fontWeight,
            color: getTextColor(),
            textAlign: 'center',
            marginBottom: tokens.spacing.md,
        },
        message: {
            fontSize: tokens.typography.body.fontSize,
            color: getTextSecondaryColor(),
            textAlign: 'center',
            marginBottom: tokens.spacing.lg,
            lineHeight: 24,
        },
        infoBox: {
            backgroundColor: isDark ? `${tokens.colors.info.main}20` : `${tokens.colors.info.main}10`,
            padding: tokens.spacing.md,
            borderRadius: tokens.borders.radius.medium,
            marginBottom: tokens.spacing.lg,
            borderLeftWidth: 4,
            borderLeftColor: tokens.colors.info.main,
        },
        infoTitle: {
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: tokens.colors.info.main,
            marginBottom: tokens.spacing.sm,
        },
        infoText: {
            fontSize: tokens.typography.body.fontSize,
            color: getTextColor(),
            lineHeight: 22,
        },
        detailsBox: {
            backgroundColor: isDark ? tokens.colors.neutral.gray800 : tokens.colors.neutral.gray100,
            padding: tokens.spacing.md,
            borderRadius: tokens.borders.radius.medium,
            marginBottom: tokens.spacing.lg,
        },
        detailsLabel: {
            fontSize: tokens.typography.caption.fontSize,
            color: getTextSecondaryColor(),
            marginBottom: tokens.spacing.xs,
        },
        detailsValue: {
            fontSize: tokens.typography.body.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: getTextColor(),
        },
        helpText: {
            fontSize: tokens.typography.body.fontSize,
            color: getTextSecondaryColor(),
            textAlign: 'center',
            marginBottom: tokens.spacing.lg,
            fontStyle: 'italic',
        },
    });

    return (
        <GradientBackground variant="student">
            <View style={styles.container}>
                <Card variant="elevated" style={{ width: '100%', maxWidth: 500 }}>
                    <View style={styles.cardContent}>
                        <View style={styles.iconContainer}>
                            <Text style={styles.icon}>⏳</Text>
                        </View>
                        
                        <Text style={styles.title}>Account Pending Verification</Text>
                        
                        <Text style={styles.message}>
                            Your account has been created successfully, but it needs to be verified by an administrator before you can access the system.
                        </Text>

                        <View style={styles.infoBox}>
                            <Text style={styles.infoTitle}>What happens next?</Text>
                            <Text style={styles.infoText}>
                                • An administrator will review your account{'\n'}
                                • You'll receive access once verified{'\n'}
                                • This usually takes 1-2 business days{'\n'}
                                • You can log out and check back later
                            </Text>
                        </View>

                        <View style={styles.detailsBox}>
                            <Text style={styles.detailsLabel}>Your Email:</Text>
                            <Text style={styles.detailsValue}>{user?.email}</Text>
                        </View>

                        <Text style={styles.helpText}>
                            If you have any questions, please contact your institution's administrator.
                        </Text>

                        <Button 
                            variant="primary"
                            onPress={signOut}
                        >
                            Sign Out
                        </Button>
                    </View>
                </Card>
            </View>
        </GradientBackground>
    );
}
