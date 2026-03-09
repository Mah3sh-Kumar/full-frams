import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../lib/design-system/ThemeContext';
import Button from '../design-system/primitives/Button';
import AssignmentSubmissionModal from './AssignmentSubmissionModal';

type Assignment = {
    id: string;
    assignment_id: string;
    status: 'pending' | 'submitted' | 'graded';
    score: number | null;
    remarks: string | null;
    teacher_remarks: string | null;
    submission_url: string | null;
    created_at: string;
    assignments: {
        title: string;
        description: string;
        due_date: string;
        max_score: number;
        attachment_url: string | null;
        subjects: {
            name: string;
        } | null;
    } | null;
};

interface AssignmentDetailModalProps {
    visible: boolean;
    assignment: Assignment | null;
    studentId: string;
    onClose: () => void;
    onSubmit: () => void;
    onRefresh: () => void;
}

export default function AssignmentDetailModal({ 
    visible, 
    assignment,
    studentId,
    onClose, 
    onSubmit,
    onRefresh
}: AssignmentDetailModalProps) {
    const { tokens, getTextColor, getSurfaceColor, getBackgroundColor, getTextSecondaryColor } = useTheme();
    const [submissionModalVisible, setSubmissionModalVisible] = useState(false);

    if (!assignment || !assignment.assignments) return null;

    const assignmentData = assignment.assignments;
    const hasAttachment = !!assignmentData.attachment_url;
    const isPending = assignment.status === 'pending';
    const isGraded = assignment.status === 'graded';

    const handleOpenAttachment = async () => {
        if (!assignmentData.attachment_url) return;
        
        try {
            let fileUrl = assignmentData.attachment_url;
            
            // If the URL is just a path (not a full URL), construct the full Supabase storage URL
            if (!fileUrl.startsWith('http')) {
                // Get the Supabase URL from environment
                const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
                if (supabaseUrl) {
                    fileUrl = `${supabaseUrl}/storage/v1/object/authenticated/assignment-attachments/${fileUrl}`;
                }
            }
            
            const supported = await Linking.canOpenURL(fileUrl);
            if (supported) {
                await Linking.openURL(fileUrl);
            } else {
                Alert.alert(
                    'Cannot Open File',
                    'Unable to open this file type on your device.',
                    [{ text: 'OK' }]
                );
            }
        } catch (error: any) {
            console.error('Error opening attachment:', error);
            console.error('Attachment URL:', assignmentData.attachment_url);
            
            // Check if it's a storage bucket error
            if (error?.message?.includes('Bucket not found') || error?.message?.includes('404')) {
                Alert.alert(
                    'File Not Found',
                    'The attachment file could not be found. It may have been deleted or moved.',
                    [{ text: 'OK' }]
                );
            } else {
                Alert.alert(
                    'Error',
                    'Failed to open attachment. Please try again later.',
                    [{ text: 'OK' }]
                );
            }
        }
    };

    const handleOpenSubmission = () => {
        setSubmissionModalVisible(true);
    };

    const handleCloseSubmission = () => {
        setSubmissionModalVisible(false);
    };

    const handleSubmissionSuccess = () => {
        onRefresh();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric',
            month: 'long', 
            day: 'numeric' 
        });
    };

    const getStatusColor = () => {
        switch (assignment.status) {
            case 'pending': return tokens.colors.warning.main;
            case 'submitted': return tokens.colors.info.main;
            case 'graded': return tokens.colors.success.main;
            default: return tokens.colors.neutral.gray600;
        }
    };

    const styles = StyleSheet.create({
        overlay: {
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: tokens.spacing.md,
        },
        modalContainer: {
            backgroundColor: getSurfaceColor(),
            borderRadius: 20,
            width: '100%',
            maxWidth: 480,
            maxHeight: '90%',
            overflow: 'hidden',
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
        },
        header: {
            backgroundColor: tokens.colors.roles.student.main,
            padding: tokens.spacing.lg,
            paddingTop: tokens.spacing.md,
        },
        closeButton: {
            position: 'absolute',
            top: tokens.spacing.sm,
            right: tokens.spacing.sm,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
        },
        title: {
            fontSize: 20,
            fontWeight: '700',
            color: '#FFFFFF',
            marginBottom: tokens.spacing.xs,
            paddingRight: 36,
            lineHeight: 26,
        },
        subjectBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            paddingVertical: 4,
            paddingHorizontal: tokens.spacing.sm,
            borderRadius: 16,
            alignSelf: 'flex-start',
            gap: 6,
        },
        subjectText: {
            fontSize: 12,
            fontWeight: '600',
            color: '#FFFFFF',
        },
        content: {
            padding: tokens.spacing.lg,
        },
        section: {
            marginBottom: tokens.spacing.lg,
        },
        sectionTitle: {
            fontSize: 11,
            fontWeight: '700',
            color: getTextSecondaryColor(),
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: tokens.spacing.sm,
        },
        description: {
            fontSize: 14,
            fontWeight: '400',
            color: getTextColor(),
            lineHeight: 20,
        },
        infoRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: tokens.spacing.sm,
            gap: tokens.spacing.sm,
        },
        infoIconContainer: {
            width: 36,
            height: 36,
            borderRadius: 10,
            justifyContent: 'center',
            alignItems: 'center',
        },
        infoContent: {
            flex: 1,
        },
        infoLabel: {
            fontSize: 11,
            fontWeight: '500',
            color: getTextSecondaryColor(),
            marginBottom: 2,
        },
        infoValue: {
            fontSize: 14,
            fontWeight: '600',
            color: getTextColor(),
        },
        statusBadge: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: tokens.spacing.sm,
            borderRadius: 16,
            gap: 6,
            alignSelf: 'flex-start',
        },
        statusText: {
            fontSize: 12,
            fontWeight: '700',
            letterSpacing: 0.5,
        },
        attachmentCard: {
            backgroundColor: `${tokens.colors.roles.student.main}08`,
            borderRadius: 14,
            padding: tokens.spacing.md,
            borderWidth: 1,
            borderColor: `${tokens.colors.roles.student.main}20`,
        },
        attachmentHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.spacing.sm,
        },
        attachmentIconContainer: {
            width: 42,
            height: 42,
            borderRadius: 10,
            backgroundColor: `${tokens.colors.roles.student.main}15`,
            justifyContent: 'center',
            alignItems: 'center',
        },
        attachmentTitle: {
            fontSize: 13,
            fontWeight: '600',
            color: getTextColor(),
            marginBottom: 2,
        },
        attachmentSubtitle: {
            fontSize: 11,
            fontWeight: '400',
            color: getTextSecondaryColor(),
        },
        scoreCard: {
            backgroundColor: `${tokens.colors.success.main}12`,
            borderRadius: 14,
            padding: tokens.spacing.md,
            borderWidth: 1.5,
            borderColor: tokens.colors.success.main,
        },
        scoreRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: tokens.spacing.xs,
        },
        scoreLabel: {
            fontSize: 13,
            fontWeight: '600',
            color: getTextColor(),
        },
        scoreValue: {
            fontSize: 24,
            fontWeight: '700',
            color: tokens.colors.success.main,
        },
        remarksText: {
            fontSize: 12,
            fontWeight: '400',
            color: getTextSecondaryColor(),
            fontStyle: 'italic',
            marginTop: tokens.spacing.xs,
        },
        footer: {
            padding: tokens.spacing.md,
            paddingTop: tokens.spacing.sm,
            borderTopWidth: 1,
            borderTopColor: `${getTextSecondaryColor()}15`,
            gap: tokens.spacing.xs,
        },
        divider: {
            height: 1,
            backgroundColor: `${getTextSecondaryColor()}15`,
            marginVertical: tokens.spacing.lg,
        },
    });

    return (
        <>
            <AssignmentSubmissionModal
                visible={submissionModalVisible}
                assignmentId={assignment.assignment_id}
                assignmentTitle={assignmentData.title}
                studentId={studentId}
                onClose={handleCloseSubmission}
                onSuccess={handleSubmissionSuccess}
            />
            
            <Modal
                visible={visible}
                transparent
                animationType="fade"
                onRequestClose={onClose}
            >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity 
                            style={styles.closeButton} 
                            onPress={onClose}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="close" size={20} color="#FFFFFF" />
                        </TouchableOpacity>
                        
                        <Text style={styles.title}>{assignmentData.title}</Text>
                        
                        <View style={styles.subjectBadge}>
                            <Ionicons name="book" size={14} color="#FFFFFF" />
                            <Text style={styles.subjectText}>
                                {assignmentData.subjects?.name || 'Unknown Subject'}
                            </Text>
                        </View>
                    </View>

                    {/* Content */}
                    <ScrollView 
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Description */}
                        {assignmentData.description && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Description</Text>
                                <Text style={styles.description}>
                                    {assignmentData.description}
                                </Text>
                            </View>
                        )}

                        {/* Assignment Info */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Assignment Details</Text>
                            
                            <View style={styles.infoRow}>
                                <View style={[styles.infoIconContainer, { backgroundColor: `${tokens.colors.info.main}15` }]}>
                                    <Ionicons name="calendar" size={20} color={tokens.colors.info.main} />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Due Date</Text>
                                    <Text style={styles.infoValue}>{formatDate(assignmentData.due_date)}</Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <View style={[styles.infoIconContainer, { backgroundColor: `${tokens.colors.warning.main}15` }]}>
                                    <Ionicons name="star" size={20} color={tokens.colors.warning.main} />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Maximum Score</Text>
                                    <Text style={styles.infoValue}>{assignmentData.max_score} points</Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <View style={[styles.infoIconContainer, { backgroundColor: `${getStatusColor()}15` }]}>
                                    <Ionicons 
                                        name={
                                            assignment.status === 'pending' ? 'time' :
                                            assignment.status === 'submitted' ? 'document-text' :
                                            'checkmark-circle'
                                        } 
                                        size={20} 
                                        color={getStatusColor()} 
                                    />
                                </View>
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Status</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor()}20` }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor() }]}>
                                            {assignment.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Attachment */}
                        {hasAttachment && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Attachment</Text>
                                <TouchableOpacity 
                                    style={styles.attachmentCard}
                                    onPress={handleOpenAttachment}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.attachmentHeader}>
                                        <View style={styles.attachmentIconContainer}>
                                            <Ionicons name="document-attach" size={22} color={tokens.colors.roles.student.main} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.attachmentTitle}>View Assignment File</Text>
                                            <Text style={styles.attachmentSubtitle}>Tap to open attachment</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={18} color={tokens.colors.roles.student.main} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* Score (if graded) */}
                        {isGraded && assignment.score !== null && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Your Score</Text>
                                <View style={styles.scoreCard}>
                                    <View style={styles.scoreRow}>
                                        <Text style={styles.scoreLabel}>Score</Text>
                                        <Text style={styles.scoreValue}>
                                            {assignment.score}/{assignmentData.max_score}
                                        </Text>
                                    </View>
                                    {assignment.teacher_remarks && (
                                        <>
                                            <Text style={[styles.sectionTitle, { marginTop: tokens.spacing.md, marginBottom: tokens.spacing.xs }]}>
                                                Teacher's Feedback
                                            </Text>
                                            <Text style={styles.remarksText}>
                                                "{assignment.teacher_remarks}"
                                            </Text>
                                        </>
                                    )}
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Footer Actions */}
                    <View style={styles.footer}>
                        {isPending && (
                            <Button
                                variant="primary"
                                size="medium"
                                onPress={handleOpenSubmission}
                            >
                                Submit Assignment
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            size="medium"
                            onPress={onClose}
                        >
                            Close
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
        </>
    );
}
