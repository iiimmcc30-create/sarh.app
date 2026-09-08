import { AppText } from '@/design-system/components';
import { colors, radius, space } from '@/design-system';
import { getRtlRow } from '@/lib/rtl';
import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

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
      contentContainerStyle={[styles.row, getRtlRow()]}
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
            <AppText
              variant="label"
              color={isActive ? 'primary' : 'textMuted'}
              numberOfLines={1}
            >
              {item.label}
            </AppText>
            <View style={[styles.tabUnderline, isActive && styles.tabUnderlineActive]} />
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

const styles = StyleSheet.create({
  row: {
    justifyContent: 'flex-end',
    paddingHorizontal: space[16],
    paddingTop: space[12],
    paddingBottom: space[8],
    gap: space[16],
  },
  tabBtn: {
    alignItems: 'center',
    paddingBottom: space[4],
    maxWidth: 140,
    minHeight: space[32],
  },
  tabUnderline: {
    marginTop: space[4],
    height: 2,
    width: '100%',
    borderRadius: radius[8],
    backgroundColor: 'transparent',
  },
  tabUnderlineActive: {
    backgroundColor: colors.primary,
  },
});
