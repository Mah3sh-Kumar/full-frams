import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../lib/design-system/ThemeContext';
import LoadingSpinner from '../../components/design-system/feedback/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { fetchTeacherMetadata } from '../../lib/database';
import { getSubjectsByTeacher } from '../../lib/subjects';
import SubjectCard from '../../components/admin/subjects/SubjectCard';
import { SubjectItem, TeacherInfo } from '../../lib/types';

export default function TeacherDashboard() {
    const navigation = useNavigation();
    const { session } = useAuth();
    const { tokens, getBackgroundColor, getSurfaceColor, getTextColor, getTextSecondaryColor } = useTheme();
    const [teacherName, setTeacherName] = useState<string>('Teacher');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalClasses: 0,
        pendingReviews: 0
    });
    const [metadata, setMetadata] = useState({
        department: '',
    });
    const [subjects, setSubjects] = useState<(SubjectItem & { teachers: TeacherInfo[] })[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const getGreeting = useCallback(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, []);

    const loadData = async () => {
        if (!session?.user?.id) return;
        setLoading(true);

        try {
            // Load Teacher Profile
            const { data: userData } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', session.user.id)
                .single();

            if (userData?.full_name) {
                const firstName = userData.full_name.split(' ')[0];
                setTeacherName(firstName);
            }

            // Load Teacher Metadata (Department)
            const { data: metadataRes } = await fetchTeacherMetadata(session.user.id);
            if (metadataRes) {
                setMetadata({
                    department: metadataRes.department || 'Not assigned',
                });
            }

            // Load Subjects assigned to this teacher
            const { data: subjectsData, error: subjectsError } = await getSubjectsByTeacher(session.user.id);
            if (subjectsError) {
                console.error('Error loading subjects:', subjectsError);
            } else if (subjectsData) {
                setSubjects(subjectsData);
            }

            // Load Subjects (to get classes) - using old query for stats
            const { data: subjectsForStats } = await supabase
                .from('subjects')
                .select('id, class_id')
                .eq('teacher_id', session.user.id);

            if (subjectsForStats) {
                const uniqueClassIds = [...new Set(subjectsForStats.map(s => s.class_id).filter(Boolean))];
                const subjectIds = subjectsForStats.map(s => s.id);

                // 1. Total Classes
                const totalClasses = uniqueClassIds.length;

                // 2. Total Students (across all unique classes)
                let totalStudents = 0;
                if (uniqueClassIds.length > 0) {
                    const { count } = await supabase
                        .from('students')
                        .select('*', { count: 'exact', head: true })
                        .in('class_id', uniqueClassIds);
                    totalStudents = count || 0;
                }

                // 3. Pending Reviews
                let pendingReviews = 0;
                if (subjectIds.length > 0) {
                    // Get assignments for these subjects
                    const { data: assignments } = await supabase
                        .from('assignments')
                        .select('id')
                        .in('subject_id', subjectIds);
                    
                    if (assignments && assignments.length > 0) {
                        const assignmentIds = assignments.map(a => a.id);
                        const { count } = await supabase
                            .from('student_assignments')
                            .select('*', { count: 'exact', head: true })
                            .in('assignment_id', assignmentIds)
                            .eq('status', 'submitted');
                        pendingReviews = count || 0;
                    }
                }

                setStats({
                    totalStudents,
                    totalClasses,
                    pendingReviews
                });
            }
        } catch (err) {
            console.error('Error loading dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: getBackgroundColor() }]}>
                <LoadingSpinner size="large" />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.mainContainer, { backgroundColor: tokens.colors.roles.teacher.main }]}>
            <StatusBar barStyle="light-content" backgroundColor={tokens.colors.roles.teacher.main} translucent={true} />
            {/* Green Header Section */}
            <View style={[styles.welcomeSection, { backgroundColor: tokens.colors.roles.teacher.main }]}>
                <View style={styles.headerRow}>
                    <View style={styles.welcomeContent}>
                        <Text style={styles.welcomeTitle}>{getGreeting()}, {teacherName}!</Text>
                        <Text style={styles.welcomeSubtitle}>Manage your classes and students</Text>
                        {metadata.department && (
                            <Text style={[styles.welcomeSubtitle, { marginTop: 8, opacity: 0.9 }]}>
                                Department: {metadata.department}
                            </Text>
                        )}
                    </View>
                    <View style={styles.quickActions}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.navigate('Notifications' as never)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.navigate('Profile' as never)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="person-circle-outline" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => navigation.navigate('Settings' as never)}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Scrollable Content Area */}
            <ScrollView
                style={[styles.scrollContainer, { backgroundColor: getBackgroundColor() }]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {/* Quick Access Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Quick Access</Text>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('AttendanceManager' as never)}
                        activeOpacity={0.7}
                        style={styles.cardWrapper}
                    >
                        <View style={[styles.taskCard, { borderLeftColor: tokens.colors.success.main, backgroundColor: getSurfaceColor() }]}>
                            <View style={[styles.iconContainer, { backgroundColor: `${tokens.colors.success.main}15` }]}>
                                <Ionicons name="checkmark-circle" size={28} color={tokens.colors.success.main} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.taskTitle, { color: getTextColor() }]}>Manage Attendance</Text>
                                <Text style={[styles.taskDescription, { color: getTextSecondaryColor() }]}>Mark student attendance for your classes.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={getTextSecondaryColor()} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('AssignmentManager' as never)}
                        activeOpacity={0.7}
                        style={styles.cardWrapper}
                    >
                        <View style={[styles.taskCard, { borderLeftColor: tokens.colors.info.main, backgroundColor: getSurfaceColor() }]}>
                            <View style={[styles.iconContainer, { backgroundColor: `${tokens.colors.info.main}15` }]}>
                                <Ionicons name="create" size={28} color={tokens.colors.info.main} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.taskTitle, { color: getTextColor() }]}>Manage Assignments</Text>
                                <Text style={[styles.taskDescription, { color: getTextSecondaryColor() }]}>Create and review student assignments.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={getTextSecondaryColor()} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('MarksReviewManager' as never)}
                        activeOpacity={0.7}
                        style={styles.cardWrapper}
                    >
                        <View style={[styles.taskCard, { borderLeftColor: tokens.colors.warning.main, backgroundColor: getSurfaceColor() }]}>
                            <View style={[styles.iconContainer, { backgroundColor: `${tokens.colors.warning.main}15` }]}>
                                <Ionicons name="stats-chart" size={28} color={tokens.colors.warning.main} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.taskTitle, { color: getTextColor() }]}>Review Marks</Text>
                                <Text style={[styles.taskDescription, { color: getTextSecondaryColor() }]}>Grade student submissions and assignments.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={getTextSecondaryColor()} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Key Statistics Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Overview</Text>
                    <View style={styles.statsRow}>
                        <View style={[styles.statCard, { backgroundColor: getSurfaceColor() }]}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIconContainer, { backgroundColor: `${tokens.colors.primary.main}15` }]}>
                                    <Ionicons name="people" size={20} color={tokens.colors.primary.main} />
                                </View>
                                <Text style={[styles.statLabel, { color: getTextSecondaryColor() }]}>Total Students</Text>
                            </View>
                            <Text style={[styles.statValue, { color: getTextColor() }]}>{stats.totalStudents}</Text>
                        </View>

                        <View style={[styles.statCard, { backgroundColor: getSurfaceColor() }]}>
                            <View style={styles.statHeader}>
                                <View style={[styles.statIconContainer, { backgroundColor: `${tokens.colors.accent.main}15` }]}>
                                    <Ionicons name="book" size={20} color={tokens.colors.accent.main} />
                                </View>
                                <Text style={[styles.statLabel, { color: getTextSecondaryColor() }]}>Classes</Text>
                            </View>
                            <Text style={[styles.statValue, { color: getTextColor() }]}>{stats.totalClasses}</Text>
                        </View>
                    </View>

                    <View style={[styles.statCard, { marginTop: 16, backgroundColor: getSurfaceColor() }]}>
                        <View style={styles.statHeader}>
                            <View style={[styles.statIconContainer, { backgroundColor: `${tokens.colors.warning.main}15` }]}>
                                <Ionicons name="time" size={20} color={tokens.colors.warning.main} />
                            </View>
                            <Text style={[styles.statLabel, { color: getTextSecondaryColor() }]}>Pending Reviews</Text>
                        </View>
                        <Text style={[styles.statValue, { color: getTextColor() }]}>{stats.pendingReviews}</Text>
                    </View>
                </View>

                {/* My Subjects Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: getTextColor() }]}>My Subjects</Text>
                    {subjects.length === 0 ? (
                        <View style={[styles.emptyState, { backgroundColor: getSurfaceColor() }]}>
                            <Ionicons name="book-outline" size={48} color={getTextSecondaryColor()} />
                            <Text style={[styles.emptyStateText, { color: getTextSecondaryColor() }]}>
                                No subjects assigned yet
                            </Text>
                        </View>
                    ) : (
                        subjects.map((subject) => (
                            <SubjectCard
                                key={subject.id}
                                subject={subject}
                                onEdit={() => {}}
                                onDelete={() => {}}
                                showActions={false}
                            />
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    mainContainer: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    welcomeSection: {
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 32,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    welcomeContent: {
        flex: 1,
        marginRight: 16,
    },
    welcomeTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 8,
        lineHeight: 34,
    },
    welcomeSubtitle: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.95,
        lineHeight: 22,
    },
    quickActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 4,
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    section: {
        paddingHorizontal: 24,
        marginTop: 24,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    cardWrapper: {
        marginBottom: 16,
    },
    taskCard: {
        borderRadius: 16,
        borderLeftWidth: 4,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    taskTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    taskDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        minHeight: 128,
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    statHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    statIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
    statValue: {
        fontSize: 36,
        fontWeight: '700',
    },
    emptyState: {
        borderRadius: 16,
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    emptyStateText: {
        fontSize: 16,
        marginTop: 12,
        textAlign: 'center',
    },
});
