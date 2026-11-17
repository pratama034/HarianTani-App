import React, { useState } from 'react';
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
import { ThemeColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { AppCard } from '../../components/AppCard';
import { DarkSummaryCard } from '../../components/DarkSummaryCard';
import { SectionHeader } from '../../components/SectionHeader';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { SensorDisplayCard } from '../../components/SensorDisplayCard';

export default function BerandaScreen() {
  const router = useRouter();
  const {
    lahanList,
    jadwalList,
    jurnalList,
    toggleJadwalSelesai,
    isLoading,
    error,
    apiStatus,
    statusCode,
    isCloudConnected,
    isSimulationActive,
    refetchAll,
  } = useAppContext();
  const { user, session } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [weatherTemp, setWeatherTemp] = useState<number>(28);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  };

  const handleShakeRefresh = async () => {
    setWeatherTemp((prev) => (prev === 28 ? 27 : prev === 27 ? 29 : 28));
    await onRefresh();
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const jadwalHariIni = jadwalList.filter((j) => j.tanggal === todayStr);
  const tugasSelesai = jadwalHariIni.filter((j) => j.selesai).length;
  const tugasBelumSelesai = jadwalHariIni.filter((j) => !j.selesai).length;
  const persenSelesai =
    jadwalHariIni.length > 0
      ? Math.round((tugasSelesai / jadwalHariIni.length) * 100)
      : 100;

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

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ThemeColors.primary} />
        <Text style={styles.loadingText}>Memuat data...</Text>
        <Text style={{ fontSize: 13, color: ThemeColors.textSecondary, marginTop: 4 }}>
          Mohon tunggu sebentar, sedang menghubungi REST API.
        </Text>
      </View>
    );
  }

  // Full Screen Error / Offline / Timeout State (Tampil saat simulasi aktif atau jika data kosong dan terjadi error)
  if (error && (isSimulationActive || (lahanList.length === 0 && jadwalList.length === 0))) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[ThemeColors.primary]}
            tintColor={ThemeColors.primary}
          />
        }
      >
        <ErrorState
          type={apiStatus === 'offline' ? 'offline' : apiStatus === 'timeout' ? 'timeout' : 'error'}
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
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[ThemeColors.primary]}
          tintColor={ThemeColors.primary}
        />
      }
    >
      {/* Greeting & Date Header */}
      <View style={styles.greetingSection}>
        <View style={styles.greetingRow}>
          <View style={styles.greetingTextCol}>
            <Text style={styles.greetingTitle}>
              Halo, {user?.name ? user.name.split(' ')[0] : 'Petani Cerdas'}!{' '}
              <Text style={styles.waveHand}>👋</Text>
            </Text>
            <Text style={styles.greetingDate}>{todayFormatted}</Text>
          </View>
          <View style={styles.weatherBadge}>
            <MaterialCommunityIcons
              name="weather-sunny"
              size={18}
              color={ThemeColors.warning}
            />
            <Text style={styles.weatherText}>{weatherTemp}°C</Text>
          </View>
        </View>

        {/* Diagnostic Status Micro-Pill */}
        <View style={styles.diagnosticPill}>
          <View style={styles.diagnosticLeft}>
            <MaterialCommunityIcons
              name={session?.token ? 'shield-check' : isCloudConnected ? 'cloud-check' : 'check-circle'}
              size={16}
              color={ThemeColors.primary}
            />
            <Text style={styles.diagnosticText}>
              {isCloudConnected
                ? (session?.token ? '🟢 Cloud REST API (200 OK • JWT Protected)' : '🟢 Cloud REST API Active (200 OK)')
                : '🟢 Data Lokal Aktif (Offline Ready)'}
            </Text>
          </View>
          <View style={styles.diagnosticTag}>
            <Text style={styles.diagnosticTagText}>
              {isCloudConnected ? (session?.token ? 'JWT Secure' : '200 OK') : 'Local Ready'}
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Action Pill Buttons */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={styles.actionBtnSecondary}
          onPress={() => router.push('/(tabs)/jurnal')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="notebook-plus"
            size={20}
            color={ThemeColors.primary}
          />
          <Text style={styles.actionBtnSecondaryText}>+ Catat Jurnal</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtnPrimary}
          onPress={() => router.push('/(tabs)/panen')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="basket-plus"
            size={20}
            color={ThemeColors.onPrimary}
          />
          <Text style={styles.actionBtnPrimaryText}>+ Catat Panen</Text>
        </TouchableOpacity>
      </View>

      {/* Dual Metric Cards */}
      <View style={styles.dualCardsRow}>
        {/* Card 1: Active Lands */}
        <AppCard style={styles.metricCardWhite}>
          <View style={styles.metricTopRow}>
            <View style={styles.metricIconBox}>
              <MaterialCommunityIcons
                name="sprout"
                size={22}
                color={ThemeColors.primary}
              />
            </View>
            <View style={styles.metricActiveBadge}>
              <Text style={styles.metricActiveBadgeText}>Aktif</Text>
            </View>
          </View>
          <View style={styles.metricMid}>
            <Text style={styles.metricBigNumber}>{lahanList.length} Lahan</Text>
            <Text style={styles.metricSubtext} numberOfLines={1}>
              {lahanList.length > 0
                ? lahanList.map((l) => l.nama).join(', ')
                : 'Belum ada petak'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.metricFooterRow}
            onPress={() => router.push('/(tabs)/lahan')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="arrow-right-circle"
              size={16}
              color={ThemeColors.primary}
            />
            <Text style={styles.metricFooterText}>Lihat Semua Lahan</Text>
          </TouchableOpacity>
        </AppCard>

        {/* Card 2: Operations & Urgent Task (Dark Telemetry Pod) */}
        <DarkSummaryCard style={styles.metricCardDark}>
          <View style={styles.metricTopRow}>
            <View style={styles.metricDarkIconBox}>
              <MaterialCommunityIcons
                name="format-list-checks"
                size={20}
                color={ThemeColors.secondaryFixed}
              />
            </View>
            <View style={styles.taskBadgeDark}>
              <View style={styles.taskPulseDot} />
              <Text style={styles.taskBadgeDarkText}>
                {tugasBelumSelesai} Tertunda
              </Text>
            </View>
          </View>
          <View style={styles.metricMid}>
            <Text style={styles.metricBigNumberDark}>{persenSelesai}%</Text>
            <Text style={styles.metricSubtextDark}>Tugas selesai hari ini</Text>
          </View>
          <TouchableOpacity
            style={styles.metricFooterDarkRow}
            onPress={() => router.push('/(tabs)/jadwal')}
            activeOpacity={0.7}
          >
            <Text style={styles.metricFooterDarkText}>
              {tugasBelumSelesai > 0 ? 'Selesaikan Tugas' : 'Semua Beres!'}
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={16}
              color={ThemeColors.secondaryFixed}
            />
          </TouchableOpacity>
        </DarkSummaryCard>
      </View>

      {/* Week 7: Device Sensor Telemetry & Shake-to-Refresh Module */}
      <SensorDisplayCard
        onShakeRefresh={handleShakeRefresh}
        isRefreshing={refreshing}
      />

      {/* Route Timeline: Jadwal Perawatan Hari Ini */}
      <SectionHeader
        title="Rute Perawatan Hari Ini"
        icon={
          <MaterialCommunityIcons
            name="routes"
            size={20}
            color={ThemeColors.primary}
          />
        }
        rightAction={
          <TouchableOpacity onPress={() => router.push('/(tabs)/jadwal')}>
            <Text style={styles.seeAllText}>Lihat Semua</Text>
          </TouchableOpacity>
        }
      />

      <AppCard style={styles.timelineCard}>
        {jadwalHariIni.length === 0 ? (
          <EmptyState
            iconName="calendar-check"
            title="Tidak Ada Jadwal Hari Ini"
            description="Semua agenda perawatan tanaman Anda untuk hari ini telah selesai atau belum ditambahkan."
          />
        ) : (
          jadwalHariIni.map((jadwal, index) => {
            const lahan = lahanList.find((l) => l.id === jadwal.idLahan);
            const isLast = index === jadwalHariIni.length - 1;

            return (
              <View key={jadwal.id} style={styles.timelineItem}>
                {/* Route Node Indicator */}
                <View style={styles.timelineNodeCol}>
                  <TouchableOpacity
                    style={[
                      styles.timelineNode,
                      jadwal.selesai
                        ? styles.timelineNodeDone
                        : styles.timelineNodePending,
                    ]}
                    onPress={() => toggleJadwalSelesai(jadwal.id)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={jadwal.selesai ? 'check' : 'clock-outline'}
                      size={16}
                      color={
                        jadwal.selesai
                          ? ThemeColors.onPrimary
                          : ThemeColors.primary
                      }
                    />
                  </TouchableOpacity>
                  {!isLast && <View style={styles.timelineConnector} />}
                </View>

                {/* Task Details */}
                <View style={styles.timelineContent}>
                  <View style={styles.timelineMetaRow}>
                    <Text style={styles.timelineTimeText}>
                      {jadwal.waktu} WIB • {lahan?.nama || 'Lahan Terkait'}
                    </Text>
                    <View
                      style={[
                        styles.taskStatusPill,
                        jadwal.selesai
                          ? styles.taskStatusPillDone
                          : styles.taskStatusPillPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.taskStatusPillText,
                          jadwal.selesai
                            ? styles.taskStatusPillTextDone
                            : styles.taskStatusPillTextPending,
                        ]}
                      >
                        {jadwal.selesai ? 'Selesai' : 'Menunggu'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.timelineTaskTitle}>
                    {jadwal.kegiatan}
                  </Text>
                  <Text style={styles.timelineTaskDesc}>
                    {jadwal.selesai
                      ? 'Telah diverifikasi dikerjakan di lapangan'
                      : 'Ketuk ikon centang setelah tugas selesai dikerjakan'}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </AppCard>

      {/* Field Conditions & Agronomist Insight Tip */}
      <AppCard style={styles.insightCard}>
        <View style={styles.insightHeader}>
          <View style={styles.insightHeaderLeft}>
            <MaterialCommunityIcons
              name="lightbulb-on-outline"
              size={20}
              color={ThemeColors.primary}
            />
            <Text style={styles.insightTitle}>Saran Agronomis Hari Ini</Text>
          </View>
          <View style={styles.insightBadge}>
            <Text style={styles.insightBadgeText}>Tips Budidaya</Text>
          </View>
        </View>
        <Text style={styles.insightBody}>
          Waktu paling efektif untuk penyiraman dan pemupukan cair adalah di pagi hari sebelum pukul 09:00 WIB atau sore setelah pukul 16:00 WIB agar penguapan tanah minimal.
        </Text>
      </AppCard>

      {/* Latest Journal Entries */}
      <SectionHeader
        title="Jurnal Terakhir"
        icon={
          <MaterialCommunityIcons
            name="notebook-outline"
            size={20}
            color={ThemeColors.primary}
          />
        }
        rightAction={
          <TouchableOpacity onPress={() => router.push('/(tabs)/jurnal')}>
            <Text style={styles.seeAllText}>Riwayat Jurnal</Text>
          </TouchableOpacity>
        }
      />

      {jurnalList.length === 0 ? (
        <AppCard style={styles.emptyCard}>
          <EmptyState
            iconName="notebook-outline"
            title="Belum Ada Catatan Jurnal"
            description="Catat perkembangan tanaman, pemupukan, atau pengeluaran biaya operasional harian Anda."
          />
        </AppCard>
      ) : (
        jurnalList.slice(0, 2).map((jurnal) => {
          const lahan = lahanList.find((l) => l.id === jurnal.idLahan);
          return (
            <AppCard key={jurnal.id} style={styles.journalCard}>
              <View style={styles.journalHeader}>
                <View style={styles.journalHeaderLeft}>
                  <View style={styles.journalIconCircle}>
                    <MaterialCommunityIcons
                      name={
                        jurnal.biaya > 0 ? 'cash-minus' : 'file-document-outline'
                      }
                      size={20}
                      color={
                        jurnal.biaya > 0 ? ThemeColors.loss : ThemeColors.primary
                      }
                    />
                  </View>
                  <View>
                    <Text style={styles.journalLahanName}>
                      {lahan?.nama || 'Petak Lahan'}
                    </Text>
                    <Text style={styles.journalDate}>{jurnal.tanggal}</Text>
                  </View>
                </View>
                {jurnal.biaya > 0 ? (
                  <View style={styles.journalExpenseBadge}>
                    <Text style={styles.journalExpenseText}>
                      - {formatRupiah(jurnal.biaya)}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.journalObservationBadge}>
                    <Text style={styles.journalObservationText}>Observasi</Text>
                  </View>
                )}
              </View>
              <View style={styles.journalNoteBox}>
                <Text style={styles.journalNoteText} numberOfLines={2}>
                  {jurnal.catatan}
                </Text>
              </View>
            </AppCard>
          );
        })
      )}

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
    padding: Spacing.margin,
    paddingTop: Spacing.sm,
  },
  greetingSection: {
    marginBottom: Spacing.md,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  greetingTextCol: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ThemeColors.text,
    letterSpacing: -0.3,
  },
  waveHand: {
    fontSize: 20,
  },
  greetingDate: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    marginTop: 2,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    ...Shadows.subtle,
  },
  weatherText: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.text,
    marginLeft: 4,
  },
  diagnosticPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ThemeColors.surfaceSageLight,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  diagnosticLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  diagnosticText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.primary,
    marginLeft: 6,
  },
  diagnosticTag: {
    backgroundColor: ThemeColors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  diagnosticTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.primary,
    letterSpacing: 0.3,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  actionBtnSecondary: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.surfaceTintGreen,
    borderRadius: Radius.full,
    ...Shadows.subtle,
  },
  actionBtnSecondaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: ThemeColors.primary,
    marginLeft: 6,
  },
  actionBtnPrimary: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.primary,
    borderRadius: Radius.full,
    ...Shadows.button,
  },
  actionBtnPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: ThemeColors.onPrimary,
    marginLeft: 6,
  },
  dualCardsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metricCardWhite: {
    flex: 1,
    minHeight: 148,
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: Radius.xxl,
  },
  metricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricActiveBadge: {
    backgroundColor: ThemeColors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  metricActiveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.onSecondaryContainer,
  },
  metricMid: {
    marginVertical: 4,
  },
  metricBigNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: ThemeColors.text,
    letterSpacing: -0.3,
  },
  metricSubtext: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginTop: 2,
  },
  metricFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  metricFooterText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
    marginLeft: 4,
  },
  metricCardDark: {
    flex: 1,
    minHeight: 148,
    justifyContent: 'space-between',
    padding: Spacing.md,
  },
  metricDarkIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskBadgeDark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  taskPulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: ThemeColors.secondaryFixed,
    marginRight: 4,
  },
  taskBadgeDarkText: {
    fontSize: 10,
    fontWeight: '600',
    color: ThemeColors.onDark,
  },
  metricBigNumberDark: {
    fontSize: 22,
    fontWeight: '700',
    color: ThemeColors.onDark,
    letterSpacing: -0.3,
  },
  metricSubtextDark: {
    fontSize: 12,
    color: ThemeColors.onDarkSecondary,
    marginTop: 2,
  },
  metricFooterDarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  metricFooterDarkText: {
    fontSize: 11,
    fontWeight: '600',
    color: ThemeColors.secondaryFixed,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  timelineCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  timelineNodeCol: {
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  timelineNode: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  timelineNodeDone: {
    backgroundColor: ThemeColors.primary,
  },
  timelineNodePending: {
    backgroundColor: ThemeColors.surfaceSageLight,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: ThemeColors.primaryFixedDim,
    marginVertical: 4,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  timelineTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
    letterSpacing: 0.3,
  },
  taskStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  taskStatusPillDone: {
    backgroundColor: ThemeColors.surfaceTintGreen,
  },
  taskStatusPillPending: {
    backgroundColor: ThemeColors.surfaceLow,
  },
  taskStatusPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  taskStatusPillTextDone: {
    color: ThemeColors.profit,
  },
  taskStatusPillTextPending: {
    color: ThemeColors.textSecondary,
  },
  timelineTaskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  timelineTaskDesc: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  insightCard: {
    backgroundColor: ThemeColors.surfaceTintGreen,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  insightHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ThemeColors.text,
    marginLeft: 6,
  },
  insightBadge: {
    backgroundColor: ThemeColors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  insightBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  insightBody: {
    fontSize: 12,
    color: ThemeColors.text,
    lineHeight: 18,
  },
  emptyCard: {
    padding: Spacing.md,
  },
  journalCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  journalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  journalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  journalIconCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: ThemeColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  journalLahanName: {
    fontSize: 14,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  journalDate: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    marginTop: 1,
  },
  journalExpenseBadge: {
    backgroundColor: ThemeColors.errorContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  journalExpenseText: {
    fontSize: 12,
    fontWeight: '700',
    color: ThemeColors.loss,
  },
  journalObservationBadge: {
    backgroundColor: ThemeColors.surfaceTintGreen,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  journalObservationText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  journalNoteBox: {
    backgroundColor: ThemeColors.surfaceLow,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: 4,
  },
  journalNoteText: {
    fontSize: 13,
    color: ThemeColors.text,
    lineHeight: 18,
  },
});
