import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { ThemeColors, Radius, Spacing } from '../constants/theme';

export interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  hint?: string;
}

export function FormInput({
  label,
  error,
  leftIcon,
  rightElement,
  containerStyle,
  inputStyle,
  hint,
  onFocus,
  onBlur,
  ...props
}: FormInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.focusedContainer,
          !!error && styles.errorContainer,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}
        <TextInput
          placeholderTextColor={ThemeColors.textMuted}
          style={[styles.input, inputStyle]}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {rightElement && (
          <View style={styles.rightElementContainer}>{rightElement}</View>
        )}
      </View>
      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: ThemeColors.text,
    marginBottom: Spacing.xs + 2,
  },
  inputContainer: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceLow,
    borderRadius: Radius.md, // 16px
    borderWidth: 1,
    borderColor: ThemeColors.border,
    paddingHorizontal: Spacing.md,
  },
  focusedContainer: {
    borderColor: ThemeColors.primary,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
  },
  errorContainer: {
    borderColor: ThemeColors.loss,
    backgroundColor: '#FFF8F8',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: ThemeColors.text,
  },
  leftIconContainer: {
    marginRight: Spacing.sm + 2,
  },
  rightElementContainer: {
    marginLeft: Spacing.sm,
  },
  errorText: {
    fontSize: 12,
    color: ThemeColors.loss,
    marginTop: 4,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 12,
    color: ThemeColors.textMuted,
    marginTop: 4,
  },
});
