import React, { ReactNode, useRef } from 'react';
import { StyleSheet, Animated, Pressable } from 'react-native';
import { Card as PaperCard } from 'react-native-paper';
import { useTheme } from '../lib/design-system/ThemeContext';

interface AnimatedCardProps {
    children: ReactNode;
    onPress?: () => void;
    style?: any;
    glassmorphism?: boolean;
}

export default function AnimatedCard({ children, onPress, style, glassmorphism = false }: AnimatedCardProps) {
    const { tokens, getSurfaceColor, reducedMotion } = useTheme();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (reducedMotion) return;
        
        Animated.timing(scaleAnim, {
            toValue: 0.96,
            duration: tokens.motion.duration.fast,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        if (reducedMotion) return;
        
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: tokens.motion.duration.normal,
            useNativeDriver: true,
        }).start();
    };

    const styles = StyleSheet.create({
        pressable: {
            marginBottom: tokens.spacing.md,
        },
        card: {
            ...tokens.shadows.md,
            backgroundColor: getSurfaceColor(),
            borderRadius: tokens.borders.radius.medium,
        },
        glassmorphism: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
        },
    });

    const content = (
        <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
            <PaperCard
                style={[
                    styles.card,
                    glassmorphism && styles.glassmorphism,
                    style
                ]}
            >
                {children}
            </PaperCard>
        </Animated.View>
    );

    if (onPress) {
        return (
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                style={styles.pressable}
            >
                {content}
            </Pressable>
        );
    }

    return content;
}
