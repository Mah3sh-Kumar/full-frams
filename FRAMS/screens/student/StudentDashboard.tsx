import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, StatusBar, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { fetchStudentAttendanceStats, fetchStudentPendingAssignments } from '../../lib/database';
import { useTheme } from '../../lib/design-system/ThemeContext';
import LoadingSpinner from '../../components/design-system/feedback/LoadingSpinner';
import ProgressRing from '../../components/design-system/analytics/ProgressRing';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { fetchStudentMetadata } from '../../lib/database';

export default function StudentDashboard() {
    const navigation = useNavigation();
    const { session } = useAuth();
    const { tokens, getBackgroundColor, getSurfaceColor, getTextColor, getTextSecondaryColor } = useTheme();
    const [stats, setStats] = useState({ 
        attendanceRate: 0, 
        pendingAssignments: 0,
        presentDays: 0,
        totalDays: 0,
        currentStreak: 0,
    });
    const [upcomingEvents, setUpcomingEvents] = useState<Array<{id: string, title: string, date: string, type: string}>>([]);
    const [studentName, setStudentName] = useState<string>('Student');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [metadata, setMetadata] = useState({
        className: '',
        branch: '',
        academicYear: '',
        classLevel: '',
    });

    useEffect(() => {
        loadStats();
        loadStudentName();
        loadStudentMetadata();
        loadUpcomingEvents();
    }, []);

    const getGreeting = useCallback(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([loadStats(), loadStudentName(), loadStudentMetadata(), loadUpcomingEvents()]);
        setRefreshing(false);
    }, []);

    const loadStudentName = async () => {
        if (!session?.user?.id) return;

        try {
            const { data } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', session.user.id)
                .single();

            if (data?.full_name) {
                const firstName = data.full_name.split(' ')[0];
                setStudentName(firstName);
            }
        } catch (err) {
            console.error('Error loading student name:', err);
        }
    };

    const loadStudentMetadata = async () => {
        if (!session?.user?.id) return;

        try {
            const { data: metadataRes } = await fetchStudentMetadata(session.user.id);
            if (metadataRes) {
                setMetadata({
                    className: metadataRes.className || 'Not assigned',
                    branch: metadataRes.branch || 'Not assigned',
                    academicYear: metadataRes.academicYear || 'Not assigned',
                    classLevel: metadataRes.classLevel || 'Not assigned',
                });
            }
        } catch (err) {
            console.error('Error loading student metadata:', err);
        }
    };

    const loadStats = async () => {
        if (!session?.user?.id) return;

        try {
            const [attendanceRes, assignmentsRes] = await Promise.all([
                fetchStudentAttendanceStats(session.user.id),
                fetchStudentPendingAssignments(session.user.id)
            ]);

            // Calculate attendance streak
            const { data: recentAttendance } = await supabase
                .from('attendance')
                .select('status, date')
                .eq('student_id', session.user.id)
                .order('date', { ascending: false })
                .limit(30);

            let streak = 0;
            if (recentAttendance) {
                for (const record of recentAttendance) {
                    if (record.status === 'present') {
                        streak++;
                    } else {
                        break;
                    }
                }
            }

            setStats({
                attendanceRate: attendanceRes.data?.rate || 0,
                pendingAssignments: assignmentsRes.data || 0,
                presentDays: attendanceRes.data?.present || 0,
                totalDays: attendanceRes.data?.total || 0,
                currentStreak: streak,
            });
        } catch (err) {
            console.error('Error loading stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadUpcomingEvents = async () => {
        if (!session?.user?.id) return;

        try {
            // Fetch upcoming assignments
            const { data: assignments, error } = await supabase
                .from('assignments')
                .select('id, title, due_date')
                .gte('due_date', new Date().toISOString())
                .order('due_date', { ascending: true })
                .limit(3);

            if (error) {
                console.error('Error fetching events:', error);
                return;
            }

            if (assignments) {
                const events = assignments.map((assignment: any) => ({
                    id: assignment.id,
                    title: assignment.title,
                    date: assignment.due_date,
                    type: 'assignment',
                }));
                setUpcomingEvents(events);
            }
        } catch (error) {
            console.error('Error loading events:', error);
        }
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'assignment':
                return 'document-text-outline';
            case 'exam':
                return 'school-outline';
            default:
                return 'calendar-outline';
        }
    };

    const formatEventDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    };

    const upcomingEventsDisplay = useMemo(() => {
        if (upcomingEvents.length === 0) return null;

        return (
            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Upcoming Events</Text>
                <View style={[styles.eventsCard, { backgroundColor: getSurfaceColor() }]}>
                    {upcomingEvents.map((event, index) => (
                        <View key={event.id}>
                            <View style={styles.eventItem}>
                                <View style={[styles.eventIconContainer, { backgroundColor: `${tokens.colors.primary.main}15` }]}>
                                    <Ionicons name={getEventIcon(event.type) as any} size={20} color={tokens.colors.primary.main} />
                                </View>
                                <View style={styles.eventContent}>
                                    <Text style={[styles.eventTitle, { color: getTextColor() }]}>{event.title}</Text>
                                    <Text style={[styles.eventDate, { color: getTextSecondaryColor() }]}>
                                        {formatEventDate(event.date)}
                                    </Text>
                                </View>
                            </View>
                            {index < upcomingEvents.length - 1 && (
                                <View style={[styles.eventDivider, { backgroundColor: getTextSecondaryColor() }]} />
                            )}
                        </View>
                    ))}
                </View>
            </View>
        );
    }, [upcomingEvents, tokens, getTextColor, getTextSecondaryColor, getSurfaceColor]);

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: getBackgroundColor() }]}>
                <LoadingSpinner size="large" />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.mainContainer, { backgroundColor: tokens.colors.roles.student.main }]}>
            <StatusBar barStyle="light-content" backgroundColor={tokens.colors.roles.student.main} translucent={true} />
            {/* Blue Header Section */}
            <View style={[styles.welcomeSection, { backgroundColor: tokens.colors.roles.student.main }]}>
                <View style={styles.headerRow}>
                    <View style={styles.welcomeContent}>
                        <Text style={styles.welcomeTitle}>{getGreeting()}, {studentName}!</Text>
                        <Text style={styles.welcomeSubtitle}>Here's your summary for the week.</Text>
                        {metadata.className && (
                            <View style={{ marginTop: 12, gap: 4 }}>
                                <Text style={[styles.welcomeSubtitle, { opacity: 0.9, fontSize: 13 }]}>
                                    Class: {metadata.className}
                                </Text>
                                {metadata.branch && (
                                    <Text style={[styles.welcomeSubtitle, { opacity: 0.9, fontSize: 13 }]}>
                                        Branch: {metadata.branch}
                                    </Text>
                                )}
                                {metadata.academicYear && (
                                    <Text style={[styles.welcomeSubtitle, { opacity: 0.9, fontSize: 13 }]}>
                                        Year: {metadata.academicYear}
                                    </Text>
                                )}
                            </View>
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
                        onPress={() => navigation.navigate('Attendance' as never)}
                        activeOpacity={0.7}
                        style={styles.cardWrapper}
                    >
                        <View style={[styles.taskCard, { borderLeftColor: tokens.colors.roles.student.main, backgroundColor: getSurfaceColor() }]}>
                            <View style={[styles.iconContainer, { backgroundColor: `${tokens.colors.roles.student.main}15` }]}>
                                <Ionicons name="calendar" size={28} color={tokens.colors.roles.student.main} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.taskTitle, { color: getTextColor() }]}>Attendance</Text>
                                <Text style={[styles.taskDescription, { color: getTextSecondaryColor() }]}>View your recent attendance records and history.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={getTextSecondaryColor()} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Assignments' as never)}
                        activeOpacity={0.7}
                        style={styles.cardWrapper}
                    >
                        <View style={[styles.taskCard, { borderLeftColor: tokens.colors.warning.main, backgroundColor: getSurfaceColor() }]}>
                            <View style={[styles.iconContainer, { backgroundColor: `${tokens.colors.warning.main}15` }]}>
                                <Ionicons name="book" size={28} color={tokens.colors.warning.main} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.taskTitle, { color: getTextColor() }]}>Assignments</Text>
                                <Text style={[styles.taskDescription, { color: getTextSecondaryColor() }]}>Check pending tasks and assignment submissions.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={getTextSecondaryColor()} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Attendance Progress Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Attendance Overview</Text>
                    <View style={[styles.attendanceCard, { backgroundColor: getSurfaceColor() }]}>
                        <View style={styles.attendanceHeader}>
                            <ProgressRing 
                                progress={stats.attendanceRate} 
                                size={100} 
                                strokeWidth={10}
                                gradientColors={[tokens.colors.roles.student.main, tokens.colors.primary.main]}
                            />
                            <View style={styles.attendanceStats}>
                                <View style={styles.attendanceStat}>
                                    <Text style={[styles.attendanceStatValue, { color: getTextColor() }]}>{stats.presentDays}</Text>
                                    <Text style={[styles.attendanceStatLabel, { color: getTextSecondaryColor() }]}>Present</Text>
                                </View>
                                <View style={[styles.attendanceStatDivider, { backgroundColor: getTextSecondaryColor() }]} />
                                <View style={styles.attendanceStat}>
                                    <Text style={[styles.attendanceStatValue, { color: getTextColor() }]}>{stats.totalDays}</Text>
                                    <Text style={[styles.attendanceStatLabel, { color: getTextSecondaryColor() }]}>Total Days</Text>
                                </View>
                            </View>
                        </View>
                        {stats.currentStreak > 0 && (
                            <View style={[styles.streakBanner, { backgroundColor: `${tokens.colors.success.main}15` }]}>
                                <Ionicons name="flame" size={20} color={tokens.colors.success.main} />
                                <Text style={[styles.streakText, { color: tokens.colors.success.main }]}>
                                    {stats.currentStreak} day streak! Keep it up!
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Pending Assignments */}
                {stats.pendingAssignments > 0 && (
                    <View style={styles.section}>
                        <View style={[styles.alertCard, { backgroundColor: `${tokens.colors.warning.main}15`, borderColor: tokens.colors.warning.main }]}>
                            <View style={styles.alertIconContainer}>
                                <Ionicons name="alert-circle" size={24} color={tokens.colors.warning.main} />
                            </View>
                            <View style={styles.alertContent}>
                                <Text style={[styles.alertTitle, { color: getTextColor() }]}>Pending Assignments</Text>
                                <Text style={[styles.alertSubtitle, { color: getTextSecondaryColor() }]}>
                                    You have {stats.pendingAssignments} assignment{stats.pendingAssignments !== 1 ? 's' : ''} to complete
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => navigation.navigate('Assignments' as never)}>
                                <Ionicons name="chevron-forward" size={20} color={tokens.colors.warning.main} />
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Upcoming Events Section */}
                {upcomingEventsDisplay}
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
        paddingTop: 20,
        paddingBottom: 32,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
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
    attendanceCard: {
        borderRadius: 16,
        padding: 20,
        elevation: 3,
    },
    attendanceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
    },
    attendanceStats: {
        flex: 1,
        flexDirection: 'row',
        gap: 16,
    },
    attendanceStat: {
        flex: 1,
        alignItems: 'center',
    },
    attendanceStatValue: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 4,
    },
    attendanceStatLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    attendanceStatDivider: {
        width: 1,
        opacity: 0.2,
    },
    streakBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
    },
    streakText: {
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    alertCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderLeftWidth: 4,
    },
    alertIconContainer: {
        marginRight: 12,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    alertSubtitle: {
        fontSize: 14,
    },
    eventsCard: {
        borderRadius: 16,
        padding: 16,
        elevation: 3,
    },
    eventItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    eventIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    eventContent: {
        flex: 1,
    },
    eventTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    eventDate: {
        fontSize: 12,
    },
    eventDivider: {
        height: 1,
        marginLeft: 52,
        opacity: 0.1,
    },
});



