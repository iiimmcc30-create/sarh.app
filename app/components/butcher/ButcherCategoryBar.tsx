import { CATEGORY_LABELS, type MeatCategory } from '@/services/butcherData';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow, getRtlText } from '@/lib/rtl';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

type ButcherCategoryBarProps = {
  categories: string[];
  active: string;
  onChange: (cat: string) => void;
};

export function ButcherCategoryBar({
  categories,
  active,
  onChange,
}: ButcherCategoryBarProps) {
  const styles = useThemedStyles(({ colors, scheme }) => createStyles(colors, scheme));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {categories.map((cat) => {
        const meta =
          cat === 'all'
            ? { ar: 'الكل', icon: '🥩' }
            : CATEGORY_LABELS[cat as MeatCategory];
        const isActive = active === cat;
        return (
          <Pressable
            key={cat}
            onPress={() => onChange(cat)}
            style={[styles.chip, isActive && styles.chipActive]}
          >
            {cat !== 'all' ? <Text style={styles.icon}>{meta?.icon}</Text> : null}
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {cat === 'all' ? 'الكل' : meta?.ar ?? cat}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  return StyleSheet.create({
    row: {
      ...getRtlRow(),
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    chip: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    chipActive: {
      backgroundColor: colors.electric + '22',
      borderColor: colors.electric,
    },
    icon: { fontSize: 14 },
    label: {
      ...typography.caption,
      ...getRtlText(),
      color: colors.textSecondary,
      fontWeight: '600',
    },
    labelActive: {
      color: scheme === 'dark' ? colors.textPrimary : colors.electricBright,
    },
  });
}
