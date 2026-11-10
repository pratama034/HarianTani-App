import React, { useState } from 'react';
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
import { ThemeColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { useAppContext } from '../../context/AppContext';
import { AppCard } from '../../components/AppCard';
import { DarkSummaryCard } from '../../components/DarkSummaryCard';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';

export default function PanenScreen() {
  const { panenList, jurnalList, lahanList, addPanen, isLoading, error, apiStatus, refetchAll } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);

  const [jumlah, setJumlah] = useState('500');
  const [satuan, setSatuan] = useState('Kg');
  const [hargaJual, setHargaJual] = useState('12000');
  const [selectedLahanId, setSelectedLahanId] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  };

  const unitOptions = ['Kg', 'Ton', 'Kuintal', 'Ikat'];

  const handleAdd = async () => {
    setFormError(null);
    const parsedJumlah = parseFloat(jumlah.replace(/[^0-9.]/g, ''));
    const parsedHarga = parseFloat(hargaJual.replace(/[^0-9.]/g, ''));

    if (!selectedLahanId) {
      setFormError('Harap pilih lahan asal hasil panen.');
      return;
    }

    if (isNaN(parsedJumlah) || parsedJumlah <= 0) {
      setFormError('Kuantitas panen harus lebih dari 0.');
      return;
    }

    if (isNaN(parsedHarga) || parsedHarga <= 0) {
      setFormError('Harga jual satuan harus lebih dari 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addPanen({
        idLahan: selectedLahanId,
        tanggal: new Date().toISOString().split('T')[0],
        jumlah: parsedJumlah,
        satuan: satuan.trim() || 'Kg',
        hargaJual: parsedHarga,
      });

      setJumlah('');
      setHargaJual('');
      setSelectedLahanId('');
      setIsAdding(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data panen ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(isNaN(angka) ? 0 : angka);
  };

  // Financial Calculations
  const totalPendapatan = panenList.reduce(
    (acc, curr) => acc + curr.jumlah * curr.hargaJual,
    0
  );
  const totalBiaya = jurnalList.reduce((acc, curr) => acc + curr.biaya, 0);
  const estimasiKeuntungan = totalPendapatan - totalBiaya;
  const isProfit = estimasiKeuntungan >= 0;

  // Margin percentage safely computed
  const marginPercent =
    totalPendapatan > 0
      ? Math.max(0, Math.min(100, Math.round((estimasiKeuntungan / totalPendapatan) * 100)))
      : 0;

  // Live calculator calculation
  const liveQty = parseFloat(jumlah.replace(/[^0-9.]/g, '')) || 0;
  const livePrice = parseFloat(hargaJual.replace(/[^0-9.]/g, '')) || 0;
  const liveTotal = liveQty * livePrice;

  if (isLoading && panenList.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ThemeColors.primary} />
        <Text style={styles.loadingText}>Memuat laporan hasil panen dari REST API...</Text>
      </View>
    );
  }

  // Error / Offline / Timeout Full Screen State saat data belum ada (Slide 3, 5, 10, 11)
  if (error && panenList.length === 0) {
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
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
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
        {/* Compact Error/Offline Banner saat update background gagal tapi data lokal tersedia */}
        {error && panenList.length > 0 && (
          <ErrorState
            compact
            type={apiStatus === 'offline' ? 'offline' : apiStatus === 'timeout' ? 'timeout' : 'error'}
            message={error}
            onRetry={onRefresh}
            isRetrying={refreshing}
            style={{ marginBottom: Spacing.sm }}
          />
        )}

        {/* Header Intro */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Laporan & Finansial</Text>
            <Text style={styles.pageSubtitle}>
              Analisis performa hasil panen dan keuntungan bersih usaha tani
            </Text>
          </View>
          <TouchableOpacity
            style={styles.toggleAddButton}
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
          <Text style={styles.networkStatusText}>🟢 Cloud REST API Active</Text>
        </View>

        {/* Executive Financial Performance Card (Dark Obsidian Luxury Pod) */}
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

          {/* Big Profit Number */}
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

          {/* Mini Visual Progress Track */}
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

          {/* Financial Breakdown Sub-grid */}
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
                {panenList.length} transaksi penjualan
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

        {/* Form Pencatatan Panen Baru */}
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
                  Input timbangan dan kalkulasi otomatis
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
              <Text style={styles.fieldLabel}>Pilih Lahan Panen</Text>
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
                        {lahan.nama}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Kuantitas & Satuan */}
            <View style={styles.qtySatuanRow}>
              <View style={styles.qtyInputCol}>
                <FormInput
                  label="Kuantitas Panen"
                  placeholder="800"
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

            {/* Live Calculation Preview Badge */}
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
              title="Simpan Data Panen"
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

        {/* Riwayat Hasil Panen Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <MaterialCommunityIcons
              name="history"
              size={20}
              color={ThemeColors.primary}
            />
            <Text style={styles.sectionTitle}>Riwayat Transaksi Panen</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{panenList.length} Catatan</Text>
          </View>
        </View>

        {panenList.length === 0 ? (
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
        ) : (
          panenList.map((panen) => {
            const lahan = lahanList.find((l) => l.id === panen.idLahan);
            const totalTransaksi = panen.jumlah * panen.hargaJual;

            return (
              <AppCard key={panen.id} style={styles.harvestCard}>
                <View style={styles.harvestAccentStrip} />

                <View style={styles.harvestHeader}>
                  <View style={styles.harvestHeaderLeft}>
                    <View style={styles.harvestCategoryPill}>
                      <Text style={styles.harvestCategoryText}>
                        {lahan?.tanaman || 'Komoditas Tani'}
                      </Text>
                    </View>
                    <Text style={styles.harvestDateText}>{panen.tanggal}</Text>
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
                  Hasil Panen {lahan?.nama || 'Petak Lahan'}
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
                        {panen.jumlah} {panen.satuan} @{' '}
                        {formatRupiah(panen.hargaJual)} / {panen.satuan}
                      </Text>
                    </View>
                    <View style={styles.lunasBadge}>
                      <Text style={styles.lunasBadgeText}>Lunas</Text>
                    </View>
                  </View>

                  <View style={styles.harvestTotalRow}>
                    <Text style={styles.harvestTotalLabel}>
                      Total Penjualan:
                    </Text>
                    <Text style={styles.harvestTotalValue}>
                      {formatRupiah(totalTransaksi)}
                    </Text>
                  </View>
                </View>

                {/* Footer Verified Info */}
                <View style={styles.harvestFooter}>
                  <View style={styles.verifiedRow}>
                    <MaterialCommunityIcons
                      name="check-decagram"
                      size={15}
                      color={ThemeColors.profit}
                    />
                    <Text style={styles.verifiedText}>Transaksi Terverifikasi</Text>
                  </View>
                  <Text style={styles.lahanLocationText}>
                    {lahan?.nama || 'Lahan Sawah'}
                  </Text>
                </View>
              </AppCard>
            );
          })
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
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
  keyboardContainer: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  scrollContent: {
    padding: Spacing.margin,
    paddingTop: Spacing.sm,
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
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginTop: 2,
  },
  toggleAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    ...Shadows.subtle,
  },
  toggleAddButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.onPrimary,
    marginLeft: 4,
  },
  financeCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  financeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  financeTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  financeIconBox: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  financePeriodLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  profitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  profitTagLoss: {
    backgroundColor: ThemeColors.errorContainer,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: ThemeColors.secondaryFixed,
    marginRight: 5,
  },
  profitTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.onPrimary,
  },
  profitTagTextLoss: {
    color: ThemeColors.loss,
  },
  amountCol: {
    marginVertical: Spacing.sm,
  },
  amountNumber: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  amountSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    marginTop: 4,
  },
  ratioPod: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    marginVertical: Spacing.sm,
  },
  ratioPodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  ratioHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratioPodTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 5,
  },
  ratioPodPercent: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.secondaryFixed,
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
  breakdownGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  breakdownCol: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radius.md,
    padding: 10,
  },
  breakdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  breakdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    textTransform: 'uppercase',
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.onDark,
  },
  breakdownSub: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.55)',
    marginTop: 2,
  },
  formCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  formIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  formSubtitle: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginTop: 1,
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
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ThemeColors.text,
    marginBottom: Spacing.xs + 2,
  },
  lahanChipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  lahanChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  lahanChipSelected: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  lahanChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.text,
    marginLeft: 4,
  },
  lahanChipTextSelected: {
    color: ThemeColors.onPrimary,
  },
  qtySatuanRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  qtyInputCol: {
    flex: 1,
  },
  satuanCol: {
    width: 120,
  },
  satuanChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  satuanChip: {
    backgroundColor: ThemeColors.surfaceLow,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  satuanChipSelected: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  satuanChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.textSecondary,
  },
  satuanChipTextSelected: {
    color: ThemeColors.onPrimary,
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.primary,
    marginRight: 4,
  },
  liveCalcCard: {
    backgroundColor: ThemeColors.surfaceTintGreen,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  liveCalcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  liveCalcTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.primary,
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  liveCalcRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  liveCalcFormula: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    fontWeight: '500',
  },
  liveCalcTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  submitBtn: {
    marginTop: Spacing.xs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: ThemeColors.text,
    marginLeft: 6,
  },
  countBadge: {
    backgroundColor: ThemeColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    ...Shadows.subtle,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.textSecondary,
  },
  emptyCard: {
    padding: Spacing.md,
  },
  harvestCard: {
    position: 'relative',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  harvestAccentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: ThemeColors.primary,
  },
  harvestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
    paddingLeft: 4,
  },
  harvestHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  harvestCategoryPill: {
    backgroundColor: ThemeColors.surfaceTintGreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginRight: 8,
  },
  harvestCategoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.primary,
    textTransform: 'uppercase',
  },
  harvestDateText: {
    fontSize: 11,
    color: ThemeColors.textMuted,
    fontWeight: '600',
  },
  harvestIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  harvestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
    marginBottom: Spacing.sm,
    paddingLeft: 4,
  },
  harvestDetailBox: {
    backgroundColor: ThemeColors.surfaceLow,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    marginBottom: Spacing.sm,
  },
  harvestCalcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  harvestQtyGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  harvestQtyText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.text,
    marginLeft: 4,
  },
  lunasBadge: {
    backgroundColor: ThemeColors.surfaceTintGreen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  lunasBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.profit,
  },
  harvestTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: ThemeColors.border,
    paddingTop: 4,
    marginTop: 2,
  },
  harvestTotalLabel: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
  },
  harvestTotalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.profit,
  },
  harvestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 4,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 11,
    color: ThemeColors.textMuted,
    marginLeft: 4,
  },
  lahanLocationText: {
    fontSize: 11,
    fontWeight: '600',
    color: ThemeColors.primary,
  },
});
