import type { MarketCategory } from '@/services/categories';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlDirection } from '@/lib/rtl';
import { FilterChip, FilterChipRow } from '@/components/ui/FilterChip';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  categories: MarketCategory[];
  activeParentId: string | null;
  activeSubId: string | null;
  onSelectParent: (category: MarketCategory | null) => void;
  onSelectSub: (sub: MarketCategory | null) => void;
};

/**
 * Two-row category nav matching market reference:
 * green underline tabs + subcategory chips (check / emoji).
 */
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
      <ScrollView
        horizontal
        style={styles.hScroll}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabRow, getRtlDirection()]}
      >
        <Pressable onPress={() => onSelectParent(null)} style={styles.tabHit}>
          <Text style={[styles.tabText, !activeParentId && styles.tabTextActive]}>
            الكل
          </Text>
          {!activeParentId ? <View style={styles.tabUnderline} /> : null}
        </Pressable>
        {categories.map((cat) => {
          const active = activeParentId === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => onSelectParent(cat)}
              style={styles.tabHit}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {cat.nameAr}
              </Text>
              {active ? <View style={styles.tabUnderline} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {activeParent && subs.length > 0 ? (
        <FilterChipRow contentPaddingHorizontal={spacing.md}>
          <FilterChip
            label="الكل"
            selected={!activeSubId}
            selectedCheck
            onPress={() => onSelectSub(null)}
          />
          {subs.map((sub) => (
            <FilterChip
              key={sub.id}
              label={sub.nameAr}
              selected={activeSubId === sub.id}
              leading={
                sub.emoji ? (
                  <Text style={styles.subEmoji}>{sub.emoji}</Text>
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: colors.screenRoot,
      gap: spacing.xs,
      paddingBottom: spacing.xs,
      flexGrow: 0,
      flexShrink: 0,
    },
    hScroll: {
      flexGrow: 0,
      flexShrink: 0,
    },
    tabRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      gap: spacing.lg,
    },
    tabHit: {
      alignItems: 'center',
      paddingBottom: 8,
      gap: 6,
    },
    tabText: {
      ...typography.smallHeading,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textMuted,
      writingDirection: 'rtl',
      includeFontPadding: false,
    },
    tabTextActive: {
      ...typography.emphasis,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.electricBright,
    },
    tabUnderline: {
      height: 3,
      width: '100%',
      minWidth: 24,
      borderRadius: 2,
      backgroundColor: colors.electricBright,
    },
    subEmoji: {
      fontSize: 14,
      lineHeight: 18,
    },
  });
}

export default MarketCategoryNav;
