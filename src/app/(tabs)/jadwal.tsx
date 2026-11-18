import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors, Radius, Spacing } from '../../constants/theme';
import { useAppContext } from '../../context/AppContext';
import { scheduleJadwalNotification } from '../../services/notifications';
import { AppCard } from '../../components/AppCard';
import { FormModal } from '../../components/FormModal';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';

type FilterType = 'Semua' | 'Hari Ini' | 'Tertunda' | 'Selesai';

export default function JadwalScreen() {
  const insets = useSafeAreaInsets();
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
  const [selectedDay, setSelectedDay] = useState<string>('12');
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
      const targetLahan = lahanList.find((l) => l.id === selectedLahanId);

      await addJadwal({
        idLahan: selectedLahanId,
        tanggal: todayStr,
        waktu: waktu.trim(),
        kegiatan: kegiatan.trim(),
      });

      // Jadwalkan notifikasi lokal pengingat otomatis pukul 06:00 WIB
      await scheduleJadwalNotification(
        kegiatan.trim(),
        todayStr,
        waktu.trim(),
        targetLahan?.nama
      );

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

  const filteredJadwal = jadwalList.filter((j) => {
    if (selectedParcelId !== 'all' && j.idLahan !== selectedParcelId) {
      return false;
    }
    if (filter === 'Hari Ini') return j.tanggal === todayStr;
    if (filter === 'Tertunda') return !j.selesai;
    if (filter === 'Selesai') return j.selesai;
    return true;
  });

  const totalHariIni = jadwalList.filter((j) => j.tanggal === todayStr).length;
  const totalTertunda = jadwalList.filter((j) => !j.selesai).length;
  const totalSelesai = jadwalList.filter((j) => j.selesai).length;

  const weekDays = [
    { day: 'Sen', date: '12', hasEvent: true },
    { day: 'Sel', date: '13', hasEvent: true },
    { day: 'Rab', date: '14', hasEvent: false },
    { day: 'Kam', date: '15', hasEvent: true },
    { day: 'Jum', date: '16', hasEvent: true },
    { day: 'Sab', date: '17', hasEvent: false },
    { day: 'Min', date: '18', hasEvent: false },
  ];

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ThemeColors.primaryContainer} />
        <Text style={styles.loadingText}>Memuat jadwal perawatan...</Text>
      </View>
    );
  }

  if (error && (isSimulationActive || jadwalList.length === 0)) {
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
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 28,
          },
        ]}
        keyboardShouldPersistTaps="handled"
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
      {error && jadwalList.length > 0 && (
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
      {/* 1. Greeting & Quick Stats Header (Modern Agritech Precision) */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.monthTagText}>MUSIM TANAM 2026</Text>
          <Text style={styles.pageTitle}>Jadwal Perawatan</Text>
        </View>
        <View style={styles.weekPill}>
          <MaterialCommunityIcons
            name="calendar-clock"
            size={16}
            color="#006C49"
          />
          <Text style={styles.weekPillText}>Pekan Aktif</Text>
        </View>
      </View>

      {/* 2. Horizontal Weekly Calendar Selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateStrip}
      >
        {weekDays.map((item) => {
          const isActive = selectedDay === item.date;
          return (
            <TouchableOpacity
              key={item.day}
              style={[styles.dateChip, isActive && styles.dateChipActive]}
              onPress={() => setSelectedDay(item.date)}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.dateChipDay,
                  isActive && styles.dateChipDayActive,
                ]}
              >
                {item.day}
              </Text>
              <Text
                style={[
                  styles.dateChipDate,
                  isActive && styles.dateChipDateActive,
                ]}
              >
                {item.date}
              </Text>
              <View
                style={[
                  styles.dateEventDot,
                  isActive
                    ? { backgroundColor: '#6CF8BB' }
                    : item.hasEvent
                      ? { backgroundColor: '#DAE2FD' }
                      : { backgroundColor: 'transparent' },
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. Field Weather Micro-Widget (Agronomic Advisory) */}
      <View style={styles.weatherMicroWidget}>
        <View style={styles.weatherMicroLeft}>
          <View style={styles.weatherMicroIconBox}>
            <MaterialCommunityIcons
              name="weather-partly-cloudy"
              size={24}
              color="#006C49"
            />
          </View>
          <View>
            <View style={styles.weatherTempRow}>
              <Text style={styles.weatherTempTitle}>28°C</Text>
              <View style={styles.weatherInlineDot} />
              <Text style={styles.weatherConditionText}>Cerah Berawan</Text>
            </View>
            <View style={styles.weatherSprayRow}>
              <MaterialCommunityIcons
                name="leaf"
                size={13}
                color="#00714D"
              />
              <Text style={styles.weatherSprayText}>
                Semprot optimal: {'<'} 09:30 WIB
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.weatherInfoCircle}>
          <MaterialCommunityIcons
            name="information-outline"
            size={16}
            color="#00442F"
          />
        </View>
      </View>

      {/* 4. Task Category Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsRow}
      >
        {(
          [
            { key: 'Semua', label: `Semua (${jadwalList.length})` },
            { key: 'Hari Ini', label: `Hari Ini (${totalHariIni})` },
            { key: 'Tertunda', label: `Tertunda (${totalTertunda})` },
            { key: 'Selesai', label: `Selesai (${totalSelesai})` },
          ] as { key: FilterType; label: string }[]
        ).map((tab) => {
          const isActive = filter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.categoryChip,
                isActive && styles.categoryChipActive,
              ]}
              onPress={() => setFilter(tab.key)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  isActive && styles.categoryChipTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Parcel Filter Chips */}
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
          <Text
            style={[
              styles.parcelChipText,
              selectedParcelId === 'all' && styles.parcelChipTextActive,
            ]}
          >
            Semua Petak
          </Text>
        </TouchableOpacity>
        {lahanList.map((lahan) => {
          const active = selectedParcelId === lahan.id;
          return (
            <TouchableOpacity
              key={lahan.id}
              style={[styles.parcelChip, active && styles.parcelChipActive]}
              onPress={() => setSelectedParcelId(lahan.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.parcelChipText,
                  active && styles.parcelChipTextActive,
                ]}
              >
                {lahan.nama}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 5. Section Heading: Agenda Perawatan */}
      <View style={styles.agendaHeadingRow}>
        <Text style={styles.agendaHeadingTitle}>Agenda Perawatan</Text>
        <Text style={styles.agendaHeadingDate}>
          {selectedDay} Okt • Hari Ini
        </Text>
      </View>

      {/* 6. Task Cards List */}
      {filteredJadwal.length === 0 ? (
        <AppCard style={styles.emptyCard}>
          <EmptyState
            iconName="calendar-check-outline"
            title="Tidak Ada Jadwal pada Filter Ini"
            description="Tambahkan jadwal perawatan baru atau ubah filter kategori."
          />
        </AppCard>
      ) : (
        <View style={styles.tasksStack}>
          {filteredJadwal.map((jadwal) => {
            const lahan = lahanList.find((l) => l.id === jadwal.idLahan);
            return (
              <View
                key={jadwal.id}
                style={[
                  styles.taskCard,
                  !jadwal.selesai && styles.taskCardPriority,
                ]}
              >
                {!jadwal.selesai && <View style={styles.priorityLeftStrip} />}

                {/* Top Metadata & Status */}
                <View style={styles.taskTopMetaRow}>
                  <View style={styles.taskMetaLeft}>
                    <View
                      style={[
                        styles.timeBadge,
                        !jadwal.selesai && styles.timeBadgeUrgent,
                      ]}
                    >
                      {!jadwal.selesai && (
                        <MaterialCommunityIcons
                          name="alarm"
                          size={12}
                          color="#93000A"
                        />
                      )}
                      <Text
                        style={[
                          styles.timeBadgeText,
                          !jadwal.selesai && styles.timeBadgeTextUrgent,
                        ]}
                      >
                        {jadwal.waktu} WIB
                      </Text>
                    </View>

                    <View style={styles.locationInline}>
                      <MaterialCommunityIcons
                        name="map-marker-outline"
                        size={14}
                        color={ThemeColors.textSecondary}
                      />
                      <Text style={styles.locationInlineText} numberOfLines={1}>
                        {lahan?.nama || 'Blok Sawah Barat'}
                      </Text>
                    </View>
                  </View>

                  {jadwal.selesai ? (
                    <View style={styles.statusPillDone}>
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={13}
                        color="#00714D"
                      />
                      <Text style={styles.statusPillDoneText}>Selesai</Text>
                    </View>
                  ) : (
                    <View style={styles.statusPillPriority}>
                      <Text style={styles.statusPillPriorityText}>
                        PRIORITAS
                      </Text>
                    </View>
                  )}
                </View>

                {/* Task Body */}
                <View style={styles.taskBodyRow}>
                  <TouchableOpacity
                    style={[
                      styles.checkboxSquare,
                      jadwal.selesai && styles.checkboxSquareChecked,
                    ]}
                    onPress={() => toggleJadwalSelesai(jadwal.id)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Centang tugas ${jadwal.kegiatan}`}
                  >
                    {jadwal.selesai && (
                      <MaterialCommunityIcons
                        name="check"
                        size={16}
                        color="#FFFFFF"
                      />
                    )}
                  </TouchableOpacity>

                  <View style={styles.taskBodyTextCol}>
                    <Text
                      style={[
                        styles.taskCardTitle,
                        jadwal.selesai && styles.taskCardTitleDone,
                      ]}
                    >
                      {jadwal.kegiatan}
                    </Text>
                    <Text style={styles.taskCardDesc}>
                      {jadwal.selesai
                        ? `Telah diselesaikan pada petak ${lahan?.nama || 'Lahan Utama'}.`
                        : `Pastikan dosis dan prosedur perawatan sesuai standar agronomi pada ${lahan?.nama || 'Lahan Utama'}.`}
                    </Text>
                  </View>
                </View>

                {/* Inline Visual Footer */}
                <View style={styles.taskFooterStrip}>
                  <View style={styles.taskFooterLeft}>
                    <MaterialCommunityIcons
                      name={
                        jadwal.selesai
                          ? 'account-check-outline'
                          : 'alert-outline'
                      }
                      size={15}
                      color={jadwal.selesai ? '#006C49' : '#BA1A1A'}
                    />
                    <Text style={styles.taskFooterLeftText}>
                      {jadwal.selesai
                        ? 'Pelaksana: Tim Lapangan'
                        : 'Batas pengerjaan sore hari'}
                    </Text>
                  </View>

                  {jadwal.selesai ? (
                    <Text style={styles.taskFooterRightDone}>
                      Tuntas {jadwal.waktu} WIB
                    </Text>
                  ) : (
                    <TouchableOpacity
                      style={styles.startNowPillBtn}
                      onPress={() => toggleJadwalSelesai(jadwal.id)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name="play"
                        size={13}
                        color="#00442F"
                      />
                      <Text style={styles.startNowPillText}>
                        Tandai Selesai
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* 7. Agritech Field Note Banner */}
      <View style={styles.fieldTipBanner}>
        <MaterialCommunityIcons
          name="lightbulb-on-outline"
          size={22}
          color="#006C49"
        />
        <Text style={styles.fieldTipText}>
          Penyemprotan pagi hari meningkatkan penyerapan stomata tanaman padi
          hingga 40% lebih efektif.
        </Text>
      </View>

      <View style={{ height: 40 }} />
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={[
          styles.fabButton,
          { bottom: Math.max(insets.bottom, 16) + 16 },
        ]}
        onPress={() => {
          setIsAdding(true);
          setFormError(null);
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Tambah jadwal tugas baru"
      >
        <MaterialCommunityIcons name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Form Modal (Progressive Disclosure Bottom Sheet) */}
      <FormModal
        visible={isAdding}
        onClose={() => {
          setIsAdding(false);
          setFormError(null);
        }}
        title="Buat Jadwal Tugas Baru"
        subtitle="Agenda perawatan tanaman lapangan"
        iconName="calendar-plus"
      >
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

        <Text style={styles.fieldLabel}>Pilih Petak Lahan</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.lahanSelectRow}
        >
          {lahanList.map((lahan) => {
            const selected = selectedLahanId === lahan.id;
            return (
              <TouchableOpacity
                key={lahan.id}
                style={[
                  styles.lahanSelectChip,
                  selected && styles.lahanSelectChipActive,
                ]}
                onPress={() => setSelectedLahanId(lahan.id)}
              >
                <Text
                  style={[
                    styles.lahanSelectText,
                    selected && styles.lahanSelectTextActive,
                  ]}
                >
                  {lahan.nama}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <FormInput
          label="Waktu Pelaksanaan (WIB)"
          placeholder="cth: 07:00 atau 16:00"
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
          placeholder="cth: Pemberian Pupuk Urea & NPK"
          value={kegiatan}
          onChangeText={setKegiatan}
          leftIcon={
            <MaterialCommunityIcons
              name="clipboard-text-outline"
              size={18}
              color={ThemeColors.textMuted}
            />
          }
        />

        <PrimaryButton
          title="Simpan Jadwal Perawatan"
          onPress={handleAdd}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </FormModal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
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
    paddingTop: Spacing.md,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#006C49',
    letterSpacing: 0.6,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ThemeColors.text,
    marginTop: 2,
  },
  weekPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceHigh,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 5,
  },
  weekPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: ThemeColors.primaryDark,
  },
  dateStrip: {
    gap: 8,
    paddingVertical: 4,
    marginBottom: 14,
  },
  dateChip: {
    width: 50,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateChipActive: {
    backgroundColor: '#135D43',
    borderColor: '#135D43',
  },
  dateChipDay: {
    fontSize: 11,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  dateChipDayActive: {
    color: 'rgba(255, 255, 255, 0.90)',
  },
  dateChipDate: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
    marginVertical: 2,
  },
  dateChipDateActive: {
    color: '#FFFFFF',
  },
  dateEventDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  weatherMicroWidget: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  weatherMicroLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  weatherMicroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherTempTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  weatherInlineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: ThemeColors.textMuted,
  },
  weatherConditionText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  weatherSprayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  weatherSprayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00714D',
  },
  weatherInfoCircle: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(108, 248, 187, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipsRow: {
    gap: 8,
    paddingBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceContainer,
  },
  categoryChipActive: {
    backgroundColor: '#135D43',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  parcelChipsRow: {
    gap: 8,
    paddingBottom: 14,
  },
  parcelChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  parcelChipActive: {
    backgroundColor: '#ABF1CF',
    borderColor: '#6EE7B7',
  },
  parcelChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  parcelChipTextActive: {
    color: '#005139',
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
    gap: 6,
  },
  errorBoxText: {
    fontSize: 12,
    color: ThemeColors.loss,
    fontWeight: '600',
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.text,
    marginBottom: 6,
  },
  lahanSelectRow: {
    gap: 8,
    marginBottom: 14,
  },
  lahanSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceLow,
  },
  lahanSelectChipActive: {
    backgroundColor: '#135D43',
  },
  lahanSelectText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  lahanSelectTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  agendaHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  agendaHeadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  agendaHeadingDate: {
    fontSize: 11.5,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: 14,
  },
  tasksStack: {
    gap: 12,
    marginBottom: 16,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
  },
  taskCardPriority: {
    borderColor: 'rgba(0, 108, 73, 0.25)',
  },
  priorityLeftStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: ThemeColors.loss,
  },
  taskTopMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  taskMetaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceHigh,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  timeBadgeUrgent: {
    backgroundColor: ThemeColors.errorContainer,
  },
  timeBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  timeBadgeTextUrgent: {
    color: ThemeColors.onErrorContainer,
  },
  locationInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    flex: 1,
  },
  locationInlineText: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
  },
  statusPillDone: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 248, 187, 0.30)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  statusPillDoneText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#00714D',
  },
  statusPillPriority: {
    backgroundColor: 'rgba(255, 218, 214, 0.55)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusPillPriorityText: {
    fontSize: 10,
    fontWeight: '800',
    color: ThemeColors.loss,
    letterSpacing: 0.4,
  },
  taskBodyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  checkboxSquare: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: ThemeColors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSquareChecked: {
    backgroundColor: '#135D43',
  },
  taskBodyTextCol: {
    flex: 1,
    gap: 3,
  },
  taskCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.text,
    lineHeight: 20,
  },
  taskCardTitleDone: {
    textDecorationLine: 'line-through',
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  taskCardDesc: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    lineHeight: 17,
  },
  taskFooterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(242, 243, 255, 0.65)',
    marginHorizontal: -15,
    marginBottom: -15,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  taskFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  taskFooterLeftText: {
    fontSize: 11,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  taskFooterRightDone: {
    fontSize: 11,
    color: ThemeColors.textMuted,
    fontWeight: '500',
  },
  startNowPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(171, 241, 207, 0.60)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
  },
  startNowPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00442F',
  },
  fieldTipBanner: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  fieldTipText: {
    flex: 1,
    fontSize: 12,
    color: ThemeColors.textSecondary,
    lineHeight: 18,
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#006C49',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 99,
  },
});
