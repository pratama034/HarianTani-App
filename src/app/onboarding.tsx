import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors, Radius, Spacing, Shadows } from '../constants/theme';
import { AppCard } from '../components/AppCard';
import { DarkSummaryCard } from '../components/DarkSummaryCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { setCompletedOnboarding } from '../services/authStorage';

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleFinishOnboarding = async (targetRoute: '/(auth)/login' | '/(auth)/register') => {
    await setCompletedOnboarding();
    router.replace(targetRoute);
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 10,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header & Brand */}
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <View style={styles.brandLogoCircle}>
              <MaterialCommunityIcons
                name="sprout"
                size={22}
                color={ThemeColors.primary}
              />
            </View>
            <View>
              <Text style={styles.brandTitle}>HarianTani</Text>
              <Text style={styles.brandSubtitle}>Asisten Digital Petani</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => handleFinishOnboarding('/(auth)/login')}
            accessibilityLabel="Lewati pengenalan"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.skipButtonText}>Lewati</Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={18}
              color={ThemeColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Hero Interactive Visual Canvas Card */}
        <AppCard style={styles.heroCanvasCard}>
          {/* Waypoints Trajectory Simulation Graphic */}
          <View style={styles.trajectoryContainer}>
            {/* Top Glass Pills */}
            <View style={styles.floatingTopPillsRow}>
              <View style={styles.aiActiveBadge}>
                <MaterialCommunityIcons
                  name="creation"
                  size={14}
                  color={ThemeColors.secondaryFixed}
                />
                <Text style={styles.aiActiveBadgeText}>AI Agronomi Aktif</Text>
              </View>
              <View style={styles.profitMetricBadge}>
                <MaterialCommunityIcons
                  name="trending-up"
                  size={14}
                  color={ThemeColors.profit}
                />
                <Text style={styles.profitMetricBadgeText}>Untung +34%</Text>
              </View>
            </View>

            {/* Connecting Pathway and Milestone Waypoints */}
            <View style={styles.waypointsRow}>
              {/* Waypoint 1: Tanam */}
              <View style={styles.waypointCol}>
                <View style={[styles.waypointCircle, styles.waypointTanam]}>
                  <MaterialCommunityIcons
                    name="sprout"
                    size={16}
                    color={ThemeColors.onPrimary}
                  />
                </View>
                <View style={styles.waypointPill}>
                  <Text style={styles.waypointPillText}>Tanam</Text>
                </View>
              </View>

              {/* Dotted Pathway line 1 */}
              <View style={styles.pathwayLine} />

              {/* Waypoint 2: Pupuk & Air */}
              <View style={styles.waypointCol}>
                <View style={[styles.waypointCircle, styles.waypointRawat]}>
                  <MaterialCommunityIcons
                    name="watering-can"
                    size={16}
                    color={ThemeColors.primary}
                  />
                </View>
                <View style={[styles.waypointPill, styles.waypointRawatPill]}>
                  <Text style={styles.waypointRawatPillText}>Pupuk & Air</Text>
                </View>
              </View>

              {/* Dotted Pathway line 2 */}
              <View style={styles.pathwayLine} />

              {/* Waypoint 3: Panen */}
              <View style={styles.waypointCol}>
                <View style={[styles.waypointCircle, styles.waypointPanen]}>
                  <MaterialCommunityIcons
                    name="basket"
                    size={16}
                    color={ThemeColors.onPrimary}
                  />
                </View>
                <View style={styles.waypointPill}>
                  <Text style={styles.waypointPillText}>Panen</Text>
                </View>
              </View>
            </View>

            {/* Bottom Floating Telemetry Capsule */}
            <View style={styles.heroBottomCapsule}>
              <View style={styles.heroCapsuleLeft}>
                <View style={styles.heroCapsuleIcon}>
                  <MaterialCommunityIcons
                    name="calendar-check"
                    size={16}
                    color={ThemeColors.primary}
                  />
                </View>
                <View>
                  <Text style={styles.heroCapsuleTitle}>
                    Rekomendasi Tepat Musim
                  </Text>
                  <Text style={styles.heroCapsuleSubtitle}>
                    Siap panen 14 hari lagi
                  </Text>
                </View>
              </View>
              <MaterialCommunityIcons
                name="check-circle"
                size={18}
                color={ThemeColors.profit}
              />
            </View>
          </View>

          {/* Telemetry Dark Pod Summary inside hero */}
          <DarkSummaryCard style={styles.heroDarkPod}>
            <View style={styles.darkPodLeft}>
              <View style={styles.darkPodIcon}>
                <MaterialCommunityIcons
                  name="calendar-month"
                  size={18}
                  color={ThemeColors.onPrimary}
                />
              </View>
              <View>
                <Text style={styles.darkPodLabel}>Status Lahan #1</Text>
                <Text style={styles.darkPodValue}>Fase Pembungaan Padi</Text>
              </View>
            </View>
            <View style={styles.darkPodRight}>
              <View style={styles.pulseDot} />
              <Text style={styles.darkPodPercent}>92%</Text>
            </View>
          </DarkSummaryCard>
        </AppCard>

        {/* Carousel Pagination Dots (Step 1 of 3) */}
        <View style={styles.carouselDotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        {/* Headline & Value Proposition */}
        <View style={styles.headlineSection}>
          <View style={styles.stepBadge}>
            <MaterialCommunityIcons
              name="creation"
              size={13}
              color={ThemeColors.primary}
            />
            <Text style={styles.stepBadgeText}>
              Langkah 1 dari 3: Otomasi Lahan
            </Text>
          </View>
          <Text style={styles.mainTitle}>
            Kelola Lahan & Keuangan Tani Lebih Mudah
          </Text>
          <Text style={styles.mainDescription}>
            Pantau siklus tanam, verifikasi jadwal perawatan harian, dan hitung
            estimasi laba bersih panen Anda secara presisi tanpa repot buku
            catatan kertas.
          </Text>
        </View>

        {/* 3 Pillar Feature Micro-Badges */}
        <View style={styles.featuresList}>
          {/* Feature 1 */}
          <AppCard variant="white" style={styles.featureItemCard}>
            <View style={styles.featureIconBox}>
              <MaterialCommunityIcons
                name="wifi-off"
                size={20}
                color={ThemeColors.primary}
              />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Offline-Ready</Text>
              <Text style={styles.featureDesc}>
                Bisa catat di tengah sawah tanpa internet
              </Text>
            </View>
          </AppCard>

          {/* Feature 2 */}
          <AppCard variant="white" style={styles.featureItemCard}>
            <View style={styles.featureIconBox}>
              <MaterialCommunityIcons
                name="calculator-variant"
                size={20}
                color={ThemeColors.primary}
              />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Hitung Untung Rugi Otomatis</Text>
              <Text style={styles.featureDesc}>
                Laba bersih dan modal langsung terkalkulasi
              </Text>
            </View>
          </AppCard>

          {/* Feature 3 */}
          <AppCard variant="white" style={styles.featureItemCard}>
            <View style={styles.featureIconBox}>
              <MaterialCommunityIcons
                name="bell-ring-outline"
                size={20}
                color={ThemeColors.primary}
              />
            </View>
            <View style={styles.featureTextCol}>
              <Text style={styles.featureTitle}>Jadwal Pintar</Text>
              <Text style={styles.featureDesc}>
                Pengingat pemupukan & irigasi tepat waktu
              </Text>
            </View>
          </AppCard>
        </View>

        {/* Bottom CTA Actions */}
        <View style={styles.bottomCtaSection}>
          <PrimaryButton
            title="Mulai Sekarang"
            onPress={() => handleFinishOnboarding('/(auth)/register')}
            rightIcon={
              <MaterialCommunityIcons
                name="arrow-right"
                size={20}
                color={ThemeColors.onPrimary}
              />
            }
            style={styles.mainCtaBtn}
          />

          <SecondaryButton
            title="Sudah Punya Akun? Masuk di Sini"
            onPress={() => handleFinishOnboarding('/(auth)/login')}
            style={styles.loginGhostBtn}
          />
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: ThemeColors.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.margin,
    paddingTop: Platform.OS === 'ios' ? 48 : 24,
    paddingBottom: 32,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandLogoCircle: {
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    ...Shadows.subtle,
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ThemeColors.text,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    color: ThemeColors.textSecondary,
    marginTop: -2,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    ...Shadows.subtle,
  },
  skipButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: ThemeColors.textSecondary,
    marginRight: 2,
  },
  heroCanvasCard: {
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  trajectoryContainer: {
    backgroundColor: ThemeColors.surfaceSageLight,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    minHeight: 190,
    justifyContent: 'space-between',
  },
  floatingTopPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 34, 28, 0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  aiActiveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.secondaryFixed,
    marginLeft: 4,
  },
  profitMetricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    ...Shadows.subtle,
  },
  profitMetricBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.text,
    marginLeft: 4,
  },
  waypointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginVertical: Spacing.sm,
  },
  waypointCol: {
    alignItems: 'center',
  },
  waypointCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.subtle,
  },
  waypointTanam: {
    backgroundColor: ThemeColors.primary,
  },
  waypointRawat: {
    backgroundColor: ThemeColors.surfaceTintGreen,
  },
  waypointPanen: {
    backgroundColor: ThemeColors.primaryDark,
  },
  waypointPill: {
    backgroundColor: 'rgba(26, 34, 28, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  waypointPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.onPrimary,
  },
  waypointRawatPill: {
    backgroundColor: ThemeColors.surfaceTintGreen,
  },
  waypointRawatPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.primary,
  },
  pathwayLine: {
    flex: 1,
    height: 2,
    borderWidth: 1,
    borderColor: ThemeColors.primaryLight,
    borderStyle: 'dashed',
    marginHorizontal: 4,
  },
  heroBottomCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    ...Shadows.subtle,
  },
  heroCapsuleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 6,
  },
  heroCapsuleIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  heroCapsuleTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  heroCapsuleSubtitle: {
    fontSize: 10,
    color: ThemeColors.textSecondary,
  },
  heroDarkPod: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    padding: 12,
    borderRadius: Radius.lg,
  },
  darkPodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  darkPodIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  darkPodLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: ThemeColors.secondaryFixedDim,
    textTransform: 'uppercase',
  },
  darkPodValue: {
    fontSize: 13,
    fontWeight: '700',
    color: ThemeColors.onDark,
  },
  darkPodRight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  pulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: ThemeColors.secondaryFixed,
    marginRight: 4,
  },
  darkPodPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: ThemeColors.secondaryFixed,
  },
  carouselDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: Spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ThemeColors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: ThemeColors.primary,
  },
  headlineSection: {
    marginBottom: Spacing.md,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.xs,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ThemeColors.primary,
    marginLeft: 4,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: ThemeColors.text,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  mainDescription: {
    fontSize: 13,
    color: ThemeColors.textSecondary,
    lineHeight: 19,
  },
  featuresList: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  featureItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginVertical: 0,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: ThemeColors.surfaceTintGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureTextCol: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ThemeColors.text,
  },
  featureDesc: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginTop: 1,
  },
  bottomCtaSection: {
    gap: Spacing.sm,
  },
  mainCtaBtn: {
    width: '100%',
  },
  loginGhostBtn: {
    width: '100%',
  },
});
