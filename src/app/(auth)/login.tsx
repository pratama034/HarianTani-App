import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ThemeColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AppCard } from '../../components/AppCard';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { SecondaryButton } from '../../components/SecondaryButton';
import { DarkSummaryCard } from '../../components/DarkSummaryCard';

export default function LoginScreen() {
  const router = useRouter();
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

  const fillDemoAccount = () => {
    setEmail('budi.santoso@tani.id');
    setPassword('PanenMelimpah2025');
    setErrorMessage(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand App Bar */}
        <View style={styles.topBar}>
          <View style={styles.brandBadgeRow}>
            <View style={styles.logoCircleSmall}>
              <MaterialCommunityIcons
                name="sprout"
                size={20}
                color={ThemeColors.primary}
              />
            </View>
            <Text style={styles.brandTitle}>HarianTani</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={styles.pulseDot} />
            <Text style={styles.statusPillText}>v2.4 Ready</Text>
          </View>
        </View>

        {/* Welcome Branding Card with Tactile Agro Glow */}
        <AppCard style={styles.welcomeCard}>
          <View style={styles.badgeCategory}>
            <MaterialCommunityIcons
              name="check-decagram"
              size={15}
              color={ThemeColors.primary}
            />
            <Text style={styles.badgeCategoryText}>
              Aplikasi Manajemen Tani
            </Text>
          </View>

          <Text style={styles.headline}>Masuk ke Akun Tani Anda</Text>
          <Text style={styles.subheadline}>
            Kelola lahan, pantau jadwal perawatan, dan hitung keuntungan panen
            harian Anda dengan mudah.
          </Text>

          {/* Mini Field Visual Showcase */}
          <View style={styles.fieldShowcase}>
            <View style={styles.fieldIconBox}>
              <MaterialCommunityIcons
                name="image-filter-hdr"
                size={22}
                color={ThemeColors.primary}
              />
            </View>
            <View style={styles.fieldTextCol}>
              <Text style={styles.fieldTitle}>Sentra Lahan Aktif</Text>
              <Text style={styles.fieldSubtitle}>Musim Tanam Gadu 2026</Text>
            </View>
            <View style={styles.onlineBadge}>
              <Text style={styles.onlineBadgeText}>Online</Text>
            </View>
          </View>
        </AppCard>

        {/* Hardware Security Pill Badge */}
        <View style={styles.securityBadge}>
          <View style={styles.securityIconBox}>
            <MaterialCommunityIcons
              name={
                isSecureHardwareAvailable
                  ? 'shield-check'
                  : 'shield-alert-outline'
              }
              size={18}
              color={
                isSecureHardwareAvailable
                  ? ThemeColors.primary
                  : ThemeColors.warning
              }
            />
          </View>
          <View style={styles.securityTextCol}>
            <View style={styles.securityRow}>
              <View
                style={[
                  styles.pulseDot,
                  {
                    backgroundColor: isSecureHardwareAvailable
                      ? ThemeColors.profit
                      : ThemeColors.warning,
                  },
                ]}
              />
              <Text style={styles.securityLabel}>KEAMANAN PERANGKAT</Text>
            </View>
            <Text style={styles.securityDesc} numberOfLines={1}>
              {isSecureHardwareAvailable
                ? 'Hardware Keystore / Keychain Aktif'
                : 'Mode Pengujian: Memori Penyimpanan Lokal'}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="lock-check"
            size={18}
            color={ThemeColors.textMuted}
          />
        </View>

        {/* Error Message Alert */}
        {errorMessage ? (
          <View style={styles.errorContainer} accessibilityRole="alert">
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={20}
              color={ThemeColors.loss}
            />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Main Login Form Card */}
        <AppCard style={styles.formCard}>
          <FormInput
            label="Alamat Email Petani"
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
            label="Kata Sandi"
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

          {/* Remember Me Toggle */}
          <TouchableOpacity
            style={styles.rememberRow}
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
                  size={14}
                  color={ThemeColors.onPrimary}
                />
              )}
            </View>
            <Text style={styles.rememberText}>
              Ingat Saya di Perangkat Ini
            </Text>
          </TouchableOpacity>

          {/* Primary Action CTA */}
          <PrimaryButton
            title="Masuk ke HarianTani"
            onPress={handleLogin}
            loading={isSubmitting}
            rightIcon={
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color={ThemeColors.onPrimary}
              />
            }
            style={styles.submitButton}
          />

          {/* Quick Demo Fill Button */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ATAU AKSES CEPAT</Text>
            <View style={styles.dividerLine} />
          </View>

          <SecondaryButton
            title="Masuk Cepat Demo (Pak Budi)"
            onPress={fillDemoAccount}
            leftIcon={
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={18}
                color={ThemeColors.primary}
              />
            }
            style={styles.demoButton}
          />
        </AppCard>

        {/* Telemetry Agro Status Dark Card */}
        <DarkSummaryCard style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <View style={styles.telemetryTitleRow}>
              <MaterialCommunityIcons
                name="brain"
                size={18}
                color={ThemeColors.secondaryFixed}
              />
              <Text style={styles.telemetryTitle}>
                Asisten Agrikultur HarianTani
              </Text>
            </View>
            <View style={styles.activeTag}>
              <Text style={styles.activeTagText}>Aktif 24 Jam</Text>
            </View>
          </View>
          <Text style={styles.telemetryQuote}>
            &quot;Suhu rata-rata wilayah Anda 27°C hari ini. Waktu optimal
            penyemprotan pupuk organik cair sebelum pukul 09:30 WIB.&quot;
          </Text>
          <View style={styles.telemetryFooter}>
            <MaterialCommunityIcons
              name="water-outline"
              size={15}
              color={ThemeColors.secondaryFixed}
            />
            <Text style={styles.telemetryFooterText}>
              Kelembapan Tanah: 74% • Status Aman
            </Text>
          </View>
        </DarkSummaryCard>

        {/* Register Redirection Card */}
        <AppCard variant="flat" style={styles.registerCard}>
          <Text style={styles.registerPrompt}>
            Belum memiliki akun HarianTani?
          </Text>
          <PrimaryButton
            title="Daftar Akun Petani Baru"
            variant="secondary"
            onPress={() => router.push('/(auth)/register')}
            rightIcon={
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={18}
                color={ThemeColors.primary}
              />
            }
            style={styles.registerButton}
          />
        </AppCard>

        {/* Trust & Legal Footer */}
        <View style={styles.trustFooter}>
          <View style={styles.trustRow}>
            <MaterialCommunityIcons
              name="lock-check-outline"
              size={15}
              color={ThemeColors.textMuted}
            />
            <Text style={styles.trustTitle}>
              Enkripsi Kriptografi Lokal & Keamanan Petani
            </Text>
          </View>
          <Text style={styles.trustDesc}>
            Data pertanian terenkripsi lokal SHA-256 + Salt • HarianTani v2.4
          </Text>
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
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircleSmall: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ThemeColors.primary,
    letterSpacing: -0.3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    ...Shadows.subtle,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ThemeColors.profit,
    marginRight: 6,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  welcomeCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.lg,
  },
  badgeCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  badgeCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
    marginLeft: 4,
    letterSpacing: 0.3,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    color: ThemeColors.text,
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  subheadline: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  fieldShowcase: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceLow,
    padding: Spacing.sm + 2,
    borderRadius: Radius.md,
  },
  fieldIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.md,
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  fieldTextCol: {
    flex: 1,
  },
  fieldTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  fieldSubtitle: {
    fontSize: 11,
    color: ThemeColors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  onlineBadge: {
    backgroundColor: ThemeColors.surfaceTintGreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  onlineBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.backgroundLight,
    padding: Spacing.sm + 2,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  securityIconBox: {
    width: 34,
    height: 34,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  securityTextCol: {
    flex: 1,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.primary,
    letterSpacing: 0.5,
  },
  securityDesc: {
    fontSize: 12,
    fontWeight: '500',
    color: ThemeColors.textSecondary,
    marginTop: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    padding: Spacing.sm + 2,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: ThemeColors.loss,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  formCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: ThemeColors.border,
    backgroundColor: ThemeColors.surfaceLow,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  checkboxBoxChecked: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  rememberText: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    fontWeight: '500',
  },
  submitButton: {
    marginTop: Spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: ThemeColors.border,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.textMuted,
    paddingHorizontal: Spacing.sm,
    letterSpacing: 0.8,
  },
  demoButton: {
    height: 48,
  },
  telemetryCard: {
    marginBottom: Spacing.md,
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs + 2,
  },
  telemetryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  telemetryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.onDark,
    marginLeft: 6,
  },
  activeTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.secondaryFixed,
  },
  telemetryQuote: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.82)',
    lineHeight: 18,
    fontStyle: 'italic',
    marginBottom: Spacing.sm,
  },
  telemetryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  telemetryFooterText: {
    fontSize: 11,
    color: ThemeColors.secondaryFixed,
    fontWeight: '600',
    marginLeft: 5,
  },
  registerCard: {
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  registerPrompt: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  registerButton: {
    width: '100%',
  },
  trustFooter: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  trustTitle: {
    fontSize: 11,
    color: ThemeColors.textMuted,
    fontWeight: '600',
    marginLeft: 5,
  },
  trustDesc: {
    fontSize: 10,
    color: ThemeColors.textMuted,
    textAlign: 'center',
  },
});
