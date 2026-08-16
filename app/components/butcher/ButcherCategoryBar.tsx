import { CATEGORY_LABELS, type MeatCategory } from '@/services/butcherData';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

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
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const scroller = useRef<ScrollView>(null);

  return (
    <ScrollView
      ref={scroller}
      horizontal
      showsHorizontalScrollIndicator={false}
      onContentSizeChange={() => scroller.current?.scrollToEnd({ animated: false })}
      contentContainerStyle={styles.row}
    >
      {[...categories].reverse().map((cat) => {
        const meta =
          cat === 'all'
            ? { ar: 'الكل' }
            : CATEGORY_LABELS[cat as MeatCategory];
        const isActive = active === cat;
        return (
          <Pressable key={cat} onPress={() => onChange(cat)} style={styles.tabBtn}>
            <View style={styles.tabCoverTrail}>
              <View style={styles.tabTextShell}>
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {cat === 'all' ? 'الكل' : meta?.ar ?? cat}
                </Text>
              </View>
            </View>
            <View style={[styles.tabUnderline, isActive && styles.tabUnderlineActive]} />
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.sm,
      gap: spacing.lg,
    },
    tabBtn: {
      alignItems: 'stretch',
      paddingBottom: 2,
    },
    tabCoverTrail: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
    },
    tabTextShell: {
      direction: 'ltr',
    },
    tabLabel: {
      ...typography.smallHeading,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    tabLabelActive: {
      color: colors.electricBright,
    },
    tabUnderline: {
      marginTop: 6,
      height: 3,
      width: '100%',
      borderRadius: 2,
      backgroundColor: 'transparent',
    },
    tabUnderlineActive: {
      backgroundColor: colors.electric,
    },
  });
}
