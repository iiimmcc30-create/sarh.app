import type { MarketCategory } from '@/services/categories';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { FilterChip, FilterChipRow } from '@/components/ui/FilterChip';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  categories: MarketCategory[];
  onSelect: (category: MarketCategory) => void;
};

/**
 * Horizontal category chips — unified FilterChip, text only.
 */
export function MarketCategoriesGrid({ categories, onSelect }: Props) {
  const { styles } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.titleShell}>
        <Text style={styles.title}>التصنيفات</Text>
      </View>
      <FilterChipRow contentPaddingHorizontal={spacing.md}>
        {categories.map((cat) => (
          <FilterChip key={cat.id} label={cat.nameAr} onPress={() => onSelect(cat)} />
        ))}
      </FilterChipRow>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
      gap: spacing.xs,
    },
    titleShell: {
      width: '100%',
      direction: 'ltr',
      paddingHorizontal: spacing.md,
    },
    title: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textSecondary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
  });
}

export default MarketCategoriesGrid;
