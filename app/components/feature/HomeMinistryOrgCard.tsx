import { Image, uriSource } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { AppText, SarhAvatar, SarhButton, SarhCard } from '@/design-system/components';
import { functional } from '@/design-system';
import { MEWA_FALLBACK_AVATAR, MEWA_FALLBACK_COVER } from '@/constants/branding';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { safePush } from '@/lib/safeNavigate';
import {
  formatServiceCountLabel,
  type MinistryAccount,
} from '@/services/officialServices';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

type Props = {
  account: MinistryAccount | null;
  serviceCount: number;
  loading?: boolean;
};

export function HomeMinistryOrgCard({ account, serviceCount, loading }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const cardH = Math.round(Math.min(228, Math.max(196, width * 0.52)));
  const name = account?.arabicName || '';
  const count = account?.servicesCount ?? serviceCount;
  const cover = account?.coverImage ? uriSource(account.coverImage) : MEWA_FALLBACK_COVER;
  const avatar = account?.avatar ? uriSource(account.avatar) : MEWA_FALLBACK_AVATAR;

  const openProfile = () => safePush('/ministry', undefined, router);

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHead}>
        <AppText variant="heading2" color="textPrimary">
          خدمات الوزارة
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}. ${formatServiceCountLabel(count)}. فتح`}
        onPress={openProfile}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        <SarhCard variant="plain" padding="none" style={[styles.card, { height: cardH }]}>
          <Image source={cover} style={StyleSheet.absoluteFill} contentFit="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(7, 19, 28, 0.22)', 'rgba(7, 19, 28, 0.82)']}
            locations={[0, 0.48, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.bar, getRtlRow()]}>
            <SarhAvatar
              source={avatar}
              name={name}
              size="lg"
              accessibilityLabel={name}
              style={styles.logo}
            />
            <View style={styles.copy}>
              <AppText
                variant="bodySmall"
                numberOfLines={2}
                ellipsizeMode="tail"
                style={styles.title}
              >
                {name || (loading ? '…' : '')}
              </AppText>
              <AppText
                variant="caption"
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.subtitle}
              >
                {loading && count === 0 ? '…' : formatServiceCountLabel(count)}
              </AppText>
            </View>
            <SarhButton
              title="فتح"
              variant="inverse"
              size="sm"
              shape="pill"
              accessibilityLabel="فتح"
              onPress={openProfile}
            />
          </View>
        </SarhCard>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingBottom: spacing.sm,
    },
    sectionHead: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md,
      minHeight: 32,
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
    logo: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: functional.onPrimary,
      borderWidth: 1.5,
      borderColor: functional.onPrimary,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    title: {
      color: functional.onPrimary,
    },
    subtitle: {
      color: 'rgba(255,255,255,0.86)',
    },
    pressed: {
      opacity: 0.96,
    },
  });
}

export default HomeMinistryOrgCard;
