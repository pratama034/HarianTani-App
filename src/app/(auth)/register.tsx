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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors, Radius, Spacing, Shadows } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { FormInput } from '../../components/FormInput';
import { PrimaryButton } from '../../components/PrimaryButton';

type FarmRole = 'Petani Mandiri' | 'Gapoktan / Kelompok';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    if (pwd.length === 0)
      return { score: 0, label: 'Masukkan Sandi', color: ThemeColors.textMuted };
    if (pwd.length < 6)
      return { score: 1, label: 'Cukup', color: ThemeColors.warning };
    if (pwd.length < 9)
      return { score: 3, label: 'Kuat', color: '#006C49' };
    return { score: 4, label: 'Sangat Kuat', color: '#006C49' };
  };

  const strength = getPasswordStrength(password);
  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

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
      setErrorMessage(
        'Format email tidak valid. Gunakan format seperti petani@hariantani.id.'
      );
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
      setErrorMessage(
        'Harap setujui Ketentuan Penggunaan dan Kebijakan Privasi.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await register(trimmedName, trimmedEmail, password);
      if (res.success) {
        setSuccessMessage(
          'Pendaftaran berhasil! Mengalihkan ke halaman masuk...'
        );
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 1400);
      } else {
        setErrorMessage(res.error || 'Gagal mendaftar akun.');
      }
    } catch {
      setErrorMessage('Terjadi gangguan sistem saat pendaftaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      {/* Top Header Bar (#135D43) */}
      <View
        style={[
          styles.topHeaderBar,
          {
            paddingTop: Math.max(insets.top, Platform.OS === 'ios' ? 44 : 24) + 8,
          },
        ]}
      >
        <View style={styles.topHeaderLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            accessibilityLabel="Kembali ke masuk"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <Text style={styles.headerBrandText}>Registrasi Akun</Text>
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
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Visual Accent Ambient Header Flow */}
        <View style={styles.heroBanner}>
          <View style={styles.heroTagPill}>
            <MaterialCommunityIcons name="leaf" size={14} color="#00714D" />
            <Text style={styles.heroTagText}>
              LANGKAH AWAL DIGITALISASI TANI
            </Text>
          </View>
          <Text style={styles.heroTitle}>Daftar Akun Petani Baru</Text>
          <Text style={styles.heroDesc}>
            Mulai kelola operasional dan keuangan usaha tani Anda secara rapi,
            mandiri, dan digital.
          </Text>
        </View>

        {/* Security & Offline-Ready Cryptographic Guarantee Pill */}
        <View style={styles.securityTrustCard}>
          <View style={styles.securityTrustIconBox}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={19}
              color={ThemeColors.primaryDark}
            />
          </View>
          <View style={styles.securityTrustCol}>
            <Text style={styles.securityTrustTitle}>
              Enkripsi Kriptografi Lokal
            </Text>
            <Text style={styles.securityTrustSubtitle}>
              SHA-256 with Salt • Offline-Ready Security
            </Text>
          </View>
        </View>

        {/* Segmented Farming Unit Choice */}
        <View style={styles.segmentSection}>
          <Text style={styles.segmentLabel}>Tipe Usaha Pertanian</Text>
          <View style={styles.segmentTrack}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                selectedRole === 'Petani Mandiri' && styles.segmentButtonActive,
              ]}
              onPress={() => setSelectedRole('Petani Mandiri')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="account-outline"
                size={17}
                color={
                  selectedRole === 'Petani Mandiri'
                    ? '#FFFFFF'
                    : ThemeColors.textSecondary
                }
              />
              <Text
                style={[
                  styles.segmentButtonText,
                  selectedRole === 'Petani Mandiri' &&
                    styles.segmentButtonTextActive,
                ]}
              >
                Petani Mandiri
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                selectedRole === 'Gapoktan / Kelompok' &&
                  styles.segmentButtonActive,
              ]}
              onPress={() => setSelectedRole('Gapoktan / Kelompok')}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="account-group-outline"
                size={17}
                color={
                  selectedRole === 'Gapoktan / Kelompok'
                    ? '#FFFFFF'
                    : ThemeColors.textSecondary
                }
              />
              <Text
                style={[
                  styles.segmentButtonText,
                  selectedRole === 'Gapoktan / Kelompok' &&
                    styles.segmentButtonTextActive,
                ]}
              >
                Gapoktan / Kelompok
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Success Alert */}
        {successMessage ? (
          <View style={styles.successContainer} accessibilityRole="alert">
            <MaterialCommunityIcons
              name="check-circle"
              size={18}
              color="#006C49"
            />
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* Error Alert */}
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

        {/* Registration Form Fields */}
        <View style={styles.formSection}>
          <View style={styles.labelRowBetween}>
            <Text style={styles.fieldLabel}>Nama Lengkap Pemilik Lahan</Text>
            <Text style={styles.requiredBadgeText}>Wajib</Text>
          </View>
          <FormInput
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
                name="card-account-details-outline"
                size={20}
                color={ThemeColors.textMuted}
              />
            }
          />

          <View style={styles.labelRowBetween}>
            <Text style={styles.fieldLabel}>Alamat Email</Text>
            <Text style={styles.optionalNoteText}>Untuk laporan</Text>
          </View>
          <FormInput
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
            hint="Digunakan untuk pemulihan akun & unduh rekap panen mingguan."
            leftIcon={
              <MaterialCommunityIcons
                name="email-outline"
                size={20}
                color={ThemeColors.textMuted}
              />
            }
          />

          {/* Password Field with Strength Pill */}
          <View style={styles.labelRowBetween}>
            <Text style={styles.fieldLabel}>Kata Sandi Baru</Text>
            <View style={styles.strengthPill}>
              <View
                style={[
                  styles.strengthDot,
                  { backgroundColor: strength.color },
                ]}
              />
              <Text
                style={[styles.strengthPillText, { color: strength.color }]}
              >
                {strength.label}
              </Text>
            </View>
          </View>
          <FormInput
            placeholder="Minimal 6 karakter"
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errorMessage) setErrorMessage(null);
            }}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
            containerStyle={{ marginBottom: 6 }}
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

          {/* 4-Bar Strength Meter */}
          <View style={styles.strengthMeterRow}>
            {[1, 2, 3, 4].map((barIdx) => (
              <View
                key={barIdx}
                style={[
                  styles.strengthBar,
                  strength.score >= barIdx && {
                    backgroundColor: strength.color,
                  },
                ]}
              />
            ))}
          </View>

          {/* Confirm Password Field */}
          <Text style={[styles.fieldLabel, { marginBottom: 6 }]}>
            Ulangi Kata Sandi
          </Text>
          <FormInput
            placeholder="Ulangi kata sandi"
            value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errorMessage) setErrorMessage(null);
            }}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isSubmitting}
            containerStyle={{ marginBottom: 6 }}
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

          {passwordsMatch && (
            <View style={styles.matchStatusRow}>
              <MaterialCommunityIcons
                name="check-all"
                size={15}
                color="#006C49"
              />
              <Text style={styles.matchStatusText}>
                Kata sandi cocok & siap dienkripsi
              </Text>
            </View>
          )}
          {passwordsMismatch && (
            <View style={styles.matchStatusRow}>
              <MaterialCommunityIcons
                name="alert-circle-outline"
                size={15}
                color={ThemeColors.loss}
              />
              <Text style={[styles.matchStatusText, { color: ThemeColors.loss }]}>
                Konfirmasi kata sandi belum cocok
              </Text>
            </View>
          )}

          {/* Terms and Consent Checkbox Card */}
          <TouchableOpacity
            style={styles.termsCard}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.85}
          >
            <View
              style={[
                styles.termsCheckbox,
                agreedToTerms && styles.termsCheckboxChecked,
              ]}
            >
              {agreedToTerms && (
                <MaterialCommunityIcons
                  name="check"
                  size={14}
                  color="#FFFFFF"
                />
              )}
            </View>
            <Text style={styles.termsText}>
              Saya menyetujui{' '}
              <Text style={styles.termsHighlight}>Ketentuan Penggunaan</Text> &{' '}
              <Text style={styles.termsHighlight}>
                Kebijakan Privasi Data Tani
              </Text>{' '}
              HarianTani.
            </Text>
          </TouchableOpacity>

          {/* Offline Resilience Guarantee Card */}
          <View style={styles.offlineGuaranteeCard}>
            <View style={styles.offlineIconBox}>
              <MaterialCommunityIcons
                name="cloud-off-outline"
                size={24}
                color="#00714D"
              />
            </View>
            <View style={styles.offlineTextCol}>
              <View style={styles.offlineHeaderRow}>
                <Text style={styles.offlineTitle}>100% Offline-First</Text>
                <View style={styles.offlineBadge}>
                  <Text style={styles.offlineBadgeText}>LOKAL</Text>
                </View>
              </View>
              <Text style={styles.offlineDesc}>
                Buku kas & timbangan panen tetap dapat dicatat tanpa jaringan
                internet di tengah sawah.
              </Text>
            </View>
          </View>

          {/* Submit Action Button */}
          <PrimaryButton
            title="Daftarkan Akun Sekarang"
            onPress={handleRegister}
            loading={isSubmitting}
            rightIcon={
              <MaterialCommunityIcons
                name="arrow-right"
                size={19}
                color="#FFFFFF"
              />
            }
            style={styles.submitButton}
          />

          {/* Navigation Link to Login */}
          <View style={styles.loginFooterRow}>
            <Text style={styles.loginFooterPrompt}>Sudah punya akun tani?</Text>
            <TouchableOpacity
              onPress={() => router.replace('/(auth)/login')}
              activeOpacity={0.75}
            >
              <Text style={styles.loginFooterLink}>Masuk di Sini</Text>
            </TouchableOpacity>
          </View>
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrandText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerProfileCircle: {
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
    paddingBottom: 40,
  },
  heroBanner: {
    marginBottom: 14,
  },
  heroTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(108, 248, 187, 0.30)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    gap: 5,
    marginBottom: 8,
  },
  heroTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#00714D',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 25,
    fontWeight: '700',
    color: ThemeColors.text,
    letterSpacing: -0.5,
  },
  heroDesc: {
    fontSize: 14,
    color: ThemeColors.textSecondary,
    lineHeight: 20,
    marginTop: 4,
  },
  securityTrustCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceLow,
    padding: 12,
    borderRadius: Radius.md,
    gap: 10,
    marginBottom: 18,
    ...Shadows.subtle,
  },
  securityTrustIconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 68, 47, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  securityTrustCol: {
    flex: 1,
  },
  securityTrustTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: ThemeColors.primaryDark,
  },
  securityTrustSubtitle: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginTop: 1,
  },
  segmentSection: {
    marginBottom: 18,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.text,
    marginBottom: 8,
  },
  segmentTrack: {
    flexDirection: 'row',
    backgroundColor: ThemeColors.surfaceHigh,
    padding: 4,
    borderRadius: Radius.md,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 9,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#135D43',
    ...Shadows.subtle,
  },
  segmentButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
  },
  segmentButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 14,
    gap: 8,
  },
  successText: {
    flex: 1,
    fontSize: 12.5,
    color: '#005139',
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 14,
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
  labelRowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.text,
  },
  requiredBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primaryDark,
  },
  optionalNoteText: {
    fontSize: 11.5,
    color: ThemeColors.textMuted,
  },
  strengthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(108, 248, 187, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 5,
  },
  strengthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  strengthPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  strengthMeterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  strengthBar: {
    flex: 1,
    height: 5,
    borderRadius: Radius.full,
    backgroundColor: '#DAE2FD',
  },
  matchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  matchStatusText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#006C49',
  },
  termsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: ThemeColors.border,
    gap: 10,
    marginTop: 4,
    marginBottom: 14,
    ...Shadows.subtle,
  },
  termsCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: '#DAE2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  termsCheckboxChecked: {
    backgroundColor: '#135D43',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: ThemeColors.text,
    lineHeight: 19,
  },
  termsHighlight: {
    fontWeight: '700',
    color: ThemeColors.primaryDark,
  },
  offlineGuaranteeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceLow,
    padding: 15,
    borderRadius: Radius.lg,
    gap: 14,
    marginBottom: 20,
    ...Shadows.subtle,
  },
  offlineIconBox: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(108, 248, 187, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineTextCol: {
    flex: 1,
  },
  offlineHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  offlineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  offlineBadge: {
    backgroundColor: '#ABF1CF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  offlineBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#002115',
  },
  offlineDesc: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    lineHeight: 17,
    marginTop: 3,
  },
  submitButton: {
    marginBottom: 14,
  },
  loginFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  loginFooterPrompt: {
    fontSize: 13.5,
    color: ThemeColors.textSecondary,
  },
  loginFooterLink: {
    fontSize: 14,
    fontWeight: '700',
    color: ThemeColors.primaryDark,
  },
});
