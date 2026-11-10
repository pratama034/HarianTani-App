import { ThemeColors } from './theme';

export const Colors = {
  ...ThemeColors,
  // Backwards compatibility aliases
  surface: ThemeColors.surface,
  background: ThemeColors.background,
  text: ThemeColors.text,
  textSecondary: ThemeColors.textSecondary,
  border: ThemeColors.border,
  error: ThemeColors.error,
  success: ThemeColors.success,
};

