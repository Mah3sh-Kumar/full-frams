import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../lib/database';
import { uploadProfilePicture } from '../lib/storage';
import { useTheme } from '../lib/design-system/ThemeContext';
import LoadingSpinner from '../components/design-system/feedback/LoadingSpinner';
import Button from '../components/design-system/primitives/Button';
import Input from '../components/design-system/primitives/Input';
import { useProfile } from '../hooks/useProfile';
import { ProfileHeader } from '../components/profile/ProfileHeader';
import { InfoRow } from '../components/profile/InfoRow';
import type { StackScreenProps } from '@react-navigation/stack';

type Props = StackScreenProps<any, 'Profile'>;

export default function ProfileScreen(_props: Props) {
    const { session, role } = useAuth();
    const { tokens, getBackgroundColor, getSurfaceColor, getTextColor, getTextSecondaryColor, getRoleColor, setRole: setThemeRole } = useTheme();
    const { profile, setProfile, loading, error, fetchProfile } = useProfile(session?.user?.id, role);
    
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Local editable state
    const [editedFullName, setEditedFullName] = useState('');
    const [editedDepartment, setEditedDepartment] = useState('');

    // Sync role with theme context
    useEffect(() => {
        if (role) {
            setThemeRole(role as any);
        }
    }, [role, setThemeRole]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    useEffect(() => {
        setEditedFullName(profile.fullName);
        setEditedDepartment(profile.department || '');
    }, [profile]);

    useEffect(() => {
        if (editing) {
            const changed = 
                editedFullName !== profile.fullName ||
                (role === 'teacher' && editedDepartment !== profile.department);
            setHasUnsavedChanges(changed);
        }
    }, [editing, editedFullName, editedDepartment, profile, role]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchProfile();
        setRefreshing(false);
    }, [fetchProfile]);

    const handleSave = useCallback(async () => {
        try {
            setSaving(true);
            const userId = session?.user?.id;
            if (!userId) return;

            const updates: Record<string, string> = {
                full_name: editedFullName,
            };

            if (role === 'teacher') {
                updates.department = editedDepartment;
            }

            const { error: updateError } = await updateUserProfile(userId, updates);

            if (updateError) {
                Alert.alert('Error', 'Failed to update profile. Please try again.');
            } else {
                // Optimistic update
                setProfile(prev => ({
                    ...prev,
                    fullName: editedFullName,
                    department: role === 'teacher' ? editedDepartment : prev.department,
                }));
                Alert.alert('Success', 'Profile updated successfully!');
                setEditing(false);
                setHasUnsavedChanges(false);
                await fetchProfile(); // Sync with server
            }
        } catch (err) {
            console.error('Error updating profile:', err);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setSaving(false);
        }
    }, [session?.user?.id, editedFullName, editedDepartment, role, setProfile, fetchProfile]);

    const handleCancel = useCallback(() => {
        if (hasUnsavedChanges) {
            Alert.alert(
                'Discard Changes?',
                'You have unsaved changes. Are you sure you want to discard them?',
                [
                    { text: 'Keep Editing', style: 'cancel' },
                    {
                        text: 'Discard',
                        style: 'destructive',
                        onPress: () => {
                            setEditing(false);
                            setEditedFullName(profile.fullName);
                            setEditedDepartment(profile.department || '');
                            setHasUnsavedChanges(false);
                        },
                    },
                ]
            );
        } else {
            setEditing(false);
        }
    }, [hasUnsavedChanges, profile]);

    const handleImageSelected = useCallback(async (uri: string) => {
        try {
            const userId = session?.user?.id;
            if (!userId) return;

            const url = await uploadProfilePicture(userId, uri);
            if (url) {
                setProfile(prev => ({ ...prev, avatarUrl: url }));
                Alert.alert('Success', 'Profile picture updated!');
            } else {
                Alert.alert('Error', 'Failed to upload profile picture');
            }
        } catch (err) {
            console.error('Error uploading image:', err);
            Alert.alert('Error', 'Upload failed. Please try again.');
        }
    }, [session?.user?.id, setProfile]);



    if (loading && !refreshing) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: getBackgroundColor() }]}>
                <LoadingSpinner size="large" />
            </View>
        );
    }

    if (error && !profile.email) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: getBackgroundColor() }]}>
                <Ionicons name="alert-circle-outline" size={48} color={tokens.colors.error.main} />
                <Text style={[styles.errorText, { color: getTextColor() }]}>
                    Failed to load profile
                </Text>
                <Button variant="primary" onPress={fetchProfile} style={{ marginTop: 16 }}>
                    Retry
                </Button>
            </View>
        );
    }

    // Use consistent header color based on role
    const roleColor = getRoleColor();
    const headerColor = roleColor?.main || tokens.colors.primary.main;

    return (
        <SafeAreaView style={[styles.mainContainer, { backgroundColor: headerColor }]}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={headerColor}
                translucent={true}
            />
            
            <ProfileHeader
                avatarUrl={profile.avatarUrl}
                fullName={profile.fullName}
                role={role}
                editing={editing}
                onImageSelected={handleImageSelected}
                headerColor={headerColor}
            />

            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: getBackgroundColor() }]}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={headerColor}
                    />
                }
            >
                {/* Personal Information Card */}
                <View style={styles.section}>
                    <View style={[styles.card, { backgroundColor: getSurfaceColor() }]}>
                        <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Personal Information</Text>

                        <View style={styles.inputSpacing}>
                            <Input
                                label="Full Name"
                                value={editedFullName}
                                onChangeText={setEditedFullName}
                                disabled={!editing}
                                accessibilityLabel="Full Name"
                            />
                        </View>

                        <View style={styles.inputSpacing}>
                            <Input
                                label="Email"
                                value={profile.email}
                                onChangeText={() => { }}
                                disabled={true}
                                accessibilityLabel="Email (read-only)"
                            />
                        </View>

                        {role === 'student' && (
                            <>
                                <View style={styles.inputSpacing}>
                                    <Input
                                        label="Enrollment Number"
                                        value={profile.enrollmentNumber || ''}
                                        onChangeText={() => { }}
                                        disabled={true}
                                        accessibilityLabel="Enrollment Number (read-only)"
                                    />
                                </View>
                                {profile.branch && (
                                    <View style={styles.inputSpacing}>
                                        <Input
                                            label="Branch"
                                            value={profile.branch}
                                            onChangeText={() => { }}
                                            disabled={true}
                                            accessibilityLabel="Branch (read-only)"
                                        />
                                    </View>
                                )}
                                {profile.className && (
                                    <View style={styles.inputSpacing}>
                                        <Input
                                            label="Class"
                                            value={profile.className}
                                            onChangeText={() => { }}
                                            disabled={true}
                                            accessibilityLabel="Class (read-only)"
                                        />
                                    </View>
                                )}
                            </>
                        )}

                        {role === 'teacher' && (
                            <View style={styles.inputSpacing}>
                                <Input
                                    label="Department"
                                    value={editedDepartment}
                                    onChangeText={setEditedDepartment}
                                    disabled={!editing}
                                    accessibilityLabel="Department"
                                />
                            </View>
                        )}

                        <View style={styles.buttonContainer}>
                            {!editing ? (
                                <Button
                                    variant="primary"
                                    onPress={() => setEditing(true)}
                                    icon={<Ionicons name="pencil" size={18} color="#FFFFFF" />}
                                >
                                    Edit Profile
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        variant="primary"
                                        onPress={handleSave}
                                        loading={saving}
                                        disabled={saving}
                                        style={styles.buttonSpaced}
                                        icon={<Ionicons name="save" size={18} color="#FFFFFF" />}
                                    >
                                        Save Changes
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onPress={handleCancel}
                                        disabled={saving}
                                        icon={<Ionicons name="close" size={18} color={getTextColor()} />}
                                    >
                                        Cancel
                                    </Button>
                                </>
                            )}
                        </View>
                    </View>
                </View>

                {/* Account Information Section */}
                <View style={styles.section}>
                    <View style={[styles.card, { backgroundColor: getSurfaceColor() }]}>
                        <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Account Information</Text>
                        
                        {profile.createdAt && (
                            <InfoRow
                                icon="calendar-outline"
                                label="Joined"
                                value={profile.createdAt}
                                iconColor={getTextSecondaryColor()}
                                labelColor={getTextSecondaryColor()}
                                valueColor={getTextColor()}
                            />
                        )}
                        
                        {profile.lastLogin && (
                            <InfoRow
                                icon="time-outline"
                                label="Last Login"
                                value={profile.lastLogin}
                                iconColor={getTextSecondaryColor()}
                                labelColor={getTextSecondaryColor()}
                                valueColor={getTextColor()}
                            />
                        )}

                        <InfoRow
                            icon="shield-checkmark-outline"
                            label="Account Status"
                            value="Active"
                            iconColor={getTextSecondaryColor()}
                            labelColor={getTextSecondaryColor()}
                            valueColor={tokens.colors.success.main}
                        />
                    </View>
                </View>

                {/* Additional Information Section */}
                <View style={styles.section}>
                    <View style={[styles.card, { backgroundColor: getSurfaceColor() }]}>
                        <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Additional Information</Text>
                        
                        <InfoRow
                            icon="school-outline"
                            label="Role"
                            value={role ? role.charAt(0).toUpperCase() + role.slice(1) : 'N/A'}
                            iconColor={getTextSecondaryColor()}
                            labelColor={getTextSecondaryColor()}
                            valueColor={getTextColor()}
                        />
                        
                        {role === 'student' && profile.className && (
                            <InfoRow
                                icon="book-outline"
                                label="Class"
                                value={profile.className}
                                iconColor={getTextSecondaryColor()}
                                labelColor={getTextSecondaryColor()}
                                valueColor={getTextColor()}
                            />
                        )}
                        
                        {role === 'student' && profile.enrollmentNumber && (
                            <InfoRow
                                icon="reader-outline"
                                label="Enrollment Number"
                                value={profile.enrollmentNumber}
                                iconColor={getTextSecondaryColor()}
                                labelColor={getTextSecondaryColor()}
                                valueColor={getTextColor()}
                            />
                        )}
                        
                        {role === 'teacher' && profile.department && (
                            <InfoRow
                                icon="briefcase-outline"
                                label="Department"
                                value={profile.department}
                                iconColor={getTextSecondaryColor()}
                                labelColor={getTextSecondaryColor()}
                                valueColor={getTextColor()}
                            />
                        )}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContainer: {
        flex: 1,
    },
    errorText: {
        fontSize: 16,
        marginTop: 12,
        textAlign: 'center',
    },
    section: {
        paddingHorizontal: 20,
        marginTop: 16,
    },
    card: {
        borderRadius: 12,
        padding: 16,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    sectionDescription: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 12,
    },
    inputSpacing: {
        marginBottom: 10,
    },
    buttonContainer: {
        marginTop: 12,
    },
    buttonSpaced: {
        marginBottom: 12,
    },
    faceRegistrationContainer: {
        alignItems: 'center',
        paddingVertical: 16,
    },
});
