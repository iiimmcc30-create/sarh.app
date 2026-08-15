import { MENU_CARD } from '@/components/feature/SidebarMenu';
import type { MarketCategory } from '@/services/categories';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlDirection } from '@/lib/rtl';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  categories: MarketCategory[];
  activeParentId: string | null;
  activeSubId: string | null;
  onSelectParent: (category: MarketCategory | null) => void;
  onSelectSub: (sub: MarketCategory | null) => void;
};

/**
 * Haraj-style two-row category nav: text tabs + subcategory chips.
 * Horizontal ScrollViews must stay flexGrow:0 so they never eat vertical space.
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
          <Text style={[styles.tabText, !activeParentId && styles.tabTextActive]}>الكل</Text>
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
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{cat.nameAr}</Text>
              {active ? <View style={styles.tabUnderline} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      {activeParent && subs.length > 0 ? (
        <ScrollView
          horizontal
          style={styles.hScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chipRow, getRtlDirection()]}
        >
          <Pressable
            onPress={() => onSelectSub(null)}
            style={[styles.chip, !activeSubId && styles.chipActive]}
          >
            <Text style={[styles.chipText, !activeSubId && styles.chipTextActive]}>الكل</Text>
          </Pressable>
          {subs.map((sub) => {
            const active = activeSubId === sub.id;
            return (
              <Pressable
                key={sub.id}
                onPress={() => onSelectSub(sub)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                  {sub.nameAr}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
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
    /** Prevent RN Web ScrollView default flexGrow:1 from opening a vertical gap. */
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
      ...typography.body,
      fontSize: 14,
      color: colors.textMuted,
      fontWeight: '500',
      writingDirection: 'rtl',
    },
    tabTextActive: {
      ...typography.emphasis,
      color: colors.textPrimary,
    },
    tabUnderline: {
      height: 3,
      width: '100%',
      minWidth: 24,
      borderRadius: 2,
      backgroundColor: colors.electric,
    },
    chipRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      gap: spacing.sm,
    },
    chip: {
      backgroundColor: colors.bgElevated,
      borderRadius: MENU_CARD.radius,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      minHeight: 38,
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    chipActive: {
      backgroundColor: colors.electric,
      borderColor: colors.electric,
    },
    chipText: {
      ...typography.caption,
      fontSize: 13,
      color: colors.textPrimary,
      writingDirection: 'rtl',
    },
    chipTextActive: {
      color: '#FFFFFF',
    },
  });
}

export default MarketCategoryNav;
