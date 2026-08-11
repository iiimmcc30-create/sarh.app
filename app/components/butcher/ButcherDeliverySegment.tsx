import { AppIcon } from '@/components/ui/FlaticonIcon';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow, getRtlText } from '@/lib/rtl';
import type { DeliveryType } from '@/services/butcherData';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type ButcherDeliverySegmentProps = {
  value: DeliveryType;
  onChange: (type: DeliveryType) => void;
};

export function ButcherDeliverySegment({ value, onChange }: ButcherDeliverySegmentProps) {
  const { styles, colors } = useThemedStyles(({ colors }) => ({
    styles: createStyles(colors),
    colors,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.segment}>
        {(['delivery', 'pickup'] as const).map((type) => {
          const active = value === type;
          return (
            <Pressable
              key={type}
              onPress={() => onChange(type)}
              style={[styles.option, active && styles.optionActive]}
            >
              <AppIcon
                name={type === 'delivery' ? 'bicycle-outline' : 'bag-handle-outline'}
                size={16}
                color={active ? '#fff' : colors.textMuted}
              />
              <Text style={[styles.optionText, active && styles.optionTextActive]}>
                {type === 'delivery' ? 'توصيل' : 'استلام'}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.hint}>
        {value === 'delivery'
          ? 'أدخل عنوان التوصيل عند الدفع من السلة.'
          : 'استلام من موقع الملحمة.'}
      </Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      gap: spacing.xs,
    },
    segment: {
      ...getRtlRow(),
      backgroundColor: colors.bgSurface,
      borderRadius: radius.pill,
      padding: 4,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    option: {
      flex: 1,
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: radius.pill,
    },
    optionActive: {
      backgroundColor: colors.electric,
    },
    optionText: {
      ...typography.bodyStrong,
      ...getRtlText(),
      color: colors.textSecondary,
      fontSize: 14,
    },
    optionTextActive: {
      color: '#fff',
    },
    hint: {
      ...typography.caption,
      ...getRtlText(),
      color: colors.textMuted,
      paddingHorizontal: spacing.xs,
    },
  });
}
