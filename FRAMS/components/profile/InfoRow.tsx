import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InfoRowProps {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    value: string;
    iconColor: string;
    labelColor: string;
    valueColor: string;
}

export const InfoRow: React.FC<InfoRowProps> = ({
    icon,
    label,
    value,
    iconColor,
    labelColor,
    valueColor,
}) => {
    return (
        <View style={styles.container} accessibilityLabel={`${label}: ${value}`}>
            <Ionicons name={icon} size={20} color={iconColor} />
            <View style={styles.textContainer}>
                <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
                <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    textContainer: {
        marginLeft: 12,
        flex: 1,
    },
    label: {
        fontSize: 12,
        marginBottom: 2,
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
    },
});
