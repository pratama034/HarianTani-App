import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors, Radius, Spacing, Shadows } from '../constants/theme';
import {
  useAccelerometer,
  SHAKE_THRESHOLD,
  NORMAL_ACCELERATION_MAX,
} from '../hooks/useAccelerometer';

interface SensorDisplayCardProps {
  /** Callback saat goncangan ekstrem (> 1.78g) terdeteksi untuk menyegarkan data (Shake-to-Refresh) */
  onShakeRefresh?: () => void;
  /** Indikator apakah proses sinkronisasi/refresh sedang berlangsung */
  isRefreshing?: boolean;
}

export const SensorDisplayCard: React.FC<SensorDisplayCardProps> = ({
  onShakeRefresh,
  isRefreshing = false,
}) => {
  const {
    data,
    totalAcceleration,
    motionStatus,
    shakeDetected,
    shakeCount,
    lastShakeTimestamp,
    isAvailable,
    subscribe,
    unsubscribe,
    simulateShake,
  } = useAccelerometer({
    onShake: onShakeRefresh,
    updateIntervalMs: 100,
  });

  const isModerate =
    !shakeDetected && motionStatus === 'Pergerakan Terdeteksi';

  const toggleSensor = () => {
    if (isAvailable) {
      unsubscribe();
    } else {
      subscribe();
    }
  };

  return (
    <View
      style={styles.card}
      accessible={true}
      accessibilityLabel={`Monitoring Stabilitas Perangkat. Status saat ini ${motionStatus}. Total akselerasi ${totalAcceleration.toFixed(2)} g.`}
    >
      {/* Header Row: Judul & Toggle Status Sensor (Task 01 & 02) */}
      <View style={styles.headerRow}>
        <View style={styles.titleLeft}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons
              name="axis-arrow"
              size={19}
              color={ThemeColors.primaryContainer}
            />
          </View>
          <View style={styles.titleTextWrapper}>
            <Text style={styles.title}>
              Monitoring Stabilitas Perangkat (Field-Sensor)
            </Text>
            <Text style={styles.subtitle}>
              Goyangkan HP ({'>'} {SHAKE_THRESHOLD}g) untuk Shake-to-Refresh data
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.sensorTogglePill,
            isAvailable ? styles.sensorActivePill : styles.sensorInactivePill,
          ]}
          onPress={toggleSensor}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={
            isAvailable ? 'Matikan sensor accelerometer' : 'Aktifkan sensor accelerometer'
          }
        >
          <View
            style={[
              styles.pulseDot,
              {
                backgroundColor: isAvailable
                  ? '#006C49'
                  : ThemeColors.textMuted,
              },
            ]}
          />
          <Text
            style={[
              styles.sensorToggleText,
              {
                color: isAvailable
                  ? '#005139'
                  : ThemeColors.textMuted,
              },
            ]}
          >
            {isAvailable ? '100ms Aktif' : 'Nonaktif'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Task 02: Grid 3 Kolom Koordinat Real-Time (X, Y, Z) dengan presisi .toFixed(2) */}
      <View style={styles.grid}>
        <View style={styles.metricBox}>
          <Text style={styles.axisLabel}>Sumbu X</Text>
          <Text style={styles.axisValue}>{data.x.toFixed(2)}</Text>
          <Text style={styles.axisHint}>Horizontal</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.axisLabel}>Sumbu Y</Text>
          <Text style={styles.axisValue}>{data.y.toFixed(2)}</Text>
          <Text style={styles.axisHint}>Vertikal</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.axisLabel}>Sumbu Z</Text>
          <Text style={styles.axisValue}>{data.z.toFixed(2)}</Text>
          <Text style={styles.axisHint}>Kedalaman</Text>
        </View>
      </View>

      {/* Task 03: Banner Interaksi & Klasifikasi Goncangan */}
      <View
        style={[
          styles.statusBox,
          shakeDetected
            ? styles.alertDanger
            : isModerate
              ? styles.alertWarning
              : styles.alertSafe,
        ]}
      >
        <View style={styles.statusHeaderRow}>
          <MaterialCommunityIcons
            name={
              shakeDetected
                ? 'alert-octagon'
                : isModerate
                  ? 'motion-sensor'
                  : 'check-decagram'
            }
            size={16}
            color={
              shakeDetected
                ? '#B91C1C'
                : isModerate
                  ? '#B45309'
                  : '#006C49'
            }
          />
          <Text
            style={[
              styles.statusText,
              shakeDetected
                ? styles.textDanger
                : isModerate
                  ? styles.textWarning
                  : styles.textSafe,
            ]}
          >
            {shakeDetected
              ? 'Goncangan Terdeteksi! Menyegarkan Data...'
              : isModerate
                ? 'Status Perangkat: Pergerakan Terdeteksi'
                : 'Status Perangkat: Kondisi Stabil'}
          </Text>
        </View>

        <Text style={styles.forceSubtext}>
          Total Akselerasi: {totalAcceleration.toFixed(2)} g{' '}
          {shakeDetected
            ? '• Sinkronisasi aktif'
            : isModerate
              ? `(Moderat: ${NORMAL_ACCELERATION_MAX.toFixed(2)}g – 1.77g)`
              : `(Normal: ≤ ${NORMAL_ACCELERATION_MAX.toFixed(2)}g)`}
        </Text>
      </View>

      {/* Footer: Informasi Riwayat Shake-to-Refresh & Tombol Simulasi Goncangan */}
      <View style={styles.footerRow}>
        <View style={styles.footerInfoLeft}>
          <MaterialCommunityIcons
            name={isRefreshing ? 'sync' : 'vibrate'}
            size={15}
            color={ThemeColors.textSecondary}
          />
          <Text style={styles.footerInfoText} numberOfLines={1}>
            {lastShakeTimestamp
              ? `Shake-Refresh: ${lastShakeTimestamp} (${shakeCount}x)`
              : 'Siap deteksi goncangan lapangan'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.simulateButton}
          onPress={simulateShake}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Simulasikan goncangan perangkat di atas 1.78g"
        >
          <MaterialCommunityIcons
            name="phone-rotate-landscape"
            size={14}
            color={ThemeColors.primaryContainer}
          />
          <Text style={styles.simulateButtonText}>Uji Goncangan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    padding: 15,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTextWrapper: {
    flex: 1,
  },
  title: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  subtitle: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    marginTop: 1,
  },
  sensorTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    gap: 5,
    borderWidth: 1,
  },
  sensorActivePill: {
    backgroundColor: '#ABF1CF',
    borderColor: '#6EE7B7',
  },
  sensorInactivePill: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sensorToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  axisLabel: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    marginBottom: 2,
    fontWeight: '600',
  },
  axisValue: {
    fontSize: 17,
    fontWeight: '700',
    color: ThemeColors.text,
    fontVariant: ['tabular-nums'],
  },
  axisHint: {
    fontSize: 10,
    color: ThemeColors.textMuted,
    marginTop: 1,
  },
  statusBox: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  alertSafe: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  alertWarning: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  alertDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  textSafe: {
    color: '#005139',
  },
  textWarning: {
    color: '#B45309',
  },
  textDanger: {
    color: '#B91C1C',
  },
  forceSubtext: {
    fontSize: 11.5,
    color: ThemeColors.textSecondary,
    marginTop: 3,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  footerInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    minWidth: 160,
  },
  footerInfoText: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
  },
  simulateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  simulateButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primaryContainer,
  },
});
