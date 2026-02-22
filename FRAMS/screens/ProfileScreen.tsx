import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, StatusBar, Platform, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { updateUserProfile } from '../lib/database';
import { uploadProfilePicture } from '../lib/storage';
import { useTheme } from '../lib/design-system/ThemeContext';
import LoadingSpinner from '../components/design-system/feedback/LoadingSpinner';
import Button from '../components/design-system/primitives/Button';
import Input from '../components/design-system/primitives/Input';
import ImagePickerComponent from '../components/ImagePickerComponent';
import type { StackScreenProps } from '@react-navigation/stack';

type Props = StackScreenProps<any, 'Profile'>;

export default function ProfileScreen(_props: Props) {
    const { session, role } = useAuth();
    const { tokens, getBackgroundColor, getSurfaceColor, getTextColor, getTextSecondaryColor, getRoleColor } = useTheme();
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [department, setDepartment] = useState('');
    const [enrollmentNumber, setEnrollmentNumber] = useState('');
    const [branch, setBranch] = useState('');
    const [className, setClassName] = useState('');
    const [createdAt, setCreatedAt] = useState<string>('');
    const [lastLogin, setLastLogin] = useState<string>('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const userId = session?.user?.id;
            if (!userId) return;

            const { data, error } = await supabase
                .from('users')
                .select(`
                    *,
                    students!students_user_id_fkey(*, org_classes(name)),
                    teachers!teachers_id_fkey(*)
                `)
                .eq('id', userId)
                .single();

            if (error) throw error;

            setFullName(data.full_name || '');
            setEmail(data.email || '');
            setAvatarUrl(data.avatar_url || '');
            setCreatedAt(data.created_at ? new Date(data.created_at).toLocaleDateString() : '');
            setLastLogin(data.last_login ? new Date(data.last_login).toLocaleDateString() : '');

            if (role === 'student' && data.students) {
                setEnrollmentNumber(data.students.enrollment_number || '');
                setBranch(data.students.branch || '');
                setClassName(data.students.org_classes?.name || '');
            } else if (role === 'teacher' && data.teachers) {
                setDepartment(data.teachers.department || '');
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const userId = session?.user?.id;
            if (!userId) return;

            const updates: any = {
                full_name: fullName,
            };

            if (role === 'teacher') {
                updates.department = department;
            }

            const { error } = await updateUserProfile(userId, updates);

            if (error) {
                Alert.alert('Error', 'Error updating profile: ' + error);
            } else {
                Alert.alert('Success', 'Profile updated successfully!');
                setEditing(false);
                fetchProfile();
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleImageSelected = async (uri: string) => {
        try {
            const userId = session?.user?.id;
            if (!userId) return;

            const url = await uploadProfilePicture(userId, uri);
            if (url) {
                setAvatarUrl(url);
                Alert.alert('Success', 'Profile picture updated successfully!');
            } else {
                Alert.alert('Error', 'Failed to upload profile picture');
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            Alert.alert('Error', 'An error occurred while uploading');
        }
    };



    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: getBackgroundColor() }]}>
                <LoadingSpinner size="large" />
            </View>
        );
    }

    const roleColor = getRoleColor();
    const headerColor = roleColor ? roleColor.main : tokens.colors.primary.main;
    const contrastColor = roleColor ? roleColor.contrast : '#FFFFFF';

    return (
        <View style={[styles.mainContainer, { backgroundColor: getBackgroundColor() }]}>
            <StatusBar
                barStyle="light-content"
                backgroundColor={headerColor}
                translucent={false}
            />
            {/* Purple Header Section */}
            <View style={[styles.header, { backgroundColor: headerColor }]}>
                <View style={styles.avatarContainer}>
                    <ImagePickerComponent
                        currentImageUrl={avatarUrl}
                        onImageSelected={handleImageSelected}
                        size={100}
                    />
                </View>
                <Text style={[styles.name, { color: contrastColor }]}>{fullName}</Text>
                <Text style={[styles.roleText, { color: contrastColor + 'F2' }]}>{role?.toUpperCase()}</Text>
                {editing && (
                    <View style={[styles.editBadge, { backgroundColor: tokens.colors.warning.main }]}>
                        <Text style={styles.editBadgeText}>EDITING</Text>
                    </View>
                )}
            </View>

            {/* Scrollable Content */}
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: getBackgroundColor() }]}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
            >
                {/* Personal Information Card */}
                <View style={styles.section}>
                    <View style={[styles.card, { backgroundColor: getSurfaceColor() }]}>
                        <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Personal Information</Text>

                        <View style={styles.inputSpacing}>
                            <Input
                                label="Full Name"
                                value={fullName}
                                onChangeText={setFullName}
                                disabled={!editing}
                            />
                        </View>

                        <View style={styles.inputSpacing}>
                            <Input
                                label="Email"
                                value={email}
                                onChangeText={() => { }}
                                disabled={true}
                            />
                        </View>

                        {role === 'student' && (
                            <>
                                <View style={styles.inputSpacing}>
                                    <Input
                                        label="Enrollment Number"
                                        value={enrollmentNumber}
                                        onChangeText={() => { }}
                                        disabled={true}
                                    />
                                </View>
                                {branch && (
                                    <View style={styles.inputSpacing}>
                                        <Input
                                            label="Branch"
                                            value={branch}
                                            onChangeText={() => { }}
                                            disabled={true}
                                        />
                                    </View>
                                )}
                                {className && (
                                    <View style={styles.inputSpacing}>
                                        <Input
                                            label="Class"
                                            value={className}
                                            onChangeText={() => { }}
                                            disabled={true}
                                        />
                                    </View>
                                )}
                            </>
                        )}

                        {role === 'teacher' && (
                            <View style={styles.inputSpacing}>
                                <Input
                                    label="Department"
                                    value={department}
                                    onChangeText={setDepartment}
                                    disabled={!editing}
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
                                        onPress={() => {
                                            setEditing(false);
                                            fetchProfile();
                                        }}
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
                        
                        {createdAt && (
                            <View style={styles.infoRow}>
                                <Ionicons name="calendar-outline" size={20} color={getTextSecondaryColor()} />
                                <View style={styles.infoTextContainer}>
                                    <Text style={[styles.infoLabel, { color: getTextSecondaryColor() }]}>Joined</Text>
                                    <Text style={[styles.infoValue, { color: getTextColor() }]}>{createdAt}</Text>
                                </View>
                            </View>
                        )}
                        
                        {lastLogin && (
                            <View style={styles.infoRow}>
                                <Ionicons name="time-outline" size={20} color={getTextSecondaryColor()} />
                                <View style={styles.infoTextContainer}>
                                    <Text style={[styles.infoLabel, { color: getTextSecondaryColor() }]}>Last Login</Text>
                                    <Text style={[styles.infoValue, { color: getTextColor() }]}>{lastLogin}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.infoRow}>
                            <Ionicons name="shield-checkmark-outline" size={20} color={getTextSecondaryColor()} />
                            <View style={styles.infoTextContainer}>
                                <Text style={[styles.infoLabel, { color: getTextSecondaryColor() }]}>Account Status</Text>
                                <Text style={[styles.infoValue, { color: tokens.colors.success.main }]}>Active</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Additional Information Section */}
                <View style={styles.section}>
                    <View style={[styles.card, { backgroundColor: getSurfaceColor() }] }>
                        <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Additional Information</Text>
                        
                        <View style={styles.infoRow}>
                            <Ionicons name="school-outline" size={20} color={getTextSecondaryColor()} />
                            <View style={styles.infoTextContainer}>
                                <Text style={[styles.infoLabel, { color: getTextSecondaryColor() }]}>Role</Text>
                                <Text style={[styles.infoValue, { color: getTextColor() }]}>{role ? role.charAt(0).toUpperCase() + role.slice(1) : 'N/A'}</Text>
                            </View>
                        </View>
                        
                        {role === 'student' && className && (
                            <View style={styles.infoRow}>
                                <Ionicons name="book-outline" size={20} color={getTextSecondaryColor()} />
                                <View style={styles.infoTextContainer}>
                                    <Text style={[styles.infoLabel, { color: getTextSecondaryColor() }]}>Class</Text>
                                    <Text style={[styles.infoValue, { color: getTextColor() }]}>{className}</Text>
                                </View>
                            </View>
                        )}
                        
                        {role === 'student' && enrollmentNumber && (
                            <View style={styles.infoRow}>
                                <Ionicons name="reader-outline" size={20} color={getTextSecondaryColor()} />
                                <View style={styles.infoTextContainer}>
                                    <Text style={[styles.infoLabel, { color: getTextSecondaryColor() }]}>Enrollment Number</Text>
                                    <Text style={[styles.infoValue, { color: getTextColor() }]}>{enrollmentNumber}</Text>
                                </View>
                            </View>
                        )}
                        
                        {role === 'teacher' && department && (
                            <View style={styles.infoRow}>
                                <Ionicons name="briefcase-outline" size={20} color={getTextSecondaryColor()} />
                                <View style={styles.infoTextContainer}>
                                    <Text style={[styles.infoLabel, { color: getTextSecondaryColor() }]}>Department</Text>
                                    <Text style={[styles.infoValue, { color: getTextColor() }]}>{department}</Text>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>
        </View>
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
    header: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        elevation: 5,
    },
    avatarContainer: {
        marginBottom: 10,
        elevation: 8,
        borderRadius: 50,
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
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    infoTextContainer: {
        marginLeft: 12,
        flex: 1,
    },
    infoLabel: {
        fontSize: 12,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
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
