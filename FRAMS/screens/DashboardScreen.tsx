import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../lib/design-system/ThemeContext';
import StudentDashboard from './student/StudentDashboard';
import TeacherDashboard from './teacher/TeacherDashboard';
import AdminDashboard from './admin/AdminDashboard';
import type { StackScreenProps } from '@react-navigation/stack';

type Props = StackScreenProps<any, 'Dashboard'>;

export default function DashboardScreen({ navigation }: Props) {
    const { role } = useAuth();
    const { tokens, getTextSecondaryColor } = useTheme();
    
    const styles = StyleSheet.create({
        content: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: tokens.spacing.lg,
        },
        noRoleText: {
            textAlign: 'center',
            fontSize: tokens.typography.body.fontSize,
            lineHeight: tokens.typography.body.lineHeight,
            color: getTextSecondaryColor(),
        }
    });

    return (
        <View style={{ flex: 1 }}>
            {role === 'student' && <StudentDashboard />}
            {role === 'teacher' && <TeacherDashboard />}
            {role === 'admin' && <AdminDashboard />}
            {!role && (
                <View style={styles.content}>
                    <Text style={styles.noRoleText}>
                        No role assigned. Please contact admin.
                    </Text>
                </View>
            )}
        </View>
    );
}