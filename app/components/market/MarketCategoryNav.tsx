import type { MarketCategory } from '@/services/categories';
import { resolveCategoryChipDisplay } from '@/lib/marketCategoriesFallback';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { FilterChip, FilterChipRow } from '@/components/ui/FilterChip';
import { MARKET_CHIP } from '@/components/ui/filterChipTokens';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  categories: MarketCategory[];
  activeParentId: string | null;
  activeSubId: string | null;
  onSelectParent: (category: MarketCategory | null) => void;
  onSelectSub: (sub: MarketCategory | null) => void;
};

function CategoryChipLeading({
  category,
  selected,
  colors,
  emojiStyle,
}: {
  category: Pick<MarketCategory, 'slug' | 'emoji' | 'icon'>;
  selected: boolean;
  colors: ThemeColors;
  emojiStyle: { fontSize: number; lineHeight: number };
}) {
  const { emoji, icon } = resolveCategoryChipDisplay(category);
  const tint = selected ? '#FFFFFF' : colors.textSecondary;

  if (emoji) {
    return <Text style={emojiStyle}>{emoji}</Text>;
  }

  if (icon) {
    return <AppIcon name={icon} size={MARKET_CHIP.iconSize} color={tint} />;
  }

  return null;
}

/** Two-row market category nav — parent and sub chips share the same compact card style. */
export function MarketCategoryNav({
  categories,
  activeParentId,
  activeSubId,
  onSelectParent,
  onSelectSub,
}: Props) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  const activeParent = categories.find((c) => c.id === activeParentId) ?? null;
  const subs = activeParent?.children?.filter((c) => c.isActive) ?? [];

  return (
    <View style={styles.wrap}>
      <FilterChipRow contentPaddingHorizontal={spacing.md}>
        <FilterChip
          label="الكل"
          compact
          icon="apps"
          selected={!activeParentId}
          selectedCheck
          onPress={() => onSelectParent(null)}
        />
        {categories.map((cat) => {
          const selected = activeParentId === cat.id;
          return (
            <FilterChip
              key={cat.id}
              label={cat.nameAr}
              compact
              selected={selected}
              leading={
                <CategoryChipLeading
                  category={cat}
                  selected={selected}
                  colors={colors}
                  emojiStyle={styles.chipEmoji}
                />
              }
              onPress={() => onSelectParent(cat)}
            />
          );
        })}
      </FilterChipRow>

      {activeParent && subs.length > 0 ? (
        <FilterChipRow contentPaddingHorizontal={spacing.md}>
          <FilterChip
            label="الكل"
            compact
            icon="apps"
            selected={!activeSubId}
            selectedCheck
            onPress={() => onSelectSub(null)}
          />
          {subs.map((sub) => {
            const selected = activeSubId === sub.id;
            return (
              <FilterChip
                key={sub.id}
                label={sub.nameAr}
                compact
                selected={selected}
                leading={
                  <CategoryChipLeading
                    category={sub}
                    selected={selected}
                    colors={colors}
                    emojiStyle={styles.chipEmoji}
                  />
                }
                onPress={() => onSelectSub(sub)}
              />
            );
          })}
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
