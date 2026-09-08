import { Image, uriSource } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { colors, elevation, functional, motion, radius, space } from '@/design-system';
import { AppText, SarhAvatar, SarhButton, SarhCard } from '@/design-system/components';
import { MEWA_FALLBACK_AVATAR, MEWA_FALLBACK_COVER } from '@/constants/branding';
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
  const cardH = Math.round(Math.min(200, Math.max(172, width * 0.46)));
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
            colors={['transparent', functional.overlay]}
            locations={[0.28, 1]}
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
                variant="heading3"
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

const styles = StyleSheet.create({
  wrap: {
    paddingBottom: space[16],
  },
  sectionHead: {
    paddingHorizontal: space[16],
    paddingTop: space[16],
    paddingBottom: space[12],
  },
  card: {
    marginHorizontal: space[16],
    borderRadius: radius[20],
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: colors.surfaceElevated,
    shadowColor: colors.background,
    ...elevation.raised,
  },
  bar: {
    alignItems: 'center',
    gap: space[12],
    paddingHorizontal: space[16],
    paddingVertical: space[16],
  },
  logo: {
    width: space[48],
    height: space[48],
    borderRadius: radius[999],
    backgroundColor: functional.onPrimary,
    borderWidth: 2,
    borderColor: functional.onPrimary,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: space[4],
  },
  title: {
    color: functional.onPrimary,
  },
  subtitle: {
    color: functional.onPrimary,
    opacity: motion.opacity.pressed,
  },
  pressed: {
    opacity: motion.opacity.pressed,
  },
});

export default HomeMinistryOrgCard;
