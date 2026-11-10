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
    backgroundColor: ThemeColors.surfaceDarkCard, // #1A221C
    borderRadius: Radius.xxl, // 28px
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#0A180E',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 5,
    overflow: 'hidden',
  },
});
