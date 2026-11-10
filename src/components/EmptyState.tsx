import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors, Radius, Spacing } from '../constants/theme';

export interface EmptyStateProps {
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: ViewStyle;
}

export function EmptyState({
  iconName = 'sprout-outline',
  title,
  description,
  action,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons
          name={iconName}
          size={36}
          color={ThemeColors.primary}
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {action && <View style={styles.actionContainer}>{action}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 18,
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: Spacing.md,
  },
});
