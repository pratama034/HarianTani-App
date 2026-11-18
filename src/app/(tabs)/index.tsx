import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { useAccelerometer } from '../../hooks/useAccelerometer';

export default function BerandaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    lahanList,
    jadwalList,
    jurnalList,
    panenList,
    toggleJadwalSelesai,
    isLoading,
    error,
    apiStatus,
    statusCode,
    refetchAll,
  } = useAppContext();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [weatherTemp, setWeatherTemp] = useState<number>(28);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  }, [refetchAll]);

  const handleShakeRefresh = useCallback(async () => {
    if (refreshing) return;
    setWeatherTemp((prev) => (prev === 28 ? 27 : prev === 27 ? 29 : 28));
    await onRefresh();
  }, [refreshing, onRefresh]);

  // Headless Shake-to-Refresh (> 1.78g) berjalan di background
  useAccelerometer({
    onShake: handleShakeRefresh,
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const jadwalHariIni = jadwalList.filter((j) => j.tanggal === todayStr);
  const tugasSelesai = jadwalHariIni.filter((j) => j.selesai).length;
  const tugasBelumSelesai = jadwalHariIni.filter((j) => !j.selesai).length;

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  const todayFormatted = new Date().toLocaleDateString('id-ID', dateOptions);

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const formatCompactRupiah = (angka: number) => {
    const abs = Math.abs(angka);
    if (abs >= 1_000_000) {
      return `Rp ${(angka / 1_000_000).toFixed(1)}M`;
    }
    if (abs >= 1_000) {
      return `Rp ${Math.round(angka / 1_000)}rb`;
    }
    return formatRupiah(angka);
  };

  // Kas Usaha Calculation
  const totalPendapatan = panenList.reduce(
    (acc, curr) => acc + curr.jumlah * curr.hargaJual,
    0
  );
  const totalBiaya = jurnalList.reduce((acc, curr) => acc + curr.biaya, 0);
  const kasUsaha = totalPendapatan - totalBiaya;

  // Featured Lahan
  const featuredLahan = lahanList[0];
  const getUmurDays = (tgl?: string) => {
    if (!tgl) return 38;
    try {
      const start = new Date(tgl);
      const now = new Date();
      const diff = Math.ceil(
        Math.abs(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      return isNaN(diff) || diff <= 0 ? 38 : diff;
    } catch {
      return 38;
    }
  };
  const hstDays = getUmurDays(featuredLahan?.tanggalTanam);
  const totalCycleDays = 115;
  const hstPercent = Math.min(
    100,
    Math.max(10, Math.round((hstDays / totalCycleDays) * 100))
  );
  const sisaHari = Math.max(0, totalCycleDays - hstDays);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ThemeColors.primaryContainer} />
        <Text style={styles.loadingText}>Memuat dashboard lapangan...</Text>
      </View>
    );
  }

  // Full Screen Error / Offline / Timeout State (Hanya jika belum ada data sama sekali di memori)
  const hasDataInMemory =
    lahanList.length > 0 ||
    jadwalList.length > 0 ||
    jurnalList.length > 0 ||
    panenList.length > 0;

  if (error && !hasDataInMemory) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[ThemeColors.primaryContainer]}
            tintColor={ThemeColors.primaryContainer}
          />
        }
      >
        <ErrorState
          type={
            apiStatus === 'offline'
              ? 'offline'
              : apiStatus === 'timeout'
                ? 'timeout'
                : 'error'
          }
          statusCode={statusCode}
          message={error}
          onRetry={onRefresh}
          isRetrying={refreshing}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        {
          paddingBottom: Math.max(insets.bottom, 16) + 28,
        },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[ThemeColors.primaryContainer]}
          tintColor={ThemeColors.primaryContainer}
        />
      }
    >
      {/* Network Error Alert Banner saat data terakhir di memori dipertahankan */}
      {error && hasDataInMemory && (
        <View style={{ marginBottom: 14 }}>
          <ErrorState
            compact
            type={
              apiStatus === 'offline'
                ? 'offline'
                : apiStatus === 'timeout'
                  ? 'timeout'
                  : 'error'
            }
            statusCode={statusCode}
            message={error}
            onRetry={onRefresh}
            isRetrying={refreshing}
          />
        </View>
      )}
      {/* 1. Greeting & Compact Weather Pill (Diet Dashboard) */}
      <View style={styles.greetingSection}>
        <View style={styles.greetingTopRow}>
          <View style={styles.greetingTextCol}>
            <View style={styles.greetingMetaRow}>
              <View style={styles.dashboardPill}>
                <View style={styles.dashboardPillDot} />
                <Text style={styles.dashboardPillText}>DASHBOARD LAPANGAN</Text>
              </View>
              <View style={styles.weatherMiniBadge}>
                <Text style={styles.weatherMiniText}>🌤️ {weatherTemp}°C Cerah</Text>
              </View>
            </View>
            <Text style={styles.greetingTitle}>
              Halo, {user?.name ? `Pak ${user.name}` : 'Pak Budi'}
            </Text>
            <Text style={styles.greetingDateText}>{todayFormatted}</Text>
          </View>

          <View style={styles.waveIconBox}>
            <MaterialCommunityIcons
              name="hand-wave"
              size={20}
              color="#FFFFFF"
            />
          </View>
        </View>
      </View>

      {/* 2. Quick Action Buttons */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={styles.actionBtnOutline}
          onPress={() => router.push('/(tabs)/jurnal')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="notebook-edit-outline"
            size={20}
            color="#135D43"
          />
          <Text style={styles.actionBtnOutlineText}>+ Catat Jurnal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnSolid}
          onPress={() => router.push('/(tabs)/panen')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="sprout"
            size={20}
            color="#6CF8BB"
          />
          <Text style={styles.actionBtnSolidText}>+ Catat Panen</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Three-Column Metric Summary Cards */}
      <View style={styles.threeMetricsRow}>
        {/* Card 1: Lahan Aktif */}
        <TouchableOpacity
          style={[styles.miniMetricCard, styles.miniMetricEmerald]}
          onPress={() => router.push('/(tabs)/lahan')}
          activeOpacity={0.85}
        >
          <View style={styles.miniMetricTop}>
            <Text style={styles.miniMetricLabel}>Lahan{'\n'}Aktif</Text>
            <View style={styles.miniIconEmerald}>
              <MaterialCommunityIcons
                name="layers-outline"
                size={15}
                color="#135D43"
              />
            </View>
          </View>
          <View>
            <Text style={styles.miniMetricValue}>{lahanList.length} Petak</Text>
            <Text style={styles.miniMetricSubEmerald} numberOfLines={1}>
              1.8 Ha Total
            </Text>
          </View>
        </TouchableOpacity>

        {/* Card 2: Tugas Hari Ini */}
        <TouchableOpacity
          style={[styles.miniMetricCard, styles.miniMetricAmber]}
          onPress={() => router.push('/(tabs)/jadwal')}
          activeOpacity={0.85}
        >
          <View style={styles.miniMetricTop}>
            <Text style={styles.miniMetricLabel}>Tugas Hari{'\n'}Ini</Text>
            <View style={styles.miniIconAmber}>
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={15}
                color="#B45309"
              />
            </View>
          </View>
          <View>
            <Text style={styles.miniMetricValue}>
              {tugasBelumSelesai} Tersisa
            </Text>
            <Text style={styles.miniMetricSubAmber} numberOfLines={1}>
              {tugasSelesai} dari {jadwalHariIni.length} selesai
            </Text>
          </View>
        </TouchableOpacity>

        {/* Card 3: Kas Usaha */}
        <TouchableOpacity
          style={[styles.miniMetricCard, styles.miniMetricTeal]}
          onPress={() => router.push('/(tabs)/panen')}
          activeOpacity={0.85}
        >
          <View style={styles.miniMetricTop}>
            <Text style={styles.miniMetricLabel}>Kas{'\n'}Usaha</Text>
            <View style={styles.miniIconTeal}>
              <MaterialCommunityIcons
                name="wallet-outline"
                size={15}
                color="#0F766E"
              />
            </View>
          </View>
          <View>
            <Text style={styles.miniMetricValueCompact} numberOfLines={1}>
              {formatCompactRupiah(kasUsaha)}
            </Text>
            <Text style={styles.miniMetricSubTeal} numberOfLines={1}>
              {kasUsaha >= 0 ? '+Surplus sehat' : 'Defisit kas'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 4. Sorotan Petak Utama (Featured Plot Card) */}
      {featuredLahan && (
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeaderLeft}>
              <Text style={styles.sectionTitle}>Sorotan Petak Utama</Text>
              <View style={styles.sectionDot} />
            </View>
            <TouchableOpacity
              style={styles.sectionLinkBtn}
              onPress={() => router.push('/(tabs)/lahan')}
            >
              <Text style={styles.sectionLinkText}>
                Kelola ({lahanList.length})
              </Text>
              <MaterialCommunityIcons
                name="arrow-right"
                size={14}
                color="#135D43"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.featuredPlotCard}>
            <View style={styles.featuredTopRow}>
              <View style={styles.featuredTitleCol}>
                <View style={styles.featuredNameRow}>
                  <Text style={styles.featuredPlotName} numberOfLines={1}>
                    {featuredLahan.nama}
                  </Text>
                  <MaterialCommunityIcons
                    name="check-decagram"
                    size={17}
                    color="#059669"
                  />
                </View>
                <Text style={styles.featuredCropMeta}>
                  {featuredLahan.tanaman} • Tanam {featuredLahan.tanggalTanam}
                </Text>
              </View>

              <View style={styles.vegetatifBadge}>
                <View style={styles.vegetatifDot} />
                <Text style={styles.vegetatifText}>Vegetatif</Text>
              </View>
            </View>

            <View style={styles.hstProgressBox}>
              <View style={styles.hstTopRow}>
                <Text style={styles.hstLabel}>Progres Masa Tanam</Text>
                <Text style={styles.hstValue}>
                  Hari ke-{hstDays} / {totalCycleDays} HST ({hstPercent}%)
                </Text>
              </View>
              <View style={styles.hstTrack}>
                <View
                  style={[styles.hstFill, { width: `${hstPercent}%` }]}
                />
              </View>
              <View style={styles.hstBottomRow}>
                <View style={styles.hstEstLeft}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={14}
                    color="#006C49"
                  />
                  <Text style={styles.hstEstText}>Est. Panen: 28 Nov 2026</Text>
                </View>
                <View style={styles.hstRemainingBadge}>
                  <Text style={styles.hstRemainingText}>
                    Tersisa {sisaHari} hari
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* 5. Jadwal Perawatan Hari Ini */}
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Text style={styles.sectionTitle}>Jadwal Perawatan Hari Ini</Text>
            <View style={styles.countCircleBadge}>
              <Text style={styles.countCircleText}>
                {jadwalHariIni.length}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.sectionLinkBtn}
            onPress={() => router.push('/(tabs)/jadwal')}
          >
            <Text style={styles.sectionLinkText}>Kalender</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color="#135D43"
            />
          </TouchableOpacity>
        </View>

        {jadwalHariIni.length === 0 ? (
          <View style={styles.whiteCard}>
            <EmptyState
              iconName="calendar-check"
              title="Tidak Ada Jadwal Hari Ini"
              description="Semua agenda perawatan tanaman untuk hari ini telah selesai."
            />
          </View>
        ) : (
          <View style={styles.taskStack}>
            {jadwalHariIni.map((jadwal) => {
              const lahan = lahanList.find((l) => l.id === jadwal.idLahan);
              return (
                <View
                  key={jadwal.id}
                  style={[
                    styles.taskRowCard,
                    jadwal.selesai
                      ? styles.taskRowDoneBorder
                      : styles.taskRowPendingBorder,
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.taskCheckCircle,
                      jadwal.selesai
                        ? styles.taskCheckCircleDone
                        : styles.taskCheckCirclePending,
                    ]}
                    onPress={() => toggleJadwalSelesai(jadwal.id)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Tandai tugas ${jadwal.kegiatan}`}
                  >
                    <MaterialCommunityIcons
                      name={
                        jadwal.selesai
                          ? 'check'
                          : 'checkbox-blank-circle-outline'
                      }
                      size={18}
                      color={jadwal.selesai ? '#006C49' : '#B45309'}
                    />
                  </TouchableOpacity>

                  <View style={styles.taskTextCol}>
                    <Text
                      style={[
                        styles.taskItemTitle,
                        jadwal.selesai && styles.taskItemTitleDone,
                      ]}
                      numberOfLines={1}
                    >
                      {jadwal.kegiatan}
                    </Text>
                    <Text style={styles.taskItemSub} numberOfLines={1}>
                      {jadwal.waktu} WIB • {lahan?.nama || 'Petak Lahan'}
                    </Text>
                  </View>

                  {jadwal.selesai ? (
                    <View style={styles.taskDonePill}>
                      <Text style={styles.taskDonePillText}>Selesai</Text>
                    </View>
                  ) : (
                    <View style={styles.taskPendingRight}>
                      <View style={styles.taskTimePillRed}>
                        <Text style={styles.taskTimePillRedText}>
                          {jadwal.waktu} WIB
                        </Text>
                      </View>
                      <View style={styles.taskBellMini}>
                        <MaterialCommunityIcons
                          name="bell-ring-outline"
                          size={15}
                          color={ThemeColors.textSecondary}
                        />
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ThemeColors.background,
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: ThemeColors.textSecondary,
    fontWeight: '600',
  },
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingTop: 18,
    paddingBottom: 28,
  },
  greetingSection: {
    marginBottom: 14,
  },
  greetingTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  greetingTextCol: {
    flex: 1,
  },
  dashboardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 5,
    marginBottom: 6,
  },
  dashboardPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#006C49',
  },
  dashboardPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#135D43',
    letterSpacing: 0.5,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ThemeColors.text,
    letterSpacing: -0.4,
  },
  waveIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#135D43',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  greetingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  weatherMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  weatherMiniText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#065F46',
  },
  dateWeatherInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  greetingDateText: {
    fontSize: 12.5,
    color: ThemeColors.textSecondary,
    marginTop: 2,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  actionBtnOutline: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnOutlineText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  actionBtnSolid: {
    flex: 1,
    height: 48,
    backgroundColor: '#006C49',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnSolidText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  threeMetricsRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 16,
  },
  miniMetricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 11,
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    minHeight: 96,
  },
  miniMetricEmerald: {
    borderLeftColor: '#059669',
  },
  miniMetricAmber: {
    borderLeftColor: '#F59E0B',
  },
  miniMetricTeal: {
    borderLeftColor: '#0D9488',
  },
  miniMetricTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  miniMetricLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
    lineHeight: 14,
    flex: 1,
    marginRight: 4,
  },
  miniIconEmerald: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIconAmber: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniIconTeal: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMetricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  miniMetricValueCompact: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  miniMetricSubEmerald: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#006C49',
    marginTop: 2,
  },
  miniMetricSubAmber: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#92400E',
    marginTop: 2,
  },
  miniMetricSubTeal: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#00714D',
    marginTop: 2,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  sectionDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#006C49',
  },
  sectionLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sectionLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#135D43',
  },
  featuredPlotCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 15,
  },
  featuredTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  featuredTitleCol: {
    flex: 1,
  },
  featuredNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  featuredPlotName: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  featuredCropMeta: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginTop: 2,
  },
  vegetatifBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ABF1CF',
    borderWidth: 1,
    borderColor: '#6EE7B7',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 5,
  },
  vegetatifDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  vegetatifText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#005139',
  },
  hstProgressBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 12,
    padding: 11,
    marginBottom: 10,
  },
  hstTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hstLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  hstValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#135D43',
  },
  hstTrack: {
    height: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  hstFill: {
    height: '100%',
    backgroundColor: '#135D43',
    borderRadius: Radius.full,
  },
  hstBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#ECFDF5',
  },
  hstEstLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hstEstText: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    fontWeight: '500',
  },
  hstRemainingBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hstRemainingText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  countCircleBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  countCircleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006C49',
  },
  whiteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  taskStack: {
    gap: 9,
  },
  taskRowCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  taskRowDoneBorder: {
    borderColor: '#D1FAE5',
    opacity: 0.92,
  },
  taskRowPendingBorder: {
    borderColor: '#FDE68A',
  },
  taskCheckCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCheckCircleDone: {
    backgroundColor: '#ABF1CF',
  },
  taskCheckCirclePending: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  taskTextCol: {
    flex: 1,
  },
  taskItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  taskItemTitleDone: {
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  taskItemSub: {
    fontSize: 11.5,
    color: ThemeColors.textSecondary,
    marginTop: 2,
  },
  taskDonePill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  taskDonePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#006C49',
  },
  taskPendingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskTimePillRed: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  taskTimePillRedText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#B91C1C',
  },
  taskBellMini: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: ThemeColors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
