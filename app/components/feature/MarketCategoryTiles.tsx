import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ambientShadow, ds } from '@/constants/designSystem';
import { sarh } from '@/constants/sarhTokens';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow, getRtlDirection } from '@/lib/rtl';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

export type MarketCategoryId =
  | 'all'
  | 'camels'
  | 'sheep'
  | 'goats'
  | 'cows'
  | 'horses'
  | 'birds'
  | 'feed'
  | 'equipment';

type CategoryDef = {
  id: MarketCategoryId;
  ar: string;
  icon?: string;
  emoji?: string;
};

const CATEGORIES: CategoryDef[] = [
  { id: 'all', ar: 'الكل', icon: 'apps' },
  { id: 'camels', ar: 'إبل', emoji: '🐪' },
  { id: 'sheep', ar: 'أغنام', emoji: '🐑' },
  { id: 'goats', ar: 'ماعز', emoji: '🐐' },
  { id: 'horses', ar: 'خيول', emoji: '🐎' },
  { id: 'cows', ar: 'أبقار', emoji: '🐄' },
];

type Props = {
  value: string;
  onChange: (id: string) => void;
};

export function MarketCategoryTiles({ value, onChange }: Props) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors, theme.scheme),
    colors: theme.colors,
  }));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.row, getRtlDirection()]}
    >
      {CATEGORIES.map((cat) => {
        const active = value === cat.id;
        return (
          <Pressable
            key={cat.id}
            onPress={() => onChange(cat.id)}
            style={({ pressed }) => [styles.tile, pressed && { opacity: 0.88 }]}
          >
            <View style={[styles.iconBox, active && styles.iconBoxActive]}>
              {cat.icon ? (
                <AppIcon
                  name={cat.icon}
                  size={ds.icon.sm}
                  color={active ? sarh.color.action : colors.textMuted}
                  variant={active ? 'sr' : 'rr'}
                />
              ) : (
                <Text style={styles.emoji}>{cat.emoji}</Text>
              )}
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>{cat.ar}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const tokens = scheme === 'light' ? ds.light : ds.dark;
  const isDark = scheme === 'dark';
  const tile = ds.categoryTile;
  return StyleSheet.create({
    row: {
      ...getRtlRow(),
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    tile: {
      alignItems: 'center',
      gap: 4,
      width: tile + 4,
    },
    iconBox: {
      width: tile,
      height: tile,
      borderRadius: ds.radius.md,
      backgroundColor: isDark ? sarh.color.surface : colors.bgSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? sarh.color.border : tokens.stroke,
      ...ambientShadow(scheme, 'soft'),
    },
    iconBoxActive: {
      borderColor: sarh.color.action,
      borderWidth: 1.5,
      backgroundColor: isDark ? sarh.color.actionMuted : tokens.primaryMuted,
    },
    emoji: {
      fontSize: 20,
    },
    label: {
      ...typography.micro,
      fontSize: 11,
      color: colors.textMuted,
      fontWeight: '500',
      writingDirection: 'rtl',
      textAlign: 'center',
    },
    labelActive: {
      color: colors.textPrimary,
      fontWeight: '700',
    },
  });
}

export default MarketCategoryTiles;
