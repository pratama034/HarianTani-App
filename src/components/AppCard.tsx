import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { ThemeColors, Radius, Shadows, Spacing } from '../constants/theme';

export interface AppCardProps extends ViewProps {
  variant?: 'white' | 'sage' | 'flat';
  bordered?: boolean;
}

export function AppCard({
  style,
  children,
  variant = 'white',
  bordered = true,
  ...props
}: AppCardProps) {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'sage':
        return ThemeColors.surfaceSageLight;
      case 'flat':
        return ThemeColors.surfaceLow;
      case 'white':
      default:
        return ThemeColors.surface;
    }
  };

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: getBackgroundColor() },
        variant === 'white' && Shadows.card,
        bordered && styles.bordered,
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.lg, // 16px per Modern Agritech Precision DESIGN.md
    padding: Spacing.md,
    marginVertical: Spacing.xs,
  },
  bordered: {
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
});
