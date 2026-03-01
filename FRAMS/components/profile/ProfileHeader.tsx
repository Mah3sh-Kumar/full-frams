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
                    size={100}
                />
            </View>
            <Text style={[styles.name, { color: contrastColor }]} accessibilityRole="header">
                {fullName}
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
    container: {
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingHorizontal: 26,
        paddingTop: Platform.OS === 'ios' ? 50 : 35,
        paddingBottom: 4,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    screenTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    avatarContainer: {
        marginBottom: 12,
        elevation: 10,
        borderRadius: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
    },
    name: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
    },
    editBadge: {
        marginTop: 12,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
        elevation: 2,
    },
    editBadgeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
    },
});
