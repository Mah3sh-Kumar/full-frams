import React from 'react';
import { StyleSheet } from 'react-native';
import { Portal, Dialog, Button, Text, Paragraph } from 'react-native-paper';
import { useTheme } from '../lib/design-system/ThemeContext';

interface ConfirmDialogProps {
    visible: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
}

export default function ConfirmDialog({
    visible,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    destructive = false,
}: ConfirmDialogProps) {
    const { tokens } = useTheme();

    const styles = StyleSheet.create({
        dialog: {
            borderRadius: tokens.borders.radius.large,
        },
        title: {
            fontSize: tokens.typography.h3.fontSize,
            fontWeight: tokens.typography.h3.fontWeight,
        },
        content: {
            fontSize: tokens.typography.body.fontSize,
            lineHeight: tokens.typography.body.lineHeight,
        },
    });

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onCancel} style={styles.dialog}>
                <Dialog.Title style={styles.title}>{title}</Dialog.Title>
                <Dialog.Content>
                    <Paragraph style={styles.content}>{message}</Paragraph>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={onCancel}>{cancelText}</Button>
                    <Button
                        onPress={onConfirm}
                        textColor={destructive ? tokens.colors.error.main : tokens.colors.primary.main}
                    >
                        {confirmText}
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
}
