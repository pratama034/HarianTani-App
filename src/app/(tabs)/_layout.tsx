import React, { useState } from 'react';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useAppContext, SimulationScenario } from '../../context/AppContext';
import {
  View,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Text,
  Modal,
  ScrollView,
} from 'react-native';

export default function TabLayout() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const { apiStatus, statusCode, simulateApiCondition } = useAppContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={ThemeColors.primaryContainer} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  const handleSelectScenario = (scenario: SimulationScenario) => {
    setIsDiagnosticOpen(false);
    void simulateApiCondition(scenario);
  };

  const handleNotificationPress = () => {
    Alert.alert(
      'Notifikasi Operasional',
      'Ringkasan status harian:\n• Seluruh petak lahan terpantau optimal\n• Cuaca cerah berawan 28°C mendukung kegiatan lapang\n• Jadwal pemupukan siap dilaksanakan',
      [{ text: 'Mengerti', style: 'default' }]
    );
  };

  const handleLogoutPress = () => {
    const userName = user?.name ? user.name : 'Petani';
    const performLogout = async () => {
      const res = await logout();
      if (res.success) {
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Gagal Keluar', res.error || 'Terjadi kesalahan saat keluar.');
      }
    };

    if (Platform.OS === 'web') {
      if (
        typeof window !== 'undefined' &&
        window.confirm(`Halo ${userName}, apakah Anda yakin ingin keluar dari HarianTani?`)
      ) {
        void performLogout();
      }
    } else {
      Alert.alert(
        'Konfirmasi Keluar',
        `Halo ${userName}, apakah Anda yakin ingin keluar dari akun HarianTani?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Keluar', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  // Tentukan ikon & warna status jaringan secara dinamis (Pekan 6)
  let cloudIconName: keyof typeof MaterialCommunityIcons.glyphMap = 'cloud-check-outline';
  let cloudIconColor = '#6CF8BB';

  if (apiStatus === 'offline') {
    cloudIconName = 'wifi-off';
    cloudIconColor = '#FCA5A5';
  } else if (apiStatus === 'timeout') {
    cloudIconName = 'clock-alert-outline';
    cloudIconColor = '#FDE047';
  } else if (apiStatus === 'error') {
    cloudIconName = 'cloud-alert';
    cloudIconColor = '#FCA5A5';
  } else if (apiStatus === 'loading') {
    cloudIconName = 'cloud-sync-outline';
    cloudIconColor = '#FDE047';
  }

  const renderHeaderTitle = (screenSubtitle: string) => (
    <View style={styles.headerTitleContainer}>
      <View style={styles.headerLogoBox}>
        <MaterialCommunityIcons
          name="leaf"
          size={20}
          color="#6CF8BB"
        />
      </View>
      <View style={styles.headerTextCol}>
        <View style={styles.headerBrandRow}>
          <Text style={styles.headerBrandTitle}>HarianTani</Text>
          <View style={styles.headerLiveDot} />
        </View>
        <View style={styles.headerSubtitleRow}>
          <MaterialCommunityIcons
            name="map-marker"
            size={12}
            color="#6CF8BB"
          />
          <Text style={styles.headerBrandSubtitle} numberOfLines={1}>
            {screenSubtitle}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <>
      <StatusBar style="light" />

      {/* Modal Panel Diagnostik & Penguji Kondisi API (Sprint 04 & Sprint 05 Demo) */}
      <Modal
        visible={isDiagnosticOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDiagnosticOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScrollContent}
              bounces={false}
            >
              <View style={styles.modalHeaderRow}>
                <View style={styles.modalTitleRow}>
                  <MaterialCommunityIcons
                    name="shield-sync"
                    size={22}
                    color={ThemeColors.primaryContainer}
                  />
                  <Text style={styles.modalTitle}>Status & Uji REST API</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setIsDiagnosticOpen(false)}
                  accessibilityRole="button"
                  accessibilityLabel="Tutup Panel"
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={22}
                    color={ThemeColors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.statusSummaryBox}>
                <Text style={styles.statusSummaryLabel}>Status Saat Ini:</Text>
                <Text style={styles.statusSummaryValue}>
                  {apiStatus === 'success' && '200 OK — Cloud REST API Active (JWT Protected)'}
                  {apiStatus === 'idle' && '200 OK — Sinkronisasi Aktif'}
                  {apiStatus === 'loading' && 'Loading — Sedang menghubungi server...'}
                  {apiStatus === 'offline' && 'Offline — Tidak ada koneksi internet'}
                  {apiStatus === 'timeout' && '408 Timeout — Waktu permintaan habis'}
                  {apiStatus === 'error' &&
                    `HTTP ${statusCode || 500} Error — Kegagalan respons server`}
                </Text>
                <Text style={styles.statusSecurityNote}>
                  • Keamanan Pekan 5: JWT Bearer Token + SecureStore + 401 Auto-Logout{'\n'}
                  • Keandalan Pekan 6: Timeout 12s AbortController + Klasifikasi 2xx/4xx/5xx & Offline
                </Text>
              </View>

              <Text style={styles.simulatorSectionTitle}>
                Simulator Kondisi Jaringan (Demo Pekan 6):
              </Text>

              <TouchableOpacity
                style={[
                  styles.scenarioBtn,
                  (apiStatus === 'success' || apiStatus === 'idle') && styles.scenarioBtnActive,
                ]}
                onPress={() => handleSelectScenario('normal')}
              >
                <MaterialCommunityIcons name="check-circle" size={18} color="#006C49" />
                <View style={styles.scenarioTextCol}>
                  <Text style={styles.scenarioBtnTitle}>1. Normal / Live API (200 OK)</Text>
                  <Text style={styles.scenarioBtnDesc}>
                    Hubungkan kembali ke server Supabase REST API normal
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scenarioBtn,
                  apiStatus === 'offline' && styles.scenarioBtnActive,
                ]}
                onPress={() => handleSelectScenario('offline')}
              >
                <MaterialCommunityIcons name="wifi-off" size={18} color="#DC2626" />
                <View style={styles.scenarioTextCol}>
                  <Text style={styles.scenarioBtnTitle}>2. Simulasi Offline (Tidak Ada Internet)</Text>
                  <Text style={styles.scenarioBtnDesc}>
                    Uji tampilan Offline State & tombol Retry ketika jaringan terputus
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scenarioBtn,
                  apiStatus === 'timeout' && styles.scenarioBtnActive,
                ]}
                onPress={() => handleSelectScenario('timeout')}
              >
                <MaterialCommunityIcons name="clock-alert-outline" size={18} color="#D97706" />
                <View style={styles.scenarioTextCol}>
                  <Text style={styles.scenarioBtnTitle}>3. Simulasi Request Timeout (408)</Text>
                  <Text style={styles.scenarioBtnDesc}>
                    Uji penanganan saat server terlalu lama merespons
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scenarioBtn,
                  apiStatus === 'error' && statusCode === 404 && styles.scenarioBtnActive,
                ]}
                onPress={() => handleSelectScenario('http_404')}
              >
                <MaterialCommunityIcons name="file-search-outline" size={18} color="#D97706" />
                <View style={styles.scenarioTextCol}>
                  <Text style={styles.scenarioBtnTitle}>4. Simulasi Client Error (404 Not Found)</Text>
                  <Text style={styles.scenarioBtnDesc}>
                    Uji respons HTTP 4xx ketika endpoint/data tidak ditemukan
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.scenarioBtn,
                  apiStatus === 'error' && statusCode === 500 && styles.scenarioBtnActive,
                ]}
                onPress={() => handleSelectScenario('http_500')}
              >
                <MaterialCommunityIcons name="server-network-off" size={18} color="#DC2626" />
                <View style={styles.scenarioTextCol}>
                  <Text style={styles.scenarioBtnTitle}>5. Simulasi Server Error (500 Internal)</Text>
                  <Text style={styles.scenarioBtnDesc}>
                    Uji respons HTTP 5xx ketika server mengalami gangguan
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setIsDiagnosticOpen(false)}
              >
                <Text style={styles.closeModalBtnText}>Tutup Panel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: ThemeColors.tabBarActive,
          tabBarInactiveTintColor: ThemeColors.tabBarInactive,
          tabBarStyle: [
            styles.tabBar,
            {
              height: Platform.select({
                ios: 56 + Math.max(insets.bottom, 16),
                android: 60 + Math.max(insets.bottom, 8),
                default: 64,
              }),
              paddingBottom: Platform.select({
                ios: Math.max(insets.bottom, 10),
                android: Math.max(insets.bottom, 8),
                default: 8,
              }),
            },
          ],
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
          headerStyle: [
            styles.header,
            insets.top > 0 && {
              height: Platform.select({
                ios: 50 + insets.top,
                android: 56 + insets.top,
                default: 64,
              }),
            },
          ],
          headerShadowVisible: false,
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <TouchableOpacity
                style={styles.headerCircleButton}
                onPress={() => setIsDiagnosticOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Status dan Simulasi REST API"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name={cloudIconName}
                  size={19}
                  color={cloudIconColor}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerCircleButton}
                onPress={handleNotificationPress}
                accessibilityRole="button"
                accessibilityLabel="Notifikasi Operasional"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="bell-outline"
                  size={20}
                  color="#FFFFFF"
                />
                <View style={styles.notificationDot} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.headerCircleButton}
                onPress={handleLogoutPress}
                accessibilityRole="button"
                accessibilityLabel="Profil dan Keluar"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="account-outline"
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Beranda',
            headerTitle: () => renderHeaderTitle('Sukaraja, Sukabumi'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <MaterialCommunityIcons
                  name={focused ? 'home' : 'home-outline'}
                  size={20}
                  color={focused ? '#005139' : (typeof color === 'string' ? color : ThemeColors.tabBarInactive)}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="lahan"
          options={{
            title: 'Lahan',
            headerTitle: () => renderHeaderTitle('Lahan'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <MaterialCommunityIcons
                  name={focused ? 'view-grid' : 'view-grid-outline'}
                  size={20}
                  color={focused ? '#005139' : (typeof color === 'string' ? color : ThemeColors.tabBarInactive)}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="jadwal"
          options={{
            title: 'Jadwal',
            headerTitle: () => renderHeaderTitle('Jadwal'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <MaterialCommunityIcons
                  name={focused ? 'calendar-month' : 'calendar-month-outline'}
                  size={20}
                  color={focused ? '#005139' : (typeof color === 'string' ? color : ThemeColors.tabBarInactive)}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="jurnal"
          options={{
            title: 'Jurnal',
            headerTitle: () => renderHeaderTitle('Jurnal'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <MaterialCommunityIcons
                  name={focused ? 'book-open-variant' : 'book-open-outline'}
                  size={20}
                  color={focused ? '#005139' : (typeof color === 'string' ? color : ThemeColors.tabBarInactive)}
                />
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="panen"
          options={{
            title: 'Panen',
            headerTitle: () => renderHeaderTitle('Panen'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <MaterialCommunityIcons
                  name="trending-up"
                  size={20}
                  color={focused ? '#005139' : (typeof color === 'string' ? color : ThemeColors.tabBarInactive)}
                />
              </View>
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: ThemeColors.background,
  },
  header: {
    backgroundColor: ThemeColors.headerBackground, // #0E3E2D
    elevation: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.10)',
    height: Platform.OS === 'ios' ? 98 : 66,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: 190,
  },
  headerLogoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flexDirection: 'column',
    justifyContent: 'center',
    flexShrink: 1,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBrandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  headerLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#6CF8BB',
  },
  headerSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  headerBrandSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.88)',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    gap: 6,
  },
  headerCircleButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6CF8BB',
    borderWidth: 1.5,
    borderColor: '#0E3E2D',
  },
  tabBar: {
    backgroundColor: ThemeColors.tabBarBackground, // #0E3E2D
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
    height: Platform.OS === 'ios' ? 84 : 66,
    paddingBottom: Platform.OS === 'ios' ? 22 : 8,
    paddingTop: 6,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  tabBarItem: {
    paddingVertical: 2,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  iconWrapper: {
    width: 46,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: '#ABF1CF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md + 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Shadows.card,
  },
  modalScrollContent: {
    paddingBottom: 4,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  statusSummaryBox: {
    backgroundColor: '#ECFDF5',
    borderRadius: Radius.md,
    padding: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: Spacing.md,
  },
  statusSummaryLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.textSecondary,
    textTransform: 'uppercase',
  },
  statusSummaryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.text,
    marginTop: 2,
    marginBottom: 6,
  },
  statusSecurityNote: {
    fontSize: 11.5,
    color: ThemeColors.textSecondary,
    lineHeight: 17,
  },
  simulatorSectionTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: ThemeColors.text,
    marginBottom: Spacing.xs,
  },
  scenarioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    gap: 10,
  },
  scenarioBtnActive: {
    borderColor: ThemeColors.primaryContainer,
    backgroundColor: '#ECFDF5',
  },
  scenarioTextCol: {
    flex: 1,
  },
  scenarioBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  scenarioBtnDesc: {
    fontSize: 11.5,
    color: ThemeColors.textSecondary,
    marginTop: 1,
  },
  closeModalBtn: {
    marginTop: Spacing.xs,
    backgroundColor: ThemeColors.primaryContainer,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
