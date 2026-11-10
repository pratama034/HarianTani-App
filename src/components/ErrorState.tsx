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

export type ErrorStateType = 'offline' | 'timeout' | 'error' | 'generic';

export interface ErrorStateProps {
  type?: ErrorStateType;
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  compact?: boolean;
  style?: ViewStyle;
}

/**
 * Komponen ErrorState: Visual feedback untuk kegagalan API, Timeout, dan Kondisi Offline.
 * Sesuai Slide 3, 5, 6, 7, 10, & 11 (Pekan 6: Error Handling & Offline).
 */
export function ErrorState({
  type = 'error',
  title,
  message,
  onRetry,
  isRetrying = false,
  compact = false,
  style,
}: ErrorStateProps) {
  // Tentukan ikon, judul default, dan warna berdasarkan jenis kegagalan
  let defaultIcon: keyof typeof MaterialCommunityIcons.glyphMap = 'alert-circle-outline';
  let defaultTitle = 'Gagal Memuat Data';
  let defaultMessage = 'Terjadi kesalahan pada server. Silakan coba beberapa saat lagi.';
  let iconBgColor = 'rgba(239, 68, 68, 0.12)';
  let iconColor = ThemeColors.error;

  if (type === 'offline') {
    defaultIcon = 'wifi-off';
    defaultTitle = 'Tidak Ada Koneksi Internet';
    defaultMessage = 'Periksa koneksi data seluler atau Wi-Fi Anda lalu coba lagi.';
    iconBgColor = 'rgba(245, 158, 11, 0.14)';
    iconColor = ThemeColors.warning;
  } else if (type === 'timeout') {
    defaultIcon = 'timer-sand-empty';
    defaultTitle = 'Waktu Permintaan Habis';
    defaultMessage = 'Server membutuhkan waktu terlalu lama untuk merespons. Silakan coba kembali.';
    iconBgColor = 'rgba(245, 158, 11, 0.14)';
    iconColor = ThemeColors.warning;
  }

  const finalTitle = title || defaultTitle;
  const finalMessage = message || defaultMessage;

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
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
          >
            {isRetrying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.retryInnerRow}>
                <MaterialCommunityIcons name="refresh" size={16} color="#FFFFFF" />
                <Text style={styles.compactRetryText}>Coba</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
        <MaterialCommunityIcons name={defaultIcon} size={42} color={iconColor} />
      </View>
      <Text style={styles.title}>{finalTitle}</Text>
      <Text style={styles.message}>{finalMessage}</Text>

      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, isRetrying && styles.buttonDisabled]}
          onPress={onRetry}
          disabled={isRetrying}
          activeOpacity={0.85}
        >
          {isRetrying ? (
            <View style={styles.buttonInner}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Menghubungkan Ulang...</Text>
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
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    backgroundColor: ThemeColors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    marginVertical: Spacing.md,
    ...Shadows.card,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ThemeColors.text,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  message: {
    fontSize: 14,
    color: ThemeColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
    maxWidth: 320,
  },
  retryButton: {
    backgroundColor: ThemeColors.primary,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radius.full,
    ...Shadows.button,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },

  // Compact Banner Styles
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
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
    color: '#92400E',
  },
  compactMessage: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 1,
  },
  compactRetryButton: {
    backgroundColor: ThemeColors.primary,
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
