import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
} from 'react-native';
import { ThemeColors, Radius, Spacing } from '../constants/theme';

export interface SecondaryButtonProps extends TouchableOpacityProps {
  title: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  outlined?: boolean;
}

export function SecondaryButton({
  title,
  leftIcon,
  rightIcon,
  style,
  textStyle,
  outlined = false,
  ...props
}: SecondaryButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[
        styles.button,
        outlined ? styles.outlined : styles.tinted,
        style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
        <Text
          style={[
            styles.text,
            outlined ? styles.outlinedText : styles.tintedText,
            textStyle,
          ]}
        >
          {title}
        </Text>
        {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
  },
  tinted: {
    backgroundColor: ThemeColors.surfaceTintGreen,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: ThemeColors.border,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '700',
  },
  tintedText: {
    color: ThemeColors.primary,
  },
  outlinedText: {
    color: ThemeColors.textSecondary,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});
