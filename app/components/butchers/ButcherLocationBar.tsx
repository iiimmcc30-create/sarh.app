// SAFAT — Butchers home delivery-location selector (tap to open smart map picker)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import {
  deliveryLocationSummary,
  loadDeliveryLocation,
  type DeliveryLocation,
} from '@/services/butcherDeliveryLocation';
import { useFocusEffect, useRouter } from 'expo-router';
import { safePush } from '@/lib/safeNavigate';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export function ButcherLocationBar() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [location, setLocation] = useState<DeliveryLocation | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadDeliveryLocation().then((loc) => {
        if (active) setLocation(loc);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const summary = deliveryLocationSummary(location);
  const hasLocation = Boolean(summary);
  const label = location?.label?.trim() || (hasLocation ? 'التوصيل إلى' : 'حدّد موقعك');

  return (
    <Pressable
      style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      onPress={() => safePush('/butchers/location', undefined, router)}
      accessibilityRole="button"
      accessibilityLabel="تحديد موقع التوصيل"
    >
      <View style={styles.pin}>
        <AppIcon name="location" size={18} color={colors.electricBright} />
      </View>
      <View style={styles.textShell}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.value} numberOfLines={1}>
          {hasLocation ? summary : 'اضغط لاختيار موقع التوصيل على الخريطة'}
        </Text>
      </View>
      <AppIcon name="chevron-down" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bar: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.bgElevated,
    },
    pressed: { opacity: 0.85 },
    pin: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.electric + '18',
    },
    textShell: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
    },
    label: {
      ...typography.micro,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    value: {
      ...typography.bodyStrong,
      fontSize: 14,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
  });
}

export default ButcherLocationBar;
