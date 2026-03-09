import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView, Text, TouchableOpacity, TextInput as RNTextInput, Linking } from 'react-native';
import { Menu, Portal, Modal } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../lib/design-system/ThemeContext';
import { supabase } from '../../lib/supabase';
import { fetchTeacherSubjects, fetchTeacherAssignments, fetchAssignmentSubmissions, gradeSubmission } from '../../lib/database';
import { pickDocument, uploadAssignmentFile, deleteAssignmentFile, formatFileSize, getFileIcon } from '../../lib/fileUpload';
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
    const { tokens, getTextColor, getTextSecondaryColor, getSurfaceColor, getBorderColor } = useTheme();
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
    
    // File upload state
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [editingFile, setEditingFile] = useState<any>(null);
    const [replaceFileConfirmVisible, setReplaceFileConfirmVisible] = useState(false);

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
        
        try {
            // Create assignment first
            const { data: newAssignment, error: insertError } = await supabase
                .from('assignments')
                .insert({
                    subject_id: selectedSubject.id,
                    title,
                    description,
                    due_date: dueDateValue,
                    max_score: parseFloat(maxScore),
                })
                .select()
                .single();

            if (insertError) {
                Alert.alert('Error', insertError.message);
                setCreateLoading(false);
                return;
            }

            // Upload file if selected
            if (selectedFile && newAssignment) {
                setUploadingFile(true);
                const { data: uploadData, error: uploadError } = await uploadAssignmentFile(
                    selectedFile,
                    newAssignment.id
                );

                if (uploadError) {
                    Alert.alert('Warning', `Assignment created but file upload failed: ${uploadError}`);
                } else if (uploadData) {
                    // Update assignment with file info
                    await supabase
                        .from('assignments')
                        .update({
                            attachment_url: uploadData.url,
                            attachment_name: uploadData.name,
                            attachment_type: uploadData.type,
                            attachment_size: uploadData.size,
                        })
                        .eq('id', newAssignment.id);
                }
                setUploadingFile(false);
            }

            Alert.alert('Success', 'Assignment created successfully!');
            setTitle('');
            setDescription('');
            setMaxScore('100');
            setDueDate('');
            setSelectedSubject(null);
            setSelectedFile(null);
            setCreateModalVisible(false);
            loadAssignments();
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to create assignment');
        }
        
        setCreateLoading(false);
    }

    async function handlePickFile() {
        const { data, error } = await pickDocument();
        if (error) {
            Alert.alert('Error', error);
        } else if (data) {
            setSelectedFile(data);
        }
    }

    function handleRemoveFile() {
        setSelectedFile(null);
    }

    async function handleOpenFile(url: string, fileName: string) {
        try {
            const canOpen = await Linking.canOpenURL(url);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                Alert.alert('Error', 'Cannot open file');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to open file');
        }
    }

    async function handleUpdateAssignment() {
        if (!editingAssignment) return;

        setCreateLoading(true);
        
        try {
            // Handle file upload/replacement if a new file is selected
            if (editingFile) {
                setUploadingFile(true);
                
                // Delete old file if exists
                if (editingAssignment.attachment_url) {
                    const oldPath = editingAssignment.attachment_url.split('/').slice(-2).join('/');
                    await deleteAssignmentFile(oldPath);
                }
                
                // Upload new file
                const { data: uploadData, error: uploadError } = await uploadAssignmentFile(
                    editingFile,
                    editingAssignment.id
                );

                if (uploadError) {
                    Alert.alert('Warning', `Assignment updated but file upload failed: ${uploadError}`);
                } else if (uploadData) {
                    // Update with new file info
                    editingAssignment.attachment_url = uploadData.url;
                    editingAssignment.attachment_name = uploadData.name;
                    editingAssignment.attachment_type = uploadData.type;
                    editingAssignment.attachment_size = uploadData.size;
                }
                setUploadingFile(false);
            }

            // Update assignment
            const { error } = await supabase
                .from('assignments')
                .update({
                    title: editingAssignment.title,
                    description: editingAssignment.description,
                    max_score: parseFloat(editingAssignment.max_score),
                    due_date: editingAssignment.due_date,
                    attachment_url: editingAssignment.attachment_url,
                    attachment_name: editingAssignment.attachment_name,
                    attachment_type: editingAssignment.attachment_type,
                    attachment_size: editingAssignment.attachment_size,
                })
                .eq('id', editingAssignment.id);

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                Alert.alert('Success', 'Assignment updated successfully!');
                setEditModalVisible(false);
                setEditingAssignment(null);
                setEditingFile(null);
                loadAssignments();
            }
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to update assignment');
        }
        
        setCreateLoading(false);
    }

    async function handlePickEditFile() {
        const { data, error } = await pickDocument();
        if (error) {
            Alert.alert('Error', error);
        } else if (data) {
            // If assignment already has a file, ask to replace
            if (editingAssignment?.attachment_url) {
                Alert.alert(
                    'Replace File?',
                    `This will replace the existing file "${editingAssignment.attachment_name}". Continue?`,
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                            text: 'Replace', 
                            style: 'destructive',
                            onPress: () => setEditingFile(data)
                        }
                    ]
                );
            } else {
                setEditingFile(data);
            }
        }
    }

    function handleRemoveEditFile() {
        setEditingFile(null);
    }

    async function handleRemoveExistingFile() {
        if (!editingAssignment) return;
        
        Alert.alert(
            'Remove File?',
            'This will permanently remove the attached file from this assignment. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Remove',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            // Delete from storage
                            if (editingAssignment.attachment_url) {
                                const filePath = editingAssignment.attachment_url.split('/').slice(-2).join('/');
                                await deleteAssignmentFile(filePath);
                            }
                            
                            // Update assignment to remove file info
                            setEditingAssignment({
                                ...editingAssignment,
                                attachment_url: null,
                                attachment_name: null,
                                attachment_type: null,
                                attachment_size: null,
                            });
                            
                            Alert.alert('Success', 'File removed');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to remove file');
                        }
                    }
                }
            ]
        );
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
            textAlign: 'left',
            writingDirection: 'ltr',
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
            gap: 8,
            alignItems: 'center',
        },
        actionButton: {
            width: 36,
            height: 36,
            borderRadius: 18,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
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
        label: {
            fontSize: 14,
            fontWeight: '600',
        },
        helperText: {
            fontSize: 12,
            lineHeight: 18,
        },
        filePreview: {
            borderRadius: tokens.borders.radius.medium,
            borderWidth: 1,
            padding: tokens.spacing.md,
        },
        fileInfo: {
            flexDirection: 'row',
            alignItems: 'center',
        },
        fileName: {
            fontSize: 15,
            fontWeight: '500',
            marginBottom: 4,
        },
        fileSize: {
            fontSize: 12,
        },
        attachmentBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: tokens.colors.info.light,
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 6,
            marginTop: 8,
        },
        attachmentText: {
            fontSize: 12,
            color: tokens.colors.info.main,
            marginLeft: 4,
            fontWeight: '500',
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
                                    {item.attachment_url && (
                                        <TouchableOpacity 
                                            style={styles.attachmentBadge}
                                            onPress={() => handleOpenFile(item.attachment_url, item.attachment_name)}
                                        >
                                            <Ionicons name={getFileIcon(item.attachment_type)} size={14} color={tokens.colors.info.main} />
                                            <Text style={styles.attachmentText} numberOfLines={1}>
                                                {item.attachment_name}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                                <View style={styles.assignmentActions}>
                                    <TouchableOpacity 
                                        style={[styles.actionButton, { backgroundColor: '#e0e7ff' }]}
                                        onPress={() => {
                                            setEditingAssignment(item);
                                            setEditModalVisible(true);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="pencil" size={18} color={tokens.colors.primary.main} />
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        style={[styles.actionButton, { backgroundColor: '#fee2e2' }]}
                                        onPress={() => {
                                            setAssignmentToDelete(item);
                                            setDeleteConfirmVisible(true);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="trash" size={18} color={tokens.colors.error.main} />
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

                        {/* File Upload Section */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={[styles.label, { color: getTextColor(), marginBottom: 8 }]}>
                                Attachment (Optional)
                            </Text>
                            <Text style={[styles.helperText, { color: getTextSecondaryColor(), marginBottom: 12 }]}>
                                Upload PDF or Word document (Max 10MB)
                            </Text>
                            
                            {selectedFile ? (
                                <View style={[styles.filePreview, { backgroundColor: tokens.colors.primary.light, borderColor: tokens.colors.primary.main }]}>
                                    <View style={styles.fileInfo}>
                                        <Ionicons name={getFileIcon(selectedFile.mimeType)} size={24} color={tokens.colors.primary.main} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={[styles.fileName, { color: getTextColor() }]} numberOfLines={1}>
                                                {selectedFile.name}
                                            </Text>
                                            <Text style={[styles.fileSize, { color: getTextSecondaryColor() }]}>
                                                {formatFileSize(selectedFile.size || 0)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={handleRemoveFile}>
                                            <Ionicons name="close-circle" size={24} color={tokens.colors.error.main} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : (
                                <Button 
                                    variant="secondary" 
                                    onPress={handlePickFile}
                                    icon={<Ionicons name="attach" size={20} color={tokens.colors.primary.main} />}
                                >
                                    Choose File
                                </Button>
                            )}
                        </View>

                        <View style={styles.modalActions}>
                            <Button variant="ghost" onPress={() => {
                                setCreateModalVisible(false);
                                setSelectedFile(null);
                            }}>
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                onPress={handleCreateAssignment} 
                                loading={createLoading || uploadingFile}
                            >
                                {uploadingFile ? 'Uploading...' : 'Create'}
                            </Button>
                        </View>
                    </ScrollView>
                </Modal>

                {/* Edit Assignment Modal */}
                <Modal 
                    visible={editModalVisible} 
                    onDismiss={() => {
                        setEditModalVisible(false);
                        setEditingFile(null);
                    }} 
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

                        {/* File Upload/Management Section */}
                        <View style={{ marginBottom: 16 }}>
                            <Text style={[styles.label, { color: getTextColor(), marginBottom: 8 }]}>
                                Attachment
                            </Text>
                            
                            {/* Show existing file */}
                            {editingAssignment?.attachment_url && !editingFile && (
                                <View style={[styles.filePreview, { backgroundColor: tokens.colors.info.light, borderColor: tokens.colors.info.main }]}>
                                    <View style={styles.fileInfo}>
                                        <Ionicons name={getFileIcon(editingAssignment.attachment_type)} size={24} color={tokens.colors.info.main} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={[styles.fileName, { color: getTextColor() }]} numberOfLines={1}>
                                                {editingAssignment.attachment_name}
                                            </Text>
                                            <Text style={[styles.fileSize, { color: getTextSecondaryColor() }]}>
                                                {formatFileSize(editingAssignment.attachment_size || 0)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity 
                                            onPress={() => handleOpenFile(editingAssignment.attachment_url, editingAssignment.attachment_name)}
                                            style={{ marginRight: 12 }}
                                        >
                                            <Ionicons name="eye" size={24} color={tokens.colors.info.main} />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={handleRemoveExistingFile}>
                                            <Ionicons name="trash" size={24} color={tokens.colors.error.main} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                            
                            {/* Show new file to upload */}
                            {editingFile && (
                                <View style={[styles.filePreview, { backgroundColor: tokens.colors.success.light, borderColor: tokens.colors.success.main }]}>
                                    <View style={styles.fileInfo}>
                                        <Ionicons name={getFileIcon(editingFile.mimeType)} size={24} color={tokens.colors.success.main} />
                                        <View style={{ flex: 1, marginLeft: 12 }}>
                                            <Text style={[styles.fileName, { color: getTextColor() }]} numberOfLines={1}>
                                                {editingFile.name}
                                            </Text>
                                            <Text style={[styles.fileSize, { color: getTextSecondaryColor() }]}>
                                                {formatFileSize(editingFile.size || 0)} • New file
                                            </Text>
                                        </View>
                                        <TouchableOpacity onPress={handleRemoveEditFile}>
                                            <Ionicons name="close-circle" size={24} color={tokens.colors.error.main} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                            
                            {/* Upload button */}
                            {!editingFile && (
                                <Button 
                                    variant="secondary" 
                                    onPress={handlePickEditFile}
                                    icon={<Ionicons name="attach" size={20} color={tokens.colors.primary.main} />}
                                >
                                    {editingAssignment?.attachment_url ? 'Replace File' : 'Add File'}
                                </Button>
                            )}
                        </View>

                        <View style={styles.modalActions}>
                            <Button variant="ghost" onPress={() => {
                                setEditModalVisible(false);
                                setEditingFile(null);
                            }}>
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                onPress={handleUpdateAssignment} 
                                loading={createLoading || uploadingFile}
                            >
                                {uploadingFile ? 'Uploading...' : 'Update'}
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

                    {/* Submission Details */}
                    {gradingSubmission?.submission_url && (
                        <View style={{ 
                            marginBottom: tokens.spacing.md, 
                            padding: tokens.spacing.md,
                            backgroundColor: tokens.colors.info.light + '20',
                            borderRadius: tokens.borders.radius.medium,
                            borderWidth: 1,
                            borderColor: tokens.colors.info.main + '30'
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: tokens.spacing.sm }}>
                                <Ionicons name="document-attach" size={20} color={tokens.colors.info.main} />
                                <Text style={{ 
                                    marginLeft: tokens.spacing.sm, 
                                    fontWeight: '600',
                                    color: getTextColor() 
                                }}>
                                    Submitted File
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: tokens.spacing.sm,
                                    backgroundColor: getSurfaceColor(),
                                    borderRadius: tokens.borders.radius.small,
                                    marginBottom: tokens.spacing.sm
                                }}
                                onPress={async () => {
                                    try {
                                        const supported = await Linking.canOpenURL(gradingSubmission.submission_url);
                                        if (supported) {
                                            await Linking.openURL(gradingSubmission.submission_url);
                                        } else {
                                            Alert.alert('Error', 'Cannot open this file type.');
                                        }
                                    } catch (error) {
                                        console.error('Error opening submission:', error);
                                        Alert.alert('Error', 'Failed to open submission file.');
                                    }
                                }}
                            >
                                <Ionicons name="open-outline" size={18} color={tokens.colors.primary.main} />
                                <Text style={{ 
                                    marginLeft: tokens.spacing.sm,
                                    color: tokens.colors.primary.main,
                                    fontWeight: '500',
                                    flex: 1
                                }}>
                                    View Submitted File
                                </Text>
                                <Ionicons name="chevron-forward" size={18} color={tokens.colors.primary.main} />
                            </TouchableOpacity>
                            
                            {gradingSubmission?.submitted_at && (
                                <Text style={{ fontSize: 12, color: getTextSecondaryColor() }}>
                                    Submitted: {new Date(gradingSubmission.submitted_at).toLocaleString()}
                                </Text>
                            )}
                        </View>
                    )}

                    {/* Student's Notes */}
                    {gradingSubmission?.remarks && gradingSubmission.status === 'submitted' && (
                        <View style={{ 
                            marginBottom: tokens.spacing.md,
                            padding: tokens.spacing.md,
                            backgroundColor: getSurfaceColor(),
                            borderRadius: tokens.borders.radius.medium,
                            borderWidth: 1,
                            borderColor: getBorderColor()
                        }}>
                            <Text style={{ 
                                fontWeight: '600', 
                                marginBottom: tokens.spacing.xs,
                                color: getTextColor()
                            }}>
                                Student's Notes:
                            </Text>
                            <Text style={{ color: getTextSecondaryColor(), fontStyle: 'italic' }}>
                                "{gradingSubmission.remarks}"
                            </Text>
                        </View>
                    )}

                    <Input
                        label="Score"
                        value={score}
                        onChangeText={setScore}
                        keyboardType="numeric"
                        placeholder={`Enter score (max: ${selectedAssignment?.max_score || 100})`}
                    />
                    <Input
                        label="Teacher's Remarks"
                        value={remarks}
                        onChangeText={setRemarks}
                        multiline
                        numberOfLines={3}
                        placeholder="Add feedback for the student..."
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
