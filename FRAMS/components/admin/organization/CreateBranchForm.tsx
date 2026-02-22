import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Input from '../../design-system/primitives/Input';
import Button from '../../design-system/primitives/Button';
import EnhancedPicker from '../../EnhancedPicker';
import { useTheme } from '../../../lib/design-system/ThemeContext';
import { BranchItem, ClassItem } from '../../../lib/organization';

interface CreateBranchFormProps {
    onSubmit: (name: string, code: string, classId: string | null) => void;
    onCancel: () => void;
    loading: boolean;
    classes: ClassItem[];
    initialValues?: BranchItem;
}

export default function CreateBranchForm({ onSubmit, onCancel, loading, classes, initialValues }: CreateBranchFormProps) {
    const { tokens, getTextSecondaryColor } = useTheme();
    const [name, setName] = useState(initialValues?.name || '');
    const [code, setCode] = useState(initialValues?.code || '');
    const [classId, setClassId] = useState<string>(initialValues?.class_id || '');
    const [errors, setErrors] = useState<{ name?: string; code?: string }>({});

    useEffect(() => {
        if (initialValues) {
            setName(initialValues.name);
            setCode(initialValues.code);
            setClassId(initialValues.class_id || '');
        }
    }, [initialValues]);

    const validate = () => {
        const newErrors: { name?: string; code?: string } = {};
        if (!name.trim()) newErrors.name = 'Branch Name is required';
        if (!code.trim()) newErrors.code = 'Branch Code is required';
        else if (!/^[a-z0-9_]+$/.test(code)) newErrors.code = 'Code must be lowercase letters, numbers, and underscores only';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit(name, code, classId || null);
        }
    };

    const handleNameChange = (text: string) => {
        setName(text);
        if (!initialValues && (!code || code === name.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, -1))) {
            setCode(text.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
        }
    };

    return (
        <View>
            <Input
                label="Branch Name *"
                value={name}
                onChangeText={handleNameChange}
                placeholder="e.g. Computer Science"
                error={errors.name}
            />
            <View style={{ marginBottom: 16 }}>
                <Input
                    label="Branch Code *"
                    value={code}
                    onChangeText={setCode}
                    placeholder="e.g. cse"
                    autoCapitalize="none"
                    error={errors.code}
                    style={{ marginBottom: 4 }}
                />
                <Text style={{ fontSize: 12, color: getTextSecondaryColor(), marginLeft: 4 }}>
                    Unique identifier (lowercase, numbers, _)
                </Text>
            </View>
            <EnhancedPicker
                label="Class (Optional)"
                value={classId}
                items={[
                    { label: 'Available for all classes', value: '' },
                    ...classes.map((c) => ({ label: c.name, value: c.id })),
                ]}
                onValueChange={setClassId}
                testID="branch-class-picker"
            />

            <View style={styles.actions}>
                <Button
                    variant="secondary"
                    onPress={onCancel}
                    style={{ flex: 1, marginRight: tokens.spacing.sm }}
                >
                    Cancel
                </Button>
                <Button
                    variant="primary"
                    onPress={handleSubmit}
                    loading={loading}
                    style={{ flex: 1 }}
                >
                    {initialValues ? 'Update Branch' : 'Create Branch'}
                </Button>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    actions: {
        flexDirection: 'row',
        marginTop: 24,
    },
});
