import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Chip } from 'react-native-paper';
import { tokens } from '../lib/design-system/tokens';

interface CountdownTimerProps {
    dueDate: string;
    compact?: boolean;
}

export default function CountdownTimer({ dueDate, compact = false }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isOverdue, setIsOverdue] = useState(false);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const due = new Date(dueDate).getTime();
            const difference = due - now;

            if (difference < 0) {
                setIsOverdue(true);
                const overdueDays = Math.floor(Math.abs(difference) / (1000 * 60 * 60 * 24));
                setTimeLeft(`${overdueDays} day${overdueDays !== 1 ? 's' : ''} overdue`);
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) {
                setTimeLeft(`${days}d ${hours}h left`);
            } else if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m left`);
            } else {
                setTimeLeft(`${minutes}m left`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000); // Update every minute

        return () => clearInterval(interval);
    }, [dueDate]);

    if (compact) {
        return (
            <Chip
                icon={isOverdue ? 'alert-circle' : 'clock-outline'}
                textStyle={styles.chipText}
                style={[
                    styles.chip,
                    { backgroundColor: isOverdue ? tokens.colors.error.light : tokens.colors.warning.light },
                ]}
            >
                {timeLeft}
            </Chip>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.text, { color: isOverdue ? tokens.colors.error.main : tokens.colors.warning.main }]}>
                {timeLeft}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginTop: tokens.spacing.xs,
    },
    text: {
        fontSize: tokens.typography.body.fontSize,
        fontWeight: tokens.typography.h3.fontWeight,
        lineHeight: tokens.typography.body.lineHeight,
    },
    chip: {
        alignSelf: 'flex-start',
        minHeight: 32,
    },
    chipText: {
        fontSize: tokens.typography.caption.fontSize,
        lineHeight: tokens.typography.caption.lineHeight,
    },
});
