import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { ThemeColors, Radius, Spacing } from '../constants/theme';

export type DarkSummaryCardProps = ViewProps;

export function DarkSummaryCard({ style, children, ...props }: DarkSummaryCardProps) {
  return (
    <View style={[styles.card, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: ThemeColors.surfaceDarkCard, // #00442F Deep Pine-Emerald
    borderRadius: Radius.lg, // 16px
    padding: Spacing.lg - 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#002115',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
});
