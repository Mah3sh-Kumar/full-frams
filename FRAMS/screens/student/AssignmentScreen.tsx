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
    const { tokens, getTextColor, getSurfaceColor, getBackgroundColor, getTextSecondaryColor, getBorderColor } = useTheme();
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
            fontSize: 9,
            fontWeight: '500',
            color: getTextSecondaryColor(),
            marginTop: 2,
            opacity: 0.7,
            textAlign: 'center',
        },
        searchInput: {
            backgroundColor: getSurfaceColor(),
            borderRadius: 20,
            borderWidth: 2,
            borderColor: getBorderColor(),
            paddingHorizontal: tokens.spacing.lg,
            paddingVertical: tokens.spacing.md,
            fontSize: 16,
            fontWeight: '500',
            color: getTextColor(),
        },
        filterButton: {
            flex: 1,
            minWidth: 0,
            paddingVertical: 10,
            paddingHorizontal: 4,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: getBorderColor(),
            backgroundColor: getSurfaceColor(),
            alignItems: 'center',
            justifyContent: 'center',
        },
        filterButtonActive: {
            borderColor: tokens.colors.primary.main,
            backgroundColor: tokens.colors.primary.main + '15',
            borderWidth: 1.5,
        },
        filterButtonText: {
            fontSize: 11,
            fontWeight: '600',
            color: getTextSecondaryColor(),
            textAlign: 'center',
        },
        filterButtonTextActive: {
            color: tokens.colors.primary.main,
            fontWeight: '700',
            textAlign: 'center',
        },
        assignmentCard: {
            marginBottom: 0,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.12,
            shadowRadius: 3,
        },
        cardContent: {
            padding: tokens.spacing.lg,
        },
        cardHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: tokens.spacing.md,
        },
        cardTitleContainer: {
            flex: 1,
            marginRight: tokens.spacing.md,
        },
        assignmentTitle: {
            fontSize: 18,
            fontWeight: '600',
            color: getTextColor(),
            marginBottom: tokens.spacing.xs,
            letterSpacing: -0.2,
        },
        subjectName: {
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
        description: {
            fontSize: 15,
            fontWeight: '400',
            color: getTextSecondaryColor(),
            marginBottom: tokens.spacing.md,
            lineHeight: 22,
            opacity: 0.8,
        },
        cardFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: tokens.spacing.md,
        },
        dueDateContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.spacing.sm,
        },
        dueDate: {
            fontSize: 14,
            fontWeight: '500',
            color: getTextSecondaryColor(),
        },
        overdueText: {
            color: tokens.colors.error.main,
            fontWeight: '700',
        },
        scoreBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: tokens.spacing.xs,
            paddingHorizontal: tokens.spacing.md,
            borderRadius: 20,
            backgroundColor: tokens.colors.success.main + '20',
            gap: tokens.spacing.xs,
        },
        scoreText: {
            fontSize: 14,
            fontWeight: '700',
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
                contentContainerStyle={{ paddingBottom: tokens.spacing.xl }}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>My Assignments</Text>
                    <Text style={styles.subtitle}>Track your coursework</Text>
                </View>

                <View style={{ paddingHorizontal: tokens.spacing.md }}>
                    <Stack spacing="md" style={{ maxWidth: '100%' }}>
                    <View style={{ width: '100%', overflow: 'hidden' }}>
                        <View style={{ flexDirection: 'row', gap: 4, justifyContent: 'space-between' }}>
                            <View style={styles.statCard}>
                            <View style={[styles.statContent, { backgroundColor: getSurfaceColor(), borderRadius: 12 }]}>
                                <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.warning.main + '20' }]}>
                                    <Ionicons name="time-outline" size={16} color={tokens.colors.warning.main} />
                                </View>
                                <Text style={styles.statValue}>{stats.pending}</Text>
                                <Text style={styles.statLabel} numberOfLines={1}>Pending</Text>
                            </View>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.statContent, { backgroundColor: getSurfaceColor(), borderRadius: 12 }]}>
                                <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.info.main + '20' }]}>
                                    <Ionicons name="document-text" size={16} color={tokens.colors.info.main} />
                                </View>
                                <Text style={styles.statValue}>{stats.submitted}</Text>
                                <Text style={styles.statLabel} numberOfLines={1}>Submitted</Text>
                            </View>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.statContent, { backgroundColor: getSurfaceColor(), borderRadius: 12 }]}>
                                <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.success.main + '20' }]}>
                                    <Ionicons name="checkmark-circle" size={16} color={tokens.colors.success.main} />
                                </View>
                                <Text style={styles.statValue}>{stats.graded}</Text>
                                <Text style={styles.statLabel} numberOfLines={1}>Graded</Text>
                            </View>
                        </View>

                        <View style={styles.statCard}>
                            <View style={[styles.statContent, { backgroundColor: getSurfaceColor(), borderRadius: 12 }]}>
                                <View style={[styles.statIconContainer, { backgroundColor: tokens.colors.primary.main + '20' }]}>
                                    <Ionicons name="star" size={16} color={tokens.colors.primary.main} />
                                </View>
                                <Text style={styles.statValue}>{stats.avgScore.toFixed(0)}</Text>
                                <Text style={styles.statLabel} numberOfLines={1}>Avg Score</Text>
                            </View>
                        </View>
                        </View>
                    </View>

                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search assignments..."
                        placeholderTextColor={getTextSecondaryColor() + '80'}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />

                    <View style={{ width: '100%', paddingHorizontal: 2 }}>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                            {['all', 'pending', 'submitted', 'graded'].map((status) => (
                            <TouchableOpacity
                                key={status}
                                style={[styles.filterButton, filterStatus === status && styles.filterButtonActive]}
                                onPress={() => setFilterStatus(status)}
                                accessible
                                accessibilityRole="button"
                                accessibilityState={{ selected: filterStatus === status }}
                            >
                                <Text 
                                    style={[styles.filterButtonText, filterStatus === status && styles.filterButtonTextActive]}
                                    numberOfLines={1}
                                    adjustsFontSizeToFit
                                    minimumFontScale={0.75}
                                >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Text>
                            </TouchableOpacity>
                            ))}
                        </View>
                    </View>

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
                                                                color={overdue ? tokens.colors.error.main : getTextSecondaryColor()}
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
                </View>
            </ScrollView>
        </View>
    );
}
