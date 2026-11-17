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
import { ThemeColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { useAppContext } from '../../context/AppContext';
import { AppCard } from '../../components/AppCard';
import { DarkSummaryCard } from '../../components/DarkSummaryCard';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';

type FilterType = 'Semua' | 'Hari Ini' | 'Selesai';

export default function JadwalScreen() {
  const {
    jadwalList,
    lahanList,
    addJadwal,
    toggleJadwalSelesai,
    isLoading,
    error,
    apiStatus,
    statusCode,
    isSimulationActive,
    refetchAll,
  } = useAppContext();
  const [filter, setFilter] = useState<FilterType>('Semua');
  const [selectedParcelId, setSelectedParcelId] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);

  const [waktu, setWaktu] = useState('');
  const [kegiatan, setKegiatan] = useState('');
  const [selectedLahanId, setSelectedLahanId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const handleAdd = async () => {
    setFormError(null);
    if (!waktu.trim() || !kegiatan.trim() || !selectedLahanId) {
      setFormError('Harap pilih lahan, isi waktu, dan nama kegiatan perawatan.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addJadwal({
        idLahan: selectedLahanId,
        tanggal: todayStr,
        waktu: waktu.trim(),
        kegiatan: kegiatan.trim(),
      });

      setWaktu('');
      setKegiatan('');
      setSelectedLahanId('');
      setIsAdding(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan jadwal ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter schedules
  const filteredJadwal = jadwalList.filter((j) => {
    // Filter by parcel
    if (selectedParcelId !== 'all' && j.idLahan !== selectedParcelId) {
      return false;
    }
    // Filter by status tab
    if (filter === 'Hari Ini') return j.tanggal === todayStr;
    if (filter === 'Selesai') return j.selesai;
    return true; // Semua
  });

  const totalSelesai = jadwalList.filter((j) => j.selesai).length;
  const persenSiap =
    jadwalList.length > 0
      ? Math.round((totalSelesai / jadwalList.length) * 100)
      : 100;

  // Weekly Date Strip mock
  const weekDays = [
    { day: 'Sen', date: '12', active: true },
    { day: 'Sel', date: '13', active: false },
    { day: 'Rab', date: '14', active: false },
    { day: 'Kam', date: '15', active: false },
    { day: 'Jum', date: '16', active: false },
    { day: 'Sab', date: '17', active: false },
    { day: 'Min', date: '18', active: false },
  ];

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ThemeColors.primary} />
        <Text style={styles.loadingText}>Memuat jadwal perawatan dari REST API...</Text>
      </View>
    );
  }

  // Error / Offline / Timeout Full Screen State (Tampil saat simulasi aktif atau jika data kosong dan terjadi error)
  if (error && (isSimulationActive || jadwalList.length === 0)) {
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

      {/* Top AI Smart Agronomy Dark Pod */}
      <DarkSummaryCard style={styles.summaryPod}>
        <View style={styles.summaryTopRow}>
          <View style={styles.aiTag}>
            <MaterialCommunityIcons
              name="cloud-check"
              size={13}
              color={ThemeColors.secondaryFixed}
            />
            <Text style={styles.aiTagText}>🟢 Cloud REST API Active</Text>
          </View>
          <Text style={styles.monthTagText}>Musim Tanam 2026</Text>
        </View>

        <View style={styles.summaryMainRow}>
          <View>
            <Text style={styles.summaryPodTitle}>Jadwal Perawatan</Text>
            <Text style={styles.summaryPodSubtitle}>
              {totalSelesai} dari {jadwalList.length} tugas telah selesai
            </Text>
          </View>
          <View style={styles.percentCol}>
            <Text style={styles.percentText}>{persenSiap}%</Text>
            <Text style={styles.percentLabel}>SELESAI</Text>
          </View>
        </View>

        {/* Progress Pill Bar */}
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.min(100, Math.max(8, persenSiap))}%` },
            ]}
          />
        </View>
      </DarkSummaryCard>

      {/* Horizontal Weekly Date Strip */}
      <View style={styles.weekSection}>
        <View style={styles.weekHeader}>
          <View style={styles.weekTitleRow}>
            <MaterialCommunityIcons
              name="calendar-month-outline"
              size={16}
              color={ThemeColors.primary}
            />
            <Text style={styles.weekTitle}>Pekan Ini</Text>
          </View>
          <Text style={styles.weekSub}>Hari Ini Aktif</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateStrip}
        >
          {weekDays.map((item) => (
            <View
              key={item.day}
              style={[
                styles.dateChip,
                item.active && styles.dateChipActive,
              ]}
            >
              <Text
                style={[
                  styles.dateChipDay,
                  item.active && styles.dateChipDayActive,
                ]}
              >
                {item.day}
              </Text>
              <Text
                style={[
                  styles.dateChipDate,
                  item.active && styles.dateChipDateActive,
                ]}
              >
                {item.date}
              </Text>
              {item.active && <View style={styles.activeDateDot} />}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Parcel Selector Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.parcelChipsRow}
      >
        <TouchableOpacity
          style={[
            styles.parcelChip,
            selectedParcelId === 'all' && styles.parcelChipActive,
          ]}
          onPress={() => setSelectedParcelId('all')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="sprout"
            size={16}
            color={
              selectedParcelId === 'all'
                ? ThemeColors.onPrimary
                : ThemeColors.primary
            }
          />
          <Text
            style={[
              styles.parcelChipText,
              selectedParcelId === 'all' && styles.parcelChipTextActive,
            ]}
          >
            Semua Lahan
          </Text>
        </TouchableOpacity>

        {lahanList.map((lahan) => {
          const isSelected = selectedParcelId === lahan.id;
          return (
            <TouchableOpacity
              key={lahan.id}
              style={[
                styles.parcelChip,
                isSelected && styles.parcelChipActive,
              ]}
              onPress={() => setSelectedParcelId(lahan.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.parcelChipText,
                  isSelected && styles.parcelChipTextActive,
                ]}
              >
                {lahan.nama}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Status Filter Segmented Control & Add Button */}
      <View style={styles.filterAndActionRow}>
        <View style={styles.segmentedControl}>
          {(['Semua', 'Hari Ini', 'Selesai'] as FilterType[]).map((f) => {
            const isActive = filter === f;
            return (
              <TouchableOpacity
                key={f}
                style={[
                  styles.segmentBtn,
                  isActive && styles.segmentBtnActive,
                ]}
                onPress={() => setFilter(f)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentBtnText,
                    isActive && styles.segmentBtnTextActive,
                  ]}
                >
                  {f}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setIsAdding(!isAdding);
            setFormError(null);
          }}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name={isAdding ? 'close' : 'plus'}
            size={18}
            color={ThemeColors.onPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Collapsible Add Schedule Form */}
      {isAdding && (
        <AppCard style={styles.formCard}>
          <Text style={styles.formTitle}>Tambah Jadwal Perawatan (Hari Ini)</Text>

          {formError && (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={16}
                color={ThemeColors.loss}
              />
              <Text style={styles.errorBoxText}>{formError}</Text>
            </View>
          )}

          <Text style={styles.inputLabel}>Pilih Lahan Target</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lahanSelectorRow}
          >
            {lahanList.map((lahan) => {
              const isSelected = selectedLahanId === lahan.id;
              return (
                <TouchableOpacity
                  key={lahan.id}
                  style={[
                    styles.lahanSelectChip,
                    isSelected && styles.lahanSelectChipSelected,
                  ]}
                  onPress={() => setSelectedLahanId(lahan.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.lahanSelectChipText,
                      isSelected && styles.lahanSelectChipTextSelected,
                    ]}
                  >
                    {lahan.nama}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <FormInput
            label="Waktu Kegiatan"
            placeholder="contoh: 07:00 atau 16:30"
            value={waktu}
            onChangeText={setWaktu}
            leftIcon={
              <MaterialCommunityIcons
                name="clock-outline"
                size={18}
                color={ThemeColors.textMuted}
              />
            }
          />

          <FormInput
            label="Nama Kegiatan Perawatan"
            placeholder="contoh: Penyiraman Air & Pupuk Cair NPK"
            value={kegiatan}
            onChangeText={setKegiatan}
            leftIcon={
              <MaterialCommunityIcons
                name="watering-can-outline"
                size={18}
                color={ThemeColors.textMuted}
              />
            }
          />

          <PrimaryButton
            title="Simpan Jadwal"
            onPress={handleAdd}
            loading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={
              <MaterialCommunityIcons
                name="calendar-check"
                size={18}
                color={ThemeColors.onPrimary}
              />
            }
            style={styles.submitBtn}
          />
        </AppCard>
      )}

      {/* Task List / Timeline Cards */}
      {filteredJadwal.length === 0 ? (
        <AppCard style={styles.emptyCard}>
          <EmptyState
            iconName="calendar-blank-outline"
            title="Tidak Ada Jadwal Perawatan"
            description="Tidak ada tugas perawatan yang cocok dengan filter yang dipilih."
            action={
              <PrimaryButton
                title="+ Tambah Jadwal Baru"
                onPress={() => setIsAdding(true)}
              />
            }
          />
        </AppCard>
      ) : (
        <View style={styles.timelineList}>
          {filteredJadwal.map((jadwal) => {
            const lahan = lahanList.find((l) => l.id === jadwal.idLahan);

            return (
              <AppCard key={jadwal.id} style={styles.taskCard}>
                <View style={styles.taskCardRow}>
                  {/* Pin Status Icon */}
                  <View
                    style={[
                      styles.taskIconPin,
                      jadwal.selesai
                        ? styles.taskIconPinDone
                        : styles.taskIconPinPending,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={
                        jadwal.selesai ? 'check-circle' : 'clock-alert-outline'
                      }
                      size={20}
                      color={
                        jadwal.selesai
                          ? ThemeColors.profit
                          : ThemeColors.warning
                      }
                    />
                  </View>

                  {/* Task Details */}
                  <View style={styles.taskDetailCol}>
                    <View style={styles.taskMetaRow}>
                      <View style={styles.timeBadge}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={13}
                          color={ThemeColors.primary}
                        />
                        <Text style={styles.timeBadgeText}>
                          {jadwal.waktu} WIB
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          jadwal.selesai
                            ? styles.statusBadgeDone
                            : styles.statusBadgePending,
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: jadwal.selesai
                                ? ThemeColors.profit
                                : ThemeColors.warning,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color: jadwal.selesai
                                ? ThemeColors.profit
                                : ThemeColors.warning,
                            },
                          ]}
                        >
                          {jadwal.selesai ? 'Selesai' : 'Menunggu'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.taskTitle}>{jadwal.kegiatan}</Text>

                    <View style={styles.parcelInfoRow}>
                      <MaterialCommunityIcons
                        name="sprout"
                        size={15}
                        color={ThemeColors.primary}
                      />
                      <Text style={styles.parcelInfoText}>
                        {lahan?.nama || 'Lahan Tidak Diketahui'} •{' '}
                        {lahan?.tanaman || 'Tanaman'}
                      </Text>
                    </View>

                    {/* Action Mark Button */}
                    <View style={styles.taskActionRow}>
                      <TouchableOpacity
                        style={[
                          styles.toggleActionBtn,
                          jadwal.selesai && styles.toggleActionBtnDone,
                        ]}
                        onPress={() => toggleJadwalSelesai(jadwal.id)}
                        activeOpacity={0.85}
                      >
                        <MaterialCommunityIcons
                          name={
                            jadwal.selesai
                              ? 'check-circle-outline'
                              : 'checkbox-marked-circle'
                          }
                          size={16}
                          color={
                            jadwal.selesai
                              ? ThemeColors.textSecondary
                              : ThemeColors.onPrimary
                          }
                        />
                        <Text
                          style={[
                            styles.toggleActionBtnText,
                            jadwal.selesai && styles.toggleActionBtnTextDone,
                          ]}
                        >
                          {jadwal.selesai
                            ? 'Batal Selesai'
                            : 'Tandai Selesai'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </AppCard>
            );
          })}
        </View>
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
  summaryPod: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  aiTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.secondaryFixed,
    marginLeft: 5,
  },
  monthTagText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  summaryMainRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 10,
  },
  summaryPodTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ThemeColors.onDark,
    letterSpacing: -0.3,
  },
  summaryPodSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 2,
  },
  percentCol: {
    alignItems: 'flex-end',
  },
  percentText: {
    fontSize: 22,
    fontWeight: '700',
    color: ThemeColors.secondaryFixed,
  },
  percentLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 0.5,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ThemeColors.secondaryFixed,
    borderRadius: Radius.full,
  },
  weekSection: {
    marginBottom: Spacing.md,
  },
  weekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs + 2,
  },
  weekTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.text,
    marginLeft: 5,
  },
  weekSub: {
    fontSize: 11,
    color: ThemeColors.primary,
    fontWeight: '600',
  },
  dateStrip: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  dateChip: {
    width: 52,
    height: 70,
    borderRadius: Radius.md,
    backgroundColor: ThemeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  dateChipActive: {
    backgroundColor: ThemeColors.primary,
    ...Shadows.button,
  },
  dateChipDay: {
    fontSize: 11,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  dateChipDayActive: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  dateChipDate: {
    fontSize: 17,
    fontWeight: '700',
    color: ThemeColors.text,
    marginTop: 2,
  },
  dateChipDateActive: {
    color: ThemeColors.onPrimary,
  },
  activeDateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ThemeColors.secondaryFixed,
    marginTop: 4,
  },
  parcelChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
    paddingVertical: 2,
  },
  parcelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surface,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  parcelChipActive: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  parcelChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: ThemeColors.text,
    marginLeft: 5,
  },
  parcelChipTextActive: {
    color: ThemeColors.onPrimary,
  },
  filterAndActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  segmentedControl: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: ThemeColors.surfaceHigh,
    padding: 3,
    borderRadius: Radius.full,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentBtnActive: {
    backgroundColor: ThemeColors.surface,
    ...Shadows.subtle,
  },
  segmentBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  segmentBtnTextActive: {
    color: ThemeColors.primary,
    fontWeight: '700',
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  formCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
    marginBottom: Spacing.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  errorBoxText: {
    fontSize: 12,
    color: ThemeColors.loss,
    fontWeight: '600',
    marginLeft: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ThemeColors.text,
    marginBottom: Spacing.xs,
  },
  lahanSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  lahanSelectChip: {
    backgroundColor: ThemeColors.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  lahanSelectChipSelected: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  lahanSelectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.text,
  },
  lahanSelectChipTextSelected: {
    color: ThemeColors.onPrimary,
  },
  submitBtn: {
    marginTop: Spacing.xs,
  },
  emptyCard: {
    padding: Spacing.md,
  },
  timelineList: {
    gap: Spacing.sm,
  },
  taskCard: {
    padding: Spacing.md,
  },
  taskCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  taskIconPin: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  taskIconPinDone: {
    backgroundColor: ThemeColors.surfaceTintGreen,
  },
  taskIconPinPending: {
    backgroundColor: '#FFF3E0',
  },
  taskDetailCol: {
    flex: 1,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceTintGreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  timeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusBadgeDone: {
    backgroundColor: ThemeColors.surfaceTintGreen,
  },
  statusBadgePending: {
    backgroundColor: '#FFF3E0',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.text,
    lineHeight: 20,
    marginBottom: 4,
  },
  parcelInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  parcelInfoText: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginLeft: 5,
  },
  taskActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: ThemeColors.border,
    paddingTop: 8,
  },
  toggleActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    ...Shadows.subtle,
  },
  toggleActionBtnDone: {
    backgroundColor: ThemeColors.surfaceLow,
  },
  toggleActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: ThemeColors.onPrimary,
    marginLeft: 5,
  },
  toggleActionBtnTextDone: {
    color: ThemeColors.textSecondary,
  },
});
