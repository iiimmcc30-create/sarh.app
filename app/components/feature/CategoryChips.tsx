// Powered by OnSpace.AI
import { View, StyleSheet } from 'react-native';
import { spacing } from '@/constants/theme';
import { FilterChip, FilterChipRow } from '@/components/ui/FilterChip';

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
  return (
    <View style={styles.wrap}>
      <FilterChipRow contentPaddingHorizontal={spacing.lg}>
        {categories.map((c) => (
          <FilterChip
            key={c.key}
            label={c.arabic}
            selected={c.key === value}
            onPress={() => onChange(c.key)}
          />
        ))}
      </FilterChipRow>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.sm,
  },
});

export default CategoryChips;
