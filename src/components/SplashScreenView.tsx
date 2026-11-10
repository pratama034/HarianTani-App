import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors, Radius, Spacing, Shadows } from '../constants/theme';

export interface SplashScreenViewProps {
  statusText?: string;
}

export function SplashScreenView({
  statusText = 'Memuat modul & data pertanian terenkripsi...',
}: SplashScreenViewProps) {
  return (
    <View style={styles.container}>
      {/* Top Header Badge */}
      <View style={styles.topBadgesRow}>
        <View style={styles.versionBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.versionBadgeText}>v2.4 READY</Text>
        </View>
        <View style={styles.vaultBadge}>
          <MaterialCommunityIcons
            name="shield-check"
            size={14}
            color={ThemeColors.primary}
          />
          <Text style={styles.vaultBadgeText}>Agro-Vault Active</Text>
        </View>
      </View>

      {/* Center Brand Emblem Pod */}
      <View style={styles.centerPod}>
        {/* Glowing Outer Rings */}
        <View style={styles.glowRingOuter}>
          <View style={styles.glowRingMid}>
            <View style={styles.glowRingInner}>
              <MaterialCommunityIcons
                name="sprout"
                size={40}
                color={ThemeColors.onPrimary}
              />
            </View>
          </View>
        </View>

        {/* Brand Headline Typography */}
        <Text style={styles.brandTitle}>
          Harian<Text style={styles.brandTitleAccent}>Tani</Text>
        </Text>
        <Text style={styles.brandSubtitle}>
          Digitalisasi & Manajemen Usaha Tani Cerdas
        </Text>
      </View>

      {/* Bottom Loading Indicator */}
      <View style={styles.bottomPod}>
        <ActivityIndicator size="small" color={ThemeColors.primary} />
        <Text style={styles.bootStatusText}>{statusText}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.margin,
    paddingVertical: 50,
  },
  topBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    ...Shadows.subtle,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ThemeColors.profit,
    marginRight: 6,
  },
  versionBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
    letterSpacing: 0.5,
  },
  vaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceTintGreen,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  vaultBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
    marginLeft: 4,
  },
  centerPod: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRingOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.card,
  },
  glowRingMid: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRingInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ThemeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  brandTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: ThemeColors.text,
    letterSpacing: -0.5,
  },
  brandTitleAccent: {
    color: ThemeColors.primary,
  },
  brandSubtitle: {
    fontSize: 14,
    color: ThemeColors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 20,
  },
  bottomPod: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bootStatusText: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    fontWeight: '500',
    marginTop: 10,
  },
});
