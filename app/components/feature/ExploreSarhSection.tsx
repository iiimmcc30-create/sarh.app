import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { AppText } from '@/design-system/components';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow, rtlForwardIcon } from '@/lib/rtl';
import { safePush } from '@/lib/safeNavigate';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';

const HERO_IMAGE = require('../../assets/images/onboarding/slide-2.jpg');
const ICON_BOX = 40;

export function ExploreSarhSection() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const heroH = Math.round(Math.min(240, Math.max(188, width * 0.54)));
  const imageW = Math.round(width * 0.48);

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionHead}>
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
        <View style={[styles.heroRow, getRtlRow()]}>
          <View style={styles.copy}>
            <View style={styles.iconRing}>
              <AppIcon name="storefront-outline" size={20} color={styles.accent.color} />
            </View>
            <AppText variant="heading2" color="textPrimary" numberOfLines={2} ellipsizeMode="tail">
              ملاحم سرح
            </AppText>
            <AppText variant="bodySmall" color="textSecondary" numberOfLines={3} ellipsizeMode="tail">
              تصفح أفضل منتجات اللحوم بكل أمان وثقة
            </AppText>
            <View style={[styles.cta, getRtlRow()]}>
              <AppText variant="label" color="primary">
                تصفح الملاحم
              </AppText>
              <AppIcon name={rtlForwardIcon()} size={14} color={styles.accent.color} />
            </View>
          </View>
          <View style={[styles.imagePane, { width: imageW }]}>
            <Image source={HERO_IMAGE} style={styles.image} contentFit="cover" />
          </View>
        </View>
        <LinearGradient
          pointerEvents="none"
          colors={[styles.heroShade.color, styles.heroMid.color, 'transparent']}
          locations={[0, 0.55, 1]}
          start={{ x: 1, y: 0.5 }}
          end={{ x: 0, y: 0.5 }}
          style={styles.shade}
        />
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingBottom: spacing.md,
    },
    sectionHead: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md,
      minHeight: 32,
    },
    hero: {
      width: '100%',
      overflow: 'hidden',
      backgroundColor: colors.bgDeep,
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
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    iconRing: {
      width: ICON_BOX,
      height: ICON_BOX,
      borderRadius: ICON_BOX / 2,
      borderWidth: 1.5,
      borderColor: colors.electric,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cta: {
      alignItems: 'center',
      gap: spacing.xs,
      minHeight: 44,
      paddingTop: spacing.xs,
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
      width: '64%',
      zIndex: 1,
    },
    accent: { color: colors.electric },
    heroShade: { color: colors.bgDeep },
    heroMid: { color: `${colors.bgDeep}B8` },
    pressed: {
      opacity: 0.94,
    },
  });
}

export default ExploreSarhSection;
