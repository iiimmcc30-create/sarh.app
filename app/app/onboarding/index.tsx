import { Image } from 'expo-image';
import { OnboardingDots } from '@/components/onboarding/OnboardingDots';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import {
  ONBOARDING_NEXT_LABEL,
  ONBOARDING_SKIP_LABEL,
  ONBOARDING_SLIDES,
  ONBOARDING_START_LABEL,
} from '@/constants/onboardingCopy';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { layout, spacing } from '@/constants/theme';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { paddingStart, rtlForwardIcon } from '@/lib/rtl';
import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type ListRenderItemInfo,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CREAM = '#F4EFE6';
const INK = '#163526';
const MUTED = '#5C6B63';
const DIVIDER = '#284E39';

export default function OnboardingScreen() {
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { completeOnboarding } = useOnboarding();

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const listRef = useRef<FlatList<(typeof ONBOARDING_SLIDES)[number]>>(null);
  const finishingRef = useRef(false);

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;
  const compact = height < 720;

  const finishOnboarding = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    try {
      await completeOnboarding();
      router.replace(isAuthenticated ? '/(tabs)' : '/auth/welcome');
    } catch {
      finishingRef.current = false;
    }
  }, [completeOnboarding, isAuthenticated, router]);

  const handleSkip = useCallback(() => {
    void finishOnboarding();
  }, [finishOnboarding]);

  const handleNext = useCallback(() => {
    if (isLastSlide) {
      void finishOnboarding();
      return;
    }
    listRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
  }, [currentIndex, finishOnboarding, isLastSlide]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false },
  );

  const onMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / width);
      setCurrentIndex(Math.max(0, Math.min(ONBOARDING_SLIDES.length - 1, index)));
    },
    [width],
  );

  const renderSlide = useCallback(
    ({ item }: ListRenderItemInfo<(typeof ONBOARDING_SLIDES)[number]>) => {
      return (
        <View style={[styles.slide, { width }]}>
          <Image source={item.image} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          <LinearGradient
            colors={[CREAM, `${CREAM}F2`, `${CREAM}66`, 'transparent']}
            locations={[0, 0.28, 0.48, 0.72]}
            style={styles.fade}
          />
          <View style={[styles.textBlock, compact && styles.textBlockCompact]}>
            <Text style={styles.title}>{item.title}</Text>
            <View style={styles.divider} />
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </View>
      );
    },
    [compact, width],
  );

  return (
    <View style={styles.root}>
      <View style={styles.pagerShell}>
        <Animated.FlatList
          ref={listRef}
          data={ONBOARDING_SLIDES}
          keyExtractor={(item) => item.id}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          style={styles.list}
        />
      </View>

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']} pointerEvents="box-none">
        <View style={styles.header} pointerEvents="box-none">
          {!isLastSlide ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={ONBOARDING_SKIP_LABEL}
              onPress={handleSkip}
              style={({ pressed }) => [styles.skipBtn, pressed && styles.skipPressed]}
            >
              <Text style={styles.skipText}>{ONBOARDING_SKIP_LABEL}</Text>
            </Pressable>
          ) : (
            <View style={styles.skipBtn} />
          )}
        </View>

        <View style={styles.footer}>
          <OnboardingDots
            count={ONBOARDING_SLIDES.length}
            activeIndex={currentIndex}
            scrollX={scrollX}
            slideWidth={width}
          />
          <PrimaryButton
            title={isLastSlide ? ONBOARDING_START_LABEL : ONBOARDING_NEXT_LABEL}
            onPress={handleNext}
            fullWidth
            icon={isLastSlide ? 'checkmark' : rtlForwardIcon()}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: CREAM,
  },
  pagerShell: {
    ...StyleSheet.absoluteFillObject,
    direction: 'ltr',
  },
  list: {
    flex: 1,
  },
  slide: {
    flex: 1,
    backgroundColor: CREAM,
  },
  fade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '58%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'flex-start',
    ...paddingStart(layout.screenPadding),
    paddingTop: spacing.sm,
  },
  skipBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  skipPressed: { opacity: 0.7 },
  skipText: {
    fontFamily: OFFICIAL_APP_FONT,
    fontWeight: '700',
    fontSize: 15,
    color: MUTED,
    writingDirection: 'rtl',
  },
  textBlock: {
    position: 'absolute',
    top: '16%',
    left: layout.screenPadding,
    right: layout.screenPadding,
    alignItems: 'center',
    gap: spacing.lg,
  },
  textBlockCompact: {
    top: '12%',
    gap: spacing.md,
  },
  title: {
    fontFamily: OFFICIAL_APP_FONT,
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 38,
    color: INK,
    textAlign: 'center',
    writingDirection: 'rtl',
    width: '100%',
  },
  divider: {
    width: 42,
    height: 1.5,
    backgroundColor: DIVIDER,
    borderRadius: 1,
  },
  description: {
    fontFamily: OFFICIAL_APP_FONT,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 26,
    color: MUTED,
    textAlign: 'center',
    writingDirection: 'rtl',
    width: '100%',
    maxWidth: 340,
  },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    maxWidth: layout.contentMaxWidth,
    width: '100%',
    alignSelf: 'center',
  },
});
