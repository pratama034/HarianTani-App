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
import { ThemeColors, Radius, Spacing } from '../../constants/theme';
import { useAppContext } from '../../context/AppContext';
import { AppCard } from '../../components/AppCard';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';

export default function LahanScreen() {
  const { lahanList, addLahan, isLoading, error, apiStatus, refetchAll } = useAppContext();
  const [isAdding, setIsAdding] = useState(false);
  const [nama, setNama] = useState('');
  const [luas, setLuas] = useState('');
  const [tanaman, setTanaman] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  };

  const predefinedCrops = ['Padi Ciherang', 'Jagung Manis', 'Cabai Rawit Merah'];

  const handleAdd = async () => {
    setFormError(null);
    if (!nama.trim() || !luas.trim() || !tanaman.trim()) {
      setFormError('Harap lengkapi semua bidang formulir lahan.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addLahan({
        nama: nama.trim(),
        luas: luas.trim(),
        tanaman: tanaman.trim(),
        tanggalTanam: new Date().toISOString().split('T')[0],
      });

      setNama('');
      setLuas('');
      setTanaman('');
      setIsAdding(false);
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan data lahan ke server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUmur = (tanggalTanam: string) => {
    try {
      const start = new Date(tanggalTanam);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return isNaN(diffDays) ? 1 : diffDays;
    } catch {
      return 1;
    }
  };

  const formatTanggalIndo = (tglStr: string) => {
    try {
      const date = new Date(tglStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return tglStr;
    }
  };

  if (isLoading && lahanList.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ThemeColors.primary} />
        <Text style={styles.loadingText}>Memuat data lahan dari REST API...</Text>
      </View>
    );
  }

  // Error / Offline / Timeout Full Screen State saat data belum ada (Slide 3, 5, 10, 11)
  if (error && lahanList.length === 0) {
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
      {/* Compact Error/Offline Banner saat update background gagal tapi data lokal tersedia */}
      {error && lahanList.length > 0 && (
        <ErrorState
          compact
          type={apiStatus === 'offline' ? 'offline' : apiStatus === 'timeout' ? 'timeout' : 'error'}
          message={error}
          onRetry={onRefresh}
          isRetrying={refreshing}
          style={{ marginBottom: Spacing.sm }}
        />
      )}

      {/* Overview Summary Ribbon */}
      <View style={styles.summaryRibbon}>
        <View style={styles.summaryRibbonLeft}>
          <View style={styles.summaryRibbonIcon}>
            <MaterialCommunityIcons
              name="terrain"
              size={20}
              color={ThemeColors.primary}
            />
          </View>
          <View>
            <Text style={styles.summaryRibbonLabel}>Kapasitas Produksi</Text>
            <Text style={styles.summaryRibbonValue}>
              {lahanList.length} Petak Lahan Aktif
            </Text>
          </View>
        </View>
        <View style={styles.summaryBadge}>
          <View style={styles.pulseDot} />
          <Text style={styles.summaryBadgeText}>🟢 Cloud REST API Active</Text>
        </View>
      </View>

      {/* Screen Header Row */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Lahan Saya</Text>
          <Text style={styles.pageSubtitle}>
            Kelola petak lahan dan siklus tumbuh tanaman
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
            {isAdding ? 'Tutup' : 'Tambah'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Collapsible Add Land Form */}
      {isAdding && (
        <AppCard style={styles.formCard}>
          <View style={styles.formHeader}>
            <View style={styles.formTitleRow}>
              <View style={styles.formIconBox}>
                <MaterialCommunityIcons
                  name="map-marker-plus"
                  size={18}
                  color={ThemeColors.primary}
                />
              </View>
              <Text style={styles.formTitle}>Tambah Petak Lahan Baru</Text>
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

          <FormInput
            label="Nama Petak Lahan"
            placeholder="cth: Lahan Sawah Barat Blok B"
            value={nama}
            onChangeText={setNama}
            leftIcon={
              <MaterialCommunityIcons
                name="sign-direction"
                size={18}
                color={ThemeColors.textMuted}
              />
            }
          />

          <FormInput
            label="Luas Area"
            placeholder="cth: 1.2 Hektar atau 800 m²"
            value={luas}
            onChangeText={setLuas}
            leftIcon={
              <MaterialCommunityIcons
                name="ruler-square"
                size={18}
                color={ThemeColors.textMuted}
              />
            }
          />

          <View style={styles.cropSelectorSection}>
            <Text style={styles.cropSectionLabel}>Pilih Komoditas Cepat</Text>
            <View style={styles.cropChipsRow}>
              {predefinedCrops.map((crop) => {
                const isSelected = tanaman === crop;
                return (
                  <TouchableOpacity
                    key={crop}
                    style={[
                      styles.cropChip,
                      isSelected && styles.cropChipSelected,
                    ]}
                    onPress={() => setTanaman(crop)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.cropChipText,
                        isSelected && styles.cropChipTextSelected,
                      ]}
                    >
                      {crop}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <FormInput
            label="Atau Ketik Jenis Tanaman Kustom"
            placeholder="cth: Kedelai Hitam, Bawang Merah"
            value={tanaman}
            onChangeText={setTanaman}
            leftIcon={
              <MaterialCommunityIcons
                name="sprout-outline"
                size={18}
                color={ThemeColors.textMuted}
              />
            }
          />

          <PrimaryButton
            title="Simpan Data Lahan"
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

      {/* Empty State */}
      {lahanList.length === 0 && !isAdding && (
        <AppCard style={styles.emptyCard}>
          <EmptyState
            iconName="sprout-outline"
            title="Belum Ada Lahan Terdaftar"
            description="Tambahkan petak sawah atau kebun pertama Anda untuk mulai memantau siklus tanam secara teratur."
            action={
              <PrimaryButton
                title="+ Tambah Lahan Baru"
                onPress={() => setIsAdding(true)}
              />
            }
          />
        </AppCard>
      )}

      {/* Parcel Cards List */}
      {lahanList.map((lahan, idx) => {
        const umurHari = getUmur(lahan.tanggalTanam);

        return (
          <AppCard key={lahan.id} style={styles.parcelCard}>
            {/* Top Ribbon & Title */}
            <View style={styles.parcelTopRow}>
              <View style={styles.parcelTitleGroup}>
                <View style={styles.parcelIconBox}>
                  <MaterialCommunityIcons
                    name="grass"
                    size={26}
                    color={ThemeColors.primary}
                  />
                </View>
                <View style={styles.parcelTitleCol}>
                  <View style={styles.parcelNameRow}>
                    <Text style={styles.parcelTitle}>{lahan.nama}</Text>
                    <View style={styles.greenActiveDot} />
                  </View>
                  <Text style={styles.parcelSub}>
                    {lahan.tanaman} • {lahan.luas}
                  </Text>
                </View>
              </View>
              <View style={styles.parcelBadgeCol}>
                <View style={styles.parcelStageBadge}>
                  <Text style={styles.parcelStageBadgeText}>Aktif</Text>
                </View>
                <Text style={styles.parcelPetakNum}>Petak #{idx + 1}</Text>
              </View>
            </View>

            {/* Growth Age & Plantation Banner */}
            <View style={styles.ageBanner}>
              <View style={styles.ageBannerLeft}>
                <View style={styles.calendarIconBox}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={22}
                    color={ThemeColors.primary}
                  />
                </View>
                <View>
                  <Text style={styles.ageLabel}>Umur Tanaman</Text>
                  <Text style={styles.ageNumber}>{umurHari} Hari</Text>
                </View>
              </View>
              <View style={styles.ageBannerRight}>
                <Text style={styles.tglLabel}>Tanggal Awal Tanam</Text>
                <Text style={styles.tglValue}>
                  {formatTanggalIndo(lahan.tanggalTanam)}
                </Text>
                <Text style={styles.estHarvestText}>
                  Fase Pertumbuhan Berjalan
                </Text>
              </View>
            </View>

            {/* 4-Stage Visual Growth Timeline (Route-Style) */}
            <View style={styles.growthTimelineBox}>
              <View style={styles.growthTimelineHeader}>
                <Text style={styles.growthTimelineTitle}>
                  SIKLUS PERTUMBUHAN
                </Text>
                <Text style={styles.growthTimelineStage}>
                  {umurHari < 15
                    ? 'Tahap 1: Semai'
                    : umurHari < 40
                    ? 'Tahap 2: Tanam'
                    : umurHari < 80
                    ? 'Tahap 3: Pemupukan'
                    : 'Tahap 4: Menjelang Panen'}
                </Text>
              </View>

              <View style={styles.growthNodesRow}>
                {/* Connecting Track Line */}
                <View style={styles.growthTrackBg} />
                <View
                  style={[
                    styles.growthTrackActive,
                    {
                      width:
                        umurHari < 15
                          ? '20%'
                          : umurHari < 40
                          ? '50%'
                          : umurHari < 80
                          ? '75%'
                          : '100%',
                    },
                  ]}
                />

                {/* Node 1: Semai */}
                <View style={styles.growthNodeCol}>
                  <View style={[styles.growthNodeDot, styles.growthNodeDone]}>
                    <MaterialCommunityIcons
                      name="check"
                      size={12}
                      color={ThemeColors.onPrimary}
                    />
                  </View>
                  <Text style={styles.growthNodeLabel}>Semai</Text>
                </View>

                {/* Node 2: Tanam */}
                <View style={styles.growthNodeCol}>
                  <View
                    style={[
                      styles.growthNodeDot,
                      umurHari >= 15 ? styles.growthNodeDone : styles.growthNodeIdle,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={umurHari >= 15 ? 'check' : 'sprout'}
                      size={12}
                      color={
                        umurHari >= 15
                          ? ThemeColors.onPrimary
                          : ThemeColors.textMuted
                      }
                    />
                  </View>
                  <Text style={styles.growthNodeLabel}>Tanam</Text>
                </View>

                {/* Node 3: Rawat / Pemupukan */}
                <View style={styles.growthNodeCol}>
                  <View
                    style={[
                      styles.growthNodeDot,
                      umurHari >= 40
                        ? styles.growthNodeActive
                        : styles.growthNodeIdle,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={umurHari >= 40 ? 'check' : 'watering-can'}
                      size={12}
                      color={
                        umurHari >= 40
                          ? ThemeColors.onPrimary
                          : ThemeColors.textMuted
                      }
                    />
                  </View>
                  <Text style={styles.growthNodeLabel}>Perawatan</Text>
                </View>

                {/* Node 4: Panen */}
                <View style={styles.growthNodeCol}>
                  <View
                    style={[
                      styles.growthNodeDot,
                      umurHari >= 90
                        ? styles.growthNodeDone
                        : styles.growthNodeIdle,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name="basket"
                      size={12}
                      color={
                        umurHari >= 90
                          ? ThemeColors.onPrimary
                          : ThemeColors.textMuted
                      }
                    />
                  </View>
                  <Text style={styles.growthNodeLabel}>Panen</Text>
                </View>
              </View>
            </View>

            {/* Matrix Info Row */}
            <View style={styles.infoRow}>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Luas Lahan</Text>
                <Text style={styles.infoValue}>{lahan.luas}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Komoditas</Text>
                <Text style={styles.infoValue}>{lahan.tanaman}</Text>
              </View>
              <View style={styles.infoCol}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={[styles.infoValue, { color: ThemeColors.profit }]}>
                  Terawat
                </Text>
              </View>
            </View>
          </AppCard>
        );
      })}

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
  summaryRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ThemeColors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderRadius: Radius.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  summaryRibbonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryRibbonIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  summaryRibbonLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  summaryRibbonValue: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.text,
    marginTop: 1,
  },
  summaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceTintGreen,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ThemeColors.profit,
    marginRight: 6,
  },
  summaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
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
  },
  toggleAddButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.onPrimary,
    marginLeft: 4,
  },
  formCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  formHeader: {
    marginBottom: Spacing.md,
  },
  formTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  formIconBox: {
    width: 32,
    height: 32,
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
  cropSelectorSection: {
    marginBottom: Spacing.md,
  },
  cropSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ThemeColors.text,
    marginBottom: Spacing.xs + 2,
  },
  cropChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropChip: {
    backgroundColor: ThemeColors.surfaceLow,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  cropChipSelected: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  cropChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.text,
  },
  cropChipTextSelected: {
    color: ThemeColors.onPrimary,
  },
  submitBtn: {
    marginTop: Spacing.xs,
  },
  emptyCard: {
    padding: Spacing.md,
  },
  parcelCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  parcelTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  parcelTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parcelIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm + 2,
  },
  parcelTitleCol: {
    flex: 1,
  },
  parcelNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parcelTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  greenActiveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: ThemeColors.profit,
    marginLeft: 6,
  },
  parcelSub: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  parcelBadgeCol: {
    alignItems: 'flex-end',
  },
  parcelStageBadge: {
    backgroundColor: ThemeColors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  parcelStageBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.onSecondaryContainer,
  },
  parcelPetakNum: {
    fontSize: 11,
    color: ThemeColors.textMuted,
    marginTop: 3,
  },
  ageBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ThemeColors.surfaceLow,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  ageBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: ThemeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  ageLabel: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
  },
  ageNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: ThemeColors.primary,
    marginTop: 1,
  },
  ageBannerRight: {
    alignItems: 'flex-end',
  },
  tglLabel: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
  },
  tglValue: {
    fontSize: 12,
    fontWeight: '700',
    color: ThemeColors.text,
    marginTop: 1,
  },
  estHarvestText: {
    fontSize: 10,
    fontWeight: '600',
    color: ThemeColors.profit,
    marginTop: 2,
  },
  growthTimelineBox: {
    backgroundColor: ThemeColors.surfaceSageLight,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  growthTimelineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  growthTimelineTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.textSecondary,
    letterSpacing: 0.5,
  },
  growthTimelineStage: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  growthNodesRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  growthTrackBg: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: ThemeColors.border,
    top: 10,
  },
  growthTrackActive: {
    position: 'absolute',
    left: 20,
    height: 3,
    backgroundColor: ThemeColors.primary,
    top: 10,
  },
  growthNodeCol: {
    alignItems: 'center',
    zIndex: 1,
  },
  growthNodeDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  growthNodeDone: {
    backgroundColor: ThemeColors.primary,
  },
  growthNodeActive: {
    backgroundColor: ThemeColors.secondary,
  },
  growthNodeIdle: {
    backgroundColor: ThemeColors.surfaceHigh,
  },
  growthNodeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: ThemeColors.border,
    paddingTop: Spacing.sm + 2,
  },
  infoCol: {
    alignItems: 'center',
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.text,
  },
});
