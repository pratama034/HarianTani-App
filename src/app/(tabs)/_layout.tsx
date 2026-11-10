import React from 'react';
import { Tabs, Redirect, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ThemeColors, Radius } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import {
  View,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  StyleSheet,
  Text,
} from 'react-native';

export default function TabLayout() {
  const { isAuthenticated, isLoading, logout, user } = useAuth();
  const router = useRouter();

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

  const handleCloudStatusPress = () => {
    Alert.alert(
      'Status Jaringan REST API & Keamanan Token',
      '🟢 Cloud REST API Active (JWT Protected)\n\n• Token-Based Auth: JWT Bearer Token\n• Penyimpanan: Hardware SecureStore\n• Interceptor: Authorization Bearer terpasang otomatis\n• Sesi: Dilindungi dengan proteksi 401 auto-logout.',
      [{ text: 'OK', style: 'default' }]
    );
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
                onPress={handleCloudStatusPress}
                accessibilityRole="button"
                accessibilityLabel="Status REST API"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name="cloud-check"
                  size={19}
                  color="#A3E635"
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
                  color={focused ? ThemeColors.tabBarActive : color}
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
                  color={focused ? ThemeColors.tabBarActive : color}
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
                  color={focused ? ThemeColors.tabBarActive : color}
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
                  color={focused ? ThemeColors.tabBarActive : color}
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
                  color={focused ? ThemeColors.tabBarActive : color}
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
});
