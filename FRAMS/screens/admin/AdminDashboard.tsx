import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, StatusBar, RefreshControl, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../lib/design-system/ThemeContext';
import LoadingSpinner from '../../components/design-system/feedback/LoadingSpinner';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import StatWidget from '../../components/admin/StatWidget';
import DataTable from '../../components/admin/DataTable';

export default function AdminDashboard() {
    const navigation = useNavigation();
    const { session, signOut } = useAuth();
    const { tokens, getBackgroundColor, getSurfaceColor, getTextColor, getTextSecondaryColor } = useTheme();
    const [adminName, setAdminName] = useState<string>('Admin');
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalStudents: 0,
        totalTeachers: 0,
        unverifiedUsers: 0,
    });
    const [previousStats, setPreviousStats] = useState({
        totalUsers: 0,
        totalStudents: 0,
        totalTeachers: 0,
        unverifiedUsers: 0,
    });
    const [recentActivity, setRecentActivity] = useState<Array<{ id: string, action: string, timestamp: string, user: string }>>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const scaleAnim = useState(new Animated.Value(0))[0];

    useEffect(() => {
        loadAdminName();
        fetchStats();
        fetchRecentActivity();

        // Animate cards on mount
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();
    }, []);

    const getGreeting = useCallback(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    }, []);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([loadAdminName(), fetchStats(), fetchRecentActivity()]);
        setRefreshing(false);
    }, []);

    const loadAdminName = async () => {
        if (!session?.user?.id) return;

        try {
            const { data, error } = await supabase
                .from('users')
                .select('full_name')
                .eq('id', session.user.id)
                .single();

            if (error) {
                console.error('Error loading admin name:', error);
                return;
            }

            if (data?.full_name) {
                const firstName = data.full_name.split(' ')[0];
                setAdminName(firstName || 'Admin');
            }
        } catch (err) {
            console.error('Error loading admin name:', err);
        }
    };

    const fetchStats = async () => {
        try {
            // Store previous stats before fetching new ones
            setPreviousStats(stats);

            const [usersResult, studentsResult, teachersResult, unverifiedResult] = await Promise.all([
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('students').select('*', { count: 'exact', head: true }),
                supabase.from('teachers').select('*', { count: 'exact', head: true }),
                supabase.from('users').select('*', { count: 'exact', head: true }).eq('is_verified', false)
            ]);

            // Check for errors in any of the queries
            if (usersResult.error) console.error('Error fetching users count:', usersResult.error);
            if (studentsResult.error) console.error('Error fetching students count:', studentsResult.error);
            if (teachersResult.error) console.error('Error fetching teachers count:', teachersResult.error);
            if (unverifiedResult.error) console.error('Error fetching unverified count:', unverifiedResult.error);

            setStats({
                totalUsers: usersResult.count || 0,
                totalStudents: studentsResult.count || 0,
                totalTeachers: teachersResult.count || 0,
                unverifiedUsers: unverifiedResult.count || 0,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Set default values on error
            setStats({
                totalUsers: 0,
                totalStudents: 0,
                totalTeachers: 0,
                unverifiedUsers: 0,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchRecentActivity = async () => {
        try {
            // Temporarily disabled due to audit_logs table issue
            // Will re-enable once database schema is fixed
            /*
            const { data, error } = await supabase
                .from('admin_audit_log')
                .select(`
                    *,
                    actor:users(full_name)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) {
                console.error('Error fetching activity:', error);
                return;
            }

            if (data) {
                const activities = data.map((log: any) => ({
                    id: log.id,
                    action: log.action,
                    timestamp: log.created_at,
                    user: (log.actor as any)?.full_name || 'Unknown User',
                }));
                setRecentActivity(activities);
            }
            */
            // Set dummy data for now
            setRecentActivity([]);
        } catch (error) {
            console.error('Error fetching activity:', error);
        }
    };

    const getTrendIndicator = (current: number, previous: number) => {
        if (previous === 0) return null;
        const diff = current - previous;
        if (diff === 0) return null;

        const percentage = Math.abs(Math.round((diff / previous) * 100));
        const isPositive = diff > 0;

        return {
            diff,
            percentage,
            isPositive,
        };
    };

    const getRelativeTime = (timestamp: string) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffMs = now.getTime() - time.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
        return `${Math.floor(diffMins / 1440)}d ago`;
    };

    const handleMenuItemPress = (itemId: string) => {
        // Map menu item IDs to screen names
        const screenMap: Record<string, string> = {
            dashboard: 'AdminDashboard',
            users: 'UserManagement',
            organization: 'OrganizationManager',
            reports: 'ReportsScreen',
            audit: 'AuditLogsScreen',
            verification: 'VerificationDashboard'
        };

        const screenName = screenMap[itemId];
        if (screenName) {
            navigation.navigate(screenName as never);
        }
    };

    const handleLogout = async () => {
        await signOut();
    };

    if (loading) {
        return (
            <AdminLayout
                activeMenuItem="dashboard"
                onMenuItemPress={handleMenuItemPress}
                onLogout={handleLogout}
                userName={adminName}
                userEmail={session?.user?.email || ''}
            >
                <View style={[styles.loadingContainer, { backgroundColor: getBackgroundColor() }]}>
                    <LoadingSpinner size="large" />
                </View>
            </AdminLayout>
        );
    }

    return (
        <View style={[styles.mainContainer, { backgroundColor: getBackgroundColor() }]}>
            <StatusBar barStyle="light-content" backgroundColor={tokens.colors.roles.admin.main} />
            {/* Purple Header Section */}
            <View style={[styles.welcomeSection, { backgroundColor: tokens.colors.roles.admin.main }]}>
                <View style={styles.headerRow}>
                    <View style={styles.welcomeContent}>
                        <Text style={styles.welcomeTitle}>{getGreeting()}, {adminName}!</Text>
                        <Text style={styles.welcomeSubtitle}>System overview and management</Text>
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
                    <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Quick Actions</Text>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('UserManagement' as never)}
                        activeOpacity={0.7}
                        style={styles.cardWrapper}
                    >
                        <View style={[styles.taskCard, { borderLeftColor: tokens.colors.roles.admin.main, backgroundColor: getSurfaceColor() }]}>
                            <View style={[styles.iconContainer, { backgroundColor: `${tokens.colors.roles.admin.main}15` }]}>
                                <Ionicons name="settings" size={28} color={tokens.colors.roles.admin.main} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.taskTitle, { color: getTextColor() }]}>User Management</Text>
                                <Text style={[styles.taskDescription, { color: getTextSecondaryColor() }]}>Manage users, roles, and permissions.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={getTextSecondaryColor()} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('OrganizationManager' as never)}
                        activeOpacity={0.7}
                        style={styles.cardWrapper}
                    >
                        <View style={[styles.taskCard, { borderLeftColor: tokens.colors.primary.main, backgroundColor: getSurfaceColor() }]}>
                            <View style={[styles.iconContainer, { backgroundColor: `${tokens.colors.primary.main}15` }]}>
                                <Ionicons name="business" size={28} color={tokens.colors.primary.main} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.taskTitle, { color: getTextColor() }]}>Organization Manager</Text>
                                <Text style={[styles.taskDescription, { color: getTextSecondaryColor() }]}>Manage classes, branches, and departments.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={getTextSecondaryColor()} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('AuditLogs' as never)}
                        activeOpacity={0.7}
                        style={styles.cardWrapper}
                    >
                        <View style={[styles.taskCard, { borderLeftColor: tokens.colors.info.main, backgroundColor: getSurfaceColor() }]}>
                            <View style={[styles.iconContainer, { backgroundColor: `${tokens.colors.info.main}15` }]}>
                                <Ionicons name="list-outline" size={28} color={tokens.colors.info.main} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.taskTitle, { color: getTextColor() }]}>Audit Logs</Text>
                                <Text style={[styles.taskDescription, { color: getTextSecondaryColor() }]}>Monitor system activities and changes.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={getTextSecondaryColor()} />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('Reports' as never)}
                        activeOpacity={0.7}
                        style={styles.cardWrapper}
                    >
                        <View style={[styles.taskCard, { borderLeftColor: tokens.colors.success.main, backgroundColor: getSurfaceColor() }]}>
                            <View style={[styles.iconContainer, { backgroundColor: `${tokens.colors.success.main}15` }]}>
                                <Ionicons name="bar-chart" size={28} color={tokens.colors.success.main} />
                            </View>
                            <View style={styles.textContainer}>
                                <Text style={[styles.taskTitle, { color: getTextColor() }]}>View Reports</Text>
                                <Text style={[styles.taskDescription, { color: getTextSecondaryColor() }]}>Analytics and system insights.</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={getTextSecondaryColor()} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* System Statistics Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: getTextColor() }]}>System Statistics</Text>
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                        <View style={styles.statsGrid}>
                            <View style={[styles.statCard, { backgroundColor: getSurfaceColor() }]}>
                                <View style={styles.statHeader}>
                                    <View style={[styles.statIconContainer, { backgroundColor: `${tokens.colors.info.main}15` }]}>
                                        <Ionicons name="people" size={20} color={tokens.colors.info.main} />
                                    </View>
                                    <Text style={[styles.statLabel, { color: getTextSecondaryColor() }]}>Total Users</Text>
                                </View>
                                <View style={styles.statValueRow}>
                                    <Text style={[styles.statValue, { color: getTextColor() }]}>{stats.totalUsers}</Text>
                                    {getTrendIndicator(stats.totalUsers, previousStats.totalUsers) && (
                                        <View style={[styles.trendBadge, { backgroundColor: getTrendIndicator(stats.totalUsers, previousStats.totalUsers)!.isPositive ? `${tokens.colors.success.main}20` : `${tokens.colors.error.main}20` }]}>
                                            <Ionicons
                                                name={getTrendIndicator(stats.totalUsers, previousStats.totalUsers)!.isPositive ? "trending-up" : "trending-down"}
                                                size={12}
                                                color={getTrendIndicator(stats.totalUsers, previousStats.totalUsers)!.isPositive ? tokens.colors.success.main : tokens.colors.error.main}
                                            />
                                            <Text style={[styles.trendText, { color: getTrendIndicator(stats.totalUsers, previousStats.totalUsers)!.isPositive ? tokens.colors.success.main : tokens.colors.error.main }]}>
                                                {getTrendIndicator(stats.totalUsers, previousStats.totalUsers)!.percentage}%
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <View style={[styles.statCard, { backgroundColor: getSurfaceColor() }]}>
                                <View style={styles.statHeader}>
                                    <View style={[styles.statIconContainer, { backgroundColor: `${tokens.colors.primary.main}15` }]}>
                                        <Ionicons name="school" size={20} color={tokens.colors.primary.main} />
                                    </View>
                                    <Text style={[styles.statLabel, { color: getTextSecondaryColor() }]}>Students</Text>
                                </View>
                                <View style={styles.statValueRow}>
                                    <Text style={[styles.statValue, { color: getTextColor() }]}>{stats.totalStudents}</Text>
                                    {getTrendIndicator(stats.totalStudents, previousStats.totalStudents) && (
                                        <View style={[styles.trendBadge, { backgroundColor: getTrendIndicator(stats.totalStudents, previousStats.totalStudents)!.isPositive ? `${tokens.colors.success.main}20` : `${tokens.colors.error.main}20` }]}>
                                            <Ionicons
                                                name={getTrendIndicator(stats.totalStudents, previousStats.totalStudents)!.isPositive ? "trending-up" : "trending-down"}
                                                size={12}
                                                color={getTrendIndicator(stats.totalStudents, previousStats.totalStudents)!.isPositive ? tokens.colors.success.main : tokens.colors.error.main}
                                            />
                                            <Text style={[styles.trendText, { color: getTrendIndicator(stats.totalStudents, previousStats.totalStudents)!.isPositive ? tokens.colors.success.main : tokens.colors.error.main }]}>
                                                {getTrendIndicator(stats.totalStudents, previousStats.totalStudents)!.percentage}%
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        <View style={[styles.statsGrid, { marginTop: 16 }]}>
                            <View style={[styles.statCard, { backgroundColor: getSurfaceColor() }]}>
                                <View style={styles.statHeader}>
                                    <View style={[styles.statIconContainer, { backgroundColor: `${tokens.colors.success.main}15` }]}>
                                        <Ionicons name="briefcase" size={20} color={tokens.colors.success.main} />
                                    </View>
                                    <Text style={[styles.statLabel, { color: getTextSecondaryColor() }]}>Teachers</Text>
                                </View>
                                <View style={styles.statValueRow}>
                                    <Text style={[styles.statValue, { color: getTextColor() }]}>{stats.totalTeachers}</Text>
                                    {getTrendIndicator(stats.totalTeachers, previousStats.totalTeachers) && (
                                        <View style={[styles.trendBadge, { backgroundColor: getTrendIndicator(stats.totalTeachers, previousStats.totalTeachers)!.isPositive ? `${tokens.colors.success.main}20` : `${tokens.colors.error.main}20` }]}>
                                            <Ionicons
                                                name={getTrendIndicator(stats.totalTeachers, previousStats.totalTeachers)!.isPositive ? "trending-up" : "trending-down"}
                                                size={12}
                                                color={getTrendIndicator(stats.totalTeachers, previousStats.totalTeachers)!.isPositive ? tokens.colors.success.main : tokens.colors.error.main}
                                            />
                                            <Text style={[styles.trendText, { color: getTrendIndicator(stats.totalTeachers, previousStats.totalTeachers)!.isPositive ? tokens.colors.success.main : tokens.colors.error.main }]}>
                                                {getTrendIndicator(stats.totalTeachers, previousStats.totalTeachers)!.percentage}%
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>

                            <TouchableOpacity
                                style={[styles.statCard, { backgroundColor: getSurfaceColor() }]}
                                onPress={() => navigation.navigate('VerificationDashboard' as never)}
                            >
                                <View style={styles.statHeader}>
                                    <View style={[styles.statIconContainer, { backgroundColor: `${tokens.colors.warning.main}15` }]}>
                                        <Ionicons name="alert-circle" size={20} color={tokens.colors.warning.main} />
                                    </View>
                                    <Text style={[styles.statLabel, { color: getTextSecondaryColor() }]}>Pending Verification</Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <Text style={[styles.statValue, { color: getTextColor() }]}>{stats.unverifiedUsers}</Text>
                                    <Ionicons name="arrow-forward" size={16} color={tokens.colors.warning.main} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>

                {/* Recent Activity Section */}
                {recentActivity.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: getTextColor() }]}>Recent Activity</Text>
                            <TouchableOpacity onPress={() => navigation.navigate('AuditLogs' as never)}>
                                <Text style={[styles.viewAllText, { color: tokens.colors.primary.main }]}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[styles.activityCard, { backgroundColor: getSurfaceColor() }]}>
                            {recentActivity.map((activity, index) => (
                                <View key={activity.id}>
                                    <View style={styles.activityItem}>
                                        <View style={[styles.activityDot, { backgroundColor: tokens.colors.primary.main }]} />
                                        <View style={styles.activityContent}>
                                            <Text style={[styles.activityAction, { color: getTextColor() }]}>{activity.action}</Text>
                                            <Text style={[styles.activityUser, { color: getTextSecondaryColor() }]}>{activity.user}</Text>
                                        </View>
                                        <Text style={[styles.activityTime, { color: getTextSecondaryColor() }]}>
                                            {getRelativeTime(activity.timestamp)}
                                        </Text>
                                    </View>
                                    {index < recentActivity.length - 1 && (
                                        <View style={[styles.activityDivider, { backgroundColor: getTextSecondaryColor(), opacity: 0.1 }]} />
                                    )}
                                </View>
                            ))}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
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
    statsGrid: {
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
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    trendText: {
        fontSize: 11,
        fontWeight: '600',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewAllText: {
        fontSize: 14,
        fontWeight: '600',
    },
    activityCard: {
        borderRadius: 16,
        padding: 16,
        elevation: 3,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 12,
    },
    activityContent: {
        flex: 1,
    },
    activityAction: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    activityUser: {
        fontSize: 12,
    },
    activityTime: {
        fontSize: 11,
        marginLeft: 8,
    },
    activityDivider: {
        height: 1,
        marginLeft: 20,
    },
});
