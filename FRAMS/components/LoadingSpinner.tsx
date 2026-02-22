import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { colors } from '../lib/theme';

interface LoadingSpinnerProps {
    text?: string;
    size?: 'small' | 'large';
    color?: string;
}

export default function LoadingSpinner({ text = 'Loading...', size = 'large', color }: LoadingSpinnerProps) {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();

        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 2000,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
            <View style={styles.spinnerContainer}>
                <ActivityIndicator
                    size={size}
                    color={color || colors.primary.main}
                    animating={true}
                />
            </View>
            {text && (
                <Text style={styles.text}>{text}</Text>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    spinnerContainer: {
        marginBottom: 16,
    },
    text: {
        fontSize: 16,
        color: colors.theme.light.textSecondary,
        textAlign: 'center',
    },
});
