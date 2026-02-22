import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../lib/design-system/ThemeContext';

interface SkeletonLoaderProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

export default function SkeletonLoader({
    width = '100%',
    height = 20,
    borderRadius,
    style
}: SkeletonLoaderProps) {
    const { tokens, reducedMotion } = useTheme();
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const defaultBorderRadius = borderRadius ?? tokens.borders.radius.small;

    useEffect(() => {
        if (reducedMotion) {
            pulseAnim.setValue(0.5);
            return;
        }

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [pulseAnim, reducedMotion]);

    const opacity = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    const styles = StyleSheet.create({
        skeleton: {
            backgroundColor: tokens.colors.neutral.gray300,
        },
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius: defaultBorderRadius,
                    opacity: reducedMotion ? 0.5 : opacity,
                },
                style,
            ]}
        />
    );
}

export function SkeletonCard() {
    const { tokens, getSurfaceColor } = useTheme();

    const styles = StyleSheet.create({
        card: {
            backgroundColor: getSurfaceColor(),
            padding: tokens.spacing.md,
            marginBottom: tokens.spacing.md,
            borderRadius: tokens.borders.radius.medium,
            ...tokens.shadows.sm,
        },
        title: {
            marginBottom: tokens.spacing.sm,
        },
        subtitle: {
            marginBottom: tokens.spacing.md,
        },
        line: {
            marginBottom: tokens.spacing.sm,
        },
    });

    return (
        <View style={styles.card}>
            <SkeletonLoader height={24} width="60%" style={styles.title} />
            <SkeletonLoader height={16} width="40%" style={styles.subtitle} />
            <SkeletonLoader height={16} width="90%" style={styles.line} />
            <SkeletonLoader height={16} width="70%" style={styles.line} />
        </View>
    );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
    return (
        <View>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </View>
    );
}
