import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { dismissToast, getToastState, subscribeToast } from '@/lib/toast';
import { getRtlRow } from '@/lib/rtl';

const ICONS = {
  success: 'checkmark-circle',
  error: 'close-circle',
  info: 'information-circle',
} as const;

export function ToastHost() {
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [tick, setTick] = useState(0);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-16)).current;

  useEffect(() => subscribeToast(() => setTick((n) => n + 1)), []);

  const state = getToastState();
  void tick;

  useEffect(() => {
    if (!state) return;
    opacity.setValue(0);
    translateY.setValue(-16);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 6 }),
    ]).start();
  }, [state?.id, opacity, translateY, state]);

  if (!state) return null;

  const iconName = ICONS[state.type];
  const toneStyle =
    state.type === 'success'
      ? styles.toastSuccess
      : state.type === 'error'
        ? styles.toastError
        : styles.toastInfo;

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: insets.top + spacing.sm }]}>
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <Pressable
          style={[styles.toast, toneStyle, getRtlRow()]}
          onPress={dismissToast}
          accessibilityRole="alert"
        >
          <AppIcon
            name={iconName}
            size={20}
            color={
              state.type === 'success'
                ? styles.iconSuccess.color
                : state.type === 'error'
                  ? styles.iconError.color
                  : styles.iconInfo.color
            }
          />
          <Text style={styles.message}>{state.message}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    host: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      zIndex: 9999,
      alignItems: 'center',
    },
    toast: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      maxWidth: 420,
      width: '100%',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
      elevation: 6,
    },
    toastSuccess: {
      backgroundColor: colors.bgSurface,
      borderColor: `${colors.electricBright}55`,
    },
    toastError: {
      backgroundColor: colors.bgSurface,
      borderColor: `${colors.rose}55`,
    },
    toastInfo: {
      backgroundColor: colors.bgSurface,
      borderColor: colors.borderSoft,
    },
    message: {
      ...typography.bodyStrong,
      flex: 1,
      color: colors.textPrimary,
      writingDirection: 'rtl', textAlign: 'right', fontSize: 14,
      lineHeight: 20,
    },
    iconSuccess: { color: colors.electricBright },
    iconError: { color: colors.rose },
    iconInfo: { color: colors.cyan },
  });
}
