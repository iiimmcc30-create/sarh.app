import { APP_LOGO } from '@/constants/branding';
import { typeFace } from '@/constants/fonts';
import { ds } from '@/constants/designSystem';
import { typography } from '@/constants/theme';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
} from 'react-native';

const IS_WEB = Platform.OS === 'web';
const LOGO_SIZE = 120;
const BUILD_MS = IS_WEB ? 520 : 1300;
const MIN_SHOW_MS = IS_WEB ? 850 : 1800;
const FADE_MS = IS_WEB ? 260 : 420;
const BOOT_ANIM_FAILSAFE_MS = IS_WEB ? 2200 : 5500;

/** Splash stays light surface; accent = brand green only */
const BRAND_GREEN = ds.light.primary;
const BG = ds.light.card;
const MUTED = ds.light.textMuted;
const ACCENT = ds.light.primary;

type AppBootSplashProps = {
  /** App fonts + auth/onboarding finished */
  ready: boolean;
  onComplete: () => void;
};

function LoadingDots({ opacity }: { opacity: Animated.Value }) {
  const d1 = useRef(new Animated.Value(0.35)).current;
  const d2 = useRef(new Animated.Value(0.35)).current;
  const d3 = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 420,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0.35,
            duration: 420,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      );

    const a1 = pulse(d1, 0);
    const a2 = pulse(d2, 140);
    const a3 = pulse(d3, 280);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [d1, d2, d3]);

  return (
    <Animated.View style={[styles.dotsRow, { opacity }]}>
      {[d1, d2, d3].map((dot, index) => (
        <Animated.View key={index} style={[styles.dot, { opacity: dot, transform: [{ scale: dot }] }]} />
      ))}
    </Animated.View>
  );
}

/** Minimal white boot splash with brand-green accents. */
export function AppBootSplash({ ready, onComplete }: AppBootSplashProps) {
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(0.88)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(10)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const buildDone = useRef(false);
  const startMs = useRef(Date.now());
  const exited = useRef(false);
  const [interactive, setInteractive] = useState(true);

  const finish = useCallback(() => {
    if (exited.current) return;
    exited.current = true;
    setInteractive(false);
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: FADE_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      onComplete();
      if (!finished && IS_WEB) onComplete();
    });
  }, [onComplete, overlayOpacity]);

  const tryDismiss = useCallback(
    (force = false) => {
      if (exited.current) return;
      if (!force && (!ready || !buildDone.current)) return;
      const elapsed = Date.now() - startMs.current;
      const delay = Math.max(0, MIN_SHOW_MS - elapsed);
      setTimeout(() => finish(), delay);
    },
    [ready, finish],
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(ringOpacity, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(ringScale, {
        toValue: 1,
        tension: 48,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: BUILD_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 42,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(IS_WEB ? 120 : 220),
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 480,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(titleTranslate, {
            toValue: 0,
            duration: 480,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start(() => {
      buildDone.current = true;
      tryDismiss();
    });
  }, [glowOpacity, logoOpacity, logoScale, ringOpacity, ringScale, titleOpacity, titleTranslate, tryDismiss]);

  useEffect(() => {
    const t = setTimeout(() => {
      buildDone.current = true;
      tryDismiss(true);
    }, BOOT_ANIM_FAILSAFE_MS);
    return () => clearTimeout(t);
  }, [tryDismiss]);

  useEffect(() => {
    tryDismiss();
  }, [ready, tryDismiss]);

  const logoSource = APP_LOGO as ImageSourcePropType;

  return (
    <Animated.View
      style={[styles.overlay, { opacity: overlayOpacity }]}
      pointerEvents={interactive ? 'auto' : 'none'}
    >
      <View style={styles.bgOrbTop} />
      <View style={styles.bgOrbBottom} />

      <Animated.View
        style={[
          styles.glow,
          {
            opacity: glowOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      <Animated.View
        style={[
          styles.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />

      <Animated.Image
        source={logoSource}
        style={[
          styles.logo,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
        resizeMode="contain"
      />

      <Animated.Text
        style={[
          styles.title,
          {
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslate }],
          },
        ]}
      >
        سرح
      </Animated.Text>
      <Animated.Text style={[styles.sub, { opacity: titleOpacity }]}>
        المنصة الوطنية للثروة الحيوانية
      </Animated.Text>

      <LoadingDots opacity={titleOpacity} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    elevation: 9999,
    overflow: 'hidden',
  },
  bgOrbTop: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(32, 182, 111, 0.06)',
  },
  bgOrbBottom: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(32, 182, 111, 0.04)',
  },
  glow: {
    position: 'absolute',
    width: LOGO_SIZE + 56,
    height: LOGO_SIZE + 56,
    borderRadius: (LOGO_SIZE + 56) / 2,
    backgroundColor: 'rgba(32, 182, 111, 0.08)',
  },
  ring: {
    position: 'absolute',
    width: LOGO_SIZE + 24,
    height: LOGO_SIZE + 24,
    borderRadius: (LOGO_SIZE + 24) / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(32, 182, 111, 0.22)',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    ...Platform.select({
      ios: {
        shadowColor: '#101820',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  title: {
    marginTop: 20,
    fontSize: 30,
    ...typeFace('700'),
    color: BRAND_GREEN,
    letterSpacing: 0.3,
  },
  sub: {
    ...typography.secondary,
    marginTop: 8,
    color: MUTED,
    textAlign: 'center',
    paddingHorizontal: 36,
    lineHeight: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 28,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: ACCENT,
  },
});
