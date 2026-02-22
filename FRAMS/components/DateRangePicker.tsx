import React, { useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Button, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../lib/design-system/ThemeContext';

interface DateRangePickerProps {
    startDate: Date;
    endDate: Date;
    onStartDateChange: (date: Date) => void;
    onEndDateChange: (date: Date) => void;
}

export default function DateRangePicker({
    startDate,
    endDate,
    onStartDateChange,
    onEndDateChange,
}: DateRangePickerProps) {
    const { tokens, getTextSecondaryColor } = useTheme();
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: tokens.spacing.sm,
            gap: tokens.spacing.md,
        },
        dateContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.spacing.sm,
        },
        label: {
            fontSize: tokens.typography.body.fontSize,
            color: getTextSecondaryColor(),
            fontWeight: tokens.typography.body.fontWeight,
        },
        dateButton: {
            flex: 1,
            borderRadius: tokens.borders.radius.medium,
        },
    });

    return (
        <View style={styles.container}>
            <View style={styles.dateContainer}>
                <Text style={styles.label}>From:</Text>
                <Button
                    mode="outlined"
                    onPress={() => setShowStartPicker(true)}
                    style={styles.dateButton}
                    compact
                >
                    {formatDate(startDate)}
                </Button>
            </View>

            <View style={styles.dateContainer}>
                <Text style={styles.label}>To:</Text>
                <Button
                    mode="outlined"
                    onPress={() => setShowEndPicker(true)}
                    style={styles.dateButton}
                    compact
                >
                    {formatDate(endDate)}
                </Button>
            </View>

            {showStartPicker && (
                <DateTimePicker
                    value={startDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowStartPicker(Platform.OS === 'ios');
                        if (selectedDate) {
                            onStartDateChange(selectedDate);
                        }
                    }}
                />
            )}

            {showEndPicker && (
                <DateTimePicker
                    value={endDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setShowEndPicker(Platform.OS === 'ios');
                        if (selectedDate) {
                            onEndDateChange(selectedDate);
                        }
                    }}
                    minimumDate={startDate}
                />
            )}
        </View>
    );
}
