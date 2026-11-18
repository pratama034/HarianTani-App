import { Dimensions, Platform, TextStyle, ViewStyle } from 'react-native';

/**
 * Sistem Desain: Modern Agritech Precision (Google Stitch v3)
 * Memadukan ketajaman struktur modern dengan kejelasan organik untuk lapangan pertanian.
 */
export const ThemeColors = {
  // Brand Pine-Emerald & Botanical Mint
  primary: '#135D43',             // Primary container / main action green (#135D43)
  primaryDark: '#00442F',         // Deep pine-emerald (#00442F)
  primaryLight: '#006C49',        // Secondary botanical emerald (#006C49)
  primaryContainer: '#135D43',
  onPrimary: '#FFFFFF',
  onPrimaryContainer: '#8ED4B2',
  primaryFixed: '#ABF1CF',
  primaryFixedDim: '#90D5B4',
  onPrimaryFixed: '#002115',
  onPrimaryFixedVariant: '#005139',

  // Secondary & Accents
  secondary: '#006C49',
  onSecondary: '#FFFFFF',
  secondaryFixed: '#6FFBBE',
  secondaryFixedDim: '#4EDEA3',
  secondaryContainer: '#6CF8BB',
  onSecondaryContainer: '#00714D',
  onSecondaryFixed: '#002113',
  onSecondaryFixedVariant: '#005236',
  tertiary: '#353C42',
  tertiaryContainer: '#4C5359',

  // Navigation & Shell (Modern Clean Dark Green Bars)
  headerBackground: '#0E3E2D',
  onHeader: '#FFFFFF',
  onHeaderSubtitle: 'rgba(255, 255, 255, 0.85)',
  tabBarBackground: '#0E3E2D',
  tabBarActive: '#ABF1CF',
  tabBarInactive: 'rgba(255, 255, 255, 0.70)',
  tabBarActivePill: '#ABF1CF',
  onTabBarActivePill: '#005139',

  // Surfaces & Daylight Canvas (Modern Agritech Precision)
  background: '#F8FAFC',          // Clean daylight calm canvas
  backgroundLight: '#FFFFFF',
  surfaceSageLight: '#ECFDF5',    // Emerald-50 soft botanical tint
  surface: '#FFFFFF',             // Pure white card
  surfaceLow: '#F1F5F9',
  surfaceContainer: '#F8FAFC',
  surfaceHigh: '#E2E8F0',
  surfaceHighest: '#CBD5E1',
  surfaceTintGreen: '#D1FAE5',
  surfaceDarkCard: '#0F172A',     // Slate gelap pekat

  // Text & Content - Hierarki Tenang
  text: '#0F172A',                // Judul utama gelap pekat
  textSecondary: '#64748B',       // Teks sekunder abu-abu redup
  textMuted: '#94A3B8',           // Muted outline / placeholder
  onDark: '#FFFFFF',
  onDarkSecondary: '#94A3B8',

  // Outlines & Borders
  border: '#E2E8F0',              // Crisp 1px structural slate border
  borderLight: '#F1F5F9',
  outlineVariant: '#CBD5E1',

  // Status & Financial Semantics
  profit: '#006C49',              // Completed / profit / optimal
  success: '#10B981',
  loss: '#BA1A1A',                // Cost / expense / error
  error: '#BA1A1A',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',
  warning: '#D97706',             // Alert / pending / draft
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
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const Typography = {
  fontDisplay: Platform.select({
    ios: 'Plus Jakarta Sans',
    android: 'sans-serif-medium',
    default: 'Plus Jakarta Sans, sans-serif',
  }),
  fontBody: Platform.select({
    ios: 'Inter',
    android: 'sans-serif',
    default: 'Inter, sans-serif',
  }),

  displayLg: {
    fontSize: 28,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 36,
    letterSpacing: -0.5,
    color: ThemeColors.text,
  },
  headlineLg: {
    fontSize: 22,
    fontWeight: '700' as TextStyle['fontWeight'],
    lineHeight: 30,
    letterSpacing: -0.3,
    color: ThemeColors.text,
  },
  headlineMd: {
    fontSize: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 28,
    letterSpacing: -0.2,
    color: ThemeColors.text,
  },
  headlineSm: {
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 20,
    color: ThemeColors.text,
  },
  labelMd: {
    fontSize: 12,
    fontWeight: '500' as TextStyle['fontWeight'],
    lineHeight: 16,
    color: ThemeColors.text,
  },
  labelSm: {
    fontSize: 11,
    fontWeight: '600' as TextStyle['fontWeight'],
    lineHeight: 14,
    letterSpacing: 0.4,
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 0,
    shadowOpacity: 0,
  } as ViewStyle,
  button: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  } as ViewStyle,
  subtle: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 0,
    shadowOpacity: 0,
  } as ViewStyle,
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Layout = {
  window: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  isSmallDevice: SCREEN_WIDTH < 375,
  isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLargeDevice: SCREEN_WIDTH >= 414,
  maxContentWidth: 480,
};

