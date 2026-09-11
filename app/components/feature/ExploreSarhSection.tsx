import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { colors, functional, motion, radius, space } from '@/design-system';
import { AppText } from '@/design-system/components';
import { Row } from '@/design-system/layout';
import { useLayout } from '@/hooks/useLayout';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { rtlForwardIcon } from '@/lib/rtl';
import { safePush } from '@/lib/safeNavigate';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

const HERO_IMAGE = require('../../assets/images/explore-sarh-butchers.jpg');

export function ExploreSarhSection() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { gutter } = useLayout();
  const heroH = Math.round(Math.min(208, Math.max(176, width * 0.48)));
  const imageW = Math.round(width * 0.5);
  const styles = useThemedStyles(() => createStyles());

  return (
    <View style={styles.wrap}>
      <View style={[styles.sectionHead, { paddingHorizontal: gutter }]}>
        <AppText variant="heading2" color="textPrimary">
          استكشف سرح
        </AppText>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="ملاحم سرح. تصفح أفضل منتجات اللحوم بكل أمان وثقة"
        onPress={() => safePush('/butchers', undefined, router)}
        style={({ pressed }) => [styles.hero, { height: heroH }, pressed && styles.pressed]}
      >
        <Row align="stretch" style={styles.heroRow}>
          <View style={[styles.copy, { paddingHorizontal: gutter }]}>
            <View style={styles.iconRing}>
              <AppIcon name="storefront-outline" size={space[20]} color={colors.primary} />
            </View>
            <AppText variant="heading1" color="textPrimary" numberOfLines={2} ellipsizeMode="tail">
              ملاحم سرح
            </AppText>
            <AppText variant="bodySmall" color="textSecondary" numberOfLines={3} ellipsizeMode="tail">
              تصفح أفضل منتجات اللحوم بكل أمان وثقة
            </AppText>
            <Row align="center" gap="sm" style={styles.cta}>
              <AppText variant="label" color="primary">
                تصفح الملاحم
              </AppText>
              <AppIcon name={rtlForwardIcon()} size={space[16]} color={colors.primary} />
            </Row>
          </View>
          <View style={[styles.imagePane, { width: imageW }]}>
            <Image source={HERO_IMAGE} style={styles.image} contentFit="cover" />
          </View>
        </Row>
        <LinearGradient
          pointerEvents="none"
          colors={[colors.background, functional.overlay, 'transparent']}
          locations={[0, 0.42, 1]}
          start={{ x: 1, y: 0.5 }}
          end={{ x: 0, y: 0.5 }}
          style={styles.shade}
        />
      </Pressable>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
  wrap: {
    paddingBottom: space[8],
  },
  sectionHead: {
    paddingTop: space[16],
    paddingBottom: space[12],
  },
  hero: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: colors.background,
  },
  heroRow: {
    flex: 1,
    alignItems: 'stretch',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    zIndex: 2,
    justifyContent: 'center',
    paddingVertical: space[16],
    gap: space[8],
  },
  iconRing: {
    width: space[40],
    height: space[40],
    borderRadius: radius[999],
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: functional.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    alignItems: 'center',
    gap: space[8],
    minHeight: space[48],
    paddingTop: space[4],
  },
  imagePane: {
    height: '100%',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  shade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    width: '68%',
    zIndex: 1,
  },
  pressed: {
    opacity: motion.opacity.pressed,
  },
});
}

export default ExploreSarhSection;
