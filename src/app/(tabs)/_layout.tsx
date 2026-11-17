import React, { useState } from 'react';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
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
} from 'react-native';

export default function TabLayout() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const { apiStatus, statusCode, simulateApiCondition } = useAppContext();
  const router = useRouter();
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={ThemeColors.primary} />
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
      'Ringkasan status harian:\n• Seluruh petak lahan terpantau optimal\n• Cuaca cerah mendukung kegiatan lapang\n• Jadwal pemupukan siap dilaksanakan',
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

  // Tentukan ikon & warna status jaringan secara dinamis (Slide 3, 5, 13, 14 Pekan 6)
  let cloudIconName: keyof typeof MaterialCommunityIcons.glyphMap = 'cloud-check';
  let cloudIconColor = '#A3E635';

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
    cloudIconName = 'cloud-sync';
    cloudIconColor = '#FDE047';
  }

  const renderHeaderTitle = (screenSubtitle: string) => (
    <View style={styles.headerTitleContainer}>
      <View style={styles.headerLogoCircle}>
        <MaterialCommunityIcons
          name="sprout"
          size={20}
          color={ThemeColors.primary}
        />
      </View>
      <View>
        <Text style={styles.headerBrandTitle}>HarianTani</Text>
        <Text style={styles.headerBrandSubtitle}>{screenSubtitle}</Text>
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
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalTitleRow}>
                <MaterialCommunityIcons
                  name="shield-sync"
                  size={22}
                  color={ThemeColors.primary}
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
                {apiStatus === 'success' && '🟢 200 OK — Cloud REST API Active (JWT Protected)'}
                {apiStatus === 'loading' && '🟡 Loading — Sedang menghubungi server...'}
                {apiStatus === 'offline' && '🔴 Offline — Tidak ada koneksi internet'}
                {apiStatus === 'timeout' && '🟠 408 Timeout — Waktu permintaan habis'}
                {apiStatus === 'error' &&
                  `🔴 HTTP ${statusCode || 500} Error — Kegagalan respons server`}
              </Text>
              <Text style={styles.statusSecurityNote}>
                • Keamanan Pekan 5: JWT Bearer Token + SecureStore + 401 Auto-Logout{'\n'}
                • Keandalan Pekan 6: 12s AbortController Timeout + Error/Offline Retry
              </Text>
            </View>

            <Text style={styles.simulatorSectionTitle}>
              Simulasi & Pengujian Skenario API (Sprint 05 Demo):
            </Text>

            <TouchableOpacity
              style={[
                styles.scenarioBtn,
                apiStatus === 'success' && styles.scenarioBtnActive,
              ]}
              onPress={() => handleSelectScenario('normal')}
            >
              <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
              <View style={styles.scenarioTextCol}>
                <Text style={styles.scenarioBtnTitle}>1. Live API Normal (200 OK)</Text>
                <Text style={styles.scenarioBtnDesc}>
                  Ambil data asli dari Supabase PostgREST API
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
                <Text style={styles.scenarioBtnTitle}>2. Simulasi Offline (No Internet)</Text>
                <Text style={styles.scenarioBtnDesc}>
                  Uji tampilan tidak ada koneksi internet & tombol Coba Lagi
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
                  Uji kondisi ketika server terlalu lama merespons
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
              <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#D97706" />
              <View style={styles.scenarioTextCol}>
                <Text style={styles.scenarioBtnTitle}>4. Simulasi Client Error (404 Not Found)</Text>
                <Text style={styles.scenarioBtnDesc}>
                  Uji respons HTTP 4xx ketika resource tidak ditemukan
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
          </View>
        </View>
      </Modal>

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: ThemeColors.tabBarActive,
          tabBarInactiveTintColor: ThemeColors.tabBarInactive,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarItemStyle: styles.tabBarItem,
          headerStyle: styles.header,
          headerShadowVisible: false,
          headerRight: () => (
            <View style={styles.headerRightContainer}>
              <TouchableOpacity
                style={styles.headerCloudButton}
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
                style={styles.headerNotificationButton}
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
                style={styles.headerProfileButton}
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
            headerTitle: () => renderHeaderTitle('Beranda'),
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <MaterialCommunityIcons
                  name={focused ? 'home' : 'home-outline'}
                  size={24}
                  color={focused ? ThemeColors.tabBarActive : (typeof color === 'string' ? color : ThemeColors.tabBarInactive)}
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
                  name={focused ? 'sprout' : 'sprout-outline'}
                  size={24}
                  color={focused ? ThemeColors.tabBarActive : (typeof color === 'string' ? color : ThemeColors.tabBarInactive)}
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
                  name={focused ? 'calendar-clock' : 'calendar-clock-outline'}
                  size={24}
                  color={focused ? ThemeColors.tabBarActive : (typeof color === 'string' ? color : ThemeColors.tabBarInactive)}
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
                  name={focused ? 'notebook-edit' : 'notebook-edit-outline'}
                  size={24}
                  color={focused ? ThemeColors.tabBarActive : (typeof color === 'string' ? color : ThemeColors.tabBarInactive)}
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
                  name={focused ? 'basket' : 'basket-outline'}
                  size={24}
                  color={focused ? ThemeColors.tabBarActive : (typeof color === 'string' ? color : ThemeColors.tabBarInactive)}
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
    backgroundColor: ThemeColors.headerBackground,
    elevation: 6,
    shadowColor: '#0D631B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    borderBottomWidth: 0,
    height: Platform.OS === 'ios' ? 98 : 66,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoCircle: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  headerBrandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ThemeColors.onHeader,
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  headerBrandSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: ThemeColors.onHeaderSubtitle,
    marginTop: -1,
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    gap: 8,
  },
  headerCloudButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerNotificationButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: ThemeColors.loss,
    borderWidth: 1.5,
    borderColor: ThemeColors.primary,
  },
  headerProfileButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBar: {
    backgroundColor: ThemeColors.tabBarBackground,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    height: Platform.OS === 'ios' ? 86 : 70,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    elevation: 12,
    shadowColor: '#0A280F',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
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
    width: 44,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapperActive: {
    backgroundColor: ThemeColors.tabBarActivePill,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: ThemeColors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.card,
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
    backgroundColor: '#F0FDF4',
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.25)',
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
    borderColor: 'rgba(0, 0, 0, 0.08)',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    gap: 10,
  },
  scenarioBtnActive: {
    borderColor: ThemeColors.primary,
    backgroundColor: '#F0FDF4',
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
    backgroundColor: ThemeColors.primary,
    paddingVertical: 11,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
