import { AppIcon } from '@/components/ui/FlaticonIcon';
import { menuCardStyle } from '@/components/feature/SidebarMenu';
import type { MarketCategory } from '@/services/categories';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Props = {
  categories: MarketCategory[];
  onSelect: (category: MarketCategory) => void;
};

/**
 * Compact main-category grid for the market hub — elevated cards, RTL labels.
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
      <View style={styles.grid}>
        {categories.map((cat) => (
          <Pressable
            key={cat.id}
            onPress={() => onSelect(cat)}
            style={({ pressed }) => [
              styles.card,
              menuCardStyle(colors),
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.iconWrap}>
              {cat.icon ? (
                <AppIcon name={cat.icon} size={22} color={colors.textPrimary} />
              ) : (
                <Text style={styles.emoji}>{cat.emoji || '📦'}</Text>
              )}
            </View>
            <View style={styles.labelShell}>
              <Text style={styles.label} numberOfLines={1}>
                {cat.emoji ? `${cat.emoji} ` : ''}
                {cat.nameAr}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    titleShell: {
      width: '100%',
      direction: 'ltr',
    },
    title: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    card: {
      width: '48%',
      flexGrow: 1,
      flexBasis: '46%',
      minWidth: 140,
      maxWidth: '48%',
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.sm,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    cardPressed: {
      opacity: 0.88,
      transform: [{ scale: 0.99 }],
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgDeep,
    },
    emoji: {
      fontSize: 18,
    },
    labelShell: {
      flex: 1,
      direction: 'ltr',
      minWidth: 0,
    },
    label: {
      ...typography.caption,
      fontWeight: '600',
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
  });
}

export default MarketCategoriesGrid;
