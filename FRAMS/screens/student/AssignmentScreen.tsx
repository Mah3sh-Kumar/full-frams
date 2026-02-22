import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useTheme } from '../../lib/design-system/ThemeContext';
import Card from '../../components/design-system/primitives/Card';
import Button from '../../components/design-system/primitives/Button';
import Input from '../../components/design-system/primitives/Input';
import LoadingSpinner from '../../components/design-system/feedback/LoadingSpinner';
import { Stack, Row } from '../../components/design-system/layout';
import EmptyState from '../../components/EmptyState';
import CountdownTimer from '../../components/CountdownTimer';

type Assignment = {
    id: string;
    assignment_id: string;
    status: 'pending' | 'submitted' | 'graded';
    score: number | null;
    remarks: string | null;
    submission_url: string | null;
    created_at: string;
    assignments: {
        title: string;
        description: string;
        due_date: string;
        max_score: number;
        subjects: {
            name: string;
        } | null;
    } | null;
};

export default function AssignmentScreen() {
    const { tokens, getTextColor, getSurfaceColor } = useTheme();
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchAssignments();
    }, []);

    async function fetchAssignments() {
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
                    .from('student_assignments')
                    .select('*, assignments(*, subjects(name))')
                    .eq('student_id', student.id)
                    .order('created_at', { ascending: false });

                if (error) console.error(error);
                else setAssignments(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }

    function onRefresh() {
        setRefreshing(true);
        fetchAssignments();
    }

    function getStatusColor(status: string) {
        switch (status) {
            case 'pending': return tokens.colors.warning.main;
            case 'submitted': return tokens.colors.info.main;
            case 'graded': return tokens.colors.success.main;
            default: return tokens.colors.neutral.gray600;
        }
    }

    function getStatusIcon(status: string) {
        switch (status) {
            case 'pending': return 'time-outline';
            case 'submitted': return 'document-text';
            case 'graded': return 'checkmark-circle';
            default: return 'information-circle';
        }
    }

    function isOverdue(dueDate: string, status: string) {
        return status === 'pending' && new Date(dueDate) < new Date();
    }

    const stats = {
        pending: assignments.filter(a => a.status === 'pending').length,
        submitted: assignments.filter(a => a.status === 'submitted').length,
        graded: assignments.filter(a => a.status === 'graded').length,
        total: assignments.length,
        avgScore: assignments.filter(a => a.score !== null).reduce((sum, a) => sum + (a.score || 0), 0) /
            Math.max(assignments.filter(a => a.score !== null).length, 1)
    };

    const filteredAssignments = assignments.filter(a => {
        const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
        const matchesSearch = !searchQuery ||
            a.assignments?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.assignments?.subjects?.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: tokens.colors.theme.light.background,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: tokens.colors.theme.light.background,
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
            color: tokens.colors.neutral.gray600,
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
        searchInput: {
            backgroundColor: getSurfaceColor(),
            borderRadius: tokens.borders.radius.medium,
            borderWidth: tokens.borders.width.thin,
            borderColor: tokens.colors.neutral.gray300,
            paddingHorizontal: tokens.spacing.md,
            paddingVertical: tokens.spacing.sm,
            fontSize: tokens.typography.body.fontSize,
            color: getTextColor(),
        },
        filterButton: {
            flex: 1,
            paddingVertical: tokens.spacing.sm,
            paddingHorizontal: tokens.spacing.xs,
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
        assignmentCard: {
            marginBottom: 0,
        },
        cardContent: {
            padding: tokens.spacing.md,
        },
        cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: tokens.spacing.sm,
        },
        cardTitleContainer: {
            flex: 1,
            marginRight: tokens.spacing.sm,
        },
        assignmentTitle: {
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: getTextColor(),
            marginBottom: tokens.spacing.xs / 2,
        },
        subjectName: {
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
        description: {
            fontSize: tokens.typography.body.fontSize,
            color: tokens.colors.neutral.gray600,
            marginBottom: tokens.spacing.sm,
            lineHeight: 20,
        },
        cardFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: tokens.spacing.sm,
        },
        dueDateContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.spacing.xs,
        },
        dueDate: {
            fontSize: tokens.typography.caption.fontSize,
            color: tokens.colors.neutral.gray600,
        },
        overdueText: {
            color: tokens.colors.error.main,
            fontWeight: tokens.typography.h3.fontWeight,
        },
        scoreBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: tokens.spacing.xs / 2,
            paddingHorizontal: tokens.spacing.sm,
            borderRadius: tokens.borders.radius.small,
            backgroundColor: tokens.colors.success.light,
            gap: tokens.spacing.xs / 2,
        },
        scoreText: {
            fontSize: tokens.typography.caption.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: tokens.colors.success.main,
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
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>My Assignments</Text>
                    <Text style={styles.subtitle}>Track your coursework</Text>
                </View>

                <Stack spacing="md" style={{ paddingHorizontal: tokens.spacing.md }}>
                    <Row spacing="sm">
                        <Card variant="glassmorphic" style={styles.statCard}>
                            <View style={styles.statContent}>
                                <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.warning.light }]}>
                                    <Ionicons name="time-outline" size={20} color={tokens.colors.warning.main} />
                                </View>
                                <Text style={styles.statValue}>{stats.pending}</Text>
                                <Text style={styles.statLabel}>Pending</Text>
                            </View>
                        </Card>

                        <Card variant="glassmorphic" style={styles.statCard}>
                            <View style={styles.statContent}>
                                <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.info.light }]}>
                                    <Ionicons name="document-text" size={20} color={tokens.colors.info.main} />
                                </View>
                                <Text style={styles.statValue}>{stats.submitted}</Text>
                                <Text style={styles.statLabel}>Submitted</Text>
                            </View>
                        </Card>

                        <Card variant="glassmorphic" style={styles.statCard}>
                            <View style={styles.statContent}>
                                <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.success.light }]}>
                                    <Ionicons name="checkmark-circle" size={20} color={tokens.colors.success.main} />
                                </View>
                                <Text style={styles.statValue}>{stats.graded}</Text>
                                <Text style={styles.statLabel}>Graded</Text>
                            </View>
                        </Card>

                        <Card variant="glassmorphic" style={styles.statCard}>
                            <View style={styles.statContent}>
                                <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.primary.light }]}>
                                    <Ionicons name="star" size={20} color={tokens.colors.primary.main} />
                                </View>
                                <Text style={styles.statValue}>{stats.avgScore.toFixed(0)}</Text>
                                <Text style={styles.statLabel}>Avg Score</Text>
                            </View>
                        </Card>
                    </Row>

                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search assignments..."
                        placeholderTextColor={tokens.colors.neutral.gray400}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />

                    <Row spacing="sm">
                        {['all', 'pending', 'submitted', 'graded'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
                                onPress={() => setFilterStatus(status)}
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

                    {filteredAssignments.length === 0 ? (
                        <EmptyState
                            icon="book-open-variant"
                            title={searchQuery ? 'No assignments found' :
                                filterStatus === 'all' ? 'No assignments yet' :
                                    `No ${filterStatus} assignments`}
                            message={searchQuery ? 'Try adjusting your search criteria' :
                                filterStatus === 'all' ? 'Your assignments will appear here' :
                                    `You have no ${filterStatus} assignments at this time`}
                        />
                    ) : (
                        <Stack spacing="md">
                            {filteredAssignments.map((item) => {
                                const assignment = item.assignments;
                                if (!assignment) return null;

                                const overdue = isOverdue(assignment.due_date, item.status);

                                return (
                                    <Card key={item.id} variant="default" style={styles.assignmentCard}>
                                        <View style={styles.cardContent}>
                                            <View style={styles.cardHeader}>
                                                <View style={styles.cardTitleContainer}>
                                                    <Text style={styles.assignmentTitle}>{assignment.title}</Text>
                                                    <Text style={styles.subjectName}>
                                                        {assignment.subjects?.name || 'Unknown Subject'}
                                                    </Text>
                                                </View>
                                                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                                                    <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
                                                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                                                        {item.status.toUpperCase()}
                                                    </Text>
                                                </View>
                                            </View>

                                            {assignment.description && (
                                                <Text style={styles.description} numberOfLines={2}>
                                                    {assignment.description}
                                                </Text>
                                            )}

                                            <View style={styles.cardFooter}>
                                                <View style={styles.dueDateContainer}>
                                                    {item.status === 'pending' && !overdue ? (
                                                        <CountdownTimer dueDate={assignment.due_date} />
                                                    ) : (
                                                        <>
                                                            <Ionicons
                                                                name={overdue ? "alert-circle" : "calendar"}
                                                                size={16}
                                                                color={overdue ? tokens.colors.error.main : tokens.colors.neutral.gray600}
                                                            />
                                                            <Text style={[
                                                                styles.dueDate,
                                                                overdue && styles.overdueText
                                                            ]}>
                                                                {overdue ? 'Overdue' : 'Completed'}
                                                            </Text>
                                                        </>
                                                    )}
                                                </View>

                                                {item.status === 'graded' && item.score !== null && (
                                                    <View style={styles.scoreBadge}>
                                                        <Ionicons name="star" size={14} color={tokens.colors.success.main} />
                                                        <Text style={styles.scoreText}>
                                                            {item.score}/{assignment.max_score}
                                                        </Text>
                                                    </View>
                                                )}

                                                {item.status === 'pending' && (
                                                    <Button
                                                        variant="primary"
                                                        size="small"
                                                        onPress={() => Alert.alert('Submit', 'Submission interface coming soon!')}
                                                    >
                                                        Submit
                                                    </Button>
                                                )}
                                            </View>
                                        </View>
                                    </Card>
                                );
                            })}
                        </Stack>
                    )}
                </Stack>
            </ScrollView>
        </View>
    );
}
