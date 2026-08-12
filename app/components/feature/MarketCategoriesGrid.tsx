import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ds } from '@/constants/designSystem';
import type { MarketCategory } from '@/services/categories';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlDirection } from '@/lib/rtl';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

type Props = {
  categories: MarketCategory[];
  onSelect: (category: MarketCategory) => void;
};

const TILE = ds.categoryTile;

/**
 * Compact horizontal main-category strip for the market hub — RTL scroll, small tiles.
 */
export function MarketCategoriesGrid({ categories, onSelect }: Props) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
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
            style={({ pressed }) => [styles.tile, pressed && styles.tilePressed]}
          >
            <View style={styles.iconBox}>
              {cat.icon ? (
                <AppIcon name={cat.icon} size={18} color={colors.textPrimary} variant="rr" />
              ) : (
                <Text style={styles.emoji}>{cat.emoji || '📦'}</Text>
              )}
            </View>
            <View style={styles.labelShell}>
              <Text style={styles.label} numberOfLines={2}>
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
      paddingHorizontal: spacing.lg,
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
      alignItems: 'flex-start',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
      gap: spacing.sm,
    },
    tile: {
      width: TILE,
      alignItems: 'center',
      gap: 4,
    },
    tilePressed: {
      opacity: 0.88,
      transform: [{ scale: 0.97 }],
    },
    iconBox: {
      width: TILE,
      height: TILE,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgElevated,
    },
    emoji: {
      fontSize: 20,
      lineHeight: 24,
    },
    labelShell: {
      width: '100%',
      direction: 'ltr',
    },
    label: {
      ...typography.micro,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '600',
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
  });
}

export default MarketCategoriesGrid;
