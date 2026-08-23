import { SarhLogoMark } from '@/components/ui/SarhLogoMark';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { ds } from '@/constants/designSystem';
import { motion, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  partitionExploreSections,
  usesExploreSarhLogoMark,
  type HomeExploreCard,
} from '@/lib/homeExplore';
import { safePush } from '@/lib/safeNavigate';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

type Props = {
  sections: HomeExploreCard[];
};

const GRID_GAP = 10;
const SIDE_PAD = spacing.lg;
const ICON_BOX = 32;
const ICON_SIZE = 16;
const GRID_CARD_H = 112;
const FEATURED_CARD_H = 124;
const CARD_RADIUS = ds.radius.sm;

export function ExploreSarhSection({ sections }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const { grid, featured } = partitionExploreSections(sections);

  const inner = width - SIDE_PAD * 2;
  const cellW = Math.floor((inner - GRID_GAP) / 2);

  if (sections.length === 0) return null;

  const open = (item: HomeExploreCard) => {
    safePush(item.route as never, undefined, router);
  };

  const rowPairs: HomeExploreCard[][] = [];
  for (let i = 0; i < grid.length; i += 2) {
    rowPairs.push(grid.slice(i, i + 2));
  }

  return (
    <View style={styles.wrap}>
      <SectionHeader title="استكشف سرح" />
      <View style={styles.gridWrap}>
        {rowPairs.map((pair, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.gridRow}>
            {pair.map((item) => (
              <ExploreTile
                key={item.id ?? item.destination}
                item={item}
                width={cellW}
                height={GRID_CARD_H}
                styles={styles}
                onPress={() => open(item)}
              />
            ))}
            {pair.length === 1 ? <View style={{ width: cellW }} /> : null}
          </View>
        ))}
        {featured ? (
          <ExploreTile
            item={featured}
            width={inner}
            height={FEATURED_CARD_H}
            styles={styles}
            featured
            onPress={() => open(featured)}
          />
        ) : null}
      </View>
    </View>
  );
}

function ExploreTile({
  item,
  width,
  height,
  styles,
  featured = false,
  onPress,
}: {
  item: HomeExploreCard;
  width: number;
  height: number;
  styles: ReturnType<typeof createStyles>;
  featured?: boolean;
  onPress: () => void;
}) {
  const useSarhMark = usesExploreSarhLogoMark(item.destination);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.titleAr}. ${item.descriptionAr}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width, height },
        featured && styles.featuredCard,
        pressed && styles.pressed,
      ]}
    >
      {featured ? (
        <View style={styles.featuredLeaf} pointerEvents="none">
          <SarhLogoMark size={88} color={styles.leafTint.color} />
        </View>
      ) : null}
      <View style={styles.cardInner} pointerEvents="none">
        <View style={styles.iconRing}>
          {useSarhMark ? (
            <SarhLogoMark size={ICON_SIZE} color={styles.accent.color} />
          ) : null}
        </View>
        <Text
          style={[styles.title, featured && styles.featuredTitle]}
          numberOfLines={featured ? 2 : 1}
        >
          {item.titleAr}
        </Text>
        <Text style={styles.desc} numberOfLines={featured ? 2 : 2}>
          {item.descriptionAr}
        </Text>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingBottom: spacing.sm,
    },
    gridWrap: {
      paddingHorizontal: SIDE_PAD,
      gap: GRID_GAP,
    },
    gridRow: {
      flexDirection: 'row',
      gap: GRID_GAP,
    },
    card: {
      borderRadius: CARD_RADIUS,
      backgroundColor: colors.bgSurface,
      borderWidth: 0,
      overflow: 'hidden',
    },
    featuredCard: {
      alignSelf: 'center',
    },
    featuredLeaf: {
      position: 'absolute',
      left: -8,
      bottom: -12,
      opacity: 0.1,
    },
    leafTint: { color: colors.electric },
    cardInner: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      paddingTop: 12,
      paddingBottom: 10,
      gap: 4,
    },
    title: {
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary,
      textAlign: 'center',
      writingDirection: 'rtl',
      width: '100%',
    },
    featuredTitle: {
      fontSize: 14,
      lineHeight: 20,
    },
    desc: {
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
      fontSize: 11,
      lineHeight: 16,
      color: colors.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
      width: '100%',
    },
    iconRing: {
      width: ICON_BOX,
      height: ICON_BOX,
      borderRadius: ICON_BOX / 2,
      borderWidth: 1,
      borderColor: colors.electric,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 2,
    },
    accent: { color: colors.electric },
    pressed: {
      transform: [{ scale: motion.pressScale }],
      opacity: 0.94,
    },
  });
}
