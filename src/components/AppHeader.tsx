import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemeColors, Radius, Spacing } from '../constants/theme';

export interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  style?: ViewStyle;
  variant?: 'green' | 'light';
}

export function AppHeader({
  title = 'HarianTani',
  subtitle,
  showBack = false,
  onBack,
  rightElement,
  style,
  variant = 'green',
}: AppHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isGreen = variant === 'green';

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.header,
        isGreen ? styles.headerGreen : styles.headerLight,
        insets.top > 0 && { paddingTop: insets.top + Spacing.sm },
        style,
      ]}
    >
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity
            style={[styles.backButton, isGreen ? styles.backButtonGreen : styles.backButtonLight]}
            onPress={handleBack}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons
              name="arrow-left"
              size={22}
              color={isGreen ? '#FFFFFF' : ThemeColors.text}
            />
          </TouchableOpacity>
        ) : null}

        <View style={styles.brandRow}>
          <View style={[styles.brandBadge, isGreen ? styles.brandBadgeGreen : styles.brandBadgeLight]}>
            <MaterialCommunityIcons
              name="sprout"
              size={20}
              color={ThemeColors.primary}
            />
          </View>
          <View>
            <Text style={[styles.title, isGreen && styles.titleGreen]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.subtitle, isGreen && styles.subtitleGreen]}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>
      </View>

      {rightElement && <View style={styles.right}>{rightElement}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.margin,
    paddingVertical: Spacing.sm + 4,
  },
  headerGreen: {
    backgroundColor: ThemeColors.headerBackground,
    shadowColor: '#0D631B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  headerLight: {
    backgroundColor: 'rgba(235, 243, 236, 0.95)',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  backButtonGreen: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  backButtonLight: {
    backgroundColor: ThemeColors.surfaceLow,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  brandBadgeGreen: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  brandBadgeLight: {
    backgroundColor: ThemeColors.surfaceTintGreen,
    borderRadius: Radius.full,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ThemeColors.text,
    letterSpacing: -0.3,
  },
  titleGreen: {
    color: ThemeColors.onHeader,
  },
  subtitle: {
    fontSize: 12,
    color: ThemeColors.textSecondary,
    marginTop: -2,
  },
  subtitleGreen: {
    color: ThemeColors.onHeaderSubtitle,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
