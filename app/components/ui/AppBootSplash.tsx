import { APP_LOGO } from '@/constants/branding';
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
const LOGO_SIZE = 132;
const BUILD_MS = IS_WEB ? 600 : 1500;
const MIN_SHOW_MS = IS_WEB ? 900 : 2000;
const FADE_MS = IS_WEB ? 280 : 450;
const BOOT_ANIM_FAILSAFE_MS = IS_WEB ? 2200 : 5500;
const BG = '#163526';

type AppBootSplashProps = {
  /** App fonts + auth/onboarding finished */
  ready: boolean;
  onComplete: () => void;
};

/**
 * NAMA-style boot splash — emblem builds progressively on brand green.
 * Web uses a simpler opacity-only animation (height clip hangs on RN Web).
 */
export function AppBootSplash({ ready, onComplete }: AppBootSplashProps) {
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const ringScale = useRef(new Animated.Value(0.55)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const reveal = useRef(new Animated.Value(IS_WEB ? 1 : 0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleTranslate = useRef(new Animated.Value(12)).current;
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
    if (IS_WEB) {
      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(ringScale, {
          toValue: 1,
          tension: 52,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: BUILD_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 420,
          delay: 180,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 420,
          delay: 180,
          useNativeDriver: true,
        }),
      ]).start(() => {
        buildDone.current = true;
        tryDismiss();
      });
      return;
    }

    Animated.sequence([
      Animated.parallel([
        Animated.timing(ringOpacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(ringScale, {
          toValue: 1,
          tension: 52,
          friction: 9,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(reveal, {
          toValue: 1,
          duration: BUILD_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: BUILD_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslate, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]).start(({ finished }) => {
      buildDone.current = true;
      if (finished) tryDismiss();
      else tryDismiss(true);
    });
  }, [
    logoOpacity,
    reveal,
    ringOpacity,
    ringScale,
    titleOpacity,
    titleTranslate,
    tryDismiss,
  ]);

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

  const clipHeight = reveal.interpolate({
    inputRange: [0, 1],
    outputRange: [0, LOGO_SIZE],
  });

  const logoSource = APP_LOGO as ImageSourcePropType;

  return (
    <Animated.View
      style={[styles.overlay, { opacity: overlayOpacity }]}
      pointerEvents={interactive ? 'auto' : 'none'}
    >
      <Animated.View
        style={[
          styles.ring,
          {
            opacity: ringOpacity,
            transform: [{ scale: ringScale }],
          },
        ]}
      />
      <View style={styles.logoStack}>
        {IS_WEB ? (
          <Animated.Image
            source={logoSource}
            style={[styles.logo, { opacity: logoOpacity }]}
            resizeMode="contain"
          />
        ) : (
          <Animated.View style={[styles.clip, { height: clipHeight }]}>
            <Animated.Image
              source={logoSource}
              style={[styles.logo, { opacity: logoOpacity }]}
              resizeMode="contain"
            />
          </Animated.View>
        )}
      </View>
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
  },
  ring: {
    position: 'absolute',
    width: LOGO_SIZE + 28,
    height: LOGO_SIZE + 28,
    borderRadius: (LOGO_SIZE + 28) / 2,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  logoStack: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  clip: {
    width: LOGO_SIZE,
    overflow: 'hidden',
    alignItems: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  title: {
    marginTop: 20,
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  sub: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
