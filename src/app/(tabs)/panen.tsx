import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppCard } from '../../components/AppCard';
import { DarkSummaryCard } from '../../components/DarkSummaryCard';
import { EmptyState } from '../../components/EmptyState';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Radius, Shadows, Spacing, ThemeColors } from '../../constants/theme';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { exportPanenToPdf } from '../../services/reportExport';
import {
  HarvestItem,
  useAddHarvest,
  useFetchHarvests,
  useUpdateHarvest,
} from '../../hooks/useHarvests';

type DateFilterType = 'SEMUA' | 'BULAN_INI' | 'MUSIM_INI';

export default function PanenScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const {
    jurnalList,
    lahanList,
    addPanen,
    togglePanenStatus: togglePanenStatusContext,
  } = useAppContext();

  // Task 01: Setup Tri-State & Fetch Data (GET) dengan AbortController & Pagination
  const {
    harvests,
    setHarvests,
    loading,
    refreshing,
    error,
    handleRefresh,
    loadMore,
    loadingMore,
  } = useFetchHarvests();

  // Task 02: Menambahkan Data Baru (POST)
  const { addHarvestRecord, isSubmitting } = useAddHarvest(setHarvests, {
    onSuccessSync: (item) => {
      addPanen({
        idLahan: item.idLahan || '1',
        tanggal: item.date,
        jumlah: item.weightKg,
        satuan: item.satuan || 'Kg',
        hargaJual: item.hargaJual || 12000,
        isCompleted: false,
        commodity: item.commodity,
      });
    },
  });

  // Task 03: Ubah Status (PATCH) & Error Handling
  const { toggleHarvestStatus } = useUpdateHarvest(harvests, setHarvests, {
    onStatusUpdated: (id) => {
      togglePanenStatusContext(id).catch(() => { });
    },
  });

  const [isAdding, setIsAdding] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterType>('SEMUA');
  const [isExporting, setIsExporting] = useState(false);
  const [jumlah, setJumlah] = useState('500');
  const [satuan, setSatuan] = useState('Kg');
  const [hargaJual, setHargaJual] = useState('12000');
  const [selectedLahanId, setSelectedLahanId] = useState('');
  const [commodityName, setCommodityName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const unitOptions = ['Kg', 'Ton', 'Kuintal', 'Ikat'];

  const handleSelectLahan = (lahanId: string) => {
    setSelectedLahanId(lahanId);
    const matched = lahanList.find((l) => l.id === lahanId);
    if (matched) {
      setCommodityName(matched.tanaman);
    }
  };

  const handleAdd = async () => {
    setFormError(null);
    const parsedJumlah = parseFloat(jumlah.replace(/[^0-9.]/g, ''));
    const parsedHarga = parseFloat(hargaJual.replace(/[^0-9.]/g, ''));

    const effectiveCommodity =
      commodityName.trim() ||
      (selectedLahanId
        ? lahanList.find((l) => l.id === selectedLahanId)?.tanaman
        : '') ||
      'Komoditas Pangan';

    if (isNaN(parsedJumlah) || parsedJumlah <= 0) {
      setFormError('Kuantitas panen harus lebih dari 0.');
      return;
    }

    if (isNaN(parsedHarga) || parsedHarga <= 0) {
      setFormError('Harga jual satuan harus lebih dari 0.');
      return;
    }

    const success = await addHarvestRecord(effectiveCommodity, parsedJumlah, {
      idLahan: selectedLahanId || '1',
      satuan: satuan.trim() || 'Kg',
      hargaJual: parsedHarga,
    });

    if (success) {
      setJumlah('');
      setHargaJual('');
      setSelectedLahanId('');
      setCommodityName('');
      setIsAdding(false);
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(isNaN(angka) ? 0 : angka);
  };

  // Filter daftar panen berdasarkan rentang tanggal yang dipilih pengguna
  const filteredHarvests = harvests.filter((item) => {
    if (dateFilter === 'BULAN_INI') {
      const currentYearMonth = new Date().toISOString().slice(0, 7);
      if (!item.date.startsWith(currentYearMonth)) return false;
    } else if (dateFilter === 'MUSIM_INI') {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - 120);
      const itemDate = new Date(item.date);
      if (isNaN(itemDate.getTime()) || itemDate < threshold) return false;
    }
    return true;
  });

  // Financial Calculations berdasarkan data harvests & jurnal sesuai rentang filter
  const totalPendapatan = filteredHarvests.reduce(
    (acc, curr) => acc + curr.weightKg * (curr.hargaJual || 12000),
    0
  );

  const totalBiaya = jurnalList
    .filter((j) => {
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
    })
    .reduce((acc, curr) => acc + curr.biaya, 0);

  const estimasiKeuntungan = totalPendapatan - totalBiaya;
  const isProfit = estimasiKeuntungan >= 0;

  const marginPercent =
    totalPendapatan > 0
      ? Math.max(
        0,
        Math.min(
          100,
          Math.round(((estimasiKeuntungan / totalPendapatan) * 100) * 10) / 10
        )
      )
      : 0;

  const liveQty = parseFloat(jumlah.replace(/[^0-9.]/g, '')) || 0;
  const livePrice = parseFloat(hargaJual.replace(/[^0-9.]/g, '')) || 0;
  const liveTotal = liveQty * livePrice;

  const handleExportPdf = async () => {
    setIsExporting(true);
    const filterLabel =
      dateFilter === 'BULAN_INI'
        ? 'Bulan Ini'
        : dateFilter === 'MUSIM_INI'
        ? 'Musim Tanam Ini (120 Hari Terakhir)'
        : 'Semua Periode';

    try {
      await exportPanenToPdf({
        harvests: filteredHarvests,
        lahanList,
        totalPendapatan,
        totalBiaya,
        estimasiKeuntungan,
        marginPercent,
        userName: user?.name,
        filterLabel,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Task 01: Loading State dengan ActivityIndicator (#16A34A)
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Memuat Catatan Panen...</Text>
      </View>
    );
  }

  const renderListHeader = () => (
    <View>
      {/* Task 01: Error Box Banner jika request gagal */}
      {error && (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons
            name="alert-circle-outline"
            size={16}
            color="#DC2626"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Date Range Selector Chips */}
      <View style={styles.panenDateFilterRow}>
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
              style={[
                styles.panenDateFilterChip,
                active && styles.panenDateFilterChipActive,
              ]}
              onPress={() => setDateFilter(item.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.panenDateFilterText,
                  active && styles.panenDateFilterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 1. Executive Profit & Loss Card (Modern Agritech Precision #00442F) */}
      <DarkSummaryCard style={styles.executiveCard}>
        <View style={styles.execTopRow}>
          <View style={styles.execSeasonPill}>
            <View style={styles.execPulseDot} />
            <Text style={styles.execSeasonText}>Musim Tanam II - 2026</Text>
          </View>
          <Text style={styles.execAuditedText}>Audited Q3</Text>
        </View>

        <View style={styles.execProfitBlock}>
          <Text style={styles.execProfitLabel}>
            Estimasi Keuntungan Bersih
          </Text>
          <Text
            style={styles.execProfitValue}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {isProfit ? '+ ' : ''}
            {formatRupiah(estimasiKeuntungan)}
          </Text>

          <View style={styles.execMarginPill}>
            <MaterialCommunityIcons
              name="check-decagram"
              size={15}
              color="#002113"
            />
            <Text style={styles.execMarginPillText}>
              {isProfit
                ? `Surplus Sehat (Margin ${marginPercent}%)`
                : 'Perlu Evaluasi Biaya'}
            </Text>
          </View>
        </View>

        {/* Metric Split Subcard */}
        <View style={styles.execSplitRow}>
          <View style={styles.execSplitBox}>
            <View style={styles.execSplitHeader}>
              <MaterialCommunityIcons
                name="arrow-down-left"
                size={15}
                color="#8ED4B2"
              />
              <Text style={styles.execSplitLabel}>Pendapatan Bruto</Text>
            </View>
            <Text style={styles.execSplitValue}>
              {formatRupiah(totalPendapatan)}
            </Text>
            <Text style={styles.execSplitSubMint}>+18% vs musim lalu</Text>
          </View>

          <View style={styles.execSplitBox}>
            <View style={styles.execSplitHeader}>
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={15}
                color="#8ED4B2"
              />
              <Text style={styles.execSplitLabel}>Beban Biaya Operasional</Text>
            </View>
            <Text style={styles.execSplitValue}>
              {formatRupiah(totalBiaya)}
            </Text>
            <Text style={styles.execSplitSubMuted} numberOfLines={1}>
              Saprotan & Tenaga
            </Text>
          </View>
        </View>
      </DarkSummaryCard>

      {/* 2. Quick Action / Callout Bar */}
      <View style={styles.calloutRow}>
        <TouchableOpacity
          style={styles.addHarvestMainBtn}
          onPress={() => {
            setIsAdding(!isAdding);
            setFormError(null);
          }}
          activeOpacity={0.88}
        >
          <MaterialCommunityIcons
            name={isAdding ? 'close-circle-outline' : 'plus-circle-outline'}
            size={19}
            color="#FFFFFF"
          />
          <Text style={styles.addHarvestMainBtnText}>
            {isAdding ? 'Tutup Formulir Panen' : 'Catat Hasil Panen Baru'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterHarvestBtn}
          onPress={handleRefresh}
          activeOpacity={0.8}
          accessibilityLabel="Segarkan data panen"
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={20}
            color={ThemeColors.text}
          />
        </TouchableOpacity>
      </View>

      {/* 3. Task 02: Form Pencatatan Panen Baru (POST) */}
      {isAdding && (
        <AppCard style={styles.formCard}>
          <View style={styles.formTitleRow}>
            <View style={styles.formIconBox}>
              <MaterialCommunityIcons
                name="basket-plus-outline"
                size={20}
                color="#135D43"
              />
            </View>
            <View>
              <Text style={styles.formTitle}>Catat Hasil Panen Baru</Text>
              <Text style={styles.formSubtitle}>
                Operasi POST asinkron dengan kalkulasi otomatis
              </Text>
            </View>
          </View>

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

          {/* Lahan Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Pilih Petak Lahan (Komoditas)</Text>
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
                    onPress={() => handleSelectLahan(lahan.id)}
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
                      {lahan.tanaman} ({lahan.nama})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <FormInput
            label="Nama Komoditas"
            placeholder="mis: Padi Ciherang, Jagung Pipil Kering, Cabai"
            value={commodityName}
            onChangeText={setCommodityName}
            leftIcon={
              <MaterialCommunityIcons
                name="grain"
                size={18}
                color={ThemeColors.textMuted}
              />
            }
          />

          <View style={styles.qtySatuanRow}>
            <View style={styles.qtyInputCol}>
              <FormInput
                label="Berat / Kuantitas (weightKg)"
                placeholder="500"
                value={jumlah}
                onChangeText={setJumlah}
                keyboardType="numeric"
                leftIcon={
                  <MaterialCommunityIcons
                    name="scale"
                    size={18}
                    color={ThemeColors.textMuted}
                  />
                }
              />
            </View>

            <View style={styles.satuanCol}>
              <Text style={styles.fieldLabel}>Satuan</Text>
              <View style={styles.satuanChipsRow}>
                {unitOptions.map((unit) => {
                  const isSelected = satuan === unit;
                  return (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.satuanChip,
                        isSelected && styles.satuanChipSelected,
                      ]}
                      onPress={() => setSatuan(unit)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.satuanChipText,
                          isSelected && styles.satuanChipTextSelected,
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <FormInput
            label={`Harga Jual per ${satuan || 'Satuan'}`}
            placeholder="12000"
            value={hargaJual}
            onChangeText={setHargaJual}
            keyboardType="numeric"
            leftIcon={<Text style={styles.currencyPrefix}>Rp</Text>}
          />

          <View style={styles.liveCalcCard}>
            <View style={styles.liveCalcHeader}>
              <MaterialCommunityIcons
                name="calculator-variant-outline"
                size={15}
                color="#135D43"
              />
              <Text style={styles.liveCalcTitle}>
                ESTIMASI TOTAL PENJUALAN
              </Text>
            </View>
            <View style={styles.liveCalcRow}>
              <Text style={styles.liveCalcFormula}>
                {liveQty} {satuan} × {formatRupiah(livePrice)}
              </Text>
              <Text style={styles.liveCalcTotal}>
                {formatRupiah(liveTotal)}
              </Text>
            </View>
          </View>

          <PrimaryButton
            title="Simpan Data Panen (POST)"
            onPress={handleAdd}
            loading={isSubmitting}
            disabled={isSubmitting}
            leftIcon={
              <MaterialCommunityIcons
                name="content-save-outline"
                size={18}
                color="#FFFFFF"
              />
            }
          />
        </AppCard>
      )}

      {/* 4. Section Header: Riwayat Hasil Panen */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <MaterialCommunityIcons
            name="package-variant-closed"
            size={20}
            color="#00442F"
          />
          <Text style={styles.sectionTitle}>Riwayat Hasil Panen</Text>
        </View>
        <Text style={styles.sectionCountText}>
          {harvests.length} Transaksi
        </Text>
      </View>
    </View>
  );

  // Render Tiap Item Panen (Task 01 FlatList & Task 03 Status Toggle PATCH)
  const renderHarvestItem = ({ item }: { item: HarvestItem }) => {
    const totalTransaksi = item.weightKg * (item.hargaJual || 12000);
    const matchedLahan = lahanList.find((l) => l.id === item.idLahan);
    const isCorn = item.commodity.toLowerCase().includes('jagung');

    return (
      <View style={styles.harvestCard}>
        {/* Visual Top Banner Header (Modern Agritech Precision) */}
        <View
          style={[
            styles.harvestBannerHeader,
            isCorn ? styles.harvestBannerCorn : styles.harvestBannerRice,
          ]}
        >
          <View style={styles.harvestCommodityPill}>
            <MaterialCommunityIcons
              name={isCorn ? 'corn' : 'leaf'}
              size={14}
              color="#00442F"
            />
            <Text style={styles.harvestCommodityPillText}>
              {item.commodity}
            </Text>
          </View>

          {/* Task 03: Interactive Status Toggle (PATCH) */}
          <TouchableOpacity
            style={[
              styles.statusBadgeBtn,
              item.isCompleted
                ? styles.statusBadgeDone
                : styles.statusBadgeDraft,
            ]}
            onPress={() => toggleHarvestStatus(item.id, item.isCompleted)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Ubah status catatan panen. Status saat ini: ${item.isCompleted ? 'Selesai / Lunas' : 'Draft'
              }`}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: item.isCompleted ? '#002113' : '#B45309',
                },
              ]}
            />
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color: item.isCompleted ? '#002113' : '#92400E',
                },
              ]}
            >
              {item.isCompleted ? 'Lunas / Selesai' : 'Draft'}
            </Text>
            <MaterialCommunityIcons
              name="sync"
              size={12}
              color={item.isCompleted ? '#002113' : '#92400E'}
            />
          </TouchableOpacity>
        </View>

        {/* Card Body */}
        <View style={styles.harvestCardBody}>
          <View style={styles.harvestMainInfoRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.harvestPlotTitle}>
                {matchedLahan?.nama || 'Blok Sawah Barat'}
              </Text>
              <Text style={styles.harvestCycleSub}>
                {isCorn ? 'Rotasi Palawija' : 'Siklus Musim Gadu'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.harvestTotalPrice}>
                {formatRupiah(totalTransaksi)}
              </Text>
              <Text style={styles.harvestTotalLabel}>Total Penjualan</Text>
            </View>
          </View>

          {/* Specifications Grid Box */}
          <View style={styles.specsGridBox}>
            <View style={styles.specsTopRow}>
              <View style={styles.specItem}>
                <MaterialCommunityIcons
                  name="calendar-blank-outline"
                  size={15}
                  color="#00442F"
                />
                <Text style={styles.specText}>{item.date}</Text>
              </View>
              <View style={styles.specItem}>
                <MaterialCommunityIcons
                  name="ruler-square"
                  size={15}
                  color="#00442F"
                />
                <Text style={styles.specText}>
                  Luas: {matchedLahan?.luas || '1.2 Ha'}
                </Text>
              </View>
            </View>

            <View style={styles.specWeightRow}>
              <MaterialCommunityIcons
                name="scale"
                size={15}
                color="#00442F"
              />
              <Text style={styles.specWeightText}>
                {item.weightKg} {item.satuan || 'Kg'} @{' '}
                {formatRupiah(item.hargaJual || 12000)} / {item.satuan || 'Kg'}
              </Text>
            </View>
          </View>

          {/* Buyer / Status Action Row */}
          <View style={styles.buyerFooterRow}>
            <View style={styles.buyerLeft}>
              <MaterialCommunityIcons
                name="storefront-outline"
                size={16}
                color={ThemeColors.textMuted}
              />
              <Text style={styles.buyerNameText} numberOfLines={1}>
                {isCorn
                  ? 'Pabrik Pakan Ternak Sukabumi'
                  : 'Koperasi Tani Makmur Sejahtera'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.chevronCircleBtn}
              onPress={() => toggleHarvestStatus(item.id, item.isCompleted)}
              activeOpacity={0.75}
              accessibilityLabel="Ubah status verifikasi panen"
            >
              <MaterialCommunityIcons
                name="chevron-right"
                size={18}
                color={ThemeColors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderListFooter = () => (
    <View style={styles.productivityCard}>
      <View style={styles.prodHeaderRow}>
        <View style={styles.prodHeaderLeft}>
          <View style={styles.prodIconBox}>
            <MaterialCommunityIcons
              name="chart-box-outline"
              size={18}
              color="#00442F"
            />
          </View>
          <View>
            <Text style={styles.prodTitle}>Analisis Produktivitas</Text>
            <Text style={styles.prodSubtitle}>
              Tolok ukur agrikultur regional
            </Text>
          </View>
        </View>
        <View style={styles.prodEfficiencyPill}>
          <Text style={styles.prodEfficiencyText}>+12.1% Efisiensi</Text>
        </View>
      </View>

      <View style={styles.prodMetricBox}>
        <View style={styles.prodMetricTopRow}>
          <Text style={styles.prodMetricLabel}>Rata-rata Hasil Lahan</Text>
          <Text style={styles.prodMetricValue}>
            6.5 <Text style={styles.prodMetricUnit}>Ton / Ha</Text>
          </Text>
        </View>

        <View style={styles.prodTrack}>
          <View style={[styles.prodFill, { width: '78%' }]} />
        </View>

        <View style={styles.prodLegendRow}>
          <View style={styles.prodLegendLeft}>
            <View style={styles.prodLegendDot} />
            <Text style={styles.prodLegendPrimary}>Lahan Anda: 6.5 T/Ha</Text>
          </View>
          <Text style={styles.prodLegendMuted}>
            Rata-rata Sukabumi: 5.8 T/Ha
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.exportPdfBtn}
        onPress={handleExportPdf}
        disabled={isExporting}
        activeOpacity={0.85}
      >
        {isExporting ? (
          <ActivityIndicator size="small" color="#00442F" />
        ) : (
          <>
            <MaterialCommunityIcons
              name="file-pdf-box"
              size={20}
              color="#00442F"
            />
            <Text style={styles.exportPdfBtnText}>
              Ekspor Laporan Keuangan (PDF)
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Task 01: FlatList Utama dengan RefreshControl (#16A34A) & Pagination onEndReached */}
      <FlatList
        data={filteredHarvests}
        keyExtractor={(item) => item.id}
        renderItem={renderHarvestItem}
        ListHeaderComponent={renderListHeader()}
        ListFooterComponent={
          <>
            {renderListFooter()}
            {loadingMore && (
              <View style={{ paddingVertical: 14, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#006C49" />
              </View>
            )}
          </>
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        removeClippedSubviews={false}
        ListEmptyComponent={
          <AppCard style={styles.emptyCard}>
            <EmptyState
              iconName="basket-outline"
              title="Belum Ada Riwayat Panen"
              description="Catat kuantitas dan harga penjualan hasil panen pertama Anda untuk memantau laba bersih."
              action={
                <PrimaryButton
                  title="+ Catat Panen Baru"
                  onPress={() => setIsAdding(true)}
                />
              }
            />
          </AppCard>
        }
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
            onRefresh={handleRefresh}
            colors={['#16A34A']}
            tintColor="#16A34A"
          />
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  panenDateFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  panenDateFilterChip: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.full,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  panenDateFilterChipActive: {
    backgroundColor: '#00442F',
    borderColor: '#00442F',
  },
  panenDateFilterText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  panenDateFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  errorBoxText: {
    color: ThemeColors.loss,
    fontSize: 12,
    marginLeft: 6,
    fontWeight: '500',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingTop: Spacing.md,
    paddingBottom: 32,
  },
  executiveCard: {
    marginBottom: 16,
    padding: 20,
    backgroundColor: '#00442F',
    borderRadius: 16,
  },
  execTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  execSeasonPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 248, 187, 0.20)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 6,
  },
  execPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6CF8BB',
  },
  execSeasonText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#6CF8BB',
    letterSpacing: 0.3,
  },
  execAuditedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8ED4B2',
  },
  execProfitBlock: {
    marginBottom: 16,
  },
  execProfitLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8ED4B2',
  },
  execProfitValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  execMarginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#6CF8BB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 5,
    marginTop: 8,
  },
  execMarginPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#002113',
  },
  execSplitRow: {
    flexDirection: 'row',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
  },
  execSplitBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 10,
    padding: 10,
  },
  execSplitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  execSplitLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#8ED4B2',
  },
  execSplitValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  execSplitSubMint: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6CF8BB',
    marginTop: 2,
  },
  execSplitSubMuted: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#DAE2FD',
    marginTop: 2,
  },
  calloutRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addHarvestMainBtn: {
    flex: 1,
    height: 48,
    backgroundColor: '#00442F',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.button,
  },
  addHarvestMainBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  filterHarvestBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  formCard: {
    marginBottom: 18,
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  formIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ThemeColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  formSubtitle: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginTop: 1,
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
  qtySatuanRow: {
    flexDirection: 'row',
    gap: 12,
  },
  qtyInputCol: {
    flex: 1.2,
  },
  satuanCol: {
    flex: 1,
  },
  satuanChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  satuanChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: ThemeColors.surfaceLow,
  },
  satuanChipSelected: {
    backgroundColor: '#135D43',
  },
  satuanChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  satuanChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  currencyPrefix: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#135D43',
  },
  liveCalcCard: {
    backgroundColor: ThemeColors.surfaceLow,
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  liveCalcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  liveCalcTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#135D43',
    letterSpacing: 0.5,
  },
  liveCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liveCalcFormula: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
  },
  liveCalcTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: ThemeColors.text,
    fontVariant: ['tabular-nums'],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  sectionCountText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: ThemeColors.textMuted,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: 16,
  },
  harvestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
  },
  harvestBannerHeader: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  harvestBannerRice: {
    backgroundColor: '#ECFDF5',
  },
  harvestBannerCorn: {
    backgroundColor: '#FEF3C7',
  },
  harvestCommodityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  harvestCommodityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00442F',
  },
  statusBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 4,
  },
  statusBadgeDone: {
    backgroundColor: '#6CF8BB',
  },
  statusBadgeDraft: {
    backgroundColor: '#FDE68A',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  harvestCardBody: {
    padding: 15,
    gap: 10,
  },
  harvestMainInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  harvestPlotTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  harvestCycleSub: {
    fontSize: 12,
    color: ThemeColors.textMuted,
    marginTop: 1,
  },
  harvestTotalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00442F',
    fontVariant: ['tabular-nums'],
  },
  harvestTotalLabel: {
    fontSize: 10.5,
    color: ThemeColors.textMuted,
    marginTop: 1,
  },
  specsGridBox: {
    backgroundColor: ThemeColors.surfaceLow,
    borderRadius: 10,
    padding: 10,
    gap: 6,
  },
  specsTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  specText: {
    fontSize: 11.5,
    color: ThemeColors.textSecondary,
    fontWeight: '600',
  },
  specWeightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 2,
  },
  specWeightText: {
    fontSize: 12,
    fontWeight: '700',
    color: ThemeColors.text,
    fontVariant: ['tabular-nums'],
  },
  buyerFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  buyerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  buyerNameText: {
    fontSize: 12,
    color: ThemeColors.text,
    fontWeight: '500',
    flex: 1,
  },
  chevronCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productivityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    gap: 14,
    marginTop: 4,
    ...Shadows.card,
  },
  prodHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prodHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prodIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: ThemeColors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prodTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  prodSubtitle: {
    fontSize: 11,
    color: ThemeColors.textMuted,
    marginTop: 1,
  },
  prodEfficiencyPill: {
    backgroundColor: 'rgba(108, 248, 187, 0.30)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  prodEfficiencyText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#00714D',
  },
  prodMetricBox: {
    backgroundColor: ThemeColors.surfaceLow,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  prodMetricTopRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  prodMetricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  prodMetricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#00442F',
    fontVariant: ['tabular-nums'],
  },
  prodMetricUnit: {
    fontSize: 12,
    fontWeight: '400',
    color: ThemeColors.text,
  },
  prodTrack: {
    height: 9,
    backgroundColor: '#DAE2FD',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  prodFill: {
    height: '100%',
    backgroundColor: '#00442F',
    borderRadius: Radius.full,
  },
  prodLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  prodLegendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  prodLegendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#00442F',
  },
  prodLegendPrimary: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00442F',
  },
  prodLegendMuted: {
    fontSize: 11,
    color: ThemeColors.textMuted,
  },
  exportPdfBtn: {
    height: 48,
    borderRadius: 10,
    backgroundColor: ThemeColors.surfaceHigh,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  exportPdfBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#00442F',
  },
});
