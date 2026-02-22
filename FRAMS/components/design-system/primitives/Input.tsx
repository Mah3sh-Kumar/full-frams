/**
 * Input Component
 * 
 * A primitive input component with label, error support, focus states,
 * and icon support following the design system specifications.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
  TouchableWithoutFeedback,
} from 'react-native';
import { useTheme } from '../../../lib/design-system/ThemeContext';

/**
 * Input component props
 */
export interface InputProps extends Omit<TextInputProps, 'style'> {
  /** Input label */
  label: string;
  /** Input value */
  value: string;
  /** Change handler */
  onChangeText: (text: string) => void;
  /** Error message to display */
  error?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Secure text entry for passwords */
  secureTextEntry?: boolean;
  /** Optional icon component */
  icon?: React.ReactNode;
  /** Optional right icon component (for password visibility toggle) */
  rightIcon?: React.ReactNode;
  /** Optional custom container style */
  style?: ViewStyle;
  /** Optional test ID */
  testID?: string;
}

/**
 * Input Component
 * 
 * Implements design system specifications:
 * - Height: 52px
 * - Border: 1px solid
 * - Border radius: 14px (medium token)
 * - Focus state: Indigo glow effect
 * - Visible focus indicators for accessibility
 * - Icon support
 * - Error state with red border and message
 */
export default function Input({
  label,
  value,
  onChangeText,
  error,
  disabled = false,
  secureTextEntry = false,
  icon,
  rightIcon,
  style,
  testID,
  ...textInputProps
}: InputProps) {
  const { tokens, getTextColor, getTextSecondaryColor, getBorderColor, getInputColor, getInputDisabledColor } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  /**
   * Handle focus event
   */
  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (textInputProps.onFocus) {
      textInputProps.onFocus(e);
    }
  };

  /**
   * Handle blur event
   */
  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (textInputProps.onBlur) {
      textInputProps.onBlur(e);
    }
  };

  /**
   * Handle container press to focus input
   */
  const handleContainerPress = () => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  };

  /**
   * Get border color based on state
   */
  const borderColor = error 
    ? tokens.colors.error.main 
    : isFocused 
    ? tokens.colors.primary.main 
    : getBorderColor();

  const labelColor = error ? tokens.colors.error.main : getTextColor();
  const backgroundColor = disabled ? getInputDisabledColor() : getInputColor();
  const textColor = disabled ? tokens.colors.neutral.gray500 : getTextColor();
  const errorColor = tokens.colors.error.main;

  return (
    <View style={[styles.container, style]} pointerEvents="box-none">
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
      <TouchableWithoutFeedback onPress={handleContainerPress}>
        <View 
          style={[
            styles.inputContainer, 
            { 
              borderColor, 
              backgroundColor,
              ...(isFocused && !error && {
                shadowColor: tokens.colors.primary.main,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              })
            }
          ]}
        >
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            editable={!disabled}
            secureTextEntry={secureTextEntry}
            style={[styles.input, { 
              color: textColor, 
              marginLeft: icon ? 8 : 0,
              marginRight: rightIcon ? 8 : 0
            }]}
            placeholderTextColor={getTextSecondaryColor()}
            testID={testID}
            accessible={true}
            accessibilityLabel={label}
            accessibilityState={{
              disabled,
            }}
            accessibilityHint={error}
            autoCorrect={false}
            {...textInputProps}
          />
          {rightIcon && <View style={styles.rightIconContainer}>{rightIcon}</View>}
        </View>
      </TouchableWithoutFeedback>
      {error && (
        <Text
          style={[styles.error, { color: errorColor }]}
          testID={testID ? `${testID}-error` : undefined}
          accessible={true}
          accessibilityRole="alert"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  inputContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    height: '100%',
  },
  error: {
    fontSize: 14,
    marginTop: 4,
  },
  iconContainer: {
    marginRight: 8,
  },
  rightIconContainer: {
    marginLeft: 8,
  },
});
