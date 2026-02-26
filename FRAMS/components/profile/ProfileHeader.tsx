import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import ImagePickerComponent from '../ImagePickerComponent';
import { useTheme } from '../../lib/design-system/ThemeContext';

interface ProfileHeaderProps {
    avatarUrl: string;
    fullName: string;
    role: string | null;
    editing: boolean;
    onImageSelected: (uri: string) => Promise<void>;
    headerColor: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
    avatarUrl,
    fullName,
    role,
    editing,
    onImageSelected,
    headerColor,
}) => {
    const { tokens } = useTheme();
    const contrastColor = '#FFFFFF';

    return (
        <View style={[styles.header, { backgroundColor: headerColor }]}>
            <Text style={[styles.screenTitle, { color: contrastColor }]}>My Profile</Text>
            <View style={styles.avatarContainer}>
                <ImagePickerComponent
                    currentImageUrl={avatarUrl}
                    onImageSelected={onImageSelected}
                    size={120}
                />
            </View>
            <Text style={[styles.name, { color: contrastColor }]} accessibilityRole="header">
                {fullName}
            </Text>
            <Text style={[styles.roleText, { color: contrastColor + 'F2' }]}>
                {role?.toUpperCase()}
            </Text>
            {editing && (
                <View style={[styles.editBadge, { backgroundColor: tokens.colors.warning.main }]}>
                    <Text style={styles.editBadgeText}>EDITING</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 15,
        paddingBottom: 25,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 5,
    },
    screenTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    avatarContainer: {
        marginBottom: 12,
        elevation: 10,
        borderRadius: 60,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    name: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
        textAlign: 'center',
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
    editBadge: {
        marginTop: 8,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    editBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1,
    },
});
