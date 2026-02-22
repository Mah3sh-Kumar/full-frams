import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Input from '../../design-system/primitives/Input';
import Button from '../../design-system/primitives/Button';
import { useTheme } from '../../../lib/design-system/ThemeContext';
import { DepartmentItem } from '../../../lib/organization';

interface CreateDepartmentFormProps {
    onSubmit: (name: string, code: string) => void;
    onCancel: () => void;
    loading: boolean;
    initialValues?: DepartmentItem;
}

export default function CreateDepartmentForm({ onSubmit, onCancel, loading, initialValues }: CreateDepartmentFormProps) {
    const { tokens, getTextSecondaryColor } = useTheme();
    const [name, setName] = useState(initialValues?.name || '');
    const [code, setCode] = useState(initialValues?.code || '');
    const [errors, setErrors] = useState<{ name?: string; code?: string }>({});

    useEffect(() => {
        if (initialValues) {
            setName(initialValues.name);
            setCode(initialValues.code);
        }
    }, [initialValues]);

    const validate = () => {
        const newErrors: { name?: string; code?: string } = {};
        if (!name.trim()) newErrors.name = 'Department Name is required';
        if (!code.trim()) newErrors.code = 'Department Code is required';
        else if (!/^[a-z0-9_]+$/.test(code)) newErrors.code = 'Code must be lowercase letters, numbers, and underscores only';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit(name, code);
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
                label="Department Name *"
                value={name}
                onChangeText={handleNameChange}
                placeholder="e.g. Engineering"
                error={errors.name}
            />
            <View style={{ marginBottom: 16 }}>
                <Input
                    label="Department Code *"
                    value={code}
                    onChangeText={setCode}
                    placeholder="e.g. eng"
                    autoCapitalize="none"
                    error={errors.code}
                    style={{ marginBottom: 4 }}
                />
                <Text style={{ fontSize: 12, color: getTextSecondaryColor(), marginLeft: 4 }}>
                    Unique identifier (lowercase, numbers, _)
                </Text>
            </View>

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
                    {initialValues ? 'Update Department' : 'Create Department'}
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
