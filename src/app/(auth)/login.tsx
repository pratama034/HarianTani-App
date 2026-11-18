import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, isSecureHardwareAvailable } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Harap isi alamat email dan kata sandi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await login(trimmedEmail, password);
      if (res.success) {
        router.replace('/(tabs)');
      } else {
        setErrorMessage(res.error || 'Email atau kata sandi tidak valid.');
      }
    } catch {
      setErrorMessage('Terjadi kendala pada sistem. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBiometricPrompt = () => {
    Alert.alert(
      'Autentikasi Biometrik',
      'Fitur pemindaian biometrik siap digunakan setelah Anda masuk menggunakan email & kata sandi terdaftar.',
      [{ text: 'Mengerti' }]
    );
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Pemulihan Kata Sandi',
      'Tautan pemulihan kata sandi akan dikirimkan ke alamat email petani terdaftar.',
      [{ text: 'Mengerti' }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      {/* Top App Bar (Modern Agritech Precision #135D43) */}
      <View
        style={[
          styles.topHeaderBar,
          {
            paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24) + 8,
          },
        ]}
      >
        <View style={styles.topHeaderLeft}>
          <View style={styles.headerBackCircle}>
            <MaterialCommunityIcons
              name="leaf"
              size={20}
              color="#6CF8BB"
            />
          </View>
          <Text style={styles.topHeaderTitle}>Masuk Akun</Text>
        </View>
        <View style={styles.topHeaderProfileCircle}>
          <MaterialCommunityIcons
            name="account-outline"
            size={18}
            color="#FFFFFF"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Hero & Context */}
        <View style={styles.heroSection}>
          <View style={styles.heroCategoryPill}>
            <MaterialCommunityIcons
              name="leaf"
              size={14}
              color="#005139"
            />
            <Text style={styles.heroCategoryText}>
              APLIKASI MANAJEMEN TANI CERDAS
            </Text>
          </View>

          <Text style={styles.headline}>Masuk ke Akun Tani Anda</Text>
          <Text style={styles.subheadline}>
            Kelola lahan, pantau jadwal perawatan, dan hitung keuntungan panen
            harian Anda dengan mudah.
          </Text>
        </View>

        {/* Hardware Security Indicator Badge */}
        <View style={styles.securityCard}>
          <View style={styles.securityIconBox}>
            <MaterialCommunityIcons
              name="shield-check"
              size={19}
              color="#005139"
            />
          </View>
          <View style={styles.securityTextCol}>
            <Text style={styles.securityTitle}>
              PENYIMPANAN AMAN TERVERIFIKASI
            </Text>
            <Text style={styles.securitySubtitle} numberOfLines={1}>
              {isSecureHardwareAvailable
                ? 'Hardware Keystore / Keychain Aktif'
                : 'Enkripsi Sesi Lokal Terproteksi'}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="lock-check-outline"
            size={19}
            color="#006C49"
          />
        </View>

        {/* Organic Visual Accent Card (Siklus Tanam) */}
        <View style={styles.visualBannerCard}>
          <View style={styles.visualBannerCircle}>
            <MaterialCommunityIcons
              name="tractor"
              size={24}
              color="#FFFFFF"
            />
          </View>
          <View style={styles.visualBannerTextCol}>
            <Text style={styles.visualBannerTitle}>Siklus Tanam 2026</Text>
            <Text style={styles.visualBannerSubtitle}>
              Sinkronisasi data lahan terdistribusi
            </Text>
          </View>
        </View>

        {/* Error Message Alert */}
        {errorMessage ? (
          <View style={styles.errorContainer} accessibilityRole="alert">
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={18}
              color={ThemeColors.loss}
            />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Form Section */}
        <View style={styles.formSection}>
          <FormInput
            label="Alamat Email Petani *"
            placeholder="contoh: budi.santoso@tani.id"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              if (errorMessage) setErrorMessage(null);
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            editable={!isSubmitting}
            leftIcon={
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={ThemeColors.textMuted}
              />
            }
          />

          <FormInput
            label="Kata Sandi *"
            placeholder="Masukkan kata sandi akun"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errorMessage) setErrorMessage(null);
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
            leftIcon={
              <MaterialCommunityIcons
                name="lock-outline"
                size={20}
                color={ThemeColors.textMuted}
              />
            }
            rightElement={
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={ThemeColors.textMuted}
                />
              </TouchableOpacity>
            }
          />

          {/* Remember & Forgot Password */}
          <View style={styles.rememberForgotRow}>
            <TouchableOpacity
              style={styles.rememberLeft}
              onPress={() => setRememberMe(!rememberMe)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.checkboxBox,
                  rememberMe && styles.checkboxBoxChecked,
                ]}
              >
                {rememberMe && (
                  <MaterialCommunityIcons
                    name="check"
                    size={13}
                    color="#FFFFFF"
                  />
                )}
              </View>
              <Text style={styles.rememberText}>
                Ingat Saya di Perangkat Ini
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleForgotPassword}
              activeOpacity={0.75}
            >
              <Text style={styles.forgotText}>Lupa Kata Sandi?</Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton
            title="Masuk ke HarianTani"
            onPress={handleLogin}
            loading={isSubmitting}
            rightIcon={
              <MaterialCommunityIcons
                name="arrow-right"
                size={18}
                color="#FFFFFF"
              />
            }
            style={styles.submitButton}
          />
        </View>

        {/* Alternative Access Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ATAU AKSES CEPAT</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Quick Access Actions */}
        <View style={styles.quickAccessCol}>
          <TouchableOpacity
            style={styles.quickAccessCardLow}
            onPress={handleBiometricPrompt}
            activeOpacity={0.8}
          >
            <View style={styles.quickAccessLeft}>
              <View style={styles.quickIconCircleMint}>
                <MaterialCommunityIcons
                  name="fingerprint"
                  size={18}
                  color="#005139"
                />
              </View>
              <Text style={styles.quickAccessText} numberOfLines={1}>
                Masuk dengan Biometrik / Sidik Jari
              </Text>
            </View>
            <MaterialCommunityIcons
              name="access-point"
              size={18}
              color="#006C49"
            />
          </TouchableOpacity>
        </View>

        {/* Agronomy Tip Card */}
        <View style={styles.tipCard}>
          <View style={styles.tipIconBox}>
            <MaterialCommunityIcons
              name="white-balance-sunny"
              size={16}
              color="#006C49"
            />
          </View>
          <View style={styles.tipTextCol}>
            <Text style={styles.tipTitle}>ASISTEN AGRIKULTUR SUKARAJA</Text>
            <Text style={styles.tipBody}>
              Suhu rata-rata Sukaraja hari ini 28°C. Data pertanian Anda
              tersimpan aman dan terenkripsi offline.
            </Text>
          </View>
        </View>

        {/* Register Footer Section */}
        <View style={styles.registerFooter}>
          <Text style={styles.registerPrompt}>
            Belum memiliki akun HarianTani?
          </Text>
          <TouchableOpacity
            style={styles.registerLinkBtn}
            onPress={() => router.push('/(auth)/register')}
            activeOpacity={0.75}
          >
            <Text style={styles.registerLinkText}>Daftar Akun Petani Baru</Text>
            <MaterialCommunityIcons
              name="arrow-top-right"
              size={16}
              color="#006C49"
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  topHeaderBar: {
    backgroundColor: '#135D43',
    paddingTop: Platform.OS === 'ios' ? 50 : 38,
    paddingBottom: 14,
    paddingHorizontal: Spacing.margin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBackCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  topHeaderProfileCircle: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: '#00442F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingTop: Spacing.lg,
    paddingBottom: 36,
    gap: 18,
  },
  heroSection: {
    gap: 6,
  },
  heroCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#6CF8BB',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    gap: 5,
  },
  heroCategoryText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#005139',
    letterSpacing: 0.5,
  },
  headline: {
    fontSize: 24,
    fontWeight: '700',
    color: ThemeColors.text,
    letterSpacing: -0.4,
    marginTop: 4,
  },
  subheadline: {
    fontSize: 14,
    color: ThemeColors.textSecondary,
    lineHeight: 21,
  },
  securityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceLow,
    padding: 13,
    borderRadius: Radius.md,
    gap: 10,
    ...Shadows.subtle,
  },
  securityIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#6CF8BB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTextCol: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#006C49',
    letterSpacing: 0.4,
  },
  securitySubtitle: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginTop: 1,
  },
  visualBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceHigh,
    borderRadius: Radius.lg,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#DAE2FD',
  },
  visualBannerCircle: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    backgroundColor: '#135D43',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.button,
  },
  visualBannerTextCol: {
    flex: 1,
  },
  visualBannerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  visualBannerSubtitle: {
    fontSize: 12.5,
    color: ThemeColors.textSecondary,
    marginTop: 2,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.md,
    padding: 12,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12.5,
    color: ThemeColors.loss,
    fontWeight: '600',
  },
  formSection: {
    marginTop: 2,
  },
  rememberForgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
    marginBottom: 16,
  },
  rememberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: ThemeColors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#135D43',
    borderColor: '#135D43',
  },
  rememberText: {
    fontSize: 12.5,
    color: ThemeColors.text,
    fontWeight: '500',
  },
  forgotText: {
    fontSize: 12,
    color: '#006C49',
    fontWeight: '700',
  },
  submitButton: {
    marginTop: 2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#DAE2FD',
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 10.5,
    fontWeight: '700',
    color: ThemeColors.textSecondary,
    letterSpacing: 0.6,
  },
  quickAccessCol: {
    gap: 10,
  },
  quickAccessCardWhite: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: ThemeColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.subtle,
  },
  quickAccessCardLow: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: ThemeColors.surfaceLow,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.subtle,
  },
  quickAccessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  quickIconCircleNeutral: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: '#DAE2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconCircleMint: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: '#6CF8BB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: ThemeColors.text,
    flex: 1,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: ThemeColors.surfaceLow,
    padding: 15,
    borderRadius: Radius.lg,
    gap: 10,
  },
  tipIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DAE2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tipTextCol: {
    flex: 1,
    gap: 2,
  },
  tipTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#006C49',
    letterSpacing: 0.5,
  },
  tipBody: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    lineHeight: 18,
  },
  registerFooter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    gap: 4,
  },
  registerPrompt: {
    fontSize: 12.5,
    color: ThemeColors.textSecondary,
  },
  registerLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  registerLinkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#006C49',
  },
});
