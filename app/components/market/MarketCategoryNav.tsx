import type { MarketCategory } from '@/services/categories';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { FilterChip, FilterChipRow } from '@/components/ui/FilterChip';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  categories: MarketCategory[];
  activeParentId: string | null;
  activeSubId: string | null;
  onSelectParent: (category: MarketCategory | null) => void;
  onSelectSub: (sub: MarketCategory | null) => void;
};

/** Two-row market category nav — parent and sub chips share the same compact card style. */
export function MarketCategoryNav({
  categories,
  activeParentId,
  activeSubId,
  onSelectParent,
  onSelectSub,
}: Props) {
  const { styles } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
  }));

  const activeParent = categories.find((c) => c.id === activeParentId) ?? null;
  const subs = activeParent?.children?.filter((c) => c.isActive) ?? [];

  return (
    <View style={styles.wrap}>
      <FilterChipRow contentPaddingHorizontal={spacing.md}>
        <FilterChip
          label="الكل"
          compact
          selected={!activeParentId}
          selectedCheck
          onPress={() => onSelectParent(null)}
        />
        {categories.map((cat) => (
          <FilterChip
            key={cat.id}
            label={cat.nameAr}
            compact
            selected={activeParentId === cat.id}
            leading={
              cat.emoji ? (
                <Text style={styles.chipEmoji}>{cat.emoji}</Text>
              ) : undefined
            }
            onPress={() => onSelectParent(cat)}
          />
        ))}
      </FilterChipRow>

      {activeParent && subs.length > 0 ? (
        <FilterChipRow contentPaddingHorizontal={spacing.md}>
          <FilterChip
            label="الكل"
            compact
            selected={!activeSubId}
            selectedCheck
            onPress={() => onSelectSub(null)}
          />
          {subs.map((sub) => (
            <FilterChip
              key={sub.id}
              label={sub.nameAr}
              compact
              selected={activeSubId === sub.id}
              leading={
                sub.emoji ? (
                  <Text style={styles.chipEmoji}>{sub.emoji}</Text>
                ) : undefined
              }
              onPress={() => onSelectSub(sub)}
            />
          ))}
        </FilterChipRow>
      ) : null}
    </View>
  );
}

function createStyles(_colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      gap: spacing.xs,
      paddingBottom: spacing.xs,
      flexGrow: 0,
      flexShrink: 0,
    },
    chipEmoji: {
      fontSize: 12,
      lineHeight: 16,
    },
  });
}

export default MarketCategoryNav;
