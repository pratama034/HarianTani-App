import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { ThemeColors, Radius, Shadows, Spacing } from '../constants/theme';

export interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function PrimaryButton({
  title,
  loading = false,
  leftIcon,
  rightIcon,
  variant = 'primary',
  style,
  textStyle,
  disabled,
  ...props
}: PrimaryButtonProps) {
  const getBackgroundColor = () => {
    if (disabled) return ThemeColors.surfaceHigh;
    switch (variant) {
      case 'secondary':
        return ThemeColors.surfaceTintGreen;
      case 'danger':
        return ThemeColors.loss;
      case 'primary':
      default:
        return ThemeColors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return ThemeColors.textMuted;
    switch (variant) {
      case 'secondary':
        return ThemeColors.primary;
      case 'danger':
      case 'primary':
      default:
        return ThemeColors.onPrimary;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'primary' && !disabled && Shadows.button,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
          <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
          </Text>
          {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 52, // Strict 52px target standard from DESIGN.md
    borderRadius: Radius.full, // Full capsule
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});
