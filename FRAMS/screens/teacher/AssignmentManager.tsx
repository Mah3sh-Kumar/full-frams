import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView, Text, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Menu, Portal, Modal } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../lib/design-system/ThemeContext';
import { supabase } from '../../lib/supabase';
import { fetchTeacherSubjects, fetchTeacherAssignments, fetchAssignmentSubmissions, gradeSubmission } from '../../lib/database';
import Button from '../../components/design-system/primitives/Button';
import Card from '../../components/design-system/primitives/Card';
import Input from '../../components/design-system/primitives/Input';
import SelectPicker from '../../components/design-system/primitives/SelectPicker';
import { Stack } from '../../components/design-system/layout';
import LoadingSpinner from '../../components/design-system/feedback/LoadingSpinner';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Ionicons } from '@expo/vector-icons';

export default function AssignmentManager() {
    const { user } = useAuth();
    const { tokens, getTextColor, getTextSecondaryColor, getSurfaceColor } = useTheme();
    const [tab, setTab] = useState('all');

    // Create Mode State
    const [subjects, setSubjects] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<any>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [maxScore, setMaxScore] = useState('100');
    const [dueDate, setDueDate] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [createModalVisible, setCreateModalVisible] = useState(false);

    // List Mode State
    const [assignments, setAssignments] = useState<any[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [gradingSubmission, setGradingSubmission] = useState<any>(null);
    const [score, setScore] = useState('');
    const [remarks, setRemarks] = useState('');
    const [gradeLoading, setGradeLoading] = useState(false);
    const [listLoading, setListLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState<any>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<any>(null);

    useEffect(() => {
        if (user) {
            loadSubjects();
            loadAssignments();
        }
    }, [user]);

    useEffect(() => {
        if (selectedAssignment) {
            loadSubmissions(selectedAssignment.id);
        }
    }, [selectedAssignment]);

    async function loadSubjects() {
        if (!user) return;
        const { data, error } = await fetchTeacherSubjects(user.id);
        if (!error) setSubjects(data);
    }

    async function loadAssignments() {
        if (!user) return;
        setListLoading(true);
        const { data, error } = await fetchTeacherAssignments(user.id);
        if (error) Alert.alert('Error', error);
        else setAssignments(data);
        setListLoading(false);
    }

    async function loadSubmissions(assignmentId: string) {
        setListLoading(true);
        const { data, error } = await fetchAssignmentSubmissions(assignmentId);
        if (error) Alert.alert('Error', error);
        else setSubmissions(data);
        setListLoading(false);
    }

    async function handleCreateAssignment() {
        if (!selectedSubject || !title || !maxScore) {
            return Alert.alert('Error', 'Subject, Title, and Max Score are required');
        }

        setCreateLoading(true);
        const dueDateValue = dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        const { error } = await supabase.from('assignments').insert({
            subject_id: selectedSubject.id,
            title,
            description,
            due_date: dueDateValue,
            max_score: parseFloat(maxScore),
        });

        if (error) Alert.alert('Error', error.message);
        else {
            Alert.alert('Success', 'Assignment created!');
            setTitle('');
            setDescription('');
            setMaxScore('100');
            setDueDate('');
            setSelectedSubject(null);
            setCreateModalVisible(false);
            loadAssignments();
        }
        setCreateLoading(false);
    }

    async function handleUpdateAssignment() {
        if (!editingAssignment) return;

        setCreateLoading(true);
        const { error } = await supabase
            .from('assignments')
            .update({
                title: editingAssignment.title,
                description: editingAssignment.description,
                max_score: parseFloat(editingAssignment.max_score),
                due_date: editingAssignment.due_date,
            })
            .eq('id', editingAssignment.id);

        if (error) Alert.alert('Error', error.message);
        else {
            Alert.alert('Success', 'Assignment updated!');
            setEditModalVisible(false);
            setEditingAssignment(null);
            loadAssignments();
        }
        setCreateLoading(false);
    }

    async function handleDeleteAssignment() {
        if (!assignmentToDelete) return;

        const { error } = await supabase
            .from('assignments')
            .delete()
            .eq('id', assignmentToDelete.id);

        if (error) Alert.alert('Error', error.message);
        else {
            Alert.alert('Success', 'Assignment deleted!');
            setDeleteConfirmVisible(false);
            setAssignmentToDelete(null);
            loadAssignments();
        }
    }

    async function handleGrade() {
        if (!gradingSubmission || !score) return;

        setGradeLoading(true);
        const { error } = await gradeSubmission(gradingSubmission.id, parseFloat(score), remarks);

        if (error) Alert.alert('Error', error);
        else {
            Alert.alert('Success', 'Graded successfully');
            setGradingSubmission(null);
            setScore('');
            setRemarks('');
            loadSubmissions(selectedAssignment.id);
        }
        setGradeLoading(false);
    }

    const filteredAssignments = assignments.filter(a => {
        const matchesSearch = !searchQuery ||
            a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.subjects?.name?.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (tab === 'all') return matchesSearch;
        if (tab === 'pending') {
            return matchesSearch && new Date(a.due_date) > new Date();
        }
        if (tab === 'graded') {
            return matchesSearch && new Date(a.due_date) <= new Date();
        }
        return matchesSearch;
    });

    const submissionStats = {
        submitted: submissions.filter(s => s.status === 'submitted' || s.status === 'graded').length,
        pending: submissions.filter(s => s.status === 'pending').length,
        avgScore: submissions.filter(s => s.score !== null).reduce((sum, s) => sum + (s.score || 0), 0) /
            Math.max(submissions.filter(s => s.score !== null).length, 1)
    };

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: tokens.colors.background.main,
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
        headerRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: tokens.spacing.md,
        },
        subTitle: {
            fontSize: tokens.typography.h2.fontSize,
            fontWeight: tokens.typography.h2.fontWeight,
            color: getTextColor(),
        },
        tabs: {
            flexDirection: 'row',
            gap: tokens.spacing.sm,
            marginBottom: tokens.spacing.md,
        },
        tabButton: {
            flex: 1,
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
        card: {
            marginBottom: tokens.spacing.md,
        },
        assignmentHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
        },
        assignmentTitle: {
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
            color: getTextColor(),
            marginBottom: tokens.spacing.xs,
        },
        assignmentSubtext: {
            fontSize: tokens.typography.caption.fontSize,
            color: getTextSecondaryColor(),
            marginTop: tokens.spacing.xs,
        },
        assignmentActions: {
            flexDirection: 'row',
            gap: tokens.spacing.xs,
        },
        modal: {
            backgroundColor: getSurfaceColor(),
            padding: tokens.spacing.lg,
            margin: tokens.spacing.lg,
            borderRadius: tokens.borders.radius.medium,
            maxHeight: '80%',
        },
        modalTitle: {
            fontSize: tokens.typography.h2.fontSize,
            fontWeight: tokens.typography.h2.fontWeight,
            color: getTextColor(),
            marginBottom: tokens.spacing.md,
        },
        modalActions: {
            flexDirection: 'row',
            justifyContent: 'flex-end',
            gap: tokens.spacing.sm,
            marginTop: tokens.spacing.md,
        },
        emptyText: {
            textAlign: 'center',
            marginTop: tokens.spacing.xl,
            color: getTextSecondaryColor(),
            fontSize: tokens.typography.body.fontSize,
            fontStyle: 'italic',
        },
        statusBadge: {
            paddingHorizontal: tokens.spacing.sm,
            paddingVertical: tokens.spacing.xs,
            borderRadius: tokens.borders.radius.small,
        },
        statusText: {
            fontSize: tokens.typography.caption.fontSize,
            fontWeight: tokens.typography.body.fontWeight,
        },
    });

    if (listLoading && assignments.length === 0) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <LoadingSpinner size="large" />
                <Text style={{ marginTop: tokens.spacing.md, color: getTextColor() }}>Loading...</Text>
            </View>
        );
    }

    const renderAssignmentList = () => {
        if (selectedAssignment) {
            return (
                <View>
                    <Button 
                        variant="ghost"
                        onPress={() => setSelectedAssignment(null)} 
                        style={{ marginBottom: tokens.spacing.md, alignSelf: 'flex-start' }}
                        icon={<Ionicons name="arrow-back" size={20} color={tokens.colors.primary.main} />}
                    >
                        Back to Assignments
                    </Button>
                    <Text style={styles.title}>{selectedAssignment.title} - Submissions</Text>

                    {/* Submission Statistics */}
                    <View style={styles.statsContainer}>
                        <View style={[styles.statCard, { backgroundColor: tokens.colors.info.light }]}>
                            <Text style={styles.statValue}>{submissions.length}</Text>
                            <Text style={styles.statLabel}>Total</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: tokens.colors.success.light }]}>
                            <Text style={styles.statValue}>{submissionStats.submitted}</Text>
                            <Text style={styles.statLabel}>Submitted</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: tokens.colors.warning.light }]}>
                            <Text style={styles.statValue}>{submissionStats.pending}</Text>
                            <Text style={styles.statLabel}>Pending</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: tokens.colors.accent.light }]}>
                            <Text style={styles.statValue}>{submissionStats.avgScore.toFixed(0)}</Text>
                            <Text style={styles.statLabel}>Avg Score</Text>
                        </View>
                    </View>

                    <RNTextInput
                        placeholder="Search students..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={styles.searchInput}
                        placeholderTextColor={getTextSecondaryColor()}
                    />

                    <Stack spacing="md">
                        {submissions.filter(s => 
                            !searchQuery || 
                            s.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.enrollment_number?.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((item) => (
                            <Card 
                                key={item.id} 
                                variant="elevated" 
                                style={styles.card}
                                onPress={() => {
                                    setGradingSubmission(item);
                                    setScore(item.score ? item.score.toString() : '');
                                    setRemarks(item.remarks || '');
                                }}
                            >
                                <View style={styles.assignmentHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.assignmentTitle}>{item.student_name}</Text>
                                        <Text style={styles.assignmentSubtext}>Enrollment: {item.enrollment_number}</Text>
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: item.status === 'graded' ? tokens.colors.success.light : tokens.colors.warning.light }
                                    ]}>
                                        <Text style={[
                                            styles.statusText,
                                            { color: item.status === 'graded' ? tokens.colors.success.main : tokens.colors.warning.main }
                                        ]}>
                                            {item.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                                {item.score !== null && (
                                    <Text style={{ fontWeight: 'bold', color: tokens.colors.success.main, marginTop: tokens.spacing.sm }}>
                                        Score: {item.score}/{selectedAssignment.max_score}
                                    </Text>
                                )}
                            </Card>
                        ))}
                        {submissions.length === 0 && (
                            <Text style={styles.emptyText}>No submissions yet</Text>
                        )}
                    </Stack>
                </View>
            );
        }

        return (
            <View>
                <View style={styles.headerRow}>
                    <Text style={styles.title}>Assignments</Text>
                    <Button 
                        variant="primary"
                        onPress={() => setCreateModalVisible(true)}
                        icon={<Ionicons name="add" size={20} color={tokens.colors.neutral.white} />}
                    >
                        Create
                    </Button>
                </View>

                <View style={styles.tabs}>
                    <Button
                        variant={tab === 'all' ? 'primary' : 'secondary'}
                        size="small"
                        onPress={() => setTab('all')}
                        style={styles.tabButton}
                    >
                        All
                    </Button>
                    <Button
                        variant={tab === 'pending' ? 'primary' : 'secondary'}
                        size="small"
                        onPress={() => setTab('pending')}
                        style={styles.tabButton}
                    >
                        Pending
                    </Button>
                    <Button
                        variant={tab === 'graded' ? 'primary' : 'secondary'}
                        size="small"
                        onPress={() => setTab('graded')}
                        style={styles.tabButton}
                    >
                        Graded
                    </Button>
                </View>

                <RNTextInput
                    placeholder="Search assignments..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={styles.searchInput}
                    placeholderTextColor={getTextSecondaryColor()}
                />

                <Stack spacing="md">
                    {filteredAssignments.map((item) => (
                        <Card key={item.id} variant="elevated" style={styles.card} onPress={() => setSelectedAssignment(item)}>
                            <View style={styles.assignmentHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.assignmentTitle}>{item.title}</Text>
                                    <Text style={styles.assignmentSubtext}>
                                        {item.subjects?.name} ({item.subjects?.classes?.name})
                                    </Text>
                                    <Text style={[styles.assignmentSubtext, { marginTop: tokens.spacing.xs }]}>
                                        Due: {new Date(item.due_date).toLocaleDateString()}
                                    </Text>
                                </View>
                                <View style={styles.assignmentActions}>
                                    <TouchableOpacity 
                                        onPress={() => {
                                            setEditingAssignment(item);
                                            setEditModalVisible(true);
                                        }}
                                    >
                                        <Ionicons name="pencil" size={20} color={tokens.colors.primary.main} />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={() => {
                                            setAssignmentToDelete(item);
                                            setDeleteConfirmVisible(true);
                                        }}
                                    >
                                        <Ionicons name="trash" size={20} color={tokens.colors.error.main} />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </Card>
                    ))}
                    {filteredAssignments.length === 0 && (
                        <Text style={styles.emptyText}>No assignments found</Text>
                    )}
                </Stack>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="always"
                showsVerticalScrollIndicator={false}
            >
                {renderAssignmentList()}
            </ScrollView>

            {/* Create Assignment Modal */}
            <Portal>
                <Modal 
                    visible={createModalVisible} 
                    onDismiss={() => setCreateModalVisible(false)} 
                    contentContainerStyle={styles.modal}
                >
                    <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>Create New Assignment</Text>

                        <SelectPicker
                            label="Select Subject *"
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

                        <Input
                            label="Title *"
                            value={title}
                            onChangeText={setTitle}
                        />
                        <Input
                            label="Description"
                            value={description}
                            onChangeText={setDescription}
                        />
                        <Input
                            label="Max Score *"
                            value={maxScore}
                            onChangeText={setMaxScore}
                        />
                        <Input
                            label="Due Date (YYYY-MM-DD)"
                            value={dueDate}
                            onChangeText={setDueDate}
                        />

                        <View style={styles.modalActions}>
                            <Button variant="ghost" onPress={() => setCreateModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onPress={handleCreateAssignment} loading={createLoading}>
                                Create
                            </Button>
                        </View>
                    </ScrollView>
                </Modal>

                {/* Edit Assignment Modal */}
                <Modal 
                    visible={editModalVisible} 
                    onDismiss={() => setEditModalVisible(false)} 
                    contentContainerStyle={styles.modal}
                >
                    <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalTitle}>Edit Assignment</Text>

                        <Input
                            label="Title"
                            value={editingAssignment?.title || ''}
                            onChangeText={(text) => setEditingAssignment({ ...editingAssignment, title: text })}
                        />
                        <Input
                            label="Description"
                            value={editingAssignment?.description || ''}
                            onChangeText={(text) => setEditingAssignment({ ...editingAssignment, description: text })}
                        />
                        <Input
                            label="Max Score"
                            value={editingAssignment?.max_score?.toString() || ''}
                            onChangeText={(text) => setEditingAssignment({ ...editingAssignment, max_score: text })}
                        />

                        <View style={styles.modalActions}>
                            <Button variant="ghost" onPress={() => setEditModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button variant="primary" onPress={handleUpdateAssignment} loading={createLoading}>
                                Update
                            </Button>
                        </View>
                    </ScrollView>
                </Modal>

                {/* Grade Submission Modal */}
                <Modal 
                    visible={!!gradingSubmission} 
                    onDismiss={() => setGradingSubmission(null)} 
                    contentContainerStyle={styles.modal}
                >
                    <Text style={styles.modalTitle}>Grade Submission</Text>
                    <Text style={{ marginBottom: tokens.spacing.md, color: getTextColor() }}>
                        Student: {gradingSubmission?.student_name}
                    </Text>

                    <Input
                        label="Score"
                        value={score}
                        onChangeText={setScore}
                    />
                    <Input
                        label="Remarks"
                        value={remarks}
                        onChangeText={setRemarks}
                    />

                    <View style={styles.modalActions}>
                        <Button variant="ghost" onPress={() => setGradingSubmission(null)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onPress={handleGrade} loading={gradeLoading}>
                            Submit Grade
                        </Button>
                    </View>
                </Modal>
            </Portal>

            <ConfirmDialog
                visible={deleteConfirmVisible}
                title="Delete Assignment"
                message={`Are you sure you want to delete "${assignmentToDelete?.title}"? This action cannot be undone.`}
                onConfirm={handleDeleteAssignment}
                onCancel={() => setDeleteConfirmVisible(false)}
            />
        </View>
    );
}
