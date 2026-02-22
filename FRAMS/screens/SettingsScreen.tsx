import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../lib/design-system/ThemeContext';
import Button from '../components/design-system/primitives/Button';
import Card from '../components/design-system/primitives/Card';
import SelectPicker from '../components/design-system/primitives/SelectPicker';
import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';

type Props = StackScreenProps<any, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
    const { signOut } = useAuth();
    const { tokens, mode, toggleMode, getBackgroundColor, getSurfaceColor, getTextColor, getTextSecondaryColor, getBorderColor } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [assignmentReminders, setAssignmentReminders] = useState(true);
    const [attendanceAlerts, setAttendanceAlerts] = useState(true);
    const [gradeNotifications, setGradeNotifications] = useState(true);
    const [hapticFeedback, setHapticFeedback] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [cacheSize, setCacheSize] = useState('0 MB');

    useEffect(() => {
        loadSettings();
        calculateCacheSize();
    }, []);

    const loadSettings = async () => {
        try {
            const hapticSetting = await AsyncStorage.getItem('@frams_haptic_feedback');
            const languageSetting = await AsyncStorage.getItem('@frams_language');
            if (hapticSetting !== null) setHapticFeedback(JSON.parse(hapticSetting));
            if (languageSetting) setSelectedLanguage(languageSetting);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const calculateCacheSize = async () => {
        // Simplified cache calculation - in production, calculate actual AsyncStorage size
        setCacheSize('2.4 MB');
    };

    const handleHapticToggle = async (value: boolean) => {
        setHapticFeedback(value);
        await AsyncStorage.setItem('@frams_haptic_feedback', JSON.stringify(value));
        if (value) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleClearCache = async () => {
        try {
            // Clear all AsyncStorage except theme config and auth
            const keys = await AsyncStorage.getAllKeys();
            const keysToKeep = ['@frams_theme_config', '@supabase.auth.token'];
            const keysToDelete = keys.filter(key => !keysToKeep.includes(key));
            await AsyncStorage.multiRemove(keysToDelete);
            setCacheSize('0 MB');
            Alert.alert('Success', 'Cache cleared successfully');
            if (hapticFeedback) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to clear cache');
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const renderListItem = (
        title: string,
        description: string,
        icon: string,
        onPress?: () => void,
        rightElement?: React.ReactNode
    ) => (
        <TouchableOpacity
            style={[styles.listItem, { borderBottomColor: getBorderColor() }]}
            onPress={onPress}
            disabled={!onPress}
        >
            <View style={styles.listItemLeft}>
                <Ionicons name={icon as any} size={24} color={tokens.colors.primary.main} style={styles.listIcon} />
                <View style={styles.listItemText}>
                    <Text style={[styles.listItemTitle, { color: getTextColor() }]}>{title}</Text>
                    <Text style={[styles.listItemDescription, { color: getTextSecondaryColor() }]}>{description}</Text>
                </View>
            </View>
            {rightElement || (onPress && <Ionicons name="chevron-forward" size={20} color={getTextSecondaryColor()} />)}
        </TouchableOpacity>
    );

    return (
        <ScrollView style={[styles.container, { backgroundColor: getBackgroundColor() }]}>            
            {/* Header */}
            <View style={[styles.header, { backgroundColor: tokens.colors.primary.main }] }>
                <Text style={styles.headerTitle}>Settings</Text>
                <Text style={styles.headerSubtitle}>Manage your account preferences</Text>
            </View>
            
            {/* Appearance Section */}
            <Card variant="default" style={styles.card}>
                <View style={styles.sectionContent}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="color-palette-outline" size={22} color={tokens.colors.primary.main} />
                        <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Appearance</Text>
                    </View>
                    <View style={[styles.sectionDivider, { backgroundColor: getBorderColor() }]} />
                    {renderListItem(
                        'Dark Mode',
                        mode === 'dark' ? 'Dark theme enabled' : 'Light theme enabled',
                        'moon-outline',
                        undefined,
                        <Switch
                            value={mode === 'dark'}
                            onValueChange={toggleMode}
                            trackColor={{ false: tokens.colors.neutral.gray300, true: tokens.colors.primary.light }}
                            thumbColor={mode === 'dark' ? tokens.colors.primary.main : tokens.colors.neutral.white}
                        />
                    )}
                </View>
            </Card>

            {/* Notifications Section */}
            <Card variant="default" style={styles.card}>
                <View style={styles.sectionContent}>
                    <View style={styles.sectionHeader}>
                    <Ionicons name="notifications-outline" size={22} color={tokens.colors.primary.main} />
                    <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Notifications</Text>
                </View>
                <View style={[styles.sectionDivider, { backgroundColor: getBorderColor() }]} />
                {renderListItem(
                    'Enable Notifications',
                    'Receive push notifications',
                    'notifications-outline',
                    undefined,
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                        trackColor={{ false: tokens.colors.neutral.gray300, true: tokens.colors.primary.light }}
                        thumbColor={notificationsEnabled ? tokens.colors.primary.main : tokens.colors.neutral.white}
                    />
                )}
                {renderListItem(
                    'Assignment Reminders',
                    'Get reminded about upcoming assignments',
                    'calendar-outline',
                    undefined,
                    <Switch
                        value={assignmentReminders}
                        onValueChange={setAssignmentReminders}
                        disabled={!notificationsEnabled}
                        trackColor={{ false: tokens.colors.neutral.gray300, true: tokens.colors.primary.light }}
                        thumbColor={assignmentReminders ? tokens.colors.primary.main : tokens.colors.neutral.white}
                    />
                )}
                {renderListItem(
                    'Attendance Alerts',
                    'Get alerted about attendance issues',
                    'alert-circle-outline',
                    undefined,
                    <Switch
                        value={attendanceAlerts}
                        onValueChange={setAttendanceAlerts}
                        disabled={!notificationsEnabled}
                        trackColor={{ false: tokens.colors.neutral.gray300, true: tokens.colors.primary.light }}
                        thumbColor={attendanceAlerts ? tokens.colors.primary.main : tokens.colors.neutral.white}
                    />
                )}
                {renderListItem(
                    'Grade Notifications',
                    'Get notified when assignments are graded',
                    'school-outline',
                    undefined,
                    <Switch
                        value={gradeNotifications}
                        onValueChange={setGradeNotifications}
                        disabled={!notificationsEnabled}
                        trackColor={{ false: tokens.colors.neutral.gray300, true: tokens.colors.primary.light }}
                        thumbColor={gradeNotifications ? tokens.colors.primary.main : tokens.colors.neutral.white}
                    />
                )}
                </View>
            </Card>

            {/* Preferences Section */}
            <Card variant="default" style={styles.card}>
                <View style={styles.sectionContent}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="options-outline" size={22} color={tokens.colors.primary.main} />
                        <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Preferences</Text>
                    </View>
                    <View style={[styles.sectionDivider, { backgroundColor: getBorderColor() }]} />
                    {renderListItem(
                        'Haptic Feedback',
                        hapticFeedback ? 'Enabled' : 'Disabled',
                        'pulse-outline',
                        undefined,
                        <Switch
                            value={hapticFeedback}
                            onValueChange={handleHapticToggle}
                            trackColor={{ false: tokens.colors.neutral.gray300, true: tokens.colors.primary.light }}
                            thumbColor={hapticFeedback ? tokens.colors.primary.main : tokens.colors.neutral.white}
                        />
                    )}
                    <View style={[styles.sectionDivider, { backgroundColor: getBorderColor() }]} />
                    <View style={styles.pickerContainer}>
                        <SelectPicker
                            label="Language"
                            value={selectedLanguage}
                            items={[
                                { label: 'English', value: 'en', icon: 'language-outline' as const },
                                { label: 'Spanish', value: 'es', icon: 'language-outline' as const },
                                { label: 'French', value: 'fr', icon: 'language-outline' as const },
                            ]}
                            onValueChange={async (value) => {
                                setSelectedLanguage(value);
                                await AsyncStorage.setItem('@frams_language', value);
                                if (hapticFeedback) {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                }
                            }}
                        />
                    </View>
                </View>
            </Card>

            {/* Storage & Data Section */}
            <Card style={styles.card}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="server-outline" size={22} color={tokens.colors.primary.main} />
                    <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Storage & Data</Text>
                </View>
                <View style={[styles.sectionDivider, { backgroundColor: getBorderColor() }]} />
                {renderListItem(
                    'Cache Size',
                    cacheSize,
                    'folder-outline'
                )}
                <TouchableOpacity
                    style={[styles.listItem, { borderBottomColor: getBorderColor() }]}
                    onPress={handleClearCache}
                >
                    <View style={styles.listItemLeft}>
                        <Ionicons name="trash-outline" size={24} color={tokens.colors.error.main} style={styles.listIcon} />
                        <View style={styles.listItemText}>
                            <Text style={[styles.listItemTitle, { color: tokens.colors.error.main }]}>Clear Cache</Text>
                            <Text style={[styles.listItemDescription, { color: getTextSecondaryColor() }]}>
                                Free up storage space
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={getTextSecondaryColor()} />
                </TouchableOpacity>
            </Card>

            {/* Security Section */}
            <Card variant="default" style={styles.card}>
                <View style={styles.sectionContent}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="lock-closed-outline" size={22} color={tokens.colors.primary.main} />
                        <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Security</Text>
                    </View>
                    <View style={[styles.sectionDivider, { backgroundColor: getBorderColor() }]} />
                    {renderListItem(
                        'Change Password',
                        'Update your password',
                        'lock-closed-outline',
                        () => navigation.navigate('ChangePassword')
                    )}
                </View>
            </Card>

            {/* Help & Support Section */}
            <Card variant="default" style={styles.card}>
                <View style={styles.sectionContent}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="help-circle-outline" size={22} color={tokens.colors.primary.main} />
                        <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Help & Support</Text>
                    </View>
                    <View style={[styles.sectionDivider, { backgroundColor: getBorderColor() }]} />
                    {renderListItem(
                        'FAQ',
                        'Frequently asked questions',
                        'help-outline',
                        () => Alert.alert('FAQ', 'FAQ section coming soon')
                    )}
                    {renderListItem(
                        'Contact Support',
                        'Get help from our team',
                        'mail-outline',
                        () => Alert.alert('Contact', 'Contact support at support@frams.edu')
                    )}
                </View>
            </Card>

            {/* About Section */}
            <Card variant="default" style={styles.card}>
                <View style={styles.sectionContent}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="information-circle-outline" size={22} color={tokens.colors.primary.main} />
                        <Text style={[styles.sectionTitle, { color: getTextColor() }]}>About</Text>
                    </View>
                    <View style={[styles.sectionDivider, { backgroundColor: getBorderColor() }]} />
                    {renderListItem(
                        'App Version',
                        '1.0.0',
                        'information-circle-outline'
                    )}
                    {renderListItem(
                        'Privacy Policy',
                        'View our privacy policy',
                        'shield-checkmark-outline',
                        () => navigation.navigate('PrivacyPolicy')
                    )}
                    {renderListItem(
                        'Terms of Service',
                        'View terms of service',
                        'document-text-outline',
                        () => navigation.navigate('Terms')
                    )}
                </View>
            </Card>



            {/* Sign Out Button */}
            <View style={styles.signOutContainer}>
                <Button
                    variant="danger"
                    onPress={handleSignOut}
                >
                    Sign Out
                </Button>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: getTextSecondaryColor() }]}>
                    Made with ❤️ for Education
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 24,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        marginTop: 4,
        opacity: 0.8,
    },
    card: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    sectionContent: {
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    sectionDivider: {
        height: 1,
        marginVertical: 8,
    },
    pickerContainer: {
        marginTop: 8,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    listItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    listIcon: {
        marginRight: 16,
    },
    listItemText: {
        flex: 1,
    },
    listItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    listItemDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    signOutContainer: {
        paddingHorizontal: 16,
        paddingTop: 32,
        paddingBottom: 16,
    },
    footer: {
        paddingVertical: 32,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
    },
});
