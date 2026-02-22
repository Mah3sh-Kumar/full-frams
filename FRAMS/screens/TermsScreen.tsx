import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/design-system/primitives';
import { useTheme } from '../lib/design-system/ThemeContext';

export default function TermsScreen() {
    const { tokens, getBackgroundColor, getTextColor, getTextSecondaryColor } = useTheme();

    const styles = StyleSheet.create({
        container: {
            flex: 1,
        },
        contentContainer: {
            padding: tokens.spacing.md,
        },
        cardContent: {
            padding: tokens.spacing.lg,
        },
        title: {
            marginBottom: tokens.spacing.md,
            fontSize: tokens.typography.h1.fontSize,
            fontWeight: tokens.typography.h1.fontWeight,
            lineHeight: tokens.typography.h1.lineHeight,
            color: getTextColor(),
        },
        subtitle: {
            marginTop: tokens.spacing.lg,
            marginBottom: tokens.spacing.sm,
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            lineHeight: tokens.typography.h3.lineHeight,
            color: getTextColor(),
        },
        paragraph: {
            marginBottom: tokens.spacing.md,
            fontSize: tokens.typography.body.fontSize,
            lineHeight: tokens.typography.body.lineHeight,
            color: getTextSecondaryColor(),
        },
    });

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: getBackgroundColor() }]}
            contentContainerStyle={styles.contentContainer}
        >
            <Card>
                <View style={styles.cardContent}>
                    <Text style={styles.title}>Terms of Service</Text>
                    <Text style={styles.paragraph}>
                        Last updated: {new Date().toLocaleDateString()}
                    </Text>

                    <Text style={styles.subtitle}>1. Acceptance of Terms</Text>
                    <Text style={styles.paragraph}>
                        By accessing or using FRAMS (Face Recognition & Attendance Management System), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use our services.
                    </Text>

                    <Text style={styles.subtitle}>2. User Responsibilities</Text>
                    <Text style={styles.paragraph}>
                        You are responsible for:
                        {'\n'}- Maintaining the confidentiality of your account
                        {'\n'}- All activities that occur under your account
                        {'\n'}- Providing accurate and current information
                        {'\n'}- Ensuring your face data is accurate for attendance
                    </Text>

                    <Text style={styles.subtitle}>3. Academic Integrity</Text>
                    <Text style={styles.paragraph}>
                        Users must not attempt to manipulate attendance records or grades. Any such attempts will result in disciplinary action.
                    </Text>

                    <Text style={styles.subtitle}>4. Modifications</Text>
                    <Text style={styles.paragraph}>
                        We reserve the right to modify these terms at any time. We will notify users of any significant changes.
                    </Text>
                </View>
            </Card>
        </ScrollView>
    );
}