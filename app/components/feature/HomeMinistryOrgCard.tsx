import { Image } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { AppText } from '@/components/ui/AppText';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { MEWA_ARABIC_NAME, MEWA_COVER, MEWA_LOGO } from '@/constants/branding';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { safePush } from '@/lib/safeNavigate';
import { formatServiceCountLabel } from '@/services/officialServices';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

type Props = {
  serviceCount: number;
  loading?: boolean;
};

export function HomeMinistryOrgCard({ serviceCount, loading }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const cardH = Math.round(Math.min(228, Math.max(196, width * 0.52)));

  const openProfile = () => safePush('/ministry', undefined, router);

  return (
    <View style={styles.wrap}>
      <SectionHeader title="خدمات الوزارة" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${MEWA_ARABIC_NAME}. ${formatServiceCountLabel(serviceCount)}. فتح`}
        onPress={openProfile}
        style={({ pressed }) => [styles.card, { height: cardH }, pressed && styles.pressed]}
      >
        <Image source={MEWA_COVER} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(7, 19, 28, 0.22)', 'rgba(7, 19, 28, 0.82)']}
          locations={[0, 0.48, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.bar, getRtlRow()]}>
          <View style={styles.logoRing}>
            <Image
              source={MEWA_LOGO}
              style={styles.logo}
              contentFit="contain"
              accessibilityLabel="شعار وزارة البيئة والمياه والزراعة"
            />
          </View>
          <View style={styles.copy}>
            <AppText style={styles.title} numberOfLines={2}>
              {MEWA_ARABIC_NAME}
            </AppText>
            <AppText style={styles.subtitle} numberOfLines={1}>
              {loading && serviceCount === 0 ? '…' : formatServiceCountLabel(serviceCount)}
            </AppText>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="فتح"
            onPress={openProfile}
            style={({ pressed }) => [styles.openBtn, pressed && styles.openPressed]}
          >
            <AppText style={styles.openText}>فتح</AppText>
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingBottom: spacing.sm,
    },
    card: {
      marginHorizontal: spacing.lg,
      borderRadius: 28,
      overflow: 'hidden',
      justifyContent: 'flex-end',
      backgroundColor: colors.bgDeep,
      shadowColor: '#07131C',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 8,
    },
    bar: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    logoRing: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.92)',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    logo: {
      width: 40,
      height: 40,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    title: {
      ...typography.smallHeading,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    subtitle: {
      ...typography.caption,
      color: 'rgba(255,255,255,0.86)',
    },
    openBtn: {
      backgroundColor: '#FFFFFF',
      borderRadius: radius.pill,
      paddingHorizontal: 18,
      paddingVertical: 8,
    },
    openText: {
      ...typography.caption,
      color: '#101820',
      fontWeight: '700',
    },
    openPressed: {
      opacity: 0.88,
    },
    pressed: {
      opacity: 0.96,
    },
  });
}

export default HomeMinistryOrgCard;
