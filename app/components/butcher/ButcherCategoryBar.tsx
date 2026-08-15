import { CATEGORY_LABELS, type MeatCategory } from '@/services/butcherData';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
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

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {[...categories].reverse().map((cat) => {
        const meta =
          cat === 'all'
            ? { ar: 'الكل' }
            : CATEGORY_LABELS[cat as MeatCategory];
        const isActive = active === cat;
        return (
          <Pressable key={cat} onPress={() => onChange(cat)} style={styles.item}>
            <View style={styles.coverTrail}>
              <View style={styles.rtlTextShell}>
                <Text style={[styles.label, isActive && styles.labelActive]}>
                  {cat === 'all' ? 'الكل' : meta?.ar ?? cat}
                </Text>
              </View>
            </View>
            <View style={[styles.underline, isActive && styles.underlineActive]} />
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
      paddingTop: spacing.sm,
      gap: spacing.lg,
    },
    item: {
      alignItems: 'stretch',
      paddingBottom: 2,
    },
    coverTrail: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
    },
    rtlTextShell: {
      width: '100%',
      direction: 'ltr',
    },
    label: {
      ...typography.bodyStrong,
      fontSize: 14,
      fontWeight: '600',
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    labelActive: {
      color: colors.electricBright,
    },
    underline: {
      marginTop: 6,
      height: 3,
      width: '100%',
      borderRadius: 2,
      backgroundColor: 'transparent',
    },
    underlineActive: {
      backgroundColor: colors.electric,
    },
  });
}
