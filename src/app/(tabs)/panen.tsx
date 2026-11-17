import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { useAppContext } from '../../context/AppContext';
import { AppCard } from '../../components/AppCard';
import { DarkSummaryCard } from '../../components/DarkSummaryCard';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState } from '../../components/EmptyState';
import {
  useFetchHarvests,
  useAddHarvest,
  useUpdateHarvest,
  HarvestItem,
} from '../../hooks/useHarvests';

export default function PanenScreen() {
  const {
    jurnalList,
    lahanList,
    addPanen,
    togglePanenStatus: togglePanenStatusContext,
    isCloudConnected,
  } = useAppContext();

  // Task 01: Setup Tri-State & Fetch Data (GET) dengan AbortController
  const {
    harvests,
    setHarvests,
    loading,
    refreshing,
    error,
    handleRefresh,
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
      togglePanenStatusContext(id).catch(() => {});
    },
  });

  const [isAdding, setIsAdding] = useState(false);
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
      (selectedLahanId ? lahanList.find((l) => l.id === selectedLahanId)?.tanaman : '') ||
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

  // Financial Calculations berdasarkan data harvests terkini
  const totalPendapatan = harvests.reduce(
    (acc, curr) => acc + curr.weightKg * (curr.hargaJual || 12000),
    0
  );
  const totalBiaya = jurnalList.reduce((acc, curr) => acc + curr.biaya, 0);
  const estimasiKeuntungan = totalPendapatan - totalBiaya;
  const isProfit = estimasiKeuntungan >= 0;

  const marginPercent =
    totalPendapatan > 0
      ? Math.max(
          0,
          Math.min(100, Math.round((estimasiKeuntungan / totalPendapatan) * 100))
        )
      : 0;

  const liveQty = parseFloat(jumlah.replace(/[^0-9.]/g, '')) || 0;
  const livePrice = parseFloat(hargaJual.replace(/[^0-9.]/g, '')) || 0;
  const liveTotal = liveQty * livePrice;

  // Task 01: Loading State dengan ActivityIndicator (#16A34A)
  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Memuat Catatan Panen...</Text>
      </View>
    );
  }

  // Header komponen di atas FlatList (Dashboard Keuangan + Form Input)
  const renderListHeader = () => (
    <View>
      {/* Header Intro */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Laporan & Finansial</Text>
          <Text style={styles.pageSubtitle}>
            Pencatatan asinkron hasil panen dan kalkulasi laba bersih
          </Text>
        </View>
        <TouchableOpacity
          style={styles.toggleAddButton}
          onPress={() => {
            setIsAdding(!isAdding);
            setFormError(null);
          }}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={isAdding ? 'Tutup form panen' : 'Buka form catat panen'}
        >
          <MaterialCommunityIcons
            name={isAdding ? 'close' : 'plus'}
            size={18}
            color={ThemeColors.onPrimary}
          />
          <Text style={styles.toggleAddButtonText}>
            {isAdding ? 'Tutup' : 'Catat'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Network Status Badge Pill */}
      <View style={styles.networkStatusPill}>
        <MaterialCommunityIcons
          name="cloud-check"
          size={16}
          color={ThemeColors.primary}
        />
        <Text style={styles.networkStatusText}>
          {isCloudConnected ? '🟢 Cloud REST API Active (200 OK)' : '🟢 REST API Ready (Async/Await)'}
        </Text>
      </View>

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

      {/* Executive Financial Performance Card */}
      <DarkSummaryCard style={styles.financeCard}>
        <View style={styles.financeTopRow}>
          <View style={styles.financeTopLeft}>
            <View style={styles.financeIconBox}>
              <MaterialCommunityIcons
                name="shield-check"
                size={16}
                color={ThemeColors.secondaryFixed}
              />
            </View>
            <Text style={styles.financePeriodLabel}>
              ESTIMASI KEUNTUNGAN BERSIH
            </Text>
          </View>
          <View
            style={[
              styles.profitTag,
              !isProfit && styles.profitTagLoss,
            ]}
          >
            <View
              style={[
                styles.pulseDot,
                {
                  backgroundColor: isProfit
                    ? ThemeColors.secondaryFixed
                    : ThemeColors.loss,
                },
              ]}
            />
            <Text
              style={[
                styles.profitTagText,
                !isProfit && styles.profitTagTextLoss,
              ]}
            >
              {isProfit ? 'PROFIT BERSIH' : 'DEFISIT'}
            </Text>
          </View>
        </View>

        <View style={styles.amountCol}>
          <Text
            style={[
              styles.amountNumber,
              {
                color: isProfit
                  ? ThemeColors.secondaryFixed
                  : ThemeColors.loss,
              },
            ]}
          >
            {isProfit ? '+ ' : ''}
            {formatRupiah(estimasiKeuntungan)}
          </Text>
          <Text style={styles.amountSubtext}>
            {isProfit
              ? 'Hasil penjualan melebihi akumulasi beban operasional'
              : 'Pengeluaran operasional saat ini melebihi pendapatan'}
          </Text>
        </View>

        {/* Rasio Margin Keuntungan */}
        <View style={styles.ratioPod}>
          <View style={styles.ratioPodHeader}>
            <View style={styles.ratioHeaderLeft}>
              <MaterialCommunityIcons
                name="chart-arc"
                size={14}
                color={ThemeColors.secondaryFixed}
              />
              <Text style={styles.ratioPodTitle}>Rasio Margin Keuntungan</Text>
            </View>
            <Text style={styles.ratioPodPercent}>{marginPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${marginPercent}%` },
              ]}
            />
          </View>
        </View>

        {/* Breakdown Sub-Grid */}
        <View style={styles.breakdownGrid}>
          <View style={styles.breakdownCol}>
            <View style={styles.breakdownLabelRow}>
              <View
                style={[
                  styles.breakdownDot,
                  { backgroundColor: ThemeColors.profit },
                ]}
              />
              <Text style={styles.breakdownLabel}>Total Pendapatan</Text>
            </View>
            <Text style={styles.breakdownValue}>
              {formatRupiah(totalPendapatan)}
            </Text>
            <Text style={styles.breakdownSub}>
              {harvests.length} transaksi panen
            </Text>
          </View>

          <View style={styles.breakdownCol}>
            <View style={styles.breakdownLabelRow}>
              <View
                style={[
                  styles.breakdownDot,
                  { backgroundColor: ThemeColors.warning },
                ]}
              />
              <Text style={styles.breakdownLabel}>Biaya (Jurnal)</Text>
            </View>
            <Text style={styles.breakdownValue}>
              {formatRupiah(totalBiaya)}
            </Text>
            <Text style={styles.breakdownSub}>
              {jurnalList.length} pos operasional
            </Text>
          </View>
        </View>
      </DarkSummaryCard>

      {/* Task 02: Form Pencatatan Panen Baru (POST) */}
      {isAdding && (
        <AppCard style={styles.formCard}>
          <View style={styles.formTitleRow}>
            <View style={styles.formIconBox}>
              <MaterialCommunityIcons
                name="basket-plus"
                size={20}
                color={ThemeColors.primary}
              />
            </View>
            <View>
              <Text style={styles.formTitle}>Catat Hasil Panen Baru</Text>
              <Text style={styles.formSubtitle}>
                Operasi POST asinkron dengan payload JSON
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
                      size={16}
                      color={
                        isSelected
                          ? ThemeColors.onPrimary
                          : ThemeColors.primary
                      }
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

          {/* Input Nama Komoditas Opsional */}
          <FormInput
            label="Nama Komoditas"
            placeholder="mis: Cabai Merah, Padi Ciherang, Jagung"
            value={commodityName}
            onChangeText={setCommodityName}
            leftIcon={
              <MaterialCommunityIcons
                name="food-apple"
                size={18}
                color={ThemeColors.textMuted}
              />
            }
          />

          {/* Kuantitas & Satuan */}
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

          {/* Harga Jual per Satuan */}
          <FormInput
            label={`Harga Jual per ${satuan || 'Satuan'}`}
            placeholder="12000"
            value={hargaJual}
            onChangeText={setHargaJual}
            keyboardType="numeric"
            leftIcon={<Text style={styles.currencyPrefix}>Rp</Text>}
          />

          {/* Live Calculation Preview */}
          <View style={styles.liveCalcCard}>
            <View style={styles.liveCalcHeader}>
              <MaterialCommunityIcons
                name="calculator"
                size={15}
                color={ThemeColors.primary}
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
                name="content-save"
                size={18}
                color={ThemeColors.onPrimary}
              />
            }
            style={styles.submitBtn}
          />
        </AppCard>
      )}

      {/* Riwayat Hasil Panen Section Header */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionHeaderLeft}>
          <MaterialCommunityIcons
            name="history"
            size={20}
            color={ThemeColors.primary}
          />
          <Text style={styles.sectionTitle}>Riwayat Catatan Panen Harian</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{harvests.length} Catatan</Text>
        </View>
      </View>
    </View>
  );

  // Render Tiap Item Panen (Task 01 & Task 03 Status Toggle)
  const renderHarvestItem = ({ item }: { item: HarvestItem }) => {
    const totalTransaksi = item.weightKg * (item.hargaJual || 12000);

    return (
      <AppCard style={styles.harvestCard}>
        <View style={styles.harvestAccentStrip} />

        <View style={styles.harvestHeader}>
          <View style={styles.harvestHeaderLeft}>
            <View style={styles.harvestCategoryPill}>
              <Text style={styles.harvestCategoryText}>{item.commodity}</Text>
            </View>
            <Text style={styles.harvestDateText}>{item.date}</Text>
          </View>
          <View style={styles.harvestIconBox}>
            <MaterialCommunityIcons
              name="basket"
              size={20}
              color={ThemeColors.primary}
            />
          </View>
        </View>

        <Text style={styles.harvestTitle}>
          Panen: {item.commodity}
        </Text>

        {/* Calculation Detail Pill Box */}
        <View style={styles.harvestDetailBox}>
          <View style={styles.harvestCalcRow}>
            <View style={styles.harvestQtyGroup}>
              <MaterialCommunityIcons
                name="scale"
                size={16}
                color={ThemeColors.primary}
              />
              <Text style={styles.harvestQtyText}>
                {item.weightKg} {item.satuan || 'Kg'} @{' '}
                {formatRupiah(item.hargaJual || 12000)} / {item.satuan || 'Kg'}
              </Text>
            </View>

            {/* Task 03: Tombol Ubah Status (PATCH) 'Selesai' vs 'Draft' */}
            <TouchableOpacity
              style={[
                styles.statusBadgeBtn,
                item.isCompleted
                  ? styles.statusBadgeDone
                  : styles.statusBadgeDraft,
              ]}
              onPress={() => toggleHarvestStatus(item.id, item.isCompleted)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={`Ubah status catatan panen. Status saat ini: ${
                item.isCompleted ? 'Selesai Dipanen' : 'Draft'
              }`}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: item.isCompleted
                      ? '#16A34A'
                      : '#D97706',
                  },
                ]}
              />
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color: item.isCompleted ? '#16A34A' : '#D97706',
                  },
                ]}
              >
                {item.isCompleted ? 'Selesai' : 'Draft'}
              </Text>
              <MaterialCommunityIcons
                name="sync"
                size={12}
                color={item.isCompleted ? '#16A34A' : '#D97706'}
                style={{ marginLeft: 3 }}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.harvestTotalRow}>
            <Text style={styles.harvestTotalLabel}>Total Penjualan:</Text>
            <Text style={styles.harvestTotalValue}>
              {formatRupiah(totalTransaksi)}
            </Text>
          </View>
        </View>

        {/* Footer Info */}
        <View style={styles.harvestFooter}>
          <View style={styles.verifiedRow}>
            <MaterialCommunityIcons
              name={item.isCompleted ? 'check-decagram' : 'clock-outline'}
              size={15}
              color={item.isCompleted ? ThemeColors.profit : ThemeColors.warning}
            />
            <Text style={styles.verifiedText}>
              {item.isCompleted ? 'Selesai Dipanen' : 'Draft (Perlu Verifikasi)'}
            </Text>
          </View>
          <Text style={styles.lahanLocationText}>
            Ketuk badge status untuk PATCH
          </Text>
        </View>
      </AppCard>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Task 01: FlatList Utama dengan RefreshControl (#16A34A) */}
      <FlatList
        data={harvests}
        keyExtractor={(item) => item.id}
        renderItem={renderHarvestItem}
        ListHeaderComponent={renderListHeader}
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
        contentContainerStyle={styles.scrollContent}
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
    borderRadius: 8,
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
    padding: Spacing.margin,
    paddingTop: Spacing.sm,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ThemeColors.text,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    marginTop: 2,
    maxWidth: 260,
  },
  toggleAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    gap: 4,
    ...Shadows.button,
  },
  toggleAddButtonText: {
    color: ThemeColors.onPrimary,
    fontWeight: '700',
    fontSize: 12,
  },
  networkStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceSageLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  networkStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: ThemeColors.primary,
    marginLeft: 6,
  },
  financeCard: {
    marginBottom: Spacing.lg,
  },
  financeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  financeTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financeIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  financePeriodLabel: {
    color: ThemeColors.surfaceSageLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  profitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  profitTagLoss: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  profitTagText: {
    color: ThemeColors.secondaryFixed,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  profitTagTextLoss: {
    color: ThemeColors.loss,
  },
  amountCol: {
    marginBottom: Spacing.md,
  },
  amountNumber: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  amountSubtext: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 2,
  },
  ratioPod: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  ratioPodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ratioHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratioPodTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '600',
  },
  ratioPodPercent: {
    color: ThemeColors.secondaryFixed,
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: ThemeColors.secondaryFixed,
    borderRadius: Radius.full,
  },
  breakdownGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  breakdownCol: {
    flex: 1,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  breakdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  breakdownLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    fontWeight: '500',
  },
  breakdownValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  breakdownSub: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 10,
    marginTop: 1,
  },
  formCard: {
    marginBottom: Spacing.lg,
    padding: Spacing.lg,
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  formIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: ThemeColors.surfaceSageLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  formSubtitle: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
    marginBottom: 6,
  },
  lahanChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  lahanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceSageLight,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  lahanChipSelected: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  lahanChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.text,
  },
  lahanChipTextSelected: {
    color: ThemeColors.onPrimary,
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
    borderRadius: Radius.md,
    backgroundColor: ThemeColors.surfaceSageLight,
  },
  satuanChipSelected: {
    backgroundColor: ThemeColors.primary,
  },
  satuanChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.text,
  },
  satuanChipTextSelected: {
    color: ThemeColors.onPrimary,
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  liveCalcCard: {
    backgroundColor: ThemeColors.surfaceSageLight,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  liveCalcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  liveCalcTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.primary,
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
  },
  submitBtn: {
    marginTop: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
  countBadge: {
    backgroundColor: ThemeColors.surfaceSageLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  harvestCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  harvestAccentStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    backgroundColor: ThemeColors.primary,
  },
  harvestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  harvestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  harvestCategoryPill: {
    backgroundColor: 'rgba(0, 108, 73, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  harvestCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  harvestDateText: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
  },
  harvestIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: ThemeColors.surfaceSageLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  harvestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
    marginBottom: 8,
  },
  harvestDetailBox: {
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  harvestCalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  harvestQtyGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  harvestQtyText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  statusBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 4,
  },
  statusBadgeDone: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  statusBadgeDraft: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  harvestTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  harvestTotalLabel: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    fontWeight: '500',
  },
  harvestTotalValue: {
    fontSize: 14,
    fontWeight: '800',
    color: ThemeColors.text,
  },
  harvestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  lahanLocationText: {
    fontSize: 11,
    color: ThemeColors.textMuted,
    fontStyle: 'italic',
  },
});
