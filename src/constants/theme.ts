import { Platform, TextStyle, ViewStyle } from 'react-native';

export const ThemeColors = {
  // Brand Greens
  primary: '#2E7D32',             // Primary green
  primaryDark: '#1B5E20',         // Deep forest green
  primaryLight: '#4CAF50',        // Fresh green accent
  primaryContainer: '#2E7D32',
  onPrimary: '#FFFFFF',
  primaryFixed: '#A3F69C',
  primaryFixedDim: '#88D982',

  // Secondary & Accents
  secondary: '#006E1C',
  secondaryFixed: '#94F990',
  secondaryFixedDim: '#78DC77',
  secondaryContainer: '#91F78E',
  onSecondaryContainer: '#00731E',
  tertiary: '#1F6223',
  tertiaryContainer: '#3A7B39',

  // Navigation & Shell (Modern Redesign v2)
  headerBackground: '#2E7D32',
  onHeader: '#FFFFFF',
  onHeaderSubtitle: 'rgba(255, 255, 255, 0.85)',
  tabBarBackground: '#2E7D32',
  tabBarActive: '#94F990',
  tabBarInactive: 'rgba(255, 255, 255, 0.72)',
  tabBarActivePill: 'rgba(255, 255, 255, 0.22)',

  // Sage Surfaces & Canvas
  background: '#EBF3EC',          // Soft airy sage canvas
  backgroundLight: '#F1F8E9',     // Light sage tint
  surfaceSageLight: '#F1F8E9',    // Surface sage light
  surface: '#FFFFFF',             // Pure white card
  surfaceLow: '#F0F5EE',          // Low elevation container
  surfaceContainer: '#EBEFE9',
  surfaceHigh: '#E5E9E3',
  surfaceHighest: '#DFE4DD',
  surfaceTintGreen: '#E8F5E9',    // Soft pastel green container
  surfaceDarkCard: '#1A221C',     // Obsidian-forest dark summary card

  // Text & Content
  text: '#181D19',                // On-surface primary text
  textSecondary: '#40493D',       // On-surface-variant secondary text
  textMuted: '#707A6C',           // Subtle outline text
  onDark: '#FFFFFF',
  onDarkSecondary: '#DFE4DD',

  // Outlines & Borders
  border: '#D8E5DA',              // Subtle tactile border
  borderLight: '#EBF3EC',
  outlineVariant: '#BFCABA',

  // Status & Financial Semantics
  profit: '#388E3C',              // Completed / profit / income
  success: '#388E3C',
  loss: '#D32F2F',                // Cost / expense / error
  error: '#D32F2F',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',
  warning: '#F57C00',             // Alert / pending / warning
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  gutter: 16,
  margin: 20,
};

export const Radius = {
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  full: 9999,
};

export const Typography = {
  // Font Families with robust fallbacks
  fontDisplay: Platform.select({
    ios: 'Space Grotesk',
    android: 'sans-serif-medium',
    default: 'Space Grotesk, sans-serif',
  }),
  fontBody: Platform.select({
    ios: 'Plus Jakarta Sans',
    android: 'sans-serif',
    default: 'Plus Jakarta Sans, sans-serif',
  }),

  // Text Styles
  displayLg: {
    fontSize: 32,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 40,
    color: ThemeColors.text,
  },
  headlineLg: {
    fontSize: 24,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 32,
    color: ThemeColors.text,
  },
  headlineMd: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 28,
    color: ThemeColors.text,
  },
  headlineSm: {
    fontSize: 18,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 24,
    color: ThemeColors.text,
  },
  bodyLg: {
    fontSize: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 24,
    color: ThemeColors.text,
  },
  bodyMd: {
    fontSize: 14,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 20,
    color: ThemeColors.textSecondary,
  },
  bodySm: {
    fontSize: 12,
    fontWeight: '400' as TextStyle['fontWeight'],
    lineHeight: 18,
    color: ThemeColors.textSecondary,
  },
  labelLg: {
    fontSize: 15,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 20,
    color: ThemeColors.text,
  },
  labelMd: {
    fontSize: 13,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 18,
    color: ThemeColors.text,
  },
  labelSm: {
    fontSize: 11,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 16,
    letterSpacing: 0.5,
  },
  currencyDisplay: {
    fontSize: 22,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 28,
    color: ThemeColors.primary,
  },
};

export const Shadows = {
  card: {
    shadowColor: '#1E3C23',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  } as ViewStyle,
  button: {
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  } as ViewStyle,
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  } as ViewStyle,
};
