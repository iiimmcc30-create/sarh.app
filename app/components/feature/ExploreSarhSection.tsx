import { Image } from '@/components/ui/AppImage';
import { colors, functional, radius, space } from '@/design-system';
import { AppText, SarhButton } from '@/design-system/components';
import { useLayout } from '@/hooks/useLayout';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ExploreSarhBannerView } from '@/lib/exploreSarhBanners';
import {
  HOME_BANNER_CTA_HREF,
  HOME_BANNER_CTA_LABEL,
  HOME_BANNER_SUBTITLE_AR,
} from '@/lib/homeQuickAccess';
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
const BANNER_ASPECT = 16 / 9;

function bannerSubtitle(banner: ExploreSarhBannerView): string | null {
  if (banner.href === HOME_BANNER_CTA_HREF) return HOME_BANNER_SUBTITLE_AR;
  return null;
}

export function ExploreSarhSection() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { gutter } = useLayout();
  const styles = useThemedStyles(() => createStyles());
  const [banners, setBanners] = useState<ExploreSarhBannerView[]>([]);
  const [index, setIndex] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const slideWidth = width;
  const bannerWidth = slideWidth - gutter * 2;
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

  const openButchers = () => safePush(HOME_BANNER_CTA_HREF, undefined, router);

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {banners.map((banner) => {
          const subtitle = bannerSubtitle(banner);
          return (
            <View key={banner.id} style={[styles.slide, { width: slideWidth }]}>
              <View
                style={[styles.banner, { width: bannerWidth }]}
                accessibilityRole="image"
                accessibilityLabel={banner.accessibilityLabel}
              >
                <Image
                  source={banner.image}
                  style={styles.image}
                  contentFit="cover"
                  pointerEvents="none"
                />
                <View pointerEvents="none" style={styles.scrim} />
                <View style={styles.copy}>
                  <AppText
                    variant="heading2"
                    numberOfLines={2}
                    style={styles.title}
                  >
                    {banner.accessibilityLabel}
                  </AppText>
                  {subtitle ? (
                    <AppText variant="bodySmall" numberOfLines={2} style={styles.subtitle}>
                      {subtitle}
                    </AppText>
                  ) : null}
                  <View style={styles.ctaWrap}>
                    <SarhButton
                      title={HOME_BANNER_CTA_LABEL}
                      size="sm"
                      shape="pill"
                      leftIcon="angle-left"
                      accessibilityLabel={HOME_BANNER_CTA_LABEL}
                      onPress={openButchers}
                    />
                  </View>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {banners.length > 1 ? (
        <View style={[styles.dots, { paddingHorizontal: gutter }]}>
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
      ) : null}
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      paddingTop: space[12],
      paddingBottom: space[8],
    },
    slide: {
      alignItems: 'center',
    },
    banner: {
      aspectRatio: BANNER_ASPECT,
      borderRadius: radius[20],
      overflow: 'hidden',
      backgroundColor: colors.surfaceElevated,
    },
    image: {
      ...StyleSheet.absoluteFillObject,
    },
    scrim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: functional.overlay,
    },
    copy: {
      ...StyleSheet.absoluteFillObject,
      justifyContent: 'flex-end',
      padding: space[16],
      gap: space[8],
    },
    title: {
      color: functional.onPrimary,
    },
    subtitle: {
      color: functional.onPrimary,
    },
    ctaWrap: {
      alignSelf: 'flex-start',
      marginTop: space[4],
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
