import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, Text, TouchableOpacity } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/design-system/ThemeContext';
import Card from '../../components/design-system/primitives/Card';
import LoadingSpinner from '../../components/design-system/feedback/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import DateRangePicker from '../../components/DateRangePicker';
import { Stack, Row } from '../../components/design-system/layout';

type AttendanceRecord = {
    id: string;
    date: string;
    status: 'present' | 'absent' | 'late';
    subjects: { name: string } | null;
};

export default function AttendanceScreen() {
    const { tokens, getTextColor, getSurfaceColor, getBackgroundColor, getTextSecondaryColor } = useTheme();
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [selectedChartSegment, setSelectedChartSegment] = useState<string | null>(null);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)),
        end: new Date(),
    });
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0, percentage: 0 });
    const [subjectStats, setSubjectStats] = useState<Record<string, { present: number; total: number }>>({});

    useEffect(() => {
        fetchAttendance();
    }, [dateRange]);

    useEffect(() => {
        calculateStats();
    }, [attendance]);

    async function fetchAttendance() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: student } = await supabase
                .from('students')
                .select('id')
                .eq('id', user.id)
                .single();

            if (student) {
                const { data, error } = await supabase
                    .from('attendance')
                    .select('*, subjects(name)')
                    .eq('student_id', student.id)
                    .gte('date', dateRange.start.toISOString())
                    .lte('date', dateRange.end.toISOString())
                    .order('date', { ascending: false });

                if (error) console.error(error);
                else setAttendance(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    function calculateStats() {
        const present = attendance.filter(a => a.status === 'present').length;
        const absent = attendance.filter(a => a.status === 'absent').length;
        const late = attendance.filter(a => a.status === 'late').length;
        const total = attendance.length;
        const percentage = total > 0 ? ((present + late) / total * 100).toFixed(1) : 0;

        setStats({ present, absent, late, total, percentage: Number(percentage) });

        // Calculate streaks
        const sortedAttendance = [...attendance].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        let current = 0;
        let longest = 0;
        let temp = 0;

        for (let i = 0; i < sortedAttendance.length; i++) {
            if (sortedAttendance[i].status === 'present') {
                temp++;
                if (i === 0 || current === temp - 1) {
                    current = temp;
                }
                longest = Math.max(longest, temp);
            } else {
                temp = 0;
            }
        }

        setCurrentStreak(current);
        setLongestStreak(longest);

        const subjectMap: Record<string, { present: number; total: number }> = {};
        attendance.forEach(record => {
            const subjectName = record.subjects?.name || 'Unknown';
            if (!subjectMap[subjectName]) {
                subjectMap[subjectName] = { present: 0, total: 0 };
            }
            subjectMap[subjectName].total++;
            if (record.status === 'present' || record.status === 'late') {
                subjectMap[subjectName].present++;
            }
        });
        setSubjectStats(subjectMap);
    }

    function onRefresh() {
        setRefreshing(true);
        fetchAttendance();
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'present': return tokens.colors.success.main;
            case 'absent': return tokens.colors.error.main;
            case 'late': return tokens.colors.warning.main;
            default: return tokens.colors.neutral.gray600;
        }
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case 'present': return 'checkmark-circle';
            case 'absent': return 'close-circle';
            case 'late': return 'time';
            default: return 'information-circle';
        }
    }

    const filteredAttendance = selectedChartSegment
        ? attendance.filter(a => a.status === selectedChartSegment.toLowerCase())
        : filterStatus === 'all'
        ? attendance
        : attendance.filter(a => a.status === filterStatus);

    const chartData = [
        {
            name: 'Present',
            population: stats.present,
            color: tokens.colors.success.main,
            legendFontColor: getTextColor(),
            legendFontSize: 12,
        },
        {
            name: 'Absent',
            population: stats.absent,
            color: tokens.colors.error.main,
            legendFontColor: getTextColor(),
            legendFontSize: 12,
        },
        {
            name: 'Late',
            population: stats.late,
            color: tokens.colors.warning.main,
            legendFontColor: getTextColor(),
            legendFontSize: 12,
        },
    ].filter(item => item.population > 0);

    const renderCalendarView = () => {
        const currentMonth = new Date(dateRange.start);
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        
        // Get first day of month and total days
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Create array of dates for the calendar grid
        const calendarDays: (Date | null)[] = [];
        
        // Add empty slots for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            calendarDays.push(null);
        }
        
        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            calendarDays.push(new Date(year, month, day));
        }

        const getStatusForDate = (date: Date) => {
            const record = attendance.find(a => 
                new Date(a.date).toDateString() === date.toDateString()
            );
            return record?.status;
        };

        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];

        return (
            <Card variant="glassmorphic" style={styles.calendarCard}>
                <View style={styles.calendarContent}>
                    <Text style={styles.calendarTitle}>Attendance Calendar</Text>
                    <View style={styles.calendarMonthYear}>
                        <Ionicons name="calendar-outline" size={20} color={tokens.colors.primary.main} />
                        <Text style={styles.calendarMonthYearText}>
                            {monthNames[month]} {year}
                        </Text>
                    </View>
                    
                    {/* Legend */}
                    <View style={styles.calendarLegend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: tokens.colors.success.main }]} />
                            <Text style={styles.legendText}>Present</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: tokens.colors.error.main }]} />
                            <Text style={styles.legendText}>Absent</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: tokens.colors.warning.main }]} />
                            <Text style={styles.legendText}>Late</Text>
                        </View>
                    </View>

                    <View style={styles.calendarGrid}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                            <View key={i} style={styles.calendarDayHeader}>
                                <Text style={[styles.calendarDayHeaderText, { color: getTextSecondaryColor() }]}>
                                    {day}
                                </Text>
                            </View>
                        ))}
                        {calendarDays.map((date, index) => {
                            if (!date) {
                                return <View key={`empty-${index}`} style={styles.calendarDay} />;
                            }
                            const status = getStatusForDate(date);
                            const isToday = date.toDateString() === new Date().toDateString();
                            return (
                                <View key={index} style={styles.calendarDay}>
                                    <View style={[
                                        styles.calendarDayCircle,
                                        { 
                                            backgroundColor: status ? getStatusColor(status) + '25' : 'transparent',
                                            borderWidth: isToday ? 2 : 0,
                                            borderColor: isToday ? tokens.colors.primary.main : 'transparent'
                                        }
                                    ]}>
                                        <Text style={[
                                            styles.calendarDayText,
                                            { 
                                                color: status ? getStatusColor(status) : getTextSecondaryColor(),
                                                fontWeight: isToday ? '700' : '600'
                                            }
                                        ]}>
                                            {date.getDate()}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </Card>
        );
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: getBackgroundColor(),
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: getBackgroundColor(),
        },
        header: {
            padding: tokens.spacing.lg,
            paddingTop: tokens.spacing.xl,
            paddingBottom: tokens.spacing.md,
        },
        title: {
            fontSize: 28,
            fontWeight: '700',
            color: getTextColor(),
            marginBottom: tokens.spacing.xs,
            letterSpacing: -0.5,
        },
        subtitle: {
            fontSize: 16,
            fontWeight: '400',
            color: getTextSecondaryColor(),
            opacity: 0.8,
        },
        statCard: {
            flex: 1,
            minWidth: 0,
            width: '25%',
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 4,
            borderRadius: 12,
            overflow: 'visible',
        },
        statContent: {
            padding: 6,
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 85,
        },
        statIconContainer: {
            width: 32,
            height: 32,
            borderRadius: tokens.borders.radius.medium,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 4,
        },
        statValue: {
            fontSize: 16,
            fontWeight: '700',
            color: getTextColor(),
            letterSpacing: -0.3,
        },
        statLabel: {
            fontSize: 10,
            fontWeight: '500',
            color: getTextSecondaryColor(),
            marginTop: 2,
            opacity: 0.7,
            textAlign: 'center',
        },
        chartCard: {
            marginBottom: 0,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
        },
        chartContent: {
            padding: tokens.spacing.lg,
            alignItems: 'center',
        },
        chartTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: getTextColor(),
            marginBottom: tokens.spacing.lg,
            letterSpacing: -0.3,
        },
        subjectCard: {
            marginBottom: 0,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
        },
        subjectContent: {
            padding: tokens.spacing.lg,
        },
        subjectTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: getTextColor(),
            marginBottom: tokens.spacing.lg,
            letterSpacing: -0.3,
        },
        subjectRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: tokens.spacing.md,
            borderBottomWidth: tokens.borders.width.thin,
            borderBottomColor: getTextSecondaryColor() + '15',
        },
        subjectName: {
            fontSize: 16,
            fontWeight: '500',
            color: getTextColor(),
            flex: 1,
        },
        subjectStats: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.spacing.sm,
        },
        subjectPercentage: {
            fontSize: 16,
            fontWeight: '700',
            color: tokens.colors.primary.main,
        },
        subjectCount: {
            fontSize: 14,
            fontWeight: '500',
            color: getTextSecondaryColor(),
            opacity: 0.7,
        },
        filterButton: {
            flex: 1,
            minWidth: 0,
            paddingVertical: 10,
            paddingHorizontal: 4,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: getTextSecondaryColor() + '20',
            backgroundColor: getSurfaceColor() + '80',
            alignItems: 'center',
            justifyContent: 'center',
        },
        filterButtonActive: {
            borderColor: tokens.colors.primary.main,
            backgroundColor: tokens.colors.primary.main + '15',
            borderWidth: 1.5,
        },
        filterButtonText: {
            fontSize: 12,
            fontWeight: '600',
            color: getTextSecondaryColor(),
            textAlign: 'center',
        },
        filterButtonTextActive: {
            color: tokens.colors.primary.main,
            fontWeight: '700',
            textAlign: 'center',
        },
        recordCard: {
            marginBottom: 0,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.12,
            shadowRadius: 3,
        },
        recordContent: {
            padding: tokens.spacing.lg,
        },
        recordHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        recordInfo: {
            flex: 1,
        },
        recordSubject: {
            fontSize: 18,
            fontWeight: '600',
            color: getTextColor(),
            marginBottom: tokens.spacing.xs,
            letterSpacing: -0.2,
        },
        recordDate: {
            fontSize: 14,
            fontWeight: '500',
            color: getTextSecondaryColor(),
            opacity: 0.7,
        },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: tokens.spacing.xs,
            paddingHorizontal: tokens.spacing.md,
            borderRadius: 20,
            gap: tokens.spacing.xs,
        },
        statusText: {
            fontSize: 13,
            fontWeight: '700',
            letterSpacing: 0.3,
        },
        dateRangeContainer: {
            paddingHorizontal: tokens.spacing.md,
            marginBottom: tokens.spacing.md,
        },
        viewToggleContainer: {
            flexDirection: 'row',
            gap: tokens.spacing.sm,
            paddingHorizontal: tokens.spacing.md,
            marginBottom: tokens.spacing.md,
        },
        viewToggleButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: tokens.spacing.md,
            borderRadius: 20,
            borderWidth: 2,
            borderColor: getTextSecondaryColor() + '20',
            backgroundColor: getSurfaceColor() + '80',
            gap: tokens.spacing.sm,
        },
        viewToggleButtonActive: {
            borderColor: tokens.colors.primary.main,
            backgroundColor: tokens.colors.primary.main + '15',
        },
        viewToggleButtonText: {
            fontSize: 15,
            fontWeight: '600',
            color: getTextSecondaryColor(),
        },
        viewToggleButtonTextActive: {
            color: tokens.colors.primary.main,
            fontWeight: '700',
        },
        streakCard: {
            marginBottom: 0,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
        },
        streakContent: {
            padding: tokens.spacing.lg,
            flexDirection: 'row',
            gap: tokens.spacing.lg,
        },
        streakItem: {
            flex: 1,
            alignItems: 'center',
            padding: tokens.spacing.lg,
            borderRadius: 20,
        },
        streakValue: {
            fontSize: 32,
            fontWeight: '800',
            marginVertical: tokens.spacing.sm,
            letterSpacing: -1,
        },
        streakLabel: {
            fontSize: 14,
            fontWeight: '600',
        },
        chartInteractiveHint: {
            fontSize: 13,
            fontWeight: '500',
            color: getTextSecondaryColor(),
            marginTop: tokens.spacing.md,
            textAlign: 'center',
            fontStyle: 'italic',
            opacity: 0.7,
        },
        calendarCard: {
            marginBottom: 0,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 6,
        },
        calendarContent: {
            padding: tokens.spacing.lg,
        },
        calendarTitle: {
            fontSize: 20,
            fontWeight: '700',
            color: getTextColor(),
            marginBottom: tokens.spacing.sm,
            letterSpacing: -0.3,
        },
        calendarMonthYear: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.spacing.sm,
            marginBottom: tokens.spacing.md,
            paddingVertical: tokens.spacing.sm,
            paddingHorizontal: tokens.spacing.md,
            backgroundColor: tokens.colors.primary.main + '10',
            borderRadius: 12,
            alignSelf: 'flex-start',
        },
        calendarMonthYearText: {
            fontSize: 16,
            fontWeight: '600',
            color: tokens.colors.primary.main,
            letterSpacing: -0.2,
        },
        calendarLegend: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: tokens.spacing.lg,
            paddingVertical: tokens.spacing.sm,
            paddingHorizontal: tokens.spacing.xs,
            backgroundColor: getTextSecondaryColor() + '08',
            borderRadius: 12,
        },
        legendItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.spacing.xs,
        },
        legendDot: {
            width: 10,
            height: 10,
            borderRadius: 5,
        },
        legendText: {
            fontSize: 12,
            fontWeight: '500',
            color: getTextSecondaryColor(),
        },
        calendarGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            width: '100%',
        },
        calendarDayHeader: {
            width: `${100 / 7}%`,
            alignItems: 'center',
            paddingVertical: tokens.spacing.sm,
        },
        calendarDayHeaderText: {
            fontSize: 12,
            fontWeight: '700',
        },
        calendarDay: {
            width: `${100 / 7}%`,
            aspectRatio: 1,
            padding: 3,
        },
        calendarDayCircle: {
            flex: 1,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
        },
        calendarDayText: {
            fontSize: 14,
            fontWeight: '600',
        },
    });

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LoadingSpinner size="large" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: tokens.spacing.xl }}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>My Attendance</Text>
                    <Text style={styles.subtitle}>Track your class attendance</Text>
                </View>

                <View style={styles.viewToggleContainer}>
                    <TouchableOpacity
                        style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}
                        onPress={() => setViewMode('list')}
                    >
                        <Ionicons name="list" size={18} color={viewMode === 'list' ? tokens.colors.primary.main : getTextSecondaryColor()} />
                        <Text style={[styles.viewToggleButtonText, viewMode === 'list' && styles.viewToggleButtonTextActive]}>
                            List View
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.viewToggleButton, viewMode === 'calendar' && styles.viewToggleButtonActive]}
                        onPress={() => setViewMode('calendar')}
                    >
                        <Ionicons name="calendar" size={18} color={viewMode === 'calendar' ? tokens.colors.primary.main : getTextSecondaryColor()} />
                        <Text style={[styles.viewToggleButtonText, viewMode === 'calendar' && styles.viewToggleButtonTextActive]}>
                            Calendar View
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={{ paddingHorizontal: tokens.spacing.md }}>
                    <Stack spacing="md" style={{ maxWidth: '100%' }}>
                    {/* Streak Indicators */}
                    {(currentStreak > 0 || longestStreak > 0) && (
                        <Card variant="glassmorphic" style={styles.streakCard}>
                            <View style={styles.streakContent}>
                                <View style={[styles.streakItem, { backgroundColor: `${tokens.colors.success.main}15` }]}>
                                    <Ionicons name="flame" size={28} color={tokens.colors.success.main} />
                                    <Text style={[styles.streakValue, { color: tokens.colors.success.main }]}>
                                        {currentStreak}
                                    </Text>
                                    <Text style={[styles.streakLabel, { color: getTextColor() }]}>Current Streak</Text>
                                </View>
                                <View style={[styles.streakItem, { backgroundColor: `${tokens.colors.warning.main}15` }]}>
                                    <Ionicons name="trophy" size={28} color={tokens.colors.warning.main} />
                                    <Text style={[styles.streakValue, { color: tokens.colors.warning.main }]}>
                                        {longestStreak}
                                    </Text>
                                    <Text style={[styles.streakLabel, { color: getTextColor() }]}>Best Streak</Text>
                                </View>
                            </View>
                        </Card>
                    )}
                    <View style={{ width: '100%', overflow: 'hidden' }}>
                        <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'space-between' }}>
                            <View style={styles.statCard}>
                                <View style={[styles.statContent, { backgroundColor: getSurfaceColor(), borderRadius: 12 }]}>
                                    <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.success.main + '20' }]}>
                                        <Ionicons name="stats-chart" size={16} color={tokens.colors.success.main} />
                                    </View>
                                    <Text style={styles.statValue}>{stats.percentage}%</Text>
                                    <Text style={styles.statLabel} numberOfLines={1}>Overall</Text>
                                </View>
                            </View>

                            <View style={styles.statCard}>
                                <View style={[styles.statContent, { backgroundColor: getSurfaceColor(), borderRadius: 12 }]}>
                                    <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.success.main + '20' }]}>
                                        <Ionicons name="checkmark-circle" size={16} color={tokens.colors.success.main} />
                                    </View>
                                    <Text style={styles.statValue}>{stats.present}</Text>
                                    <Text style={styles.statLabel} numberOfLines={1}>Present</Text>
                                </View>
                            </View>

                            <View style={styles.statCard}>
                                <View style={[styles.statContent, { backgroundColor: getSurfaceColor(), borderRadius: 12 }]}>
                                    <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.error.main + '20' }]}>
                                        <Ionicons name="close-circle" size={16} color={tokens.colors.error.main} />
                                    </View>
                                    <Text style={styles.statValue}>{stats.absent}</Text>
                                    <Text style={styles.statLabel} numberOfLines={1}>Absent</Text>
                                </View>
                            </View>

                            <View style={styles.statCard}>
                                <View style={[styles.statContent, { backgroundColor: getSurfaceColor(), borderRadius: 12 }]}>
                                    <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.warning.main + '20' }]}>
                                        <Ionicons name="time" size={16} color={tokens.colors.warning.main} />
                                    </View>
                                    <Text style={styles.statValue}>{stats.late}</Text>
                                    <Text style={styles.statLabel} numberOfLines={1}>Late</Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {stats.total > 0 && (
                        <Card variant="glassmorphic" style={styles.chartCard}>
                            <View style={styles.chartContent}>
                                <Text style={styles.chartTitle}>Attendance Overview</Text>
                                <TouchableOpacity
                                    activeOpacity={0.9}
                                    onPress={() => setSelectedChartSegment(null)}
                                >
                                    <PieChart
                                        data={chartData}
                                        width={Dimensions.get('window').width - (tokens.spacing.md * 2) - tokens.spacing.lg}
                                        height={200}
                                        chartConfig={{
                                            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                                        }}
                                        accessor="population"
                                        backgroundColor="transparent"
                                        paddingLeft="15"
                                        absolute
                                    />
                                </TouchableOpacity>
                                {selectedChartSegment && (
                                    <Text style={styles.chartInteractiveHint}>
                                        Showing {selectedChartSegment} records • Tap chart to clear filter
                                    </Text>
                                )}
                                {!selectedChartSegment && (
                                    <Text style={styles.chartInteractiveHint}>
                                        Tap a segment to filter records
                                    </Text>
                                )}
                            </View>
                        </Card>
                    )}

                    {Object.keys(subjectStats).length > 0 && (
                        <Card variant="glassmorphic" style={styles.subjectCard}>
                            <View style={styles.subjectContent}>
                                <Text style={styles.subjectTitle}>Subject-wise Attendance</Text>
                                {Object.entries(subjectStats).map(([subject, data]) => {
                                    const percentage = ((data.present / data.total) * 100).toFixed(1);
                                    return (
                                        <View key={subject} style={styles.subjectRow}>
                                            <Text style={styles.subjectName}>{subject}</Text>
                                            <View style={styles.subjectStats}>
                                                <Text style={styles.subjectPercentage}>{percentage}%</Text>
                                                <Text style={styles.subjectCount}>
                                                    ({data.present}/{data.total})
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        </Card>
                    )}

                    <View style={{ width: '100%', paddingHorizontal: 2 }}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            {['all', 'present', 'absent', 'late'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
                                onPress={() => {
                                    setFilterStatus(status);
                                    setSelectedChartSegment(null);
                                }}
                                accessible
                                accessibilityRole="button"
                                accessibilityState={{ selected: filterStatus === status }}
                            >
                                <Text 
                                    style={[styles.filterButtonText, filterStatus === status && styles.filterButtonTextActive]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.8}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Text>
                            </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {viewMode === 'calendar' ? (
                        renderCalendarView()
                    ) : (

                    <Stack spacing="sm">
                        {filteredAttendance.length === 0 ? (
                            <EmptyState
                                icon="calendar-blank"
                                title="No Records Found"
                                message={filterStatus === 'all'
                                    ? 'No attendance records in selected date range'
                                    : `No ${filterStatus} records in selected date range`}
                            />
                        ) : (
                            filteredAttendance.map((item) => (
                                <Card key={item.id} variant="default" style={styles.recordCard}>
                                    <View style={styles.recordContent}>
                                        <View style={styles.recordHeader}>
                                            <View style={styles.recordInfo}>
                                                <Text style={styles.recordSubject}>
                                                    {item.subjects?.name || 'Unknown Subject'}
                                                </Text>
                                                <Text style={styles.recordDate}>
                                                    {new Date(item.date).toLocaleDateString('en-US', {
                                                        weekday: 'short',
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                                <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
                                                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                                    {item.status.toUpperCase()}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </Card>
                            ))
                        )}
                    </Stack>
                    )}
                    </Stack>
                </View>
            </ScrollView>
        </View>
    );
}
