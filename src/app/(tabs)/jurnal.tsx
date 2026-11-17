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

export default function JurnalScreen() {
  const { jurnalList, lahanList, addJurnal, isLoading, error, apiStatus, statusCode, isSimulationActive, refetchAll } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);

  const [catatan, setCatatan] = useState('');
  const [biaya, setBiaya] = useState('');
  const [selectedLahanId, setSelectedLahanId] = useState('');
  const [selectedKategori, setSelectedKategori] = useState<string>('Pupuk/Obat');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  };

  const kategoriOptions = [
    { name: 'Bibit', icon: 'sprout' },
    { name: 'Pupuk/Obat', icon: 'bottle-tonic-outline' },
    { name: 'BBM/Traktor', icon: 'gas-station' },
    { name: 'Upah Tenaga', icon: 'account-group-outline' },
    { name: 'Lainnya', icon: 'shape-outline' },
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

  const totalBiayaBulanIni = jurnalList.reduce((acc, curr) => acc + curr.biaya, 0);

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ThemeColors.primary} />
        <Text style={styles.loadingText}>Memuat jurnal operasional dari REST API...</Text>
      </View>
    );
  }

  // Error / Offline / Timeout Full Screen State (Tampil saat simulasi aktif atau jika data kosong dan terjadi error)
  if (error && (isSimulationActive || jurnalList.length === 0)) {
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

        {/* Header Title & Intro */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.pageTitle}>Jurnal Lapangan</Text>
            <Text style={styles.pageSubtitle}>
              Buku catatan harian operasional & biaya tani
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

        {/* Summary Card: Total Biaya (Dark Obsidian Pod) */}
        <DarkSummaryCard style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.summaryTopLeft}>
              <MaterialCommunityIcons
                name="credit-card-outline"
                size={18}
                color={ThemeColors.secondaryFixed}
              />
              <Text style={styles.summaryPeriodText}>REKAP BIAYA OPERASIONAL</Text>
            </View>
            <View style={styles.summaryActiveTag}>
              <View style={styles.pulseDot} />
              <Text style={styles.summaryActiveTagText}>🟢 Cloud REST API Active</Text>
            </View>
          </View>

          <View style={styles.summaryAmountCol}>
            <Text style={styles.summaryAmountLabel}>Total Biaya Operasional</Text>
            <Text style={styles.summaryAmountNumber}>
              {formatRupiah(totalBiayaBulanIni)}
            </Text>
          </View>

          <View style={styles.summaryFooterRow}>
            <View style={styles.summaryFooterLeft}>
              <MaterialCommunityIcons
                name="receipt-text-outline"
                size={16}
                color={ThemeColors.secondaryFixed}
              />
              <Text style={styles.summaryFooterText}>
                {jurnalList.length} transaksi tercatat
              </Text>
            </View>
            <Text style={styles.summarySafeText}>Sesuai Rencana</Text>
          </View>
        </DarkSummaryCard>

        {/* Form Tambah Entri Jurnal */}
        {isAdding && (
          <AppCard style={styles.formCard}>
            <View style={styles.formTitleRow}>
              <View style={styles.formIconBox}>
                <MaterialCommunityIcons
                  name="notebook-plus"
                  size={20}
                  color={ThemeColors.primary}
                />
              </View>
              <View>
                <Text style={styles.formTitle}>Catat Aktivitas & Biaya</Text>
                <Text style={styles.formSubtitle}>Input observasi lapangan real-time</Text>
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

            {/* Pilih Lahan Selector */}
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

            {/* Kategori Biaya Chips */}
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
                        color={
                          isSelected
                            ? ThemeColors.onPrimary
                            : ThemeColors.primary
                        }
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

            {/* Catatan Observasi */}
            <FormInput
              label="Catatan Observasi Lapangan"
              placeholder="cth: Daun padi tampak hijau segar, aplikasi pupuk organik cair susulan..."
              value={catatan}
              onChangeText={setCatatan}
              multiline
              numberOfLines={3}
              inputStyle={styles.textAreaInput}
            />

            {/* Biaya Operasional (Opsional) */}
            <FormInput
              label="Biaya Operasional (Opsional)"
              placeholder="0 (kosongkan jika tanpa biaya)"
              value={biaya}
              onChangeText={setBiaya}
              keyboardType="numeric"
              leftIcon={
                <Text style={styles.currencyPrefix}>Rp</Text>
              }
              hint="Masukkan nominal pengeluaran pembelian sarana tani/upah"
            />

            <PrimaryButton
              title="Simpan Catatan Jurnal"
              onPress={handleAdd}
              loading={isSubmitting}
              disabled={isSubmitting}
              leftIcon={
                <MaterialCommunityIcons
                  name="check-circle"
                  size={18}
                  color={ThemeColors.onPrimary}
                />
              }
              style={styles.submitBtn}
            />
          </AppCard>
        )}

        {/* Timeline Section Header */}
        <View style={styles.timelineHeaderRow}>
          <View>
            <Text style={styles.timelineSectionTitle}>Riwayat Jurnal</Text>
            <Text style={styles.timelineSectionSubtitle}>
              Kronologi pantauan & pengeluaran usaha tani
            </Text>
          </View>
          <View style={styles.totalEntriesBadge}>
            <Text style={styles.totalEntriesBadgeText}>
              {jurnalList.length} Catatan
            </Text>
          </View>
        </View>

        {/* Connected Feed Timeline */}
        {jurnalList.length === 0 ? (
          <AppCard style={styles.emptyCard}>
            <EmptyState
              iconName="book-open-page-variant-outline"
              title="Belum Ada Catatan Jurnal"
              description="Catat perkembangan tanaman atau biaya pengeluaran operasional hari ini."
              action={
                <PrimaryButton
                  title="+ Buat Catatan Pertama"
                  onPress={() => setIsAdding(true)}
                />
              }
            />
          </AppCard>
        ) : (
          <View style={styles.timelineFeed}>
            {/* Visual Route Dotted Line */}
            <View style={styles.timelineDottedLine} />

            {jurnalList.map((jurnal) => {
              const lahan = lahanList.find((l) => l.id === jurnal.idLahan);
              const hasBiaya = jurnal.biaya > 0;

              return (
                <View key={jurnal.id} style={styles.feedItem}>
                  {/* Timeline Node Pin */}
                  <View style={styles.feedNodePinCol}>
                    <View
                      style={[
                        styles.feedNodePin,
                        hasBiaya
                          ? styles.feedNodePinExpense
                          : styles.feedNodePinObservation,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={
                          hasBiaya ? 'cash-minus' : 'leaf'
                        }
                        size={18}
                        color={
                          hasBiaya ? ThemeColors.loss : ThemeColors.primary
                        }
                      />
                    </View>
                  </View>

                  {/* Card Content */}
                  <AppCard style={styles.feedCard}>
                    <View style={styles.feedCardHeader}>
                      <Text style={styles.feedDateText}>{jurnal.tanggal}</Text>
                      <View style={styles.feedLahanPill}>
                        <Text style={styles.feedLahanPillText}>
                          {lahan?.nama || 'Petak Lahan'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.feedNoteText}>{jurnal.catatan}</Text>

                    {/* Financial or Observation Badge */}
                    <View style={styles.feedBadgeContainer}>
                      {hasBiaya ? (
                        <View style={styles.expenseBadge}>
                          <View style={styles.expenseDot} />
                          <Text style={styles.expenseLabel}>
                            Beban Biaya: {formatRupiah(jurnal.biaya)}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.observationBadge}>
                          <MaterialCommunityIcons
                            name="check"
                            size={14}
                            color={ThemeColors.primary}
                          />
                          <Text style={styles.observationLabel}>
                            Observasi Rutin (Rp 0)
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Footer */}
                    <View style={styles.feedCardFooter}>
                      <View style={styles.authorRow}>
                        <View style={styles.authorAvatar}>
                          <Text style={styles.authorAvatarText}>PT</Text>
                        </View>
                        <Text style={styles.authorName}>Tercatat di Sistem</Text>
                      </View>
                      <MaterialCommunityIcons
                        name="check-decagram"
                        size={16}
                        color={ThemeColors.primary}
                      />
                    </View>
                  </AppCard>
                </View>
              );
            })}
          </View>
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
  summaryCard: {
    marginBottom: Spacing.md,
    padding: Spacing.lg,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  summaryTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryPeriodText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
    marginLeft: 5,
  },
  summaryActiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: ThemeColors.secondaryFixed,
    marginRight: 4,
  },
  summaryActiveTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.secondaryFixed,
  },
  summaryAmountCol: {
    marginVertical: 6,
  },
  summaryAmountLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  summaryAmountNumber: {
    fontSize: 26,
    fontWeight: '700',
    color: ThemeColors.onDark,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  summaryFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 6,
  },
  summaryFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryFooterText: {
    fontSize: 11,
    color: ThemeColors.onDarkSecondary,
    marginLeft: 5,
  },
  summarySafeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.secondaryFixed,
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
  kategoriGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kategoriChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceLow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  kategoriChipSelected: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  kategoriChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: ThemeColors.text,
    marginLeft: 4,
  },
  kategoriChipTextSelected: {
    color: ThemeColors.onPrimary,
  },
  textAreaInput: {
    height: 70,
    textAlignVertical: 'top',
  },
  currencyPrefix: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.primary,
    marginRight: 4,
  },
  submitBtn: {
    marginTop: Spacing.xs,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
  timelineSectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  timelineSectionSubtitle: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    marginTop: 1,
  },
  totalEntriesBadge: {
    backgroundColor: ThemeColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    ...Shadows.subtle,
  },
  totalEntriesBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.textSecondary,
  },
  emptyCard: {
    padding: Spacing.md,
  },
  timelineFeed: {
    position: 'relative',
  },
  timelineDottedLine: {
    position: 'absolute',
    left: 20,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: ThemeColors.border,
  },
  feedItem: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  feedNodePinCol: {
    width: 42,
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  feedNodePin: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ThemeColors.surface,
    ...Shadows.subtle,
  },
  feedNodePinExpense: {
    backgroundColor: '#FFEBEE',
  },
  feedNodePinObservation: {
    backgroundColor: ThemeColors.surfaceTintGreen,
  },
  feedCard: {
    flex: 1,
    padding: Spacing.md,
  },
  feedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  feedDateText: {
    fontSize: 11,
    color: ThemeColors.textMuted,
    fontWeight: '600',
  },
  feedLahanPill: {
    backgroundColor: ThemeColors.surfaceTintGreen,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  feedLahanPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  feedNoteText: {
    fontSize: 14,
    color: ThemeColors.text,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  feedBadgeContainer: {
    marginBottom: Spacing.sm,
  },
  expenseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.errorContainer,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  expenseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ThemeColors.loss,
    marginRight: 5,
  },
  expenseLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: ThemeColors.loss,
  },
  observationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  observationLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: ThemeColors.primary,
    marginLeft: 4,
  },
  feedCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: ThemeColors.border,
    paddingTop: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  authorAvatarText: {
    fontSize: 9,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  authorName: {
    fontSize: 11,
    color: ThemeColors.textMuted,
  },
});
