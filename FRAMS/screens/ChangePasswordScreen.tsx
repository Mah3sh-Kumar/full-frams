import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/design-system/ThemeContext';
import Button from '../components/design-system/primitives/Button';
import Input from '../components/design-system/primitives/Input';
import Card from '../components/design-system/primitives/Card';
import { Ionicons } from '@expo/vector-icons';
import type { StackScreenProps } from '@react-navigation/stack';
import { RootStackParamList } from '../lib/types';

type Props = StackScreenProps<RootStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen({ navigation }: Props) {
    const { tokens, getBackgroundColor, getSurfaceColor, getTextColor, getTextSecondaryColor } = useTheme();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = (): boolean => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setErrorMsg('Please fill in all fields');
            return false;
        }

        if (newPassword.length < 6) {
            setErrorMsg('New password must be at least 6 characters');
            return false;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg('New passwords do not match');
            return false;
        }

        if (currentPassword === newPassword) {
            setErrorMsg('New password must be different from current password');
            return false;
        }

        return true;
    };

    const handleChangePassword = async () => {
        setErrorMsg('');

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            // Supabase allows changing password for logged-in users
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                setErrorMsg(error.message);
            } else {
                Alert.alert(
                    'Success',
                    'Password changed successfully',
                    [
                        {
                            text: 'OK',
                            onPress: () => navigation.goBack()
                        }
                    ]
                );
            }
        } catch (err: any) {
            setErrorMsg(err.message || 'An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ScrollView 
            contentContainerStyle={[styles.container, { backgroundColor: getBackgroundColor() }]}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
        >
            <Card style={styles.card}>
                <Text style={[styles.title, { color: getTextColor() }]}>Change Password</Text>
                <Text style={[styles.subtitle, { color: getTextSecondaryColor() }]}>
                    Enter your current password and choose a new one
                </Text>

                <View style={styles.form}>
                    <View style={styles.inputWrapper}>
                        <Input
                            label="Current Password"
                            value={currentPassword}
                            onChangeText={(text) => {
                                setCurrentPassword(text);
                                setErrorMsg('');
                            }}
                            secureTextEntry={!showCurrentPassword}
                            autoCapitalize="none"
                            disabled={isSubmitting}
                            icon={
                                <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                                    <Ionicons 
                                        name={showCurrentPassword ? 'eye-off-outline' : 'eye-outline'} 
                                        size={24} 
                                        color={tokens.colors.neutral.gray500} 
                                    />
                                </TouchableOpacity>
                            }
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Input
                            label="New Password"
                            value={newPassword}
                            onChangeText={(text) => {
                                setNewPassword(text);
                                setErrorMsg('');
                            }}
                            secureTextEntry={!showNewPassword}
                            autoCapitalize="none"
                            disabled={isSubmitting}
                            icon={
                                <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                    <Ionicons 
                                        name={showNewPassword ? 'eye-off-outline' : 'eye-outline'} 
                                        size={24} 
                                        color={tokens.colors.neutral.gray500} 
                                    />
                                </TouchableOpacity>
                            }
                        />
                    </View>

                    <View style={styles.inputWrapper}>
                        <Input
                            label="Confirm New Password"
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                setErrorMsg('');
                            }}
                            secureTextEntry={!showConfirmPassword}
                            autoCapitalize="none"
                            disabled={isSubmitting}
                            icon={
                                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                    <Ionicons 
                                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} 
                                        size={24} 
                                        color={tokens.colors.neutral.gray500} 
                                    />
                                </TouchableOpacity>
                            }
                        />
                    </View>

                    {errorMsg ? (
                        <Text style={styles.errorText}>
                            {errorMsg}
                        </Text>
                    ) : null}

                    <Button
                        variant="primary"
                        onPress={handleChangePassword}
                        loading={isSubmitting}
                        disabled={isSubmitting || !currentPassword || !newPassword || !confirmPassword}
                        style={styles.submitButton}
                    >
                        Change Password
                    </Button>

                    <Button
                        variant="ghost"
                        onPress={() => navigation.goBack()}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                </View>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 16,
    },
    card: {
        marginTop: 16,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    form: {
        width: '100%',
    },
    inputWrapper: {
        marginBottom: 0,
    },
    errorText: {
        fontSize: 14,
        color: '#EF4444',
        marginBottom: 16,
        marginTop: -8,
    },
    submitButton: {
        marginTop: 8,
        marginBottom: 12,
    },
});
