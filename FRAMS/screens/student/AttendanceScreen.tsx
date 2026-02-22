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
        const daysInRange: Date[] = [];
        const current = new Date(dateRange.start);
        while (current <= dateRange.end) {
            daysInRange.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        const getStatusForDate = (date: Date) => {
            const record = attendance.find(a => 
                new Date(a.date).toDateString() === date.toDateString()
            );
            return record?.status;
        };

        return (
            <Card variant="glassmorphic" style={styles.calendarCard}>
                <View style={styles.calendarContent}>
                    <Text style={styles.calendarTitle}>Attendance Calendar</Text>
                    <View style={styles.calendarGrid}>
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <View key={i} style={styles.calendarDayHeader}>
                                <Text style={[styles.calendarDayHeaderText, { color: getTextSecondaryColor() }]}>
                                    {day}
                                </Text>
                            </View>
                        ))}
                        {daysInRange.slice(0, 35).map((date, index) => {
                            const status = getStatusForDate(date);
                            return (
                                <View key={index} style={styles.calendarDay}>
                                    <View style={[
                                        styles.calendarDayCircle,
                                        { backgroundColor: status ? getStatusColor(status) + '30' : 'transparent' }
                                    ]}>
                                        <Text style={[
                                            styles.calendarDayText,
                                            { color: status ? getStatusColor(status) : getTextSecondaryColor() }
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
        },
        title: {
            fontSize: tokens.typography.h1.fontSize,
            fontWeight: tokens.typography.h1.fontWeight,
            color: getTextColor(),
            marginBottom: tokens.spacing.xs,
        },
        subtitle: {
            fontSize: tokens.typography.body.fontSize,
            color: getTextSecondaryColor(),
        },
        statCard: {
            flex: 1,
        },
        statContent: {
            padding: tokens.spacing.md,
            alignItems: 'center',
        },
        statIconContainer: {
            width: tokens.spacing.xl + tokens.spacing.sm,
            height: tokens.spacing.xl + tokens.spacing.sm,
            borderRadius: tokens.borders.radius.medium,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: tokens.spacing.sm,
        },
        statValue: {
            fontSize: tokens.typography.h2.fontSize,
            fontWeight: tokens.typography.h2.fontWeight,
            color: getTextColor(),
        },
        statLabel: {
            fontSize: tokens.typography.caption.fontSize,
            color: tokens.colors.neutral.gray600,
            marginTop: tokens.spacing.xs / 2,
        },
        chartCard: {
            marginBottom: 0,
        },
        chartContent: {
            padding: tokens.spacing.md,
            alignItems: 'center',
        },
        chartTitle: {
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: getTextColor(),
            marginBottom: tokens.spacing.md,
        },
        subjectCard: {
            marginBottom: 0,
        },
        subjectContent: {
            padding: tokens.spacing.md,
        },
        subjectTitle: {
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: getTextColor(),
            marginBottom: tokens.spacing.md,
        },
        subjectRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: tokens.spacing.sm,
            borderBottomWidth: tokens.borders.width.thin,
            borderBottomColor: tokens.colors.neutral.gray200,
        },
        subjectName: {
            fontSize: tokens.typography.body.fontSize,
            color: getTextColor(),
            flex: 1,
        },
        subjectStats: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.spacing.xs,
        },
        subjectPercentage: {
            fontSize: tokens.typography.body.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: tokens.colors.primary.main,
        },
        subjectCount: {
            fontSize: tokens.typography.caption.fontSize,
            color: tokens.colors.neutral.gray600,
        },
        filterButton: {
            flex: 1,
            paddingVertical: tokens.spacing.sm,
            paddingHorizontal: tokens.spacing.md,
            borderRadius: tokens.borders.radius.medium,
            borderWidth: tokens.borders.width.medium,
            borderColor: tokens.colors.neutral.gray300,
            backgroundColor: getSurfaceColor(),
            alignItems: 'center',
        },
        filterButtonActive: {
            borderColor: tokens.colors.primary.main,
            backgroundColor: tokens.colors.primary.light,
        },
        filterButtonText: {
            fontSize: tokens.typography.caption.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: tokens.colors.neutral.gray600,
        },
        filterButtonTextActive: {
            color: tokens.colors.primary.main,
        },
        recordCard: {
            marginBottom: 0,
        },
        recordContent: {
            padding: tokens.spacing.md,
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
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: getTextColor(),
            marginBottom: tokens.spacing.xs / 2,
        },
        recordDate: {
            fontSize: tokens.typography.caption.fontSize,
            color: tokens.colors.neutral.gray600,
        },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: tokens.spacing.xs / 2,
            paddingHorizontal: tokens.spacing.sm,
            borderRadius: tokens.borders.radius.small,
            gap: tokens.spacing.xs / 2,
        },
        statusText: {
            fontSize: tokens.typography.caption.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
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
            paddingVertical: tokens.spacing.sm,
            borderRadius: tokens.borders.radius.medium,
            borderWidth: tokens.borders.width.medium,
            borderColor: tokens.colors.neutral.gray300,
            backgroundColor: getSurfaceColor(),
            gap: tokens.spacing.xs,
        },
        viewToggleButtonActive: {
            borderColor: tokens.colors.primary.main,
            backgroundColor: tokens.colors.primary.light,
        },
        viewToggleButtonText: {
            fontSize: tokens.typography.body.fontSize,
            fontWeight: '600',
            color: getTextSecondaryColor(),
        },
        viewToggleButtonTextActive: {
            color: tokens.colors.primary.main,
        },
        streakCard: {
            marginBottom: 0,
        },
        streakContent: {
            padding: tokens.spacing.md,
            flexDirection: 'row',
            gap: tokens.spacing.md,
        },
        streakItem: {
            flex: 1,
            alignItems: 'center',
            padding: tokens.spacing.sm,
            borderRadius: tokens.borders.radius.medium,
        },
        streakValue: {
            fontSize: tokens.typography.h2.fontSize,
            fontWeight: '700',
            marginVertical: tokens.spacing.xs,
        },
        streakLabel: {
            fontSize: tokens.typography.caption.fontSize,
            fontWeight: '500',
        },
        chartInteractiveHint: {
            fontSize: tokens.typography.caption.fontSize,
            color: getTextSecondaryColor(),
            marginTop: tokens.spacing.sm,
            textAlign: 'center',
            fontStyle: 'italic',
        },
        calendarCard: {
            marginBottom: 0,
        },
        calendarContent: {
            padding: tokens.spacing.md,
        },
        calendarTitle: {
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: getTextColor(),
            marginBottom: tokens.spacing.md,
        },
        calendarGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
        },
        calendarDayHeader: {
            width: `${100 / 7}%`,
            alignItems: 'center',
            paddingVertical: tokens.spacing.xs,
        },
        calendarDayHeaderText: {
            fontSize: tokens.typography.caption.fontSize,
            fontWeight: '600',
        },
        calendarDay: {
            width: `${100 / 7}%`,
            aspectRatio: 1,
            padding: 2,
        },
        calendarDayCircle: {
            flex: 1,
            borderRadius: 100,
            justifyContent: 'center',
            alignItems: 'center',
        },
        calendarDayText: {
            fontSize: tokens.typography.caption.fontSize,
            fontWeight: '500',
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

                <Stack spacing="md" style={{ paddingHorizontal: tokens.spacing.md }}>
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
                    <Row spacing="sm">
                        <Card variant="glassmorphic" style={styles.statCard}>
                            <View style={styles.statContent}>
                                <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.success.light }]}>
                                    <Ionicons name="stats-chart" size={20} color={tokens.colors.success.main} />
                                </View>
                                <Text style={styles.statValue}>{stats.percentage}%</Text>
                                <Text style={styles.statLabel}>Overall</Text>
                            </View>
                        </Card>

                        <Card variant="glassmorphic" style={styles.statCard}>
                            <View style={styles.statContent}>
                                <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.success.light }]}>
                                    <Ionicons name="checkmark-circle" size={20} color={tokens.colors.success.main} />
                                </View>
                                <Text style={styles.statValue}>{stats.present}</Text>
                                <Text style={styles.statLabel}>Present</Text>
                            </View>
                        </Card>

                        <Card variant="glassmorphic" style={styles.statCard}>
                            <View style={styles.statContent}>
                                <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.error.light }]}>
                                    <Ionicons name="close-circle" size={20} color={tokens.colors.error.main} />
                                </View>
                                <Text style={styles.statValue}>{stats.absent}</Text>
                                <Text style={styles.statLabel}>Absent</Text>
                            </View>
                        </Card>

                        <Card variant="glassmorphic" style={styles.statCard}>
                            <View style={styles.statContent}>
                                <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.warning.light }]}>
                                    <Ionicons name="time" size={20} color={tokens.colors.warning.main} />
                                </View>
                                <Text style={styles.statValue}>{stats.late}</Text>
                                <Text style={styles.statLabel}>Late</Text>
                            </View>
                        </Card>
                    </Row>

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

                    <Row spacing="sm">
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
                                <Text style={[styles.filterButtonText, filterStatus === status && styles.filterButtonTextActive]}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </Row>

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
            </ScrollView>
        </View>
    );
}
