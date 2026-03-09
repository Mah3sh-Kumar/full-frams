import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../../lib/design-system/ThemeContext';
import Button from '../design-system/primitives/Button';
import { supabase } from '../../lib/supabase';

interface AssignmentSubmissionModalProps {
    visible: boolean;
    assignmentId: string;
    assignmentTitle: string;
    studentId: string;
    onClose: () => void;
    onSuccess: () => void;
}

export default function AssignmentSubmissionModal({
    visible,
    assignmentId,
    assignmentTitle,
    studentId,
    onClose,
    onSuccess
}: AssignmentSubmissionModalProps) {
    const { tokens, getTextColor, getSurfaceColor, getTextSecondaryColor } = useTheme();
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [notes, setNotes] = useState('');
    const [uploading, setUploading] = useState(false);

    const handlePickDocument = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/msword',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.ms-excel',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'text/plain',
                    'image/*'
                ],
                copyToCacheDirectory: true,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setSelectedFile(result.assets[0]);
            }
        } catch (error) {
            console.error('Error picking document:', error);
            Alert.alert('Error', 'Failed to pick document. Please try again.');
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
    };

    const handleSubmit = async () => {
        if (!selectedFile) {
            Alert.alert('No File Selected', 'Please select a file to submit.');
            return;
        }

        setUploading(true);

        try {
            // Upload file to Supabase Storage
            const fileExt = selectedFile.name.split('.').pop();
            const fileName = `${assignmentId}/${studentId}_${Date.now()}.${fileExt}`;

            console.log('📤 [Submission] Starting upload:', fileName);
            console.log('📄 [Submission] File details:', {
                name: selectedFile.name,
                size: selectedFile.size,
                mimeType: selectedFile.mimeType,
                uri: selectedFile.uri
            });

            // Get auth session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('No active session. Please sign in again.');
            }

            console.log('🔐 [Submission] Session obtained');

            // Read file as blob
            const response = await fetch(selectedFile.uri);
            const blob = await response.blob();
            
            console.log('📦 [Submission] Blob created:', {
                size: blob.size,
                type: blob.type
            });

            // Use direct REST API call instead of SDK
            const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
            const uploadUrl = `${supabaseUrl}/storage/v1/object/student-submissions/${fileName}`;
            
            console.log('🔄 [Submission] Uploading to:', uploadUrl);

            const uploadResponse = await fetch(uploadUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': selectedFile.mimeType,
                    'x-upsert': 'false',
                },
                body: blob,
            });

            console.log('📡 [Submission] Upload response status:', uploadResponse.status);

            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('❌ [Submission] Upload failed:', errorText);
                throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
            }

            const uploadResult = await uploadResponse.json();
            console.log('✅ [Submission] File uploaded successfully:', uploadResult);

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
                .from('student-submissions')
                .getPublicUrl(fileName);

            console.log('📎 [Submission] Public URL:', publicUrl);

            // Create or update submission record
            const { error: dbError } = await supabase
                .from('student_assignments')
                .upsert({
                    student_id: studentId,
                    assignment_id: assignmentId,
                    status: 'submitted',
                    submission_url: publicUrl,
                    remarks: notes || null,
                    submitted_at: new Date().toISOString(),
                }, {
                    onConflict: 'student_id,assignment_id',
                    ignoreDuplicates: false
                });

            if (dbError) {
                console.error('❌ [Submission] Database error:', dbError);
                throw dbError;
            }

            console.log('✅ [Submission] Record created/updated in database');

            Alert.alert(
                'Success!',
                'Your assignment has been submitted successfully.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setSelectedFile(null);
                            setNotes('');
                            onSuccess();
                            onClose();
                        }
                    }
                ]
            );
        } catch (error: any) {
            console.error('❌ [Submission] Error:', error);
            
            let errorMessage = 'Failed to submit assignment. Please try again.';
            
            if (error.message?.includes('Network request failed')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (error.message?.includes('Bucket not found')) {
                errorMessage = 'Storage configuration error. Please contact support.';
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            Alert.alert(
                'Submission Failed',
                errorMessage,
                [{ text: 'OK' }]
            );
        } finally {
            setUploading(false);
        }
    };

    const getFileIcon = (mimeType: string) => {
        if (mimeType.includes('pdf')) return 'document-text';
        if (mimeType.includes('word')) return 'document';
        if (mimeType.includes('excel') || mimeType.includes('sheet')) return 'grid';
        if (mimeType.includes('image')) return 'image';
        return 'document-attach';
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getBorderColor = () => {
        return `${getTextSecondaryColor()}30`;
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
            maxHeight: '85%',
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
        subtitle: {
            fontSize: 13,
            fontWeight: '500',
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: 18,
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
        uploadArea: {
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: `${tokens.colors.roles.student.main}40`,
            borderRadius: 14,
            padding: tokens.spacing.xl,
            alignItems: 'center',
            backgroundColor: `${tokens.colors.roles.student.main}05`,
        },
        uploadIcon: {
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: `${tokens.colors.roles.student.main}15`,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: tokens.spacing.md,
        },
        uploadTitle: {
            fontSize: 15,
            fontWeight: '600',
            color: getTextColor(),
            marginBottom: tokens.spacing.xs,
        },
        uploadSubtitle: {
            fontSize: 12,
            fontWeight: '400',
            color: getTextSecondaryColor(),
            textAlign: 'center',
            lineHeight: 18,
        },
        fileCard: {
            backgroundColor: `${tokens.colors.success.main}10`,
            borderRadius: 14,
            padding: tokens.spacing.md,
            borderWidth: 1,
            borderColor: `${tokens.colors.success.main}30`,
        },
        fileHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: tokens.spacing.sm,
        },
        fileIconContainer: {
            width: 42,
            height: 42,
            borderRadius: 10,
            backgroundColor: `${tokens.colors.success.main}20`,
            justifyContent: 'center',
            alignItems: 'center',
        },
        fileInfo: {
            flex: 1,
        },
        fileName: {
            fontSize: 13,
            fontWeight: '600',
            color: getTextColor(),
            marginBottom: 2,
        },
        fileSize: {
            fontSize: 11,
            fontWeight: '400',
            color: getTextSecondaryColor(),
        },
        removeButton: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: `${tokens.colors.error.main}15`,
            justifyContent: 'center',
            alignItems: 'center',
        },
        notesInput: {
            backgroundColor: getSurfaceColor(),
            borderWidth: 1,
            borderColor: getBorderColor(),
            borderRadius: 12,
            padding: tokens.spacing.md,
            fontSize: 14,
            color: getTextColor(),
            minHeight: 100,
            textAlignVertical: 'top',
        },
        footer: {
            padding: tokens.spacing.md,
            paddingTop: tokens.spacing.sm,
            borderTopWidth: 1,
            borderTopColor: `${getTextSecondaryColor()}15`,
            gap: tokens.spacing.xs,
        },
        infoBox: {
            backgroundColor: `${tokens.colors.info.main}10`,
            borderRadius: 12,
            padding: tokens.spacing.md,
            flexDirection: 'row',
            gap: tokens.spacing.sm,
        },
        infoText: {
            flex: 1,
            fontSize: 12,
            fontWeight: '400',
            color: getTextSecondaryColor(),
            lineHeight: 18,
        },
    });

    return (
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

                        <Text style={styles.title}>Submit Assignment</Text>
                        <Text style={styles.subtitle}>{assignmentTitle}</Text>
                    </View>

                    {/* Content */}
                    <ScrollView
                        style={styles.content}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* File Upload Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Upload File</Text>

                            {!selectedFile ? (
                                <TouchableOpacity
                                    style={styles.uploadArea}
                                    onPress={handlePickDocument}
                                    activeOpacity={0.7}
                                >
                                    <View style={styles.uploadIcon}>
                                        <Ionicons
                                            name="cloud-upload"
                                            size={28}
                                            color={tokens.colors.roles.student.main}
                                        />
                                    </View>
                                    <Text style={styles.uploadTitle}>Choose File</Text>
                                    <Text style={styles.uploadSubtitle}>
                                        PDF, DOC, DOCX, XLS, XLSX, TXT, or Images{'\n'}
                                        Maximum file size: 10MB
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <View style={styles.fileCard}>
                                    <View style={styles.fileHeader}>
                                        <View style={styles.fileIconContainer}>
                                            <Ionicons
                                                name={getFileIcon(selectedFile.mimeType)}
                                                size={22}
                                                color={tokens.colors.success.main}
                                            />
                                        </View>
                                        <View style={styles.fileInfo}>
                                            <Text style={styles.fileName} numberOfLines={1}>
                                                {selectedFile.name}
                                            </Text>
                                            <Text style={styles.fileSize}>
                                                {formatFileSize(selectedFile.size)}
                                            </Text>
                                        </View>
                                        <TouchableOpacity
                                            style={styles.removeButton}
                                            onPress={handleRemoveFile}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name="trash"
                                                size={16}
                                                color={tokens.colors.error.main}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Notes Section */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Notes (Optional)</Text>
                            <TextInput
                                style={styles.notesInput}
                                placeholder="Add any notes or comments about your submission..."
                                placeholderTextColor={`${getTextSecondaryColor()}80`}
                                value={notes}
                                onChangeText={setNotes}
                                multiline
                                maxLength={500}
                            />
                        </View>

                        {/* Info Box */}
                        <View style={styles.infoBox}>
                            <Ionicons
                                name="information-circle"
                                size={20}
                                color={tokens.colors.info.main}
                            />
                            <Text style={styles.infoText}>
                                Once submitted, your teacher will review your work and provide feedback.
                            </Text>
                        </View>
                    </ScrollView>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Button
                            variant="primary"
                            size="medium"
                            onPress={handleSubmit}
                            loading={uploading}
                            disabled={!selectedFile || uploading}
                        >
                            {uploading ? 'Submitting...' : 'Submit Assignment'}
                        </Button>
                        <Button
                            variant="secondary"
                            size="medium"
                            onPress={onClose}
                            disabled={uploading}
                        >
                            Cancel
                        </Button>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
