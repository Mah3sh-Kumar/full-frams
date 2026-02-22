import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Card from './design-system/primitives/Card';
import { tokens } from '../lib/design-system/tokens';

interface ChartCardProps {
    title: string;
    children: React.ReactNode;
}

export default function ChartCard({ title, children }: ChartCardProps) {
    return (
        <Card variant="elevated">
            <View style={styles.cardContent}>
                <Text style={styles.title}>{title}</Text>
                <View style={styles.chartContainer}>
                    {children}
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    cardContent: {
        padding: tokens.spacing.md,
    },
    title: {
        fontSize: tokens.typography.h3.fontSize,
        fontWeight: tokens.typography.h3.fontWeight,
        lineHeight: tokens.typography.h3.lineHeight,
        color: tokens.colors.theme.light.text,
        marginBottom: tokens.spacing.md,
    },
    chartContainer: {
        alignItems: 'center',
    },
});
