import { Image } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { colors, space } from '@/design-system';
import { SarhButton } from '@/design-system/components';
import { useLayout } from '@/hooks/useLayout';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { safePush } from '@/lib/safeNavigate';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

const BUTCHERS_IMAGE = require('../../assets/images/explore-sarh-butchers.jpg');
const FEED_IMAGE = require('../../assets/images/explore-sarh-feed-suppliers.jpg');
const HERO_ASPECT = 1024 / 617;

type ExploreHeroProps = {
  image: number;
  accessibilityLabel: string;
  ctaTitle: string;
  href: string;
};

function ExploreHero({ image, accessibilityLabel, ctaTitle, href }: ExploreHeroProps) {
  const router = useRouter();
  const { gutter } = useLayout();
  const styles = useThemedStyles(() => createStyles());

  return (
    <View
      style={styles.hero}
      accessibilityLabel={accessibilityLabel}
    >
      <Image
        source={image}
        style={styles.image}
        contentFit="cover"
        pointerEvents="none"
      />
      <LinearGradient
        pointerEvents="none"
        colors={[colors.background, 'transparent']}
        style={styles.fadeTop}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', colors.background]}
        style={styles.fadeBottom}
      />
      <View
        pointerEvents="box-none"
        style={[styles.ctaDock, { paddingHorizontal: gutter }]}
      >
        <SarhButton
          title={ctaTitle}
          variant="primary"
          size="md"
          accessibilityLabel={ctaTitle}
          onPress={() => safePush(href, undefined, router)}
        />
      </View>
    </View>
  );
}

export function ExploreSarhSection() {
  const styles = useThemedStyles(() => createStyles());

  return (
    <View style={styles.wrap}>
      <ExploreHero
        image={BUTCHERS_IMAGE}
        accessibilityLabel="ملاحم سرح"
        ctaTitle="تصفح الملاحم"
        href="/butchers"
      />
      <ExploreHero
        image={FEED_IMAGE}
        accessibilityLabel="موردو الأعلاف"
        ctaTitle="استكشف"
        href="/feed-suppliers"
      />
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      paddingBottom: space[8],
      gap: space[8],
    },
    hero: {
      width: '100%',
      aspectRatio: HERO_ASPECT,
      overflow: 'hidden',
      backgroundColor: colors.background,
    },
    image: {
      ...StyleSheet.absoluteFillObject,
    },
    fadeTop: {
      position: 'absolute',
      top: 0,
      start: 0,
      end: 0,
      height: space[32],
    },
    fadeBottom: {
      position: 'absolute',
      bottom: 0,
      start: 0,
      end: 0,
      height: space[32],
    },
    ctaDock: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },
  });
}

export default ExploreSarhSection;
