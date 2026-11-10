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
import { StatusBar } from 'expo-status-bar';
import { ThemeColors, Radius, Spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { AppCard } from '../../components/AppCard';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';
import { DarkSummaryCard } from '../../components/DarkSummaryCard';

type FarmRole = 'Petani Mandiri' | 'Kelompok Tani' | 'Pekebun Sayur/Buah';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();

  const [selectedRole, setSelectedRole] = useState<FarmRole>('Petani Mandiri');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (inputEmail: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(inputEmail);
  };

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { score: 0, label: 'Masukkan kata sandi', color: ThemeColors.textMuted };
    if (pwd.length < 6) return { score: 1, label: 'Cukup', color: ThemeColors.warning };
    if (pwd.length < 9) return { score: 2, label: 'Kuat', color: ThemeColors.profit };
    return { score: 3, label: 'Sangat Kuat', color: ThemeColors.profit };
  };

  const strength = getPasswordStrength(password);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleRegister = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
      setErrorMessage('Semua bidang formulir wajib diisi.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setErrorMessage('Format email tidak valid. Gunakan format seperti nama@contoh.com.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi harus terdiri dari minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok dengan kata sandi.');
      return;
    }

    if (!agreedToTerms) {
      setErrorMessage('Harap setujui Ketentuan Penggunaan dan Kebijakan Privasi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(trimmedName, trimmedEmail, password);
      if (res.success) {
        setSuccessMessage('Pendaftaran berhasil! Mengalihkan ke halaman masuk...');
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 1500);
      } else {
        setErrorMessage(res.error || 'Gagal mendaftar akun.');
      }
    } catch {
      setErrorMessage('Terjadi gangguan sistem saat pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles: { role: FarmRole; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { role: 'Petani Mandiri', icon: 'tractor' },
    { role: 'Kelompok Tani', icon: 'account-group' },
    { role: 'Pekebun Sayur/Buah', icon: 'sprout' },
  ];

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      {/* Top Fixed Signature Green Header Bar */}
      <View style={styles.topHeaderBar}>
        <View style={styles.topHeaderLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Kembali ke masuk"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <View style={styles.headerBrandBadge}>
            <View style={styles.headerLogoCircle}>
              <MaterialCommunityIcons
                name="sprout"
                size={18}
                color={ThemeColors.primary}
              />
            </View>
            <Text style={styles.headerBrandText}>HarianTani</Text>
          </View>
        </View>
        <View style={styles.headerProfileCircle}>
          <MaterialCommunityIcons
            name="account-outline"
            size={18}
            color="#FFFFFF"
          />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* Hero Visual Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTagRow}>
            <View style={styles.heroTagIconBox}>
              <MaterialCommunityIcons
                name="spa"
                size={14}
                color={ThemeColors.primary}
              />
            </View>
            <Text style={styles.heroTagText}>
              Langkah Awal Digitalisasi Tani
            </Text>
          </View>
          <Text style={styles.heroTitle}>Daftar Akun Petani Baru</Text>
          <Text style={styles.heroDesc}>
            Mulai kelola operasional dan keuangan usaha tani Anda secara rapi dan
            digital.
          </Text>
        </View>

        {/* Hardware & Security Trust Badge */}
        <View style={styles.securityTrustCard}>
          <View style={styles.securityTrustLeft}>
            <View style={styles.securityTrustIconBox}>
              <MaterialCommunityIcons
                name="shield-lock"
                size={20}
                color={ThemeColors.primary}
              />
            </View>
            <View>
              <Text style={styles.securityTrustTitle}>
                Enkripsi Kriptografi Lokal
              </Text>
              <Text style={styles.securityTrustSubtitle}>
                SHA-256 with Salt • Offline-Ready
              </Text>
            </View>
          </View>
          <View style={styles.securityTrustBadge}>
            <View style={styles.securityPulseDot} />
            <Text style={styles.securityTrustBadgeText}>Aman</Text>
          </View>
        </View>

        {/* Success Alert */}
        {successMessage ? (
          <View style={styles.successContainer} accessibilityRole="alert">
            <MaterialCommunityIcons
              name="check-circle"
              size={20}
              color={ThemeColors.profit}
            />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* Error Alert */}
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

        {/* Main Registration Form Card */}
        <AppCard style={styles.formCard}>
          {/* Farm Role Selector Chips */}
          <View style={styles.roleSection}>
            <Text style={styles.inputSectionLabel}>Tipe Usaha Tani Anda</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.roleChipsRow}
            >
              {roles.map((item) => {
                const isActive = selectedRole === item.role;
                return (
                  <TouchableOpacity
                    key={item.role}
                    style={[
                      styles.roleChip,
                      isActive && styles.roleChipActive,
                    ]}
                    onPress={() => setSelectedRole(item.role)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={item.icon}
                      size={18}
                      color={
                        isActive
                          ? ThemeColors.onPrimary
                          : ThemeColors.textSecondary
                      }
                      style={styles.roleChipIcon}
                    />
                    <Text
                      style={[
                        styles.roleChipText,
                        isActive && styles.roleChipTextActive,
                      ]}
                    >
                      {item.role}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Full Name Field */}
          <FormInput
            label="Nama Lengkap"
            placeholder="Contoh: Pak Budi Santoso"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (errorMessage) setErrorMessage(null);
            }}
            autoCapitalize="words"
            editable={!isSubmitting}
            leftIcon={
              <MaterialCommunityIcons
                name="account-outline"
                size={20}
                color={ThemeColors.textMuted}
              />
            }
          />

          {/* Email Field */}
          <FormInput
            label="Alamat Email"
            placeholder="petani@hariantani.id"
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
            hint="Digunakan untuk pemulihan akun & laporan mingguan"
            leftIcon={
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={ThemeColors.textMuted}
              />
            }
          />

          {/* Password Field */}
          <FormInput
            label="Kata Sandi"
            placeholder="••••••••"
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

          {/* Password Strength Indicator Capsule */}
          <View style={styles.strengthBox}>
            <View style={styles.strengthBarRow}>
              <View
                style={[
                  styles.strengthBar,
                  strength.score >= 1 && { backgroundColor: strength.color },
                ]}
              />
              <View
                style={[
                  styles.strengthBar,
                  strength.score >= 2 && { backgroundColor: strength.color },
                ]}
              />
              <View
                style={[
                  styles.strengthBar,
                  strength.score >= 3 && { backgroundColor: strength.color },
                ]}
              />
              <Text style={[styles.strengthLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={16}
              color={strength.score >= 2 ? ThemeColors.profit : ThemeColors.textMuted}
            />
          </View>

          {/* Confirm Password Field */}
          <FormInput
            label="Konfirmasi Kata Sandi"
            placeholder="••••••••"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errorMessage) setErrorMessage(null);
            }}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
            leftIcon={
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={20}
                color={ThemeColors.textMuted}
              />
            }
            rightElement={
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialCommunityIcons
                  name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={ThemeColors.textMuted}
                />
              </TouchableOpacity>
            }
          />

          {/* Match Feedback Badge */}
          {passwordsMatch && (
            <View style={styles.matchNotice}>
              <MaterialCommunityIcons
                name="check-circle"
                size={15}
                color={ThemeColors.profit}
              />
              <Text style={styles.matchNoticeText}>
                Kata sandi cocok dan siap dienkripsi
              </Text>
            </View>
          )}

          {passwordsMismatch && (
            <View style={[styles.matchNotice, styles.mismatchNotice]}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={15}
                color={ThemeColors.loss}
              />
              <Text style={[styles.matchNoticeText, styles.mismatchNoticeText]}>
                Kata sandi belum sama
              </Text>
            </View>
          )}

          {/* Agreement Checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.checkboxBox,
                agreedToTerms && styles.checkboxBoxChecked,
              ]}
            >
              {agreedToTerms && (
                <MaterialCommunityIcons
                  name="check"
                  size={14}
                  color={ThemeColors.onPrimary}
                />
              )}
            </View>
            <Text style={styles.termsText}>
              Saya menyetujui{' '}
              <Text style={styles.termsLink}>Ketentuan Penggunaan</Text> &{' '}
              <Text style={styles.termsLink}>Kebijakan Privasi Data Tani</Text>.
            </Text>
          </TouchableOpacity>

          {/* Submit Action CTA Button */}
          <PrimaryButton
            title="Daftarkan Akun Sekarang"
            onPress={handleRegister}
            loading={isSubmitting}
            rightIcon={
              <MaterialCommunityIcons
                name="account-check"
                size={20}
                color={ThemeColors.onPrimary}
              />
            }
            style={styles.submitButton}
          />

          {/* Login Redirection Link */}
          <View style={styles.loginRedirectRow}>
            <Text style={styles.loginRedirectText}>Sudah punya akun?</Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.loginRedirectLink}>Masuk di Sini</Text>
            </TouchableOpacity>
          </View>
        </AppCard>

        {/* Telemetry Dark Pod: Local Offline Ready Status */}
        <DarkSummaryCard style={styles.telemetryCard}>
          <View style={styles.telemetryHeader}>
            <View style={styles.telemetryTitleRow}>
              <MaterialCommunityIcons
                name="cloud-sync-outline"
                size={18}
                color={ThemeColors.secondaryFixed}
              />
              <Text style={styles.telemetryTitle}>
                Penyimpanan Terdistribusi
              </Text>
            </View>
            <Text style={styles.telemetryPercent}>100%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={styles.progressBarFill} />
          </View>
          <Text style={styles.telemetryDesc}>
            Data panen dan buku kas Anda tetap aman dicatat tanpa sinyal internet
            di tengah ladang.
          </Text>
        </DarkSummaryCard>
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
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },
  topHeaderBar: {
    backgroundColor: ThemeColors.headerBackground,
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
    paddingBottom: 14,
    paddingHorizontal: Spacing.margin,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#0D631B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  topHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  headerBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogoCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerBrandText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerProfileCircle: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBanner: {
    backgroundColor: ThemeColors.surfaceSageLight,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    marginBottom: Spacing.md,
  },
  heroTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  heroTagIconBox: {
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  heroTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
    letterSpacing: 0.3,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ThemeColors.text,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    lineHeight: 18,
  },
  securityTrustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ThemeColors.surfaceLow,
    padding: Spacing.sm + 4,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: ThemeColors.border,
  },
  securityTrustLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  securityTrustIconBox: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  securityTrustTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  securityTrustSubtitle: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    marginTop: 1,
  },
  securityTrustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceTintGreen,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  securityPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ThemeColors.profit,
    marginRight: 4,
  },
  securityTrustBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#C8E6C9',
    padding: Spacing.sm + 2,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  successText: {
    color: ThemeColors.profit,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
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
  roleSection: {
    marginBottom: Spacing.md,
  },
  inputSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ThemeColors.text,
    marginBottom: Spacing.xs + 2,
  },
  roleChipsRow: {
    paddingVertical: 2,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceLow,
    marginRight: Spacing.sm,
  },
  roleChipActive: {
    backgroundColor: ThemeColors.primary,
  },
  roleChipIcon: {
    marginRight: 6,
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  roleChipTextActive: {
    color: ThemeColors.onPrimary,
  },
  strengthBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ThemeColors.surfaceLow,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 6,
    borderRadius: Radius.sm,
    marginTop: -8,
    marginBottom: Spacing.md,
  },
  strengthBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  strengthBar: {
    width: 22,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.border,
    marginRight: 4,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  matchNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: Spacing.sm,
  },
  matchNoticeText: {
    fontSize: 12,
    color: ThemeColors.profit,
    fontWeight: '500',
    marginLeft: 5,
  },
  mismatchNotice: {
    opacity: 0.9,
  },
  mismatchNoticeText: {
    color: ThemeColors.loss,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4,
    marginBottom: Spacing.lg,
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
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: ThemeColors.primary,
    borderColor: ThemeColors.primary,
  },
  termsText: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    lineHeight: 18,
    flex: 1,
  },
  termsLink: {
    color: ThemeColors.primary,
    fontWeight: '700',
  },
  submitButton: {
    marginBottom: Spacing.md,
  },
  loginRedirectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xs,
  },
  loginRedirectText: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    marginRight: 4,
  },
  loginRedirectLink: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  telemetryCard: {
    marginBottom: Spacing.md,
  },
  telemetryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
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
  telemetryPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: ThemeColors.secondaryFixed,
  },
  progressBarTrack: {
    width: '100%',
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '100%',
    height: '100%',
    backgroundColor: ThemeColors.secondaryFixed,
    borderRadius: Radius.full,
  },
  telemetryDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 17,
  },
});
