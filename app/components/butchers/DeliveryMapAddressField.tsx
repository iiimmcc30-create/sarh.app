// SAFAT — Delivery address via map picker (not free-text)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import {
  formatDeliveryAddressLine,
  loadDeliveryLocation,
  type DeliveryLocation,
} from '@/services/butcherDeliveryLocation';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  onAddressChange?: (addressLine: string) => void;
};

export function DeliveryMapAddressField({ onAddressChange }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [location, setLocation] = useState<DeliveryLocation | null>(null);

  const onAddressChangeRef = useRef(onAddressChange);
  onAddressChangeRef.current = onAddressChange;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void loadDeliveryLocation().then((loc) => {
        if (!active) return;
        setLocation(loc);
        onAddressChangeRef.current?.(formatDeliveryAddressLine(loc));
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const summary = formatDeliveryAddressLine(location);
  const hasLocation = Boolean(summary);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push('/butchers/location')}
      accessibilityRole="button"
      accessibilityLabel="اختيار عنوان التوصيل على الخريطة"
    >
      <View style={styles.coverTrail}>
        <View style={styles.rtlTextShellFlex}>
          <Text style={styles.title}>عنوان التوصيل</Text>
          <Text style={styles.value} numberOfLines={2}>
            {hasLocation ? summary : 'اضغط لتحديد الموقع على الخريطة'}
          </Text>
        </View>
        <View style={styles.iconWrap}>
          <AppIcon name="location" size={20} color={colors.electricBright} />
        </View>
      </View>
      <View style={styles.ctaRow}>
        <AppIcon name="angle-left" size={14} color={colors.textMuted} />
        <Text style={styles.cta}>
          {hasLocation ? 'تعديل الموقع على الخريطة' : 'فتح الخريطة'}
        </Text>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.bgElevated,
      borderRadius: 14,
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
      gap: spacing.sm,
    },
    pressed: { opacity: 0.92 },
    coverTrail: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
      width: '100%',
    },
    rtlTextShellFlex: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgDeep,
      flexShrink: 0,
    },
    title: {
      ...typography.caption,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    value: {
      ...typography.bodyStrong,
      fontSize: 15,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
      marginTop: 2,
    },
    ctaRow: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 4,
    },
    cta: {
      ...typography.caption,
      color: colors.electricBright,
      fontWeight: '600',
      writingDirection: 'rtl',
    },
  });
}

export default DeliveryMapAddressField;
