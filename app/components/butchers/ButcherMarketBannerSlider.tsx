import { Image, uriSource } from '@/components/ui/AppImage';
import { butcherTypography } from '@/constants/butcherTypography';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ButcherMarketBanner } from '@/services/butcherMarketBanners';
import { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

type Props = {
  banners: ButcherMarketBanner[];
};

export function ButcherMarketBannerSlider({ banners }: Props) {
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(({ colors, scheme }) => createStyles(colors, scheme));
  const [index, setIndex] = useState(0);
  const scroller = useRef<ScrollView>(null);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % banners.length;
        scroller.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, width]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / width);
    if (next !== index && next >= 0 && next < banners.length) setIndex(next);
  };

  if (banners.length === 0) return null;

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
        {banners.map((banner) => (
          <View key={banner.id} style={[styles.slide, { width }]}>
            <Image source={uriSource(banner.imageUrl)} style={styles.image} contentFit="cover" />
            <View style={styles.veil} />
            <View style={styles.copy}>
              <Text style={styles.title}>{banner.titleAr}</Text>
              <Text style={styles.subtitle}>{banner.subtitleAr}</Text>
              {banner.captionAr ? <Text style={styles.caption}>{banner.captionAr}</Text> : null}
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {banners.map((banner, i) => (
          <Pressable
            key={banner.id}
            onPress={() => {
              setIndex(i);
              scroller.current?.scrollTo({ x: i * width, animated: true });
            }}
            accessibilityLabel={`بنر ${i + 1}`}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const overlayText = scheme === 'light' ? colors.bgElevated : colors.textPrimary;
  return StyleSheet.create({
    wrap: {
      marginTop: 0,
    },
    slide: {
      height: 176,
      overflow: 'hidden',
      backgroundColor: colors.bgSurface,
    },
    image: { ...StyleSheet.absoluteFillObject },
    veil: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.bgOverlay,
    },
    copy: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      gap: 4,
    },
    title: {
      ...butcherTypography.secondary,
      color: overlayText,
      textAlign: 'center',
    },
    subtitle: {
      ...butcherTypography.title,
      color: overlayText,
      textAlign: 'center',
    },
    caption: {
      ...butcherTypography.meta,
      color: overlayText,
      textAlign: 'center',
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      marginTop: spacing.sm,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.borderSoft,
    },
    dotActive: {
      backgroundColor: colors.electric,
      width: 8,
      height: 8,
    },
  });
}

export default ButcherMarketBannerSlider;
