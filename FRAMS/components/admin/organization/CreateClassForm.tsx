import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Input from '../../design-system/primitives/Input';
import Button from '../../design-system/primitives/Button';
import { useTheme } from '../../../lib/design-system/ThemeContext';
import { ClassItem } from '../../../lib/organization';

interface CreateClassFormProps {
    onSubmit: (name: string, value: string) => void;
    onCancel: () => void;
    loading: boolean;
    initialValues?: ClassItem;
}

export default function CreateClassForm({ onSubmit, onCancel, loading, initialValues }: CreateClassFormProps) {
    const { tokens, getTextSecondaryColor } = useTheme();
    const [name, setName] = useState(initialValues?.name || '');
    const [value, setValue] = useState(initialValues?.value || '');
    const [errors, setErrors] = useState<{ name?: string; value?: string }>({});

    useEffect(() => {
        if (initialValues) {
            setName(initialValues.name);
            setValue(initialValues.value);
        }
    }, [initialValues]);

    const validate = () => {
        const newErrors: { name?: string; value?: string } = {};
        if (!name.trim()) newErrors.name = 'Name is required';
        if (!value.trim()) newErrors.value = 'Value is required';
        else if (!/^[a-z0-9_]+$/.test(value)) newErrors.value = 'Value must be lowercase letters, numbers, and underscores only';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit(name, value);
        }
    };

    const handleNameChange = (text: string) => {
        setName(text);
        // Auto-generate value if creating a new class and value is empty or hasn't been manually edited
        if (!initialValues && (!value || value === name.toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, -1))) {
            // Simple auto-gen logic, can be improved or removed if desired
            setValue(text.toLowerCase().replace(/[^a-z0-9_]/g, '_'));
        }
    };

    return (
        <View>
            <Input
                label="Class Name *"
                value={name}
                onChangeText={handleNameChange}
                placeholder="e.g. First Year"
                error={errors.name}
            />
            <View style={{ marginBottom: 16 }}>
                <Input
                    label="Value Identifier *"
                    value={value}
                    onChangeText={setValue}
                    placeholder="e.g. first_year"
                    autoCapitalize="none"
                    error={errors.value}
                    style={{ marginBottom: 4 }}
                />
                <Text style={{ fontSize: 12, color: getTextSecondaryColor(), marginLeft: 4 }}>
                    Unique identifier used in database (lowercase, numbers, _)
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
                    {initialValues ? 'Update Class' : 'Create Class'}
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
