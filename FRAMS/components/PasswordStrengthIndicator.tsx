import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing, typography } from '../lib/theme';
import { fontWeights } from '../lib/design-system/tokens/typography';

interface PasswordStrengthIndicatorProps {
    password: string;
}

export function calculatePasswordStrength(password: string): {
    strength: number;
    label: string;
    color: string;
} {
    if (!password) {
        return { strength: 0, label: '', color: colors.theme.light.textSecondary };
    }

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

    // Normalize to 0-4 scale
    const normalizedStrength = Math.min(Math.floor(strength / 1.5), 4);

    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colorMap = [
        colors.error.main,
        colors.error.light,
        colors.warning.main,
        colors.success.light,
        colors.success.main,
    ];

    return {
        strength: normalizedStrength,
        label: labels[normalizedStrength],
        color: colorMap[normalizedStrength],
    };
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
    const { strength, label, color } = calculatePasswordStrength(password);

    if (!password) return null;

    return (
        <View style={styles.container}>
            <View style={styles.barsContainer}>
                {[0, 1, 2, 3, 4].map((index) => (
                    <View
                        key={index}
                        style={[
                            styles.bar,
                            {
                                backgroundColor:
                                    index <= strength ? color : colors.theme.light.textSecondary,
                            },
                        ]}
                    />
                ))}
            </View>
            <Text style={[styles.label, { color }]}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: spacing.sm,
        marginBottom: spacing.md,
    },
    barsContainer: {
        flexDirection: 'row',
        gap: spacing.xs,
        marginBottom: spacing.xs,
    },
    bar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    label: {
        fontSize: typography.caption.fontSize,
        fontWeight: fontWeights.medium,
    },
});