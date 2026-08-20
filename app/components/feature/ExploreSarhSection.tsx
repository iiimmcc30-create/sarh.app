import { AppIcon } from '@/components/ui/FlaticonIcon';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { SarhLogoMark } from '@/components/ui/SarhLogoMark';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { appFont } from '@/constants/fonts';
import { motion, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import {
  splitExploreRows,
  usesExploreSarhLogoMark,
  type HomeExploreCard,
} from '@/lib/homeExplore';
import { getRtlRow } from '@/lib/rtl';
import { safePush } from '@/lib/safeNavigate';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

type Props = {
  sections: HomeExploreCard[];
};

const ROW_GAP = 10;
const SIDE_PAD = spacing.lg;
const STRIP_GAP = 8;
const ICON_BOX = 28;
const ICON_SIZE = 14;
const CARD_H = 111;
/** Fewer visible tiles than 3-up so cards stay wider than square on every width. */
const TOP_VISIBLE = 2.4;
const BOTTOM_VISIBLE = 1.9;
const TITLE_LINE = 22;

export function ExploreSarhSection({ sections }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(({ colors, scheme }) => createStyles(colors, scheme));
  const { top, bottom } = splitExploreRows(sections);

  const inner = width - SIDE_PAD * 2;
  const topW = Math.round((inner - ROW_GAP * 2) / TOP_VISIBLE);
  const bottomW = Math.round((inner - ROW_GAP) / BOTTOM_VISIBLE);

  if (sections.length === 0) return null;

  const open = (item: HomeExploreCard) => {
    safePush(item.route as never, undefined, router);
  };

  return (
    <View style={styles.wrap}>
      <SectionHeader title="استكشف سرح" />
      <View style={styles.strips}>
        <ExploreStrip items={top} cardW={topW} styles={styles} onPress={open} />
        {bottom.length > 0 ? (
          <ExploreStrip items={bottom} cardW={bottomW} styles={styles} onPress={open} />
        ) : null}
      </View>
    </View>
  );
}

function ExploreStrip({
  items,
  cardW,
  styles,
  onPress,
}: {
  items: HomeExploreCard[];
  cardW: number;
  styles: ReturnType<typeof createStyles>;
  onPress: (item: HomeExploreCard) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={[styles.row, getRtlRow()]}
      decelerationRate="fast"
      snapToInterval={cardW + ROW_GAP}
      snapToAlignment="start"
    >
      {items.map((item) => (
        <ExploreTile
          key={item.id ?? item.destination}
          item={item}
          width={cardW}
          styles={styles}
          onPress={() => onPress(item)}
        />
      ))}
    </ScrollView>
  );
}

function ExploreTile({
  item,
  width,
  styles,
  onPress,
}: {
  item: HomeExploreCard;
  width: number;
  styles: ReturnType<typeof createStyles>;
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
        { width, height: CARD_H },
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[styles.iconRing, useSarhMark ? styles.iconRingTopCenter : styles.iconRingCorner]}
        pointerEvents="none"
      >
        {useSarhMark ? (
          <SarhLogoMark size={ICON_SIZE} color={styles.accent.color} />
        ) : (
          <AppIcon name={item.icon} size={ICON_SIZE} color={styles.accent.color} />
        )}
      </View>
      <View style={styles.titleSlot} pointerEvents="none">
        <RtlTextShell>
          <Text style={styles.title} numberOfLines={1}>
            {item.titleAr}
          </Text>
        </RtlTextShell>
      </View>
      <View style={styles.descSlot} pointerEvents="none">
        <RtlTextShell>
          <Text style={styles.desc} numberOfLines={2}>
            {item.descriptionAr}
          </Text>
        </RtlTextShell>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  return StyleSheet.create({
    wrap: {
      paddingBottom: spacing.sm,
    },
    strips: {
      gap: STRIP_GAP,
    },
    scroller: {
      flexGrow: 0,
    },
    row: {
      paddingHorizontal: SIDE_PAD,
      gap: ROW_GAP,
    },
    card: {
      borderRadius: 16,
      backgroundColor: scheme === 'dark' ? '#173445' : colors.bgElevated,
      borderWidth: 1,
      borderColor: scheme === 'dark' ? '#2C5164' : colors.borderMid,
      overflow: 'hidden',
      direction: 'ltr',
    },
    titleSlot: {
      position: 'absolute',
      left: 8,
      right: 8,
      top: '50%',
      transform: [{ translateY: -(TITLE_LINE / 2) }],
      alignItems: 'center',
    },
    descSlot: {
      position: 'absolute',
      left: 8,
      right: 8,
      top: '50%',
      marginTop: TITLE_LINE / 2 + 3,
      alignItems: 'center',
    },
    title: {
      fontFamily: appFont.medium,
      fontWeight: '500',
      fontSize: 16,
      lineHeight: TITLE_LINE,
      color: colors.textPrimary,
      textAlign: 'center',
      writingDirection: 'rtl',
      width: '100%',
    },
    desc: {
      fontFamily: appFont.regular,
      fontWeight: '400',
      fontSize: 12,
      lineHeight: 18,
      color: colors.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
      width: '100%',
    },
    iconRing: {
      position: 'absolute',
      top: 10,
      width: ICON_BOX,
      height: ICON_BOX,
      borderRadius: ICON_BOX / 2,
      borderWidth: 1,
      borderColor: colors.electric,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    iconRingCorner: {
      right: 10,
    },
    iconRingTopCenter: {
      left: '50%',
      transform: [{ translateX: -(ICON_BOX / 2) }],
    },
    accent: { color: colors.electric },
    pressed: {
      transform: [{ scale: motion.pressScale }],
      opacity: 0.94,
    },
  });
}
