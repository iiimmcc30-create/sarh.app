// SAFAT — Butchers market promo slider (admin-managed, 3 slides)
import { Image, uriSource } from '@/components/ui/AppImage';
import { butcherTypography } from '@/constants/butcherTypography';
import { radius, spacing, type ThemeColors } from '@/constants/theme';
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
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const slideWidth = width - spacing.lg * 2;
  const [index, setIndex] = useState(0);
  const scroller = useRef<ScrollView>(null);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % banners.length;
        scroller.current?.scrollTo({ x: next * (slideWidth + spacing.sm), animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length, slideWidth]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const next = Math.round(x / (slideWidth + spacing.sm));
    if (next !== index && next >= 0 && next < banners.length) setIndex(next);
  };

  if (banners.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled={false}
        snapToInterval={slideWidth + spacing.sm}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {banners.map((banner) => (
          <View key={banner.id} style={[styles.slide, { width: slideWidth }]}>
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
              scroller.current?.scrollTo({ x: i * (slideWidth + spacing.sm), animated: true });
            }}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { marginTop: spacing.md },
    row: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    slide: {
      height: 168,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.bgElevated,
    },
    image: { ...StyleSheet.absoluteFillObject },
    veil: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(8,14,10,0.42)',
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
      color: '#fff',
      textAlign: 'center',
    },
    subtitle: {
      ...butcherTypography.title,
      fontSize: 18,
      color: '#fff',
      textAlign: 'center',
    },
    caption: {
      ...butcherTypography.meta,
      color: 'rgba(255,255,255,0.88)',
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
