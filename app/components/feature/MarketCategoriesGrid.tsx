import { MENU_CARD } from '@/components/feature/SidebarMenu';
import type { MarketCategory } from '@/services/categories';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlDirection } from '@/lib/rtl';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  categories: MarketCategory[];
  onSelect: (category: MarketCategory) => void;
};

/**
 * Horizontal category chips — same elevated rounded surface as listing cards, text only.
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
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.row, getRtlDirection()]}
      >
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat)}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
          >
            <View style={styles.labelShell}>
              <Text style={styles.label} numberOfLines={1}>
                {cat.nameAr}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
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
    row: {
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
      paddingVertical: 11,
      minHeight: 40,
      justifyContent: 'center',
      borderWidth: 0,
    },
    chipPressed: {
      opacity: 0.92,
    },
    labelShell: {
      direction: 'ltr',
    },
    label: {
      ...typography.bodyStrong,
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '600',
      color: colors.textBrandStrong,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
  });
}

export default MarketCategoriesGrid;
