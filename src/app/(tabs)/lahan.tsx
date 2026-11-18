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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { ThemeColors, Radius, Spacing } from '../../constants/theme';
import { useAppContext } from '../../context/AppContext';
import { useLocationPermission } from '../../hooks/useLocationPermission';
import { fetchAddressFromCoords } from '../../utils/location';
import { LahanMapView } from '../../components/LahanMapView';
import { AppCard } from '../../components/AppCard';
import { FormModal } from '../../components/FormModal';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { EmptyState } from '../../components/EmptyState';
import { ErrorState } from '../../components/ErrorState';

type CropFilter = 'Semua' | 'Padi' | 'Jagung' | 'Palawija';

export default function LahanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    lahanList,
    addLahan,
    isLoading,
    error,
    apiStatus,
    statusCode,
    isSimulationActive,
    refetchAll,
  } = useAppContext();

  const { requestPermission } = useLocationPermission();

  const [isAdding, setIsAdding] = useState(false);
  const [cropFilter, setCropFilter] = useState<CropFilter>('Semua');
  const [nama, setNama] = useState('');
  const [luas, setLuas] = useState('');
  const [tanaman, setTanaman] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchAll();
    setRefreshing(false);
  };

  const predefinedCrops = ['Padi Ciherang', 'Jagung Manis', 'Cabai Rawit Merah'];

  /**
   * Mengambil koordinat GPS saat ini menggunakan Location.Accuracy.Balanced
   * lalu memicu Reverse Geocoding untuk auto-fill alamat lahan.
   */
  const handleGetCurrentLocation = async () => {
    setIsLocating(true);
    setFormError(null);
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setFormError(
          'Izin akses lokasi ditolak. Silakan izinkan akses lokasi pada pengaturan perangkat.'
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude: lat, longitude: lon } = location.coords;
      setLatitude(lat);
      setLongitude(lon);

      // Auto-fill alamat lahan sesaat setelah koordinat didapatkan
      const fetchedAddress = await fetchAddressFromCoords(lat, lon);
      setAddress(fetchedAddress);
    } catch (err: any) {
      setFormError(err.message || 'Gagal mengambil koordinat lokasi saat ini.');
    } finally {
      setIsLocating(false);
    }
  };

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
        latitude,
        longitude,
        address: address.trim() || null,
      });

      setNama('');
      setLuas('');
      setTanaman('');
      setLatitude(null);
      setLongitude(null);
      setAddress('');
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
      return isNaN(diffDays) || diffDays <= 0 ? 1 : diffDays;
    } catch {
      return 1;
    }
  };

  const formatTanggalIndo = (tglStr: string) => {
    try {
      const date = new Date(tglStr);
      return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return tglStr;
    }
  };

  const avgHst =
    lahanList.length > 0
      ? Math.round(
          lahanList.reduce((acc, l) => acc + getUmur(l.tanggalTanam), 0) /
            lahanList.length
        )
      : 0;

  const filteredLahan = lahanList.filter((l) => {
    if (cropFilter === 'Semua') return true;
    const lower = l.tanaman.toLowerCase();
    if (cropFilter === 'Padi') return lower.includes('padi');
    if (cropFilter === 'Jagung') return lower.includes('jagung');
    return !lower.includes('padi') && !lower.includes('jagung');
  });

  if (isLoading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ThemeColors.primaryContainer} />
        <Text style={styles.loadingText}>Memuat inventaris petak lahan...</Text>
      </View>
    );
  }

  // Error / Offline / Timeout Full Screen State
  if (error && (isSimulationActive || lahanList.length === 0)) {
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
      {error && lahanList.length > 0 && (
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
      {/* 1. Top Section: Inventaris Petak Lahan (Modern Agritech Precision) */}
      <View style={styles.inventoryCard}>
        <View style={styles.inventoryHeader}>
          <View style={styles.inventoryHeaderLeft}>
            <View style={styles.inventoryIconBox}>
              <MaterialCommunityIcons
                name="sprout"
                size={19}
                color="#135D43"
              />
            </View>
            <View>
              <Text style={styles.inventoryTitle}>Inventaris Petak Lahan</Text>
              <Text style={styles.inventorySubtitle}>
                Monitoring berkala kondisi fisik agro-lahan
              </Text>
            </View>
          </View>

          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <Text style={styles.activePillText}>Aktif</Text>
          </View>
        </View>

        {/* 3-Column Metrics Grid */}
        <View style={styles.inventoryGrid}>
          <View style={styles.inventoryMetricBox}>
            <Text style={styles.inventoryMetricLabel}>Total Lahan</Text>
            <Text style={styles.inventoryMetricValue}>
              {lahanList.length} Petak
            </Text>
            <Text style={styles.inventoryMetricSub}>1.8 Ha Terdata</Text>
          </View>

          <View style={styles.inventoryMetricBox}>
            <Text style={styles.inventoryMetricLabel}>Rata-rata Umur</Text>
            <Text style={styles.inventoryMetricValue}>{avgHst} HST</Text>
            <Text style={styles.inventoryMetricSub}>Hari Sesudah Tanam</Text>
          </View>

          <View style={styles.inventoryMetricBox}>
            <Text style={styles.inventoryMetricLabel}>Status Irigasi</Text>
            <Text style={[styles.inventoryMetricValue, { color: '#006C49' }]}>
              Optimal
            </Text>
            <Text style={[styles.inventoryMetricSub, { color: '#00714D' }]}>
              100% Tercukupi
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Filter Controls (Clean Chips Row) */}
      <View style={styles.controlsBlock}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipsRow}
        >
          <TouchableOpacity
            style={styles.filterSquareBtn}
            onPress={() => setCropFilter('Semua')}
            activeOpacity={0.8}
            accessibilityLabel="Reset filter komoditas"
          >
            <MaterialCommunityIcons
              name="tune-variant"
              size={18}
              color={cropFilter === 'Semua' ? '#006C49' : ThemeColors.textSecondary}
            />
          </TouchableOpacity>
          {(
            [
              { key: 'Semua', label: `Semua (${lahanList.length})` },
              { key: 'Padi', label: 'Padi' },
              { key: 'Jagung', label: 'Jagung' },
              { key: 'Palawija', label: 'Palawija' },
            ] as { key: CropFilter; label: string }[]
          ).map((chip) => {
            const active = cropFilter === chip.key;
            return (
              <TouchableOpacity
                key={chip.key}
                style={[
                  styles.filterChip,
                  active && styles.filterChipActive,
                ]}
                onPress={() => setCropFilter(chip.key)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. Daftar Petak Aktif Heading */}
      <View style={styles.sectionHeadingRow}>
        <Text style={styles.sectionHeadingTitle}>Daftar Petak Aktif</Text>
        <Text style={styles.sectionHeadingMeta}>Update 10m lalu</Text>
      </View>

      {/* Empty State */}
      {filteredLahan.length === 0 && !isAdding && (
        <AppCard style={styles.emptyCard}>
          <EmptyState
            iconName="sprout-outline"
            title="Belum Ada Lahan Terdaftar"
            description="Tambahkan petak sawah atau kebun pertama Anda untuk mulai memantau siklus tanam."
            action={
              <PrimaryButton
                title="+ Tambah Petak Baru"
                onPress={() => setIsAdding(true)}
              />
            }
          />
        </AppCard>
      )}

      {/* 5. Plot Cards List */}
      <View style={styles.cardsStack}>
        {filteredLahan.map((lahan, idx) => {
          const hst = getUmur(lahan.tanggalTanam);
          const totalCycle = lahan.tanaman.toLowerCase().includes('jagung')
            ? 95
            : 115;
          const pct = Math.min(
            100,
            Math.max(8, Math.round((hst / totalCycle) * 100))
          );
          const isCorn = lahan.tanaman.toLowerCase().includes('jagung');

          return (
            <View key={lahan.id} style={styles.plotCard}>
              {/* Card Header */}
              <View style={styles.plotHeaderRow}>
                <View style={styles.plotHeaderLeft}>
                  <View style={styles.plotIconBox}>
                    <MaterialCommunityIcons
                      name={isCorn ? 'corn' : 'grass'}
                      size={24}
                      color="#135D43"
                    />
                  </View>
                  <View style={styles.plotTitleCol}>
                    <Text style={styles.plotNameText}>{lahan.nama}</Text>
                    <Text style={styles.plotCropText}>{lahan.tanaman}</Text>
                    {(lahan.address || (lahan.latitude && lahan.longitude)) && (
                      <View style={styles.plotLocationRow}>
                        <MaterialCommunityIcons
                          name="map-marker-outline"
                          size={12}
                          color="#006C49"
                        />
                        <Text style={styles.plotLocationText} numberOfLines={1}>
                          {lahan.address || `${lahan.latitude?.toFixed(4)}, ${lahan.longitude?.toFixed(4)}`}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View
                  style={[
                    styles.phaseBadge,
                    isCorn ? styles.phaseBadgeAmber : styles.phaseBadgeMint,
                  ]}
                >
                  <Text
                    style={[
                      styles.phaseBadgeText,
                      isCorn
                        ? styles.phaseBadgeTextAmber
                        : styles.phaseBadgeTextMint,
                    ]}
                  >
                    {isCorn ? 'Fase Pembungaan (V6)' : 'Fase Vegetatif Aktif'}
                  </Text>
                </View>
              </View>

              {/* Lifecycle Progress */}
              <View style={styles.lifecycleBox}>
                <View style={styles.lifecycleTopRow}>
                  <View style={styles.lifecycleDateRow}>
                    <MaterialCommunityIcons
                      name="calendar-blank-outline"
                      size={14}
                      color={ThemeColors.textSecondary}
                    />
                    <Text style={styles.lifecycleDateText}>
                      Tanam: {formatTanggalIndo(lahan.tanggalTanam)}
                    </Text>
                  </View>
                  <Text style={styles.lifecycleHstText}>
                    {hst} / {totalCycle} HST ({pct}%)
                  </Text>
                </View>
                <View style={styles.lifecycleTrack}>
                  <View
                    style={[styles.lifecycleFill, { width: `${pct}%` }]}
                  />
                </View>
              </View>

              {/* Visualisasi Peta Lahan Statis (react-native-maps) */}
              <LahanMapView
                latitude={lahan.latitude}
                longitude={lahan.longitude}
                namaLahan={lahan.nama}
                address={lahan.address}
                height={125}
                style={{ marginVertical: 2 }}
              />

              {/* Matrix Detail Parameter (Dipindahkan dari Sorotan Petak Utama Beranda) */}
              <View style={styles.matrixGrid}>
                <View style={styles.matrixBox}>
                  <Text style={styles.matrixLabel}>Luas Efektif</Text>
                  <Text style={styles.matrixValue}>{lahan.luas}</Text>
                </View>
                <View style={styles.matrixBox}>
                  <Text style={styles.matrixLabel}>Kebutuhan Air</Text>
                  <Text style={styles.matrixValue} numberOfLines={1}>
                    {idx % 2 === 0 ? '4.200 L/hr' : '3.800 L/hr'}
                  </Text>
                </View>
                <View style={styles.matrixBox}>
                  <Text style={styles.matrixLabel}>Status Nutrisi</Text>
                  <Text style={[styles.matrixValue, { color: '#006C49' }]}>
                    Optimal N-P-K
                  </Text>
                </View>
                <View style={styles.matrixBox}>
                  <Text style={styles.matrixLabel}>Prediksi Panen</Text>
                  <Text style={styles.matrixValue}>
                    {idx % 2 === 0 ? '28 Nov 2026' : '22 Des 2026'}
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.plotActionsRow}>
                <TouchableOpacity
                  style={styles.plotActionSecondary}
                  onPress={() => router.push('/(tabs)/jadwal')}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="calendar-month-outline"
                    size={16}
                    color="#135D43"
                  />
                  <Text style={styles.plotActionSecondaryText}>
                    Buka Jadwal
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.plotActionPrimaryTint}
                  onPress={() => router.push('/(tabs)/jurnal')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.plotActionPrimaryTintText}>
                    Detail & Jurnal
                  </Text>
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={16}
                    color="#135D43"
                  />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* 6. Kartu Rekomendasi Agronomi / Rotasi Tanam */}
      <View style={styles.agronomistCard}>
        <View style={styles.agronomistCircle}>
          <MaterialCommunityIcons name="leaf" size={20} color="#002113" />
        </View>
        <View style={styles.agronomistTextCol}>
          <View style={styles.agronomistTagRow}>
            <Text style={styles.agronomistTag}>WAWASAN AGRONOM</Text>
            <View style={styles.agronomistDot} />
            <Text style={styles.agronomistSubtag}>Rotasi Lahan</Text>
          </View>
          <Text style={styles.agronomistBody}>
            <Text style={styles.agronomistBold}>
              Rekomendasi Musim Berikutnya:{' '}
            </Text>
            Rotasi tanaman{' '}
            <Text style={{ color: '#006C49', fontWeight: '600' }}>Kedelai</Text>{' '}
            disarankan untuk pemulihan kandungan nitrogen tanah pasca panen di
            petak sawah utama.
          </Text>
        </View>
      </View>

      {/* 7. Quick Tip Footer Card */}
      <View style={styles.satelliteFooterCard}>
        <View style={styles.satelliteLeft}>
          <MaterialCommunityIcons
            name="satellite-variant"
            size={18}
            color="#006C49"
          />
          <Text style={styles.satelliteText}>
            Data petak lahan tersinkronisasi ke Cloud REST API
          </Text>
        </View>
        <TouchableOpacity onPress={onRefresh} activeOpacity={0.75}>
          <Text style={styles.satelliteSyncText}>Sinkronkan</Text>
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
        accessibilityLabel="Tambah petak lahan baru"
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
        title="Tambah Petak Lahan Baru"
        subtitle="Input inventaris lahan pertanian"
        iconName="sprout"
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

        <FormInput
          label="Nama Petak Lahan"
          placeholder="cth: Blok Sawah Barat"
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
          placeholder="cth: 1.2 Ha atau 800 m²"
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

        {/* Section Location-Based Services (LBS) */}
        <View style={styles.locationSection}>
          <View style={styles.locationHeaderRow}>
            <Text style={styles.locationSectionLabel}>
              Titik Koordinat & Alamat Lahan (GPS)
            </Text>
            {latitude !== null && longitude !== null && (
              <View style={styles.coordsBadge}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={12}
                  color="#006C49"
                />
                <Text style={styles.coordsBadgeText}>
                  {latitude.toFixed(4)}, {longitude.toFixed(4)}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.locationBtn, isLocating && styles.locationBtnDisabled]}
            onPress={handleGetCurrentLocation}
            disabled={isLocating}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Ambil koordinat lokasi saat ini"
          >
            {isLocating ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#006C49"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.locationBtnText}>
                  Mendeteksi Koordinat GPS...
                </Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons
                  name="crosshairs-gps"
                  size={18}
                  color="#006C49"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.locationBtnText}>
                  Ambil Lokasi Saat Ini
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <FormInput
          label="Alamat Lahan (Auto-Fill / Kustom)"
          placeholder="cth: Kp. Babakan, Cisaat, Sukabumi"
          value={address}
          onChangeText={setAddress}
          leftIcon={
            <MaterialCommunityIcons
              name="map-marker-outline"
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
  inventoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inventoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inventoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  inventoryIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: ThemeColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inventoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  inventorySubtitle: {
    fontSize: 11.5,
    color: ThemeColors.textSecondary,
    marginTop: 1,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(111, 251, 190, 0.30)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#006C49',
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#005236',
  },
  inventoryGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  inventoryMetricBox: {
    flex: 1,
    minWidth: 0,
    backgroundColor: ThemeColors.surfaceLow,
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
  },
  inventoryMetricLabel: {
    fontSize: 10.5,
    color: ThemeColors.textSecondary,
    fontWeight: '600',
  },
  inventoryMetricValue: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.primaryDark,
    marginTop: 4,
  },
  inventoryMetricSub: {
    fontSize: 10,
    color: ThemeColors.textMuted,
    marginTop: 1,
  },
  controlsBlock: {
    marginBottom: 14,
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
  filterSquareBtn: {
    width: 40,
    height: 34,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  filterChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  filterChipActive: {
    backgroundColor: '#135D43',
    borderColor: '#135D43',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
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
  cropSelectorSection: {
    marginBottom: 14,
  },
  cropSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.text,
    marginBottom: 8,
  },
  cropChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cropChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceLow,
  },
  cropChipSelected: {
    backgroundColor: '#135D43',
  },
  cropChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  cropChipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeadingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  sectionHeadingMeta: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    fontWeight: '600',
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: 14,
  },
  cardsStack: {
    gap: 14,
    marginBottom: 16,
  },
  plotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  plotHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  plotHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  plotIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: ThemeColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plotTitleCol: {
    flex: 1,
  },
  plotNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  plotCropText: {
    fontSize: 12.5,
    color: ThemeColors.textSecondary,
    marginTop: 2,
  },
  plotLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  plotLocationText: {
    fontSize: 11,
    color: '#006C49',
    fontWeight: '500',
    flex: 1,
  },
  phaseBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  phaseBadgeMint: {
    backgroundColor: 'rgba(111, 251, 190, 0.35)',
  },
  phaseBadgeAmber: {
    backgroundColor: '#FEF3C7',
  },
  phaseBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  phaseBadgeTextMint: {
    color: '#005236',
  },
  phaseBadgeTextAmber: {
    color: '#78350F',
  },
  lifecycleBox: {
    backgroundColor: ThemeColors.surfaceLow,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  lifecycleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lifecycleDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lifecycleDateText: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    fontWeight: '600',
  },
  lifecycleHstText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#135D43',
  },
  lifecycleTrack: {
    height: 8,
    backgroundColor: ThemeColors.surfaceHigh,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  lifecycleFill: {
    height: '100%',
    backgroundColor: '#135D43',
    borderRadius: Radius.full,
  },
  matrixGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  matrixBox: {
    flex: 1,
    backgroundColor: 'rgba(242, 243, 255, 0.65)',
    borderRadius: 12,
    padding: 10,
  },
  matrixLabel: {
    fontSize: 10.5,
    color: ThemeColors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  matrixValue: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  plotActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  plotActionSecondary: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 9,
    backgroundColor: ThemeColors.surfaceLow,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plotActionSecondaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#135D43',
  },
  plotActionPrimaryTint: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 9,
    backgroundColor: 'rgba(19, 93, 67, 0.10)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  plotActionPrimaryTintText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#135D43',
  },
  agronomistCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  agronomistCircle: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: '#6FFBBE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  agronomistTextCol: {
    flex: 1,
    gap: 4,
  },
  agronomistTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agronomistTag: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#006C49',
    letterSpacing: 0.5,
  },
  agronomistDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#006C49',
  },
  agronomistSubtag: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    fontWeight: '600',
  },
  agronomistBody: {
    fontSize: 13.5,
    color: ThemeColors.text,
    lineHeight: 19,
  },
  agronomistBold: {
    fontWeight: '700',
    color: ThemeColors.primaryDark,
  },
  satelliteFooterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  satelliteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  satelliteText: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    flex: 1,
  },
  satelliteSyncText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: ThemeColors.primaryDark,
  },
  locationSection: {
    marginBottom: 12,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  locationSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.text,
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 4,
  },
  coordsBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#006C49',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  locationBtnDisabled: {
    opacity: 0.6,
  },
  locationBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#006C49',
  },
});
