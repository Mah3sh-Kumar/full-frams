import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView, Text, TouchableOpacity, TextInput } from 'react-native';
import { Menu, Divider, Portal, Modal, ActivityIndicator as PaperActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { fetchTeacherSubjects, fetchStudentsByClass, markAttendance } from '../../lib/database';
import { useTheme } from '../../lib/design-system/ThemeContext';
import Button from '../../components/design-system/primitives/Button';
import Card from '../../components/design-system/primitives/Card';
import SelectPicker from '../../components/design-system/primitives/SelectPicker';
import { Stack } from '../../components/design-system/layout';
import LoadingSpinner from '../../components/design-system/feedback/LoadingSpinner';
import StudentProfileCard from '../../components/design-system/attendance/StudentProfileCard';
import ConfirmDialog from '../../components/ConfirmDialog';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { exportCSV } from '../../lib/csvExport';
import { realtimeAttendanceService, AttendanceEvent } from '../../lib/realtime';

export default function AttendanceManager() {
    const { user } = useAuth();
    const { tokens, getTextColor, getTextSecondaryColor, getSurfaceColor, getBackgroundColor } = useTheme();
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [marking, setMarking] = useState<Record<string, boolean>>({}); // Loading state for individual buttons
    const [menuVisible, setMenuVisible] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showStats, setShowStats] = useState(false);
    const [viewMode, setViewMode] = useState<'today' | 'history'>('today');
    const [analytics, setAnalytics] = useState({ avgAttendance: 0, totalDays: 0, bestDay: '', worstDay: '' });
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, total: 0 });
    const [bulkConfirmVisible, setBulkConfirmVisible] = useState(false);
    const [bulkAction, setBulkAction] = useState<'present' | 'absent' | null>(null);
    const [attendanceData, setAttendanceData] = useState<Record<string, 'present' | 'absent' | 'late' | 'pending'>>({});
    const [historicalData, setHistoricalData] = useState<any[]>([]);

    useEffect(() => {
        if (user) {
            loadSubjects();
        }
    }, [user]);

    // Initialize real-time attendance service
    useEffect(() => {
        const initRealtime = async () => {
            try {
                const connected = await realtimeAttendanceService.initialize();
                if (connected) {
                    // Listen for attendance changes
                    realtimeAttendanceService.on('attendance.changed', (data: { type: string; event: AttendanceEvent }) => {
                        console.log('Attendance changed:', data.type, data.event.student_id, data.event.status);
                        // Refresh attendance data when changes occur
                        if (selectedSubject) {
                            loadExistingAttendance(students);
                            loadAttendanceStats();
                        }
                    });

                    realtimeAttendanceService.on('error', (error: any) => {
                        console.error('Real-time service error:', error);
                    });
                }
            } catch (error) {
                console.error('Failed to initialize real-time service:', error);
            }
        };

        initRealtime();

        // Cleanup on unmount
        return () => {
            realtimeAttendanceService.cleanup();
        };
    }, []);

    useEffect(() => {
        if (selectedSubject) {
            loadStudents(selectedSubject.class_id);
            loadAttendanceStats();
            if (viewMode === 'history') {
                loadHistoricalData();
            }
            loadAnalytics();
        } else {
            setStudents([]);
        }
    }, [selectedSubject, selectedDate, viewMode]);

    async function loadSubjects() {
        if (!user) return;
        setLoading(true);
        const { data, error } = await fetchTeacherSubjects(user.id);
        if (error) {
            Alert.alert('Error', error);
        } else {
            setSubjects(data);
            if (data.length > 0) {
                setSelectedSubject(data[0]); // Auto-select first subject
            }
        }
        setLoading(false);
    }

    async function loadStudents(classId: string) {
        if (!classId) return;
        setLoading(true);
        const { data, error } = await fetchStudentsByClass(classId);
        if (error) {
            Alert.alert('Error', error);
        } else {
            setStudents(data);
            // Load existing attendance for the selected date
            await loadExistingAttendance(data);
        }
        setLoading(false);
    }

    async function loadExistingAttendance(studentList: any[]) {
        if (!selectedSubject) return;
        const dateStr = selectedDate.toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('attendance')
            .select('student_id, status')
            .eq('subject_id', selectedSubject.id)
            .eq('date', dateStr);

        if (!error && data) {
            const attendanceMap: Record<string, 'present' | 'absent' | 'late'> = {};
            data.forEach(record => {
                attendanceMap[record.student_id] = record.status;
            });
            setAttendanceData(attendanceMap);
        }
    }

    async function loadAttendanceStats() {
        if (!selectedSubject) return;
        const dateStr = selectedDate.toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('attendance')
            .select('status')
            .eq('subject_id', selectedSubject.id)
            .eq('date', dateStr);

        if (!error && data) {
            const present = data.filter(a => a.status === 'present').length;
            const absent = data.filter(a => a.status === 'absent').length;
            const late = data.filter(a => a.status === 'late').length;
            setStats({ present, absent, late, total: data.length });
        }
    }

    async function loadHistoricalData() {
        if (!selectedSubject) return;
        
        const { data, error } = await supabase
            .from('attendance')
            .select('date, status, students(full_name, enrollment_number)')
            .eq('subject_id', selectedSubject.id)
            .order('date', { ascending: false })
            .limit(100);

        if (!error && data) {
            setHistoricalData(data);
        }
    }

    async function loadAnalytics() {
        if (!selectedSubject) return;
        
        const { data, error } = await supabase
            .from('attendance')
            .select('date, status')
            .eq('subject_id', selectedSubject.id);

        if (!error && data) {
            const groupedByDate: Record<string, { present: number; total: number }> = {};
            
            data.forEach(record => {
                if (!groupedByDate[record.date]) {
                    groupedByDate[record.date] = { present: 0, total: 0 };
                }
                groupedByDate[record.date].total++;
                if (record.status === 'present') {
                    groupedByDate[record.date].present++;
                }
            });

            const dates = Object.keys(groupedByDate);
            const totalDays = dates.length;
            const avgAttendance = totalDays > 0
                ? dates.reduce((sum, date) => sum + (groupedByDate[date].present / groupedByDate[date].total * 100), 0) / totalDays
                : 0;

            let bestDay = '';
            let bestRate = 0;
            let worstDay = '';
            let worstRate = 100;

            dates.forEach(date => {
                const rate = (groupedByDate[date].present / groupedByDate[date].total) * 100;
                if (rate > bestRate) {
                    bestRate = rate;
                    bestDay = date;
                }
                if (rate < worstRate) {
                    worstRate = rate;
                    worstDay = date;
                }
            });

            setAnalytics({
                avgAttendance: Math.round(avgAttendance),
                totalDays,
                bestDay: bestDay ? new Date(bestDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
                worstDay: worstDay ? new Date(worstDay).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
            });
        }
    }

    async function handleMarkAttendance(studentId: string, status: 'present' | 'absent' | 'late') {
        if (!selectedSubject) return;

        setMarking(prev => ({ ...prev, [studentId]: true }));
        const date = selectedDate.toISOString().split('T')[0];

        const { error } = await markAttendance(studentId, selectedSubject.id, status, date);

        if (error) {
            Alert.alert('Error', error);
        } else {
            setAttendanceData(prev => ({ ...prev, [studentId]: status }));
            loadAttendanceStats();
        }
        setMarking(prev => ({ ...prev, [studentId]: false }));
    }

    async function handleBulkMark(status: 'present' | 'absent') {
        if (!selectedSubject || !students.length) return;
        
        setLoading(true);
        const date = selectedDate.toISOString().split('T')[0];
        const promises = students.map(student => 
            markAttendance(student.id, selectedSubject.id, status, date)
        );

        await Promise.all(promises);
        Alert.alert('Success', `Marked all students as ${status}`);
        loadAttendanceStats();
        setLoading(false);
        setBulkConfirmVisible(false);
    }

    async function exportAttendance() {
        if (!selectedSubject) return;
        
        try {
            const { data, error } = await supabase
                .from('attendance')
                .select('*, students(full_name, enrollment_number)')
                .eq('subject_id', selectedSubject.id)
                .order('date', { ascending: false });

            if (error) throw error;

            let csv = 'Date,Student Name,Enrollment,Status\n';
            data?.forEach(record => {
                csv += `${record.date},${record.students?.full_name},${record.students?.enrollment_number},${record.status}\n`;
            });

            await exportCSV(csv, 'attendance_export.csv');
        } catch (error) {
            Alert.alert('Error', 'Failed to export attendance');
        }
    }

    const filteredStudents = students.filter(student => {
        const matchesSearch = !searchQuery || 
            student.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.enrollment_number?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: getBackgroundColor(),
        },
        scrollContent: {
            padding: tokens.spacing.md,
        },
        title: {
            fontSize: tokens.typography.h1.fontSize,
            fontWeight: tokens.typography.h1.fontWeight,
            color: getTextColor(),
            marginBottom: tokens.spacing.lg,
        },
        selectorContainer: {
            marginBottom: tokens.spacing.md,
        },
        dateContainer: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginVertical: tokens.spacing.md,
            gap: tokens.spacing.sm,
        },
        dateText: {
            fontSize: tokens.typography.body.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: getTextColor(),
            flex: 1,
            textAlign: 'center',
        },
        statsContainer: {
            flexDirection: 'row',
            gap: tokens.spacing.sm,
            marginVertical: tokens.spacing.md,
        },
        statCard: {
            flex: 1,
            padding: tokens.spacing.md,
            borderRadius: tokens.borders.radius.medium,
            alignItems: 'center',
            ...tokens.shadows.sm,
        },
        statValue: {
            fontSize: 22,
            fontWeight: '700',
            color: getTextColor(),
            lineHeight: 30,
        },
        statLabel: {
            fontSize: tokens.typography.caption.fontSize,
            color: getTextSecondaryColor(),
            marginTop: tokens.spacing.xs,
        },
        bulkActions: {
            flexDirection: 'row',
            gap: tokens.spacing.sm,
            marginVertical: tokens.spacing.md,
        },
        searchContainer: {
            marginBottom: tokens.spacing.md,
        },
        searchInput: {
            backgroundColor: getSurfaceColor(),
            borderRadius: tokens.borders.radius.medium,
            padding: tokens.spacing.md,
            fontSize: tokens.typography.body.fontSize,
            color: getTextColor(),
            borderWidth: 1,
            borderColor: tokens.colors.neutral.gray300,
            textAlign: 'left',
            writingDirection: 'ltr',
        },
        studentCard: {
            marginBottom: tokens.spacing.md,
        },
        studentHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: tokens.spacing.sm,
        },
        studentName: {
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: getTextColor(),
        },
        enrollment: {
            color: getTextSecondaryColor(),
            fontSize: tokens.typography.caption.fontSize,
            marginTop: tokens.spacing.xs,
        },
        actionContainer: {
            flexDirection: 'row',
            gap: tokens.spacing.sm,
            marginTop: tokens.spacing.sm,
        },
        actionButton: {
            flex: 1,
        },
        emptyText: {
            textAlign: 'center',
            marginTop: tokens.spacing.xl,
            color: getTextSecondaryColor(),
            fontSize: tokens.typography.body.fontSize,
            fontStyle: 'italic',
        },
        viewToggleContainer: {
            flexDirection: 'row',
            gap: tokens.spacing.sm,
            marginVertical: tokens.spacing.md,
        },
        viewToggleButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: tokens.spacing.sm,
            paddingHorizontal: tokens.spacing.md,
            borderRadius: tokens.borders.radius.medium,
            borderWidth: 1,
            borderColor: tokens.colors.neutral.gray300,
            backgroundColor: getSurfaceColor(),
            gap: tokens.spacing.xs,
        },
        viewToggleButtonActive: {
            borderColor: tokens.colors.primary.main,
            backgroundColor: tokens.colors.primary.light,
        },
        viewToggleText: {
            fontSize: tokens.typography.body.fontSize,
            fontWeight: '600',
            color: getTextSecondaryColor(),
        },
        viewToggleTextActive: {
            color: tokens.colors.primary.main,
        },
        analyticsCard: {
            padding: tokens.spacing.md,
            borderRadius: tokens.borders.radius.medium,
            backgroundColor: getSurfaceColor(),
            marginVertical: tokens.spacing.md,
            ...tokens.shadows.sm,
        },
        analyticsTitle: {
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: '700',
            color: getTextColor(),
            marginBottom: tokens.spacing.md,
        },
        analyticsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: tokens.spacing.sm,
        },
        analyticsItem: {
            width: '48%',
            padding: tokens.spacing.sm,
            borderRadius: tokens.borders.radius.small,
            backgroundColor: tokens.colors.neutral.gray100,
        },
        analyticsValue: {
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: '700',
            color: tokens.colors.primary.main,
            marginBottom: 4,
        },
        analyticsLabel: {
            fontSize: tokens.typography.caption.fontSize,
            color: getTextSecondaryColor(),
        },
        compactCard: {
            marginBottom: tokens.spacing.sm,
        },
        compactRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: tokens.spacing.sm,
        },
        compactInfo: {
            flex: 1,
            marginRight: tokens.spacing.sm,
        },
        compactName: {
            fontSize: 15,
            fontWeight: '600',
            color: getTextColor(),
            lineHeight: 24,
        },
        compactEnrollment: {
            fontSize: 12,
            color: getTextSecondaryColor(),
            lineHeight: 20,
        },
        compactActions: {
            flexDirection: 'row',
            gap: 6,
        },
        compactButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 1,
        },
        historyItem: {
            padding: tokens.spacing.md,
            borderBottomWidth: 1,
            borderBottomColor: tokens.colors.neutral.gray200,
        },
        historyDate: {
            fontSize: tokens.typography.caption.fontSize,
            color: getTextSecondaryColor(),
            marginBottom: 4,
        },
        menuButton: {
            backgroundColor: getSurfaceColor(),
            borderRadius: tokens.borders.radius.medium,
            padding: tokens.spacing.md,
            borderWidth: 1,
            borderColor: tokens.colors.neutral.gray300,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        menuButtonText: {
            fontSize: tokens.typography.body.fontSize,
            color: getTextColor(),
        },
    });

    if (loading && !students.length) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LoadingSpinner size="large" />
                <Text style={{ marginTop: tokens.spacing.md, color: getTextColor() }}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Attendance Manager</Text>

                {/* Subject Selector */}
                <View style={styles.selectorContainer}>
                    <SelectPicker
                        label="Select Subject"
                        value={selectedSubject?.id}
                        onValueChange={(id) => {
                            const subject = subjects.find(s => s.id === id);
                            if (subject) setSelectedSubject(subject);
                        }}
                        items={subjects.map(subject => ({
                            label: subject.name,
                            value: subject.id,
                            description: subject.classes?.name,
                            icon: 'book-outline' as const
                        }))}
                        placeholder="Choose a subject"
                    />
                </View>

                {/* Date Picker */}
                {selectedSubject && (
                    <View style={styles.dateContainer}>
                        <Button 
                            variant="secondary"
                            size="small"
                            onPress={() => {
                                const newDate = new Date(selectedDate);
                                newDate.setDate(newDate.getDate() - 1);
                                setSelectedDate(newDate);
                            }}
                            icon={<Ionicons name="chevron-back" size={16} color={getTextColor()} />}
                        >
                            Prev
                        </Button>
                        <Text style={styles.dateText}>
                            {selectedDate.toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            })}
                        </Text>
                        <Button 
                            variant="secondary"
                            size="small"
                            onPress={() => {
                                const newDate = new Date(selectedDate);
                                newDate.setDate(newDate.getDate() + 1);
                                setSelectedDate(newDate);
                            }}
                            icon={<Ionicons name="chevron-forward" size={16} color={getTextColor()} />}
                        >
                            Next
                        </Button>
                    </View>
                )}

                {/* View Mode Toggle */}
                {selectedSubject && (
                    <View style={styles.viewToggleContainer}>
                        <TouchableOpacity
                            style={[styles.viewToggleButton, viewMode === 'today' && styles.viewToggleButtonActive]}
                            onPress={() => setViewMode('today')}
                        >
                            <Ionicons name="today" size={18} color={viewMode === 'today' ? tokens.colors.primary.main : getTextSecondaryColor()} />
                            <Text style={[styles.viewToggleText, viewMode === 'today' && styles.viewToggleTextActive]}>
                                Today's Attendance
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.viewToggleButton, viewMode === 'history' && styles.viewToggleButtonActive]}
                            onPress={() => setViewMode('history')}
                        >
                            <Ionicons name="time" size={18} color={viewMode === 'history' ? tokens.colors.primary.main : getTextSecondaryColor()} />
                            <Text style={[styles.viewToggleText, viewMode === 'history' && styles.viewToggleTextActive]}>
                                History
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Analytics */}
                {selectedSubject && analytics.totalDays > 0 && (
                    <View style={styles.analyticsCard}>
                        <Text style={styles.analyticsTitle}>Class Analytics</Text>
                        <View style={styles.analyticsGrid}>
                            <View style={styles.analyticsItem}>
                                <Text style={styles.analyticsValue}>{analytics.avgAttendance}%</Text>
                                <Text style={styles.analyticsLabel}>Avg Attendance</Text>
                            </View>
                            <View style={styles.analyticsItem}>
                                <Text style={styles.analyticsValue}>{analytics.totalDays}</Text>
                                <Text style={styles.analyticsLabel}>Total Days</Text>
                            </View>
                            <View style={styles.analyticsItem}>
                                <Text style={styles.analyticsValue}>{analytics.bestDay}</Text>
                                <Text style={styles.analyticsLabel}>Best Day</Text>
                            </View>
                            <View style={styles.analyticsItem}>
                                <Text style={styles.analyticsValue}>{analytics.worstDay}</Text>
                                <Text style={styles.analyticsLabel}>Needs Improvement</Text>
                            </View>
                        </View>
                    </View>
                )}
                {/* Statistics */}
                {selectedSubject && viewMode === 'today' && stats.total > 0 && (
                    <View style={styles.statsContainer}>
                        <View style={[styles.statCard, { backgroundColor: tokens.colors.success.light }]}>
                            <Text style={styles.statValue}>{stats.present}</Text>
                            <Text style={styles.statLabel}>Present</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: tokens.colors.error.light }]}>
                            <Text style={styles.statValue}>{stats.absent}</Text>
                            <Text style={styles.statLabel}>Absent</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: tokens.colors.warning.light }]}>
                            <Text style={styles.statValue}>{stats.late}</Text>
                            <Text style={styles.statLabel}>Late</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: tokens.colors.info.light }]}>
                            <Text style={styles.statValue}>{stats.total}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                    </View>
                )}

                {/* Bulk Actions */}
                {selectedSubject && viewMode === 'today' && (
                    <View style={styles.bulkActions}>
                        <View style={{ flex: 1 }}>
                            <Button 
                                variant="primary"
                                onPress={() => {
                                    setBulkAction('present');
                                    setBulkConfirmVisible(true);
                                }}
                                icon={<Ionicons name="checkmark-done" size={20} color={tokens.colors.neutral.white} />}
                            >
                                Mark All Present
                            </Button>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Button 
                                variant="danger"
                                onPress={() => {
                                    setBulkAction('absent');
                                    setBulkConfirmVisible(true);
                                }}
                                icon={<Ionicons name="close-circle" size={20} color={tokens.colors.neutral.white} />}
                            >
                                Mark All Absent
                            </Button>
                        </View>
                        <Button 
                            variant="ghost"
                            onPress={exportAttendance}
                            icon={<Ionicons name="download" size={20} color={tokens.colors.primary.main} />}
                        >
                            Export
                        </Button>
                    </View>
                )}

                {/* Search */}
                {selectedSubject && viewMode === 'today' && (
                    <View style={styles.searchContainer}>
                        <View style={{ position: 'relative' }}>
                            <Ionicons 
                                name="search" 
                                size={20} 
                                color={getTextSecondaryColor()} 
                                style={{ position: 'absolute', left: tokens.spacing.md, top: 16, zIndex: 1 }}
                            />
                            <TextInput
                                placeholder="Search students..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={[styles.searchInput, { paddingLeft: tokens.spacing.xl + tokens.spacing.sm }]}
                                placeholderTextColor={getTextSecondaryColor()}
                            />
                        </View>
                    </View>
                )}

                {selectedSubject && viewMode === 'today' ? (
                    <Stack spacing="sm">
                        {filteredStudents.length === 0 ? (
                            <Text style={styles.emptyText}>No students found.</Text>
                        ) : (
                            filteredStudents.map((item) => {
                                const currentStatus = attendanceData[item.id] || 'pending';
                                
                                return (
                                    <Card key={item.id} variant="default" style={styles.compactCard}>
                                        <View style={styles.compactRow}>
                                            <View style={styles.compactInfo}>
                                                <Text style={styles.compactName}>{item.full_name}</Text>
                                                <Text style={styles.compactEnrollment}>{item.enrollment_number}</Text>
                                            </View>
                                            <View style={styles.compactActions}>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.compactButton,
                                                        {
                                                            backgroundColor: currentStatus === 'present' ? tokens.colors.success.main : tokens.colors.success.light,
                                                            borderColor: tokens.colors.success.main,
                                                        },
                                                    ]}
                                                    onPress={() => handleMarkAttendance(item.id, 'present')}
                                                    disabled={marking[item.id]}
                                                >
                                                    <Ionicons
                                                        name="checkmark"
                                                        size={20}
                                                        color={currentStatus === 'present' ? tokens.colors.neutral.white : tokens.colors.success.main}
                                                    />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.compactButton,
                                                        {
                                                            backgroundColor: currentStatus === 'absent' ? tokens.colors.error.main : tokens.colors.error.light,
                                                            borderColor: tokens.colors.error.main,
                                                        },
                                                    ]}
                                                    onPress={() => handleMarkAttendance(item.id, 'absent')}
                                                    disabled={marking[item.id]}
                                                >
                                                    <Ionicons
                                                        name="close"
                                                        size={20}
                                                        color={currentStatus === 'absent' ? tokens.colors.neutral.white : tokens.colors.error.main}
                                                    />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={[
                                                        styles.compactButton,
                                                        {
                                                            backgroundColor: currentStatus === 'late' ? tokens.colors.warning.main : tokens.colors.warning.light,
                                                            borderColor: tokens.colors.warning.main,
                                                        },
                                                    ]}
                                                    onPress={() => handleMarkAttendance(item.id, 'late')}
                                                    disabled={marking[item.id]}
                                                >
                                                    <Ionicons
                                                        name="time"
                                                        size={20}
                                                        color={currentStatus === 'late' ? tokens.colors.neutral.white : tokens.colors.warning.main}
                                                    />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    </Card>
                                );
                            })
                        )}
                    </Stack>
                ) : selectedSubject && viewMode === 'history' ? (
                    <Card variant="default">
                        {historicalData.length === 0 ? (
                            <Text style={styles.emptyText}>No historical data available.</Text>
                        ) : (
                            historicalData.map((item, index) => (
                                <View key={index} style={styles.historyItem}>
                                    <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</Text>
                                    <Text style={styles.compactName}>{item.students?.full_name}</Text>
                                    <Text style={styles.compactEnrollment}>{item.students?.enrollment_number}</Text>
                                    <View style={{
                                        marginTop: 4,
                                        alignSelf: 'flex-start',
                                        backgroundColor: item.status === 'present' 
                                            ? tokens.colors.success.light 
                                            : item.status === 'absent'
                                            ? tokens.colors.error.light
                                            : tokens.colors.warning.light,
                                        paddingHorizontal: 8,
                                        paddingVertical: 4,
                                        borderRadius: 4,
                                    }}>
                                        <Text style={{
                                            fontSize: 12,
                                            fontWeight: '600',
                                            lineHeight: 20,
                                            color: item.status === 'present' 
                                                ? tokens.colors.success.main 
                                                : item.status === 'absent'
                                                ? tokens.colors.error.main
                                                : tokens.colors.warning.main,
                                        }}>
                                            {item.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            ))
                        )}
                    </Card>
                ) : (
                    <Text style={styles.emptyText}>Please select a subject to load students.</Text>
                )}
            </ScrollView>

            <ConfirmDialog
                visible={bulkConfirmVisible}
                title="Bulk Mark Attendance"
                message={`Are you sure you want to mark all students as ${bulkAction}?`}
                onConfirm={() => bulkAction && handleBulkMark(bulkAction)}
                onCancel={() => setBulkConfirmVisible(false)}
            />
        </View>
    );
}
