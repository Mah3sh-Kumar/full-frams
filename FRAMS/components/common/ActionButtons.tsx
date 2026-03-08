import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { tokens } from '../../lib/design-system/tokens';

interface ActionButtonProps {
  onPress: () => void;
  type: 'edit' | 'delete';
  accessibilityLabel?: string;
  accessibilityHint?: string;
  size?: number;
  style?: ViewStyle;
}

interface ActionButtonsGroupProps {
  onEdit?: () => void;
  onDelete?: () => void;
  editAccessibilityLabel?: string;
  editAccessibilityHint?: string;
  deleteAccessibilityLabel?: string;
  deleteAccessibilityHint?: string;
  style?: ViewStyle;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  onPress,
  type,
  accessibilityLabel,
  accessibilityHint,
  size = 20,
  style,
}) => {
  const isEdit = type === 'edit';
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.actionButton,
        {
          backgroundColor: isEdit ? '#e0e7ff' : '#fee2e2',
        },
        style,
      ]}
      activeOpacity={0.7}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <Ionicons
        name={isEdit ? 'pencil' : 'trash'}
        size={size}
        color={isEdit ? tokens.colors.primary.main : tokens.colors.error.main}
      />
    </TouchableOpacity>
  );
};

export const ActionButtonsGroup: React.FC<ActionButtonsGroupProps> = ({
  onEdit,
  onDelete,
  editAccessibilityLabel,
  editAccessibilityHint,
  deleteAccessibilityLabel,
  deleteAccessibilityHint,
  style,
}) => {
  return (
    <View style={[styles.actionButtonsGroup, style]}>
      {onEdit && (
        <ActionButton
          type="edit"
          onPress={onEdit}
          accessibilityLabel={editAccessibilityLabel}
          accessibilityHint={editAccessibilityHint}
        />
      )}
      {onDelete && (
        <ActionButton
          type="delete"
          onPress={onDelete}
          accessibilityLabel={deleteAccessibilityLabel}
          accessibilityHint={deleteAccessibilityHint}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  actionButtonsGroup: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
});
