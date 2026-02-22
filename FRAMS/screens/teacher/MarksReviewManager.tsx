import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView, Text, Dimensions, TextInput as RNTextInput } from 'react-native';
import { Menu } from 'react-native-paper';
import { BarChart } from 'react-native-chart-kit';
import { fetchTeacherAssignments, fetchAssignmentSubmissions } from '../../lib/database';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../lib/design-system/ThemeContext';
import { supabase } from '../../lib/supabase';
import Button from '../../components/design-system/primitives/Button';
import Card from '../../components/design-system/primitives/Card';
import SelectPicker from '../../components/design-system/primitives/SelectPicker';
import { Stack } from '../../components/design-system/layout';
import LoadingSpinner from '../../components/design-system/feedback/LoadingSpinner';
import DateRangePicker from '../../components/DateRangePicker';
import { Ionicons } from '@expo/vector-icons';
import { exportCSV } from '../../lib/csvExport';

export default function MarksReviewManager() {
    const { user } = useAuth();
    const { tokens, getTextColor, getTextSecondaryColor, getSurfaceColor } = useTheme();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<string>('all');
    const [subjects, setSubjects] = useState<any[]>([]);
    const [subjectMenuVisible, setSubjectMenuVisible] = useState(false);
    const [sortBy, setSortBy] = useState<'name' | 'score' | 'date'>('date');
    const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
        start: new Date(new Date().setMonth(new Date().getMonth() - 3)),
        end: new Date(),
    });

    useEffect(() => {
        if (user?.id) {
            loadSubjects();
            loadData();
        }
    }, [user, dateRange]);

    const loadSubjects = async () => {
        const { data, error } = await supabase
            .from('subjects')
            .select(`
                id, 
                name,
                org_classes (name)
            `)
            .eq('teacher_id', user!.id);
        
        if (!error && data) {
            setSubjects(data);
        }
    };

    const loadData = async () => {
        setLoading(true);
        
        const { data: assignmentsData, error: assignmentsError } = await fetchTeacherAssignments(user!.id);
        if (!assignmentsError && assignmentsData) {
            const allSubmissions: any[] = [];
            for (const assignment of assignmentsData) {
                const { data: subs } = await fetchAssignmentSubmissions(assignment.id);
                if (subs) {
                    allSubmissions.push(...subs.map(s => ({
                        ...s,
                        assignment_title: assignment.title,
                        subject_name: assignment.subjects?.name,
                        subject_id: assignment.subject_id,
                        max_score: assignment.max_score,
                    })));
                }
            }
            setSubmissions(allSubmissions);
        }
        
        setLoading(false);
    };

    const filteredSubmissions = submissions.filter(s => {
        const matchesSearch = !searchQuery ||
            s.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.enrollment_number?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesSubject = selectedSubject === 'all' || s.subject_id === selectedSubject;
        const submissionDate = new Date(s.created_at);
        const matchesDateRange = submissionDate >= dateRange.start && submissionDate <= dateRange.end;
        
        return matchesSearch && matchesSubject && matchesDateRange && s.score !== null;
    });

    const sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return (a.student_name || '').localeCompare(b.student_name || '');
            case 'score':
                return (b.score || 0) - (a.score || 0);
            case 'date':
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            default:
                return 0;
        }
    });

    const gradeDistribution = {
        'A': filteredSubmissions.filter(s => s.score >= 90).length,
        'B': filteredSubmissions.filter(s => s.score >= 80 && s.score < 90).length,
        'C': filteredSubmissions.filter(s => s.score >= 70 && s.score < 80).length,
        'D': filteredSubmissions.filter(s => s.score >= 60 && s.score < 70).length,
        'F': filteredSubmissions.filter(s => s.score < 60).length,
    };

    const chartData = {
        labels: ['A', 'B', 'C', 'D', 'F'],
        datasets: [{
            data: [
                gradeDistribution['A'],
                gradeDistribution['B'],
                gradeDistribution['C'],
                gradeDistribution['D'],
                gradeDistribution['F'],
            ]
        }]
    };

    const stats = {
        totalGraded: filteredSubmissions.length,
        avgScore: filteredSubmissions.length > 0 
            ? filteredSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / filteredSubmissions.length 
            : 0,
        highestScore: filteredSubmissions.length > 0 
            ? Math.max(...filteredSubmissions.map(s => s.score || 0)) 
            : 0,
        lowestScore: filteredSubmissions.length > 0 
            ? Math.min(...filteredSubmissions.map(s => s.score || 0)) 
            : 0,
    };

    const exportToCSV = async () => {
        try {
            let csv = 'Student Name,Enrollment,Assignment,Subject,Score,Max Score,Percentage,Date\n';
            sortedSubmissions.forEach(s => {
                const percentage = ((s.score / s.max_score) * 100).toFixed(1);
                csv += `${s.student_name},${s.enrollment_number},${s.assignment_title},${s.subject_name},${s.score},${s.max_score},${percentage}%,${new Date(s.created_at).toLocaleDateString()}\n`;
            });

            await exportCSV(csv, 'marks_export.csv');
        } catch (error) {
            Alert.alert('Error', 'Failed to export data');
        }
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: tokens.colors.background.main,
        },
        scrollContent: {
            padding: tokens.spacing.md,
        },
        header: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: tokens.spacing.md,
        },
        title: {
            fontSize: tokens.typography.h1.fontSize,
            fontWeight: tokens.typography.h1.fontWeight,
            color: getTextColor(),
        },
        statsContainer: {
            flexDirection: 'row',
            gap: tokens.spacing.sm,
            marginBottom: tokens.spacing.md,
        },
        statCard: {
            flex: 1,
            padding: tokens.spacing.md,
            borderRadius: tokens.borders.radius.medium,
            alignItems: 'center',
            ...tokens.shadows.sm,
        },
        statValue: {
            fontSize: tokens.typography.h2.fontSize,
            fontWeight: tokens.typography.h2.fontWeight,
            color: getTextColor(),
        },
        statLabel: {
            fontSize: tokens.typography.caption.fontSize,
            color: getTextSecondaryColor(),
            marginTop: tokens.spacing.xs,
        },
        searchInput: {
            backgroundColor: getSurfaceColor(),
            borderRadius: tokens.borders.radius.medium,
            padding: tokens.spacing.md,
            fontSize: tokens.typography.body.fontSize,
            color: getTextColor(),
            borderWidth: 1,
            borderColor: tokens.colors.neutral.gray300,
            marginBottom: tokens.spacing.md,
        },
        sortButtons: {
            flexDirection: 'row',
            gap: tokens.spacing.sm,
            marginVertical: tokens.spacing.md,
        },
        sortButton: {
            flex: 1,
        },
        card: {
            marginBottom: tokens.spacing.md,
        },
        submissionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: tokens.spacing.sm,
        },
        studentName: {
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: getTextColor(),
        },
        enrollmentText: {
            fontSize: tokens.typography.caption.fontSize,
            color: getTextSecondaryColor(),
            marginTop: tokens.spacing.xs,
        },
        assignmentText: {
            fontSize: tokens.typography.body.fontSize,
            color: getTextColor(),
            marginTop: tokens.spacing.xs,
        },
        subjectText: {
            fontSize: tokens.typography.caption.fontSize,
            color: getTextSecondaryColor(),
            marginTop: tokens.spacing.xs,
        },
        scoreContainer: {
            alignItems: 'flex-end',
        },
        scoreBadge: {
            paddingHorizontal: tokens.spacing.sm,
            paddingVertical: tokens.spacing.xs,
            borderRadius: tokens.borders.radius.small,
        },
        scoreText: {
            fontSize: tokens.typography.body.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
        },
        percentageText: {
            fontSize: tokens.typography.caption.fontSize,
            color: getTextSecondaryColor(),
            marginTop: tokens.spacing.xs,
        },
        dateText: {
            fontSize: tokens.typography.caption.fontSize,
            color: getTextSecondaryColor(),
            marginTop: tokens.spacing.xs,
        },
    });

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LoadingSpinner size="large" />
                <Text style={{ marginTop: tokens.spacing.md, color: getTextColor() }}>Loading marks...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.header}>
                <Text style={styles.title}>Marks & Reviews</Text>
                <Button 
                    variant="ghost"
                    onPress={exportToCSV}
                    icon={<Ionicons name="download" size={20} color={tokens.colors.primary.main} />}
                >
                    Export
                </Button>
            </View>

            <View style={styles.statsContainer}>
                <View style={[styles.statCard, { backgroundColor: tokens.colors.info.light }]}>
                    <Text style={styles.statValue}>{stats.totalGraded}</Text>
                    <Text style={styles.statLabel}>Total Graded</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: tokens.colors.accent.light }]}>
                    <Text style={styles.statValue}>{stats.avgScore.toFixed(1)}</Text>
                    <Text style={styles.statLabel}>Avg Score</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: tokens.colors.success.light }]}>
                    <Text style={styles.statValue}>{stats.highestScore}</Text>
                    <Text style={styles.statLabel}>Highest</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: tokens.colors.error.light }]}>
                    <Text style={styles.statValue}>{stats.lowestScore}</Text>
                    <Text style={styles.statLabel}>Lowest</Text>
                </View>
            </View>

            {filteredSubmissions.length > 0 && (
                <Card variant="elevated" style={{ marginBottom: tokens.spacing.md }}>
                    <Text style={[styles.title, { fontSize: tokens.typography.h3.fontSize, marginBottom: tokens.spacing.md }]}>
                        Grade Distribution
                    </Text>
                    <BarChart
                        data={chartData}
                        width={Dimensions.get('window').width - (tokens.spacing.md * 4)}
                        height={220}
                        yAxisLabel=""
                        yAxisSuffix=""
                        chartConfig={{
                            backgroundColor: getSurfaceColor(),
                            backgroundGradientFrom: getSurfaceColor(),
                            backgroundGradientTo: getSurfaceColor(),
                            decimalPlaces: 0,
                            color: (opacity = 1) => tokens.colors.primary.main,
                            labelColor: (opacity = 1) => getTextColor(),
                        }}
                        style={{ marginVertical: tokens.spacing.sm, borderRadius: tokens.borders.radius.medium }}
                    />
                </Card>
            )}

            <View style={{ marginBottom: tokens.spacing.md }}>
                <SelectPicker
                    label="Filter by Subject"
                    value={selectedSubject}
                    onValueChange={(value) => setSelectedSubject(value)}
                    items={[
                        { label: 'All Subjects', value: 'all', icon: 'grid-outline' as const },
                        ...subjects.map(subject => ({
                            label: subject.name,
                            value: subject.id,
                            description: subject.org_classes?.name,
                            icon: 'book-outline' as const
                        }))
                    ]}
                />
            </View>

            <DateRangePicker
                startDate={dateRange.start}
                endDate={dateRange.end}
                onStartDateChange={(date: Date) => setDateRange({ ...dateRange, start: date })}
                onEndDateChange={(date: Date) => setDateRange({ ...dateRange, end: date })}
            />

            <RNTextInput
                placeholder="Search students..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
                placeholderTextColor={getTextSecondaryColor()}
            />

            <View style={styles.sortButtons}>
                <Button
                    variant={sortBy === 'date' ? 'primary' : 'secondary'}
                    size="small"
                    onPress={() => setSortBy('date')}
                    style={styles.sortButton}
                    icon={<Ionicons name="calendar" size={16} color={sortBy === 'date' ? tokens.colors.neutral.white : getTextColor()} />}
                >
                    Date
                </Button>
                <Button
                    variant={sortBy === 'name' ? 'primary' : 'secondary'}
                    size="small"
                    onPress={() => setSortBy('name')}
                    style={styles.sortButton}
                    icon={<Ionicons name="person" size={16} color={sortBy === 'name' ? tokens.colors.neutral.white : getTextColor()} />}
                >
                    Name
                </Button>
                <Button
                    variant={sortBy === 'score' ? 'primary' : 'secondary'}
                    size="small"
                    onPress={() => setSortBy('score')}
                    style={styles.sortButton}
                    icon={<Ionicons name="star" size={16} color={sortBy === 'score' ? tokens.colors.neutral.white : getTextColor()} />}
                >
                    Score
                </Button>
            </View>

            {sortedSubmissions.length === 0 ? (
                <Text style={{ textAlign: 'center', marginTop: tokens.spacing.xl, color: getTextSecondaryColor() }}>
                    No graded submissions found
                </Text>
            ) : (
                <Stack spacing="md">
                    {sortedSubmissions.map((item) => {
                        const percentage = ((item.score / item.max_score) * 100).toFixed(0);
                        const scoreColor = item.score >= 80 
                            ? tokens.colors.success.main 
                            : item.score >= 60 
                            ? tokens.colors.warning.main 
                            : tokens.colors.error.main;
                        const scoreBgColor = item.score >= 80 
                            ? tokens.colors.success.light 
                            : item.score >= 60 
                            ? tokens.colors.warning.light 
                            : tokens.colors.error.light;
                        
                        return (
                            <Card key={item.id} variant="elevated" style={styles.card}>
                                <View style={styles.submissionHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.studentName}>{item.student_name}</Text>
                                        <Text style={styles.enrollmentText}>{item.enrollment_number}</Text>
                                        <Text style={styles.assignmentText}>{item.assignment_title}</Text>
                                        <Text style={styles.subjectText}>{item.subject_name}</Text>
                                    </View>
                                    <View style={styles.scoreContainer}>
                                        <View style={[styles.scoreBadge, { backgroundColor: scoreBgColor }]}>
                                            <Text style={[styles.scoreText, { color: scoreColor }]}>
                                                {item.score}/{item.max_score}
                                            </Text>
                                        </View>
                                        <Text style={styles.percentageText}>{percentage}%</Text>
                                    </View>
                                </View>
                                <Text style={styles.dateText}>
                                    {new Date(item.created_at).toLocaleDateString()}
                                </Text>
                            </Card>
                        );
                    })}
                </Stack>
            )}
        </ScrollView>
    );
}
