// Powered by OnSpace.AI
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { getRtlRow } from '@/lib/rtl';
import { useThemedStyles } from '@/hooks/useThemedStyles';

export type CategoryKey =
  | 'all'
  | 'camels'
  | 'sheep'
  | 'goats'
  | 'cows'
  | 'horses'
  | 'birds'
  | 'feed'
  | 'equipment';

interface CategoryDef {
  key: CategoryKey;
  label: string;
  arabic: string;
}

const categories: CategoryDef[] = [
  { key: 'all', label: 'All', arabic: 'الكل' },
  { key: 'camels', label: 'Camels', arabic: 'إبل' },
  { key: 'sheep', label: 'Sheep', arabic: 'أغنام' },
  { key: 'goats', label: 'Goats', arabic: 'ماعز' },
  { key: 'cows', label: 'Cows', arabic: 'أبقار' },
  { key: 'horses', label: 'Horses', arabic: 'خيول' },
  { key: 'birds', label: 'Birds', arabic: 'طيور' },
  { key: 'feed', label: 'Feed', arabic: 'علف' },
  { key: 'equipment', label: 'Equipment', arabic: 'معدات' },
];

interface Props {
  value: CategoryKey;
  onChange: (k: CategoryKey) => void;
}

export function CategoryChips({ value, onChange }: Props) {
  const styles = useThemedStyles(({ colors, scheme }) => createStyles(colors, scheme));

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {categories.map((c) => {
          const isSelected = c.key === value;
          return (
            <Pressable
              key={c.key}
              onPress={() => onChange(c.key)}
              style={({ pressed }) => [
                styles.chip,
                isSelected && styles.chipSelected,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={[styles.text, isSelected && styles.textSelected]}>{c.arabic}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors, _scheme: 'light' | 'dark') {
  return StyleSheet.create({
    wrap: {
      paddingVertical: spacing.sm,
    },
    content: {
      ...getRtlRow(),
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    chip: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      height: 36,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
      borderWidth: 0,
    },
    chipSelected: {
      backgroundColor: colors.electric,
    },
    text: {
      ...typography.caption,
      lineHeight: 18,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    textSelected: {
      color: '#fff',
      fontWeight: '600',
    },
  });
}

export default CategoryChips;
