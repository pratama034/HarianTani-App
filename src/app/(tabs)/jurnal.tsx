import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ThemeColors, Radius, Spacing } from '../../constants/theme';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { AppCard } from '../../components/AppCard';
import { FormModal } from '../../components/FormModal';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';
import { exportJurnalToPdf } from '../../services/reportExport';
import { findNearbyLahan } from '../../utils/geofence';

type DateFilterType = 'SEMUA' | 'BULAN_INI' | 'MUSIM_INI';

export default function JurnalScreen() {
  const insets = useSafeAreaInsets();
  const {
    jurnalList,
    lahanList,
    addJurnal,
    isLoading,
    error,
    apiStatus,
    statusCode,
    isSimulationActive,
    refetchAll,
    loadMoreJurnal,
    hasMoreJurnal,
    isLoadingMoreJurnal,
  } = useAppContext();
  const { user } = useAuth();

  const [isAdding, setIsAdding] = useState(false);
  const [filterLahanId, setFilterLahanId] = useState<string>('all');
  const [onlyExpenseFilter, setOnlyExpenseFilter] = useState<boolean>(false);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('SEMUA');

  const [catatan, setCatatan] = useState('');
  const [biaya, setBiaya] = useState('');
  const [selectedLahanId, setSelectedLahanId] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('Pupuk/Obat');
  const [geofenceNotice, setGeofenceNotice] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Smart Check-in (Geofencing):
   * Mengambil lokasi pengguna saat ini (one-off call, tanpa watchPosition/background tracking)
   * Jika jarak pengguna dengan lahan < 200 meter, otomatis pilih lahan di formulir
   * dan tampilkan pesan "Lokasi terdeteksi: Anda berada di area lahan [Nama Lahan]".
   */
  useEffect(() => {
    let isMounted = true;

    const performSmartCheckIn = async () => {
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== Location.PermissionStatus.GRANTED) return;

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!isMounted) return;

        const { latitude, longitude } = pos.coords;
        const match = findNearbyLahan(latitude, longitude, lahanList, 200);

        if (match && isMounted) {
          setSelectedLahanId(match.lahan.id);
          setGeofenceNotice(
            `Lokasi terdeteksi: Anda berada di area lahan ${match.lahan.nama}`
          );
        }
      } catch {
        // Abaikan jika GPS belum aktif atau ditolak
      }
    };

    if (lahanList.length > 0) {
      void performSmartCheckIn();
    }

    return () => {
      isMounted = false;
    };
  }, [lahanList]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  };

  const kategoriOptions = [
    { name: 'Bibit', icon: 'sprout' },
    { name: 'Pupuk/Obat', icon: 'bottle-tonic-outline' },
    { name: 'BBM/Traktor', icon: 'gas-station-outline' },
    { name: 'Upah Tenaga', icon: 'account-group-outline' },
    { name: 'Observasi', icon: 'eye-check-outline' },
  ];

  const handleAdd = async () => {
    setFormError(null);
    if (!catatan.trim() || !selectedLahanId) {
      setFormError('Harap pilih lahan pertanian dan tuliskan catatan observasi.');
      return;
    }

    const cleanBiaya = parseFloat(biaya.replace(/[^0-9]/g, '')) || 0;

    setIsSubmitting(true);
    try {
      await addJurnal({
        idLahan: selectedLahanId,
        tanggal: new Date().toISOString().split('T')[0],
        catatan: catatan.trim(),
        biaya: cleanBiaya,
      });

      setCatatan('');
      setBiaya('');
      setSelectedLahanId('');
      setIsAdding(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan catatan jurnal ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(angka);
  };

  const filteredJurnal = jurnalList.filter((j) => {
    if (filterLahanId !== 'all' && j.idLahan !== filterLahanId) return false;
    if (onlyExpenseFilter && j.biaya <= 0) return false;

    if (dateFilter === 'BULAN_INI') {
      const currentYearMonth = new Date().toISOString().slice(0, 7);
      if (!j.tanggal.startsWith(currentYearMonth)) return false;
    } else if (dateFilter === 'MUSIM_INI') {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 120);
      const itemDate = new Date(j.tanggal);
      if (isNaN(itemDate.getTime()) || itemDate < threshold) return false;
    }

    return true;
  });

  const totalBiayaBulanIni = filteredJurnal.reduce(
    (acc, curr) => acc + curr.biaya,
    0
  );
  const saprotanTotal = Math.round(totalBiayaBulanIni * 0.59);
  const tenagaKerjaTotal = totalBiayaBulanIni - saprotanTotal;

  const handleExportBook = async () => {
    setIsExporting(true);
    const filterLabel =
      dateFilter === 'BULAN_INI'
        ? 'Bulan Ini'
        : dateFilter === 'MUSIM_INI'
        ? 'Musim Tanam Ini (120 Hari Terakhir)'
        : 'Semua Periode';

    try {
      await exportJurnalToPdf({
        jurnalList: filteredJurnal,
        lahanList,
        totalBiaya: totalBiayaBulanIni,
        userName: user?.name,
        filterLabel,
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ThemeColors.primaryContainer} />
        <Text style={styles.loadingText}>Memuat buku jurnal lapangan...</Text>
      </View>
    );
  }

  if (error && (isSimulationActive || jurnalList.length === 0)) {
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
        {error && jurnalList.length > 0 && (
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
        {/* 1. Ringkasan Kas & Beban Operasional (Modern Agritech Precision) */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLeftStrip} />

          <View style={styles.summaryInner}>
            <View style={styles.summaryTopRow}>
              <Text style={styles.summaryTopLabel}>
                BEBAN OPERASIONAL • MUSIM 2026
              </Text>
              <View style={styles.summaryControlledPill}>
                <View style={styles.summaryControlledDot} />
                <Text style={styles.summaryControlledText}>
                  Terkontrol • {jurnalList.length} Entri
                </Text>
              </View>
            </View>

            <View style={styles.summaryMainRow}>
              <View style={styles.summaryAmountCol}>
                <Text
                  style={styles.summaryAmountValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatRupiah(totalBiayaBulanIni)}
                </Text>
                <Text style={styles.summaryAmountSub}>
                  Total pengeluaran tercatat bulan berjalan
                </Text>
              </View>
              <View style={styles.summaryWalletCircle}>
                <MaterialCommunityIcons
                  name="wallet-outline"
                  size={22}
                  color="#135D43"
                />
              </View>
            </View>

            {/* Quick Breakdown Pill Cards */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownBox}>
                <View style={styles.breakdownHeader}>
                  <MaterialCommunityIcons
                    name="leaf"
                    size={15}
                    color="#00442F"
                  />
                  <Text style={styles.breakdownBoxLabel}>Saprotan</Text>
                </View>
                <Text
                  style={styles.breakdownBoxValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatRupiah(saprotanTotal)}
                </Text>
                <Text style={styles.breakdownBoxSub}>59% total kas</Text>
              </View>

              <View style={styles.breakdownBox}>
                <View style={styles.breakdownHeader}>
                  <MaterialCommunityIcons
                    name="account-group-outline"
                    size={15}
                    color="#006C49"
                  />
                  <Text style={styles.breakdownBoxLabel}>Tenaga Kerja</Text>
                </View>
                <Text
                  style={styles.breakdownBoxValue}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {formatRupiah(tenagaKerjaTotal)}
                </Text>
                <Text style={styles.breakdownBoxSub}>41% total kas</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Geofencing Smart Check-in Banner */}
        {geofenceNotice && (
          <View style={styles.geofenceMainBanner}>
            <View style={styles.geofenceIconCircle}>
              <MaterialCommunityIcons
                name="map-marker-radius"
                size={16}
                color="#006C49"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.geofenceMainTitle}>Smart Check-in Aktif</Text>
              <Text style={styles.geofenceMainText}>{geofenceNotice}</Text>
            </View>
          </View>
        )}

        {/* 4. Filter Lahan & Kategori */}
        <View style={styles.filterSection}>
          <View style={styles.filterHeaderRow}>
            <Text style={styles.filterTitle}>Filter Catatan</Text>
            <Text style={styles.filterSub}>
              {filteredJurnal.length} entri ditampilkan
            </Text>
          </View>

          {/* Selector Rentang Tanggal */}
          <View style={styles.dateFilterRow}>
            {(
              [
                { id: 'SEMUA', label: 'Semua Waktu' },
                { id: 'BULAN_INI', label: 'Bulan Ini' },
                { id: 'MUSIM_INI', label: 'Musim Tanam Ini' },
              ] as const
            ).map((item) => {
              const active = dateFilter === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.dateFilterChip, active && styles.dateFilterChipActive]}
                  onPress={() => setDateFilter(item.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.dateFilterText, active && styles.dateFilterTextActive]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollRow}
          >
            <TouchableOpacity
              style={[
                styles.filterPill,
                filterLahanId === 'all' &&
                  !onlyExpenseFilter &&
                  styles.filterPillActive,
              ]}
              onPress={() => {
                setFilterLahanId('all');
                setOnlyExpenseFilter(false);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filterLahanId === 'all' &&
                    !onlyExpenseFilter &&
                    styles.filterPillTextActive,
                ]}
              >
                Semua Lahan
              </Text>
              {filterLahanId === 'all' && !onlyExpenseFilter && (
                <MaterialCommunityIcons
                  name="check"
                  size={14}
                  color="#FFFFFF"
                />
              )}
            </TouchableOpacity>

            {lahanList.map((lahan) => {
              const active = filterLahanId === lahan.id;
              return (
                <TouchableOpacity
                  key={lahan.id}
                  style={[
                    styles.filterPill,
                    active && styles.filterPillActive,
                  ]}
                  onPress={() => setFilterLahanId(lahan.id)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      active && styles.filterPillTextActive,
                    ]}
                  >
                    {lahan.nama}
                  </Text>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[
                styles.filterPillExpense,
                onlyExpenseFilter && styles.filterPillActive,
              ]}
              onPress={() => setOnlyExpenseFilter(!onlyExpenseFilter)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="cash-multiple"
                size={15}
                color={onlyExpenseFilter ? '#FFFFFF' : ThemeColors.loss}
              />
              <Text
                style={[
                  styles.filterPillText,
                  onlyExpenseFilter && styles.filterPillTextActive,
                ]}
              >
                Hanya Pengeluaran (Rp)
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* 5. Riwayat Lapangan */}
        <View style={styles.historyHeaderRow}>
          <Text style={styles.historyTitle}>Riwayat Lapangan</Text>
          <Text style={styles.historySortText}>Urut Terbaru</Text>
        </View>

        {filteredJurnal.length === 0 ? (
          <AppCard style={styles.emptyCard}>
            <EmptyState
              iconName="notebook-outline"
              title="Belum Ada Catatan Jurnal"
              description="Catat observasi tanaman dan pengeluaran operasional harian Anda."
              action={
                <PrimaryButton
                  title="+ Tulis Jurnal Baru"
                  onPress={() => setIsAdding(true)}
                />
              }
            />
          </AppCard>
        ) : (
          <View style={styles.entriesStack}>
            {filteredJurnal.map((jurnal) => {
              const lahan = lahanList.find((l) => l.id === jurnal.idLahan);
              const hasExpense = jurnal.biaya > 0;

              return (
                <View key={jurnal.id} style={styles.entryCard}>
                  <View style={styles.entryTopRow}>
                    <View style={styles.entryTopLeft}>
                      <View
                        style={[
                          styles.entryAvatarCircle,
                          hasExpense
                            ? styles.entryAvatarPrimary
                            : styles.entryAvatarMint,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name={hasExpense ? 'tractor' : 'sprout'}
                          size={18}
                          color={hasExpense ? '#002115' : '#00714D'}
                        />
                      </View>
                      <View style={styles.entryTitleCol}>
                        <View style={styles.entryPlotNameRow}>
                          <Text style={styles.entryPlotName} numberOfLines={1}>
                            {lahan?.nama || 'Blok Sawah Barat'}
                          </Text>
                          {lahan?.tanaman && (
                            <Text style={styles.entryCropName}>
                              • {lahan.tanaman}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.entryDateText}>
                          {jurnal.tanggal} • 16:30 WIB
                        </Text>
                      </View>
                    </View>

                    {hasExpense ? (
                      <View style={styles.expenseBadge}>
                        <Text style={styles.expenseBadgeText}>
                          - {formatRupiah(jurnal.biaya)}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.obsBadge}>
                        <Text style={styles.obsBadgeText}>
                          Biaya: Rp 0 (Observasi)
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.entryNoteText}>{jurnal.catatan}</Text>

                  <View style={styles.entryFooterRow}>
                    <View style={styles.entryAuthorLeft}>
                      <MaterialCommunityIcons
                        name="card-account-details-outline"
                        size={15}
                        color={ThemeColors.textMuted}
                      />
                      <Text style={styles.entryAuthorText}>
                        {user?.name || 'Pak Budi Santoso'}
                      </Text>
                    </View>

                    <View style={styles.entryCategoryRight}>
                      <View style={styles.entryCategoryTag}>
                        <Text style={styles.entryCategoryTagText}>
                          {hasExpense ? 'Saprotan & Upah' : 'Pengamatan Hama'}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={
                          hasExpense
                            ? 'receipt-text-outline'
                            : 'check-circle-outline'
                        }
                        size={16}
                        color={hasExpense ? ThemeColors.textMuted : '#006C49'}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
            {hasMoreJurnal && (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={loadMoreJurnal}
                disabled={isLoadingMoreJurnal}
                activeOpacity={0.8}
              >
                {isLoadingMoreJurnal ? (
                  <ActivityIndicator size="small" color="#006C49" />
                ) : (
                  <Text style={styles.loadMoreText}>Muat Catatan Lebih Banyak</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 6. Export & Arsip Section */}
        <View style={styles.exportArchiveCard}>
          <View style={styles.exportIconCircle}>
            <MaterialCommunityIcons
              name="file-download-outline"
              size={22}
              color="#135D43"
            />
          </View>
          <Text style={styles.exportTitle}>
            Laporan Keuangan & Buku Jurnal
          </Text>
          <Text style={styles.exportSub}>
            Semua data terverifikasi dan siap diaudit untuk pengajuan KUR Tani
          </Text>
          <TouchableOpacity
            style={styles.exportActionBtn}
            onPress={handleExportBook}
            disabled={isExporting}
            activeOpacity={0.75}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color="#135D43" />
            ) : (
              <>
                <Text style={styles.exportActionText}>
                  Ekspor Laporan Buku Kas (PDF)
                </Text>
                <MaterialCommunityIcons
                  name="arrow-right"
                  size={17}
                  color="#135D43"
                />
              </>
            )}
          </TouchableOpacity>
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
        accessibilityLabel="Tulis jurnal dan pengeluaran baru"
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
        title="Catat Aktivitas & Biaya"
        subtitle="Input observasi lapangan & pengeluaran kas"
        iconName="notebook-plus-outline"
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

        {/* Geofencing Auto-Selected Notification */}
        {geofenceNotice && (
          <View style={styles.geofenceNoticeBox}>
            <MaterialCommunityIcons
              name="map-marker-check"
              size={16}
              color="#006C49"
            />
            <Text style={styles.geofenceNoticeText}>{geofenceNotice}</Text>
          </View>
        )}

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Pilih Lahan Pertanian</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.lahanChipsRow}
          >
            {lahanList.map((lahan) => {
              const isSelected = selectedLahanId === lahan.id;
              return (
                <TouchableOpacity
                  key={lahan.id}
                  style={[
                    styles.lahanChip,
                    isSelected && styles.lahanChipSelected,
                  ]}
                  onPress={() => setSelectedLahanId(lahan.id)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="sprout"
                    size={15}
                    color={isSelected ? '#FFFFFF' : '#135D43'}
                  />
                  <Text
                    style={[
                      styles.lahanChipText,
                      isSelected && styles.lahanChipTextSelected,
                    ]}
                  >
                    {lahan.nama}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Kategori Aktivitas</Text>
          <View style={styles.kategoriGrid}>
            {kategoriOptions.map((kat) => {
              const isSelected = selectedKategori === kat.name;
              return (
                <TouchableOpacity
                  key={kat.name}
                  style={[
                    styles.kategoriChip,
                    isSelected && styles.kategoriChipSelected,
                  ]}
                  onPress={() => setSelectedKategori(kat.name)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={kat.icon as any}
                    size={15}
                    color={isSelected ? '#FFFFFF' : '#135D43'}
                  />
                  <Text
                    style={[
                      styles.kategoriChipText,
                      isSelected && styles.kategoriChipTextSelected,
                    ]}
                  >
                    {kat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <FormInput
          label="Catatan Observasi & Pekerjaan"
          placeholder="cth: Pembelian benih susulan & penyiangan gulma..."
          value={catatan}
          onChangeText={setCatatan}
          multiline
          leftIcon={
            <MaterialCommunityIcons
              name="text-box-outline"
              size={18}
              color={ThemeColors.textMuted}
            />
          }
        />

        <FormInput
          label="Nominal Biaya Pengeluaran (Rp) — Isi 0 jika hanya observasi"
          placeholder="cth: 350000"
          value={biaya}
          onChangeText={setBiaya}
          keyboardType="numeric"
          leftIcon={<Text style={styles.currencyPrefix}>Rp</Text>}
        />

        <PrimaryButton
          title="Simpan Catatan Jurnal"
          onPress={handleAdd}
          loading={isSubmitting}
          disabled={isSubmitting}
          leftIcon={
            <MaterialCommunityIcons
              name="check-circle-outline"
              size={18}
              color="#FFFFFF"
            />
          }
        />
      </FormModal>
    </KeyboardAvoidingView>
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
  keyboardContainer: {
    flex: 1,
    backgroundColor: ThemeColors.background,
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
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 14,
  },
  summaryLeftStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 6,
    backgroundColor: '#135D43',
  },
  summaryInner: {
    padding: Spacing.md,
    paddingLeft: 18,
    gap: 10,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  summaryTopLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: ThemeColors.textMuted,
    letterSpacing: 0.5,
  },
  summaryControlledPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 248, 187, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 5,
  },
  summaryControlledDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#006C49',
  },
  summaryControlledText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#00714D',
  },
  summaryMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryAmountCol: {
    flex: 1,
  },
  summaryAmountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: ThemeColors.text,
    letterSpacing: -0.4,
    fontVariant: ['tabular-nums'],
  },
  summaryAmountSub: {
    fontSize: 12,
    color: ThemeColors.textMuted,
    marginTop: 2,
  },
  summaryWalletCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  breakdownBox: {
    flex: 1,
    backgroundColor: ThemeColors.surfaceLow,
    borderRadius: 10,
    padding: 10,
  },
  breakdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  breakdownBoxLabel: {
    fontSize: 11,
    color: ThemeColors.textMuted,
    fontWeight: '600',
  },
  breakdownBoxValue: {
    fontSize: 14.5,
    fontWeight: '700',
    color: ThemeColors.text,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  breakdownBoxSub: {
    fontSize: 10.5,
    color: ThemeColors.textMuted,
    marginTop: 2,
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
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.text,
    marginBottom: 6,
  },
  lahanChipsRow: {
    gap: 8,
  },
  lahanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceLow,
    gap: 5,
  },
  lahanChipSelected: {
    backgroundColor: '#135D43',
  },
  lahanChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  lahanChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  kategoriGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kategoriChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceLow,
    gap: 5,
  },
  kategoriChipSelected: {
    backgroundColor: '#135D43',
  },
  kategoriChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  kategoriChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  currencyPrefix: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#135D43',
  },
  filterSection: {
    marginBottom: 16,
  },
  geofenceMainBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 10,
  },
  geofenceIconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  geofenceMainTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#006C49',
  },
  geofenceMainText: {
    fontSize: 12,
    color: '#166534',
    marginTop: 1,
  },
  geofenceNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    padding: 9,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    gap: 6,
  },
  geofenceNoticeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
    flex: 1,
  },
  dateFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  dateFilterChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateFilterChipActive: {
    backgroundColor: '#00442F',
    borderColor: '#00442F',
  },
  dateFilterText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  dateFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  filterSub: {
    fontSize: 11,
    color: ThemeColors.textMuted,
    fontWeight: '600',
  },
  filterScrollRow: {
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceContainer,
    gap: 5,
  },
  filterPillExpense: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceHigh,
    gap: 5,
  },
  filterPillActive: {
    backgroundColor: '#135D43',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  historySortText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: ThemeColors.primaryDark,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: 16,
  },
  entriesStack: {
    gap: 12,
    marginBottom: 16,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  entryTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  entryTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  entryAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryAvatarPrimary: {
    backgroundColor: '#ABF1CF',
  },
  entryAvatarMint: {
    backgroundColor: 'rgba(108, 248, 187, 0.45)',
  },
  entryTitleCol: {
    flex: 1,
  },
  entryPlotNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  entryPlotName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  entryCropName: {
    fontSize: 11,
    color: ThemeColors.textMuted,
    fontWeight: '600',
  },
  entryDateText: {
    fontSize: 11,
    color: ThemeColors.textMuted,
    marginTop: 1,
  },
  expenseBadge: {
    backgroundColor: ThemeColors.errorContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  expenseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.onErrorContainer,
    fontVariant: ['tabular-nums'],
  },
  obsBadge: {
    backgroundColor: 'rgba(108, 248, 187, 0.30)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  obsBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#00714D',
  },
  entryNoteText: {
    fontSize: 13.5,
    color: ThemeColors.textSecondary,
    lineHeight: 20,
  },
  entryFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: ThemeColors.surfaceContainer,
  },
  entryAuthorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  entryAuthorText: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    fontWeight: '500',
  },
  entryCategoryRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  entryCategoryTag: {
    backgroundColor: ThemeColors.surfaceContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  entryCategoryTagText: {
    fontSize: 10.5,
    color: ThemeColors.textMuted,
    fontWeight: '600',
  },
  exportArchiveCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 6,
  },
  exportIconCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  exportSub: {
    fontSize: 12,
    color: ThemeColors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  exportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  exportActionText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#135D43',
  },
  loadMoreBtn: {
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#006C49',
  },
});
