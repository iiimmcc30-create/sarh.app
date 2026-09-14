import { Image } from '@/components/ui/AppImage';
import { colors, elevation, motion, radius, space } from '@/design-system';
import { AppText } from '@/design-system/components';
import { useLayout } from '@/hooks/useLayout';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { safePush } from '@/lib/safeNavigate';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

const AUTO_ADVANCE_MS = 5000;

const BUTCHERS_IMAGE = require('../../assets/images/explore-sarh-butchers.jpg');
const FEED_IMAGE = require('../../assets/images/explore-sarh-feed-suppliers.jpg');
const MINISTRY_IMAGE = require('../../assets/images/explore-sarh-ministry.jpg');
const BANNER_ASPECT = 1376 / 768;

const BANNERS = [
  {
    key: 'butchers',
    image: BUTCHERS_IMAGE,
    accessibilityLabel: 'ملاحم سرح',
    href: '/butchers',
  },
  {
    key: 'feed-suppliers',
    image: FEED_IMAGE,
    accessibilityLabel: 'موردو الأعلاف',
    href: '/feed-suppliers',
  },
  {
    key: 'ministry',
    image: MINISTRY_IMAGE,
    accessibilityLabel: 'خدمات وزارة البيئة والمياه والزراعة',
    href: '/ministry',
  },
] as const;

export function ExploreSarhSection() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { gutter } = useLayout();
  const styles = useThemedStyles(() => createStyles());
  const [index, setIndex] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const slideWidth = width;
  const indexRef = useRef(index);
  indexRef.current = index;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    if (next !== indexRef.current && next >= 0 && next < BANNERS.length) {
      setIndex(next);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % BANNERS.length;
      setIndex(next);
      scroller.current?.scrollTo({ x: next * slideWidth, animated: true });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [slideWidth]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.sectionHead, { paddingHorizontal: gutter }]}>
        <AppText variant="heading2" color="textPrimary">
          استكشف سرح
        </AppText>
      </View>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {BANNERS.map((banner) => (
          <View key={banner.key} style={[styles.slide, { width: slideWidth }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={banner.accessibilityLabel}
              onPress={() => safePush(banner.href, undefined, router)}
              style={({ pressed }) => [
                styles.banner,
                { width: slideWidth - gutter * 2 },
                pressed && styles.pressed,
              ]}
            >
              <Image
                source={banner.image}
                style={styles.image}
                contentFit="cover"
                pointerEvents="none"
              />
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {BANNERS.map((banner, i) => (
          <Pressable
            key={banner.key}
            accessibilityRole="button"
            accessibilityLabel={`بنر ${i + 1} من ${BANNERS.length}`}
            onPress={() => {
              setIndex(i);
              scroller.current?.scrollTo({ x: i * slideWidth, animated: true });
            }}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      paddingBottom: space[16],
    },
    sectionHead: {
      paddingTop: space[16],
      paddingBottom: space[12],
    },
    slide: {
      alignItems: 'center',
    },
    banner: {
      aspectRatio: BANNER_ASPECT,
      borderRadius: radius[20],
      overflow: 'hidden',
      backgroundColor: colors.surfaceElevated,
      ...elevation.raised,
    },
    image: {
      ...StyleSheet.absoluteFillObject,
    },
    pressed: {
      opacity: motion.opacity.pressed,
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: space[8],
      marginTop: space[12],
    },
    dot: {
      width: space[8],
      height: space[8],
      borderRadius: radius[999],
      backgroundColor: colors.border,
    },
    dotActive: {
      width: space[16],
      backgroundColor: colors.primary,
    },
  });
}

export default ExploreSarhSection;
