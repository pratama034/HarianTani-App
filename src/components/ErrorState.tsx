import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors, Radius, Spacing, Shadows } from '../constants/theme';

export type ErrorStateType =
  | 'offline'
  | 'timeout'
  | 'client_error'
  | 'server_error'
  | 'error'
  | 'generic';

export interface ErrorStateProps {
  type?: ErrorStateType;
  statusCode?: number | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  compact?: boolean;
  style?: ViewStyle;
}

/**
 * Komponen ErrorState: Visual feedback untuk kegagalan API (4xx/5xx), Timeout, dan Kondisi Offline.
 * Sesuai Slide 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, & 14 (Pekan 6 / Sprint 05: Error Handling & Offline).
 */
export function ErrorState({
  type = 'error',
  statusCode,
  title,
  message,
  onRetry,
  isRetrying = false,
  compact = false,
  style,
}: ErrorStateProps) {
  // Tentukan kategori error secara otomatis berdasarkan statusCode jika tersedia
  const resolvedType: ErrorStateType = (() => {
    if (type !== 'error') return type;
    if (statusCode === 408) return 'timeout';
    if (statusCode && statusCode >= 400 && statusCode < 500) return 'client_error';
    if (statusCode && statusCode >= 500) return 'server_error';
    return type;
  })();

  let defaultIcon: keyof typeof MaterialCommunityIcons.glyphMap = 'alert-circle-outline';
  let defaultTitle = 'Gagal mengambil data.';
  let defaultMessage = 'Terjadi kesalahan pada server. Silakan coba lagi.';
  let badgeText = statusCode ? `HTTP ${statusCode} Error` : 'API Request Error';
  let iconBgColor = 'rgba(239, 68, 68, 0.12)';
  let iconColor = ThemeColors.error;
  let badgeBgColor = 'rgba(239, 68, 68, 0.1)';

  if (resolvedType === 'offline') {
    defaultIcon = 'wifi-off';
    defaultTitle = 'Tidak ada koneksi internet.';
    defaultMessage = 'Periksa koneksi Anda dan coba lagi.';
    badgeText = 'Network Error • Offline';
    iconBgColor = 'rgba(239, 68, 68, 0.12)';
    iconColor = ThemeColors.error;
    badgeBgColor = 'rgba(239, 68, 68, 0.1)';
  } else if (resolvedType === 'timeout') {
    defaultIcon = 'clock-alert-outline';
    defaultTitle = 'Waktu permintaan habis.';
    defaultMessage = 'Server tidak merespons (timeout). Silakan coba lagi.';
    badgeText = 'HTTP 408 • Request Timeout';
    iconBgColor = 'rgba(245, 158, 11, 0.14)';
    iconColor = ThemeColors.warning;
    badgeBgColor = 'rgba(245, 158, 11, 0.12)';
  } else if (resolvedType === 'client_error') {
    defaultIcon = 'alert-circle-outline';
    defaultTitle = statusCode === 404 ? 'Data tidak ditemukan' : 'Permintaan tidak valid';
    defaultMessage =
      statusCode === 404
        ? 'Data atau resource yang Anda cari tidak tersedia. (404 Not Found)'
        : `Terjadi kesalahan permintaan dari aplikasi (${statusCode || '4xx'} Client Error).`;
    badgeText = `HTTP ${statusCode || 400} • Client Error (4xx)`;
    iconBgColor = 'rgba(245, 158, 11, 0.14)';
    iconColor = ThemeColors.warning;
    badgeBgColor = 'rgba(245, 158, 11, 0.12)';
  } else if (resolvedType === 'server_error') {
    defaultIcon = 'server-network-off';
    defaultTitle = 'Terjadi kesalahan pada server.';
    defaultMessage = `Server sedang mengalami gangguan. Silakan coba lagi nanti. (${statusCode || 500} Internal Server Error)`;
    badgeText = `HTTP ${statusCode || 500} • Server Error (5xx)`;
    iconBgColor = 'rgba(239, 68, 68, 0.12)';
    iconColor = ThemeColors.error;
    badgeBgColor = 'rgba(239, 68, 68, 0.1)';
  }

  const finalTitle = title || defaultTitle;
  const finalMessage = message || defaultMessage;

  if (compact) {
    return (
      <View
        style={[styles.compactContainer, style]}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={`${finalTitle}. ${finalMessage}`}
      >
        <View style={[styles.compactIconCircle, { backgroundColor: iconBgColor }]}>
          <MaterialCommunityIcons name={defaultIcon} size={20} color={iconColor} />
        </View>
        <View style={styles.compactContent}>
          <Text style={styles.compactTitle}>{finalTitle}</Text>
          <Text style={styles.compactMessage} numberOfLines={2}>
            {finalMessage}
          </Text>
        </View>
        {onRetry && (
          <TouchableOpacity
            style={[styles.compactRetryButton, isRetrying && styles.buttonDisabled]}
            onPress={onRetry}
            disabled={isRetrying}
            activeOpacity={0.8}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Coba Lagi"
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.retryInnerRow}>
                <MaterialCommunityIcons name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.compactRetryText}>Coba Lagi</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View
      style={[styles.container, style]}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={`${finalTitle}. ${finalMessage}`}
    >
      {/* Status Classification Badge */}
      <View style={[styles.badgePill, { backgroundColor: badgeBgColor }]}>
        <Text style={[styles.badgeText, { color: iconColor }]}>{badgeText}</Text>
      </View>

      <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
        <MaterialCommunityIcons name={defaultIcon} size={44} color={iconColor} />
      </View>

      <Text style={styles.title}>{isRetrying ? 'Mencoba lagi...' : finalTitle}</Text>
      <Text style={styles.message}>
        {isRetrying
          ? 'Menghubungkan ke server dan mengambil data terbaru.'
          : finalMessage}
      </Text>

      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, isRetrying && styles.buttonDisabled]}
          onPress={onRetry}
          disabled={isRetrying}
          activeOpacity={0.85}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Tombol Coba Lagi"
        >
          {isRetrying ? (
            <View style={styles.buttonInner}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Mencoba lagi...</Text>
            </View>
          ) : (
            <View style={styles.buttonInner}>
              <MaterialCommunityIcons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Coba Lagi</Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl + 8,
    paddingHorizontal: Spacing.xl,
    backgroundColor: ThemeColors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.18)',
    marginVertical: Spacing.md,
    ...Shadows.card,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.md,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: ThemeColors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: 14,
    color: ThemeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: Spacing.lg,
    maxWidth: 320,
  },
  retryButton: {
    backgroundColor: ThemeColors.error,
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.xl + 8,
    borderRadius: Radius.full,
    minWidth: 180,
    alignItems: 'center',
    ...Shadows.button,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Compact Banner Styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    marginVertical: Spacing.xs,
  },
  compactIconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  compactContent: {
    flex: 1,
    marginRight: Spacing.xs,
  },
  compactTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#991B1B',
  },
  compactMessage: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 1,
  },
  compactRetryButton: {
    backgroundColor: ThemeColors.error,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
  },
  compactRetryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  retryInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
});
