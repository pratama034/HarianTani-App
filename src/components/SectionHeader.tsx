import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { ThemeColors, Spacing } from '../constants/theme';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  rightAction,
  style,
}: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.left}>
        <View style={styles.titleRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={styles.title}>{title}</Text>
        </View>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightAction && <View style={styles.right}>{rightAction}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    paddingHorizontal: 2,
  },
  left: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: Spacing.xs + 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ThemeColors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginTop: 2,
  },
  right: {
    marginLeft: Spacing.sm,
  },
});
