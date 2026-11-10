import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ThemeColors, Radius, Spacing } from '../constants/theme';

export type StatusVariant =
  | 'profit'
  | 'loss'
  | 'warning'
  | 'neutral'
  | 'active'
  | 'sage';

export interface StatusChipProps {
  label: string;
  variant?: StatusVariant;
  icon?: React.ReactNode;
  pulseDot?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  size?: 'sm' | 'md';
}

export function StatusChip({
  label,
  variant = 'neutral',
  icon,
  pulseDot = false,
  style,
  textStyle,
  size = 'md',
}: StatusChipProps) {
  const getStyles = () => {
    switch (variant) {
      case 'profit':
      case 'active':
        return {
          bg: ThemeColors.surfaceTintGreen,
          text: ThemeColors.profit,
          dot: ThemeColors.profit,
        };
      case 'loss':
        return {
          bg: ThemeColors.errorContainer,
          text: ThemeColors.loss,
          dot: ThemeColors.loss,
        };
      case 'warning':
        return {
          bg: '#FFF3E0',
          text: ThemeColors.warning,
          dot: ThemeColors.warning,
        };
      case 'sage':
        return {
          bg: ThemeColors.surfaceContainer,
          text: ThemeColors.primary,
          dot: ThemeColors.primary,
        };
      case 'neutral':
      default:
        return {
          bg: ThemeColors.surfaceLow,
          text: ThemeColors.textSecondary,
          dot: ThemeColors.textMuted,
        };
    }
  };

  const colors = getStyles();

  return (
    <View
      style={[
        styles.chip,
        size === 'sm' ? styles.chipSm : styles.chipMd,
        { backgroundColor: colors.bg },
        style,
      ]}
    >
      {pulseDot && (
        <View style={[styles.dot, { backgroundColor: colors.dot }]} />
      )}
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[
          size === 'sm' ? styles.textSm : styles.textMd,
          { color: colors.text },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  chipMd: {
    height: 30,
    paddingHorizontal: Spacing.sm + 4,
  },
  chipSm: {
    height: 24,
    paddingHorizontal: Spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  iconContainer: {
    marginRight: 4,
  },
  textMd: {
    fontSize: 12,
    fontWeight: '700',
  },
  textSm: {
    fontSize: 11,
    fontWeight: '700',
  },
});
