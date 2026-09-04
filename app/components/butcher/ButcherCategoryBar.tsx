import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type ButcherStoreNavItem = {
  /** Stable key — category slug, or "offers" / "about" / "stories". */
  id: string;
  label: string;
  /** Product categories vs store sections (about is never a product category). */
  kind: 'category' | 'offers' | 'about' | 'stories';
};

type ButcherStoreNavBarProps = {
  items: ButcherStoreNavItem[];
  activeId: string;
  onChange: (item: ButcherStoreNavItem) => void;
};

/**
 * Single unified horizontal bar for the butcher store:
 * dynamic product categories + offers + about (+ stories when present).
 */
export function ButcherStoreNavBar({
  items,
  activeId,
  onChange,
}: ButcherStoreNavBarProps) {
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const scroller = useRef<ScrollView>(null);

  if (!items.length) return null;

  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() =>
        scroller.current?.scrollToEnd({ animated: false })
      }
      contentContainerStyle={styles.row}
    >
      {[...items].reverse().map((item) => {
        const isActive = activeId === item.id;
        return (
          <Pressable
            key={`${item.kind}:${item.id}`}
            onPress={() => onChange(item)}
            style={styles.tabBtn}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <View style={styles.tabCoverTrail}>
              <View style={styles.tabTextShell}>
                <Text
                  style={[styles.tabLabel, isActive && styles.tabLabelActive]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </View>
            </View>
            <View
              style={[styles.tabUnderline, isActive && styles.tabUnderlineActive]}
            />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** @deprecated Prefer ButcherStoreNavBar — kept for any residual imports. */
export function ButcherCategoryBar({
  categories,
  active,
  onChange,
}: {
  categories: string[];
  active: string;
  onChange: (cat: string) => void;
}) {
  const items: ButcherStoreNavItem[] = categories.map((id) => ({
    id,
    label: id === 'all' ? 'الكل' : id,
    kind: 'category',
  }));
  return (
    <ButcherStoreNavBar
      items={items}
      activeId={active}
      onChange={(item) => onChange(item.id)}
    />
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
            justifyContent: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.lg,
    },
    tabBtn: {
      alignItems: 'stretch',
      paddingBottom: 2,
      maxWidth: 140,
    },
    tabCoverTrail: {
      flexDirection: 'row',
            justifyContent: 'flex-end',
    },
    tabTextShell: {
          },
    tabLabel: {
      ...typography.smallHeading,
      color: colors.textMuted,
            writingDirection: 'rtl',
    },
    tabLabelActive: {
      color: colors.textPrimary,
    },
    tabUnderline: {
      marginTop: 6,
      height: 3,
      width: '100%',
      borderRadius: 2,
      backgroundColor: 'transparent',
    },
    tabUnderlineActive: {
      backgroundColor: colors.textPrimary,
    },
  });
}
