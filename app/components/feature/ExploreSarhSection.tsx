import { Image } from '@/components/ui/AppImage';
import { colors, elevation, motion, radius, space } from '@/design-system';
import { AppText } from '@/design-system/components';
import { useLayout } from '@/hooks/useLayout';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  FALLBACK_EXPLORE_SARH_BANNERS,
  type ExploreSarhBannerView,
} from '@/lib/exploreSarhBanners';
import { safePush } from '@/lib/safeNavigate';
import { fetchExploreSarhBanners } from '@/services/exploreSarhBanners';
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
const BANNER_ASPECT = 1376 / 768;

export function ExploreSarhSection() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { gutter } = useLayout();
  const styles = useThemedStyles(() => createStyles());
  const [banners, setBanners] = useState<ExploreSarhBannerView[]>(
    FALLBACK_EXPLORE_SARH_BANNERS,
  );
  const [index, setIndex] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const slideWidth = width;
  const indexRef = useRef(index);
  const bannersRef = useRef(banners);
  indexRef.current = index;
  bannersRef.current = banners;

  useEffect(() => {
    let cancelled = false;
    void fetchExploreSarhBanners().then((next) => {
      if (cancelled || next.length === 0) return;
      setBanners(next);
      setIndex(0);
      scroller.current?.scrollTo({ x: 0, animated: false });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
    if (next !== indexRef.current && next >= 0 && next < bannersRef.current.length) {
      setIndex(next);
    }
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      const len = bannersRef.current.length;
      if (len <= 1) return;
      const next = (indexRef.current + 1) % len;
      setIndex(next);
      scroller.current?.scrollTo({ x: next * slideWidth, animated: true });
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [slideWidth, banners.length]);

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
        {banners.map((banner) => (
          <View key={banner.id} style={[styles.slide, { width: slideWidth }]}>
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
        {banners.map((banner, i) => (
          <Pressable
            key={banner.id}
            accessibilityRole="button"
            accessibilityLabel={`بنر ${i + 1} من ${banners.length}`}
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
