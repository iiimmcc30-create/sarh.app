import { AppIcon } from '@/components/ui/FlaticonIcon';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { motion, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { splitExploreRows, type HomeExploreCard } from '@/lib/homeExplore';
import { getRtlRow } from '@/lib/rtl';
import { safePush } from '@/lib/safeNavigate';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

type Props = {
  sections: HomeExploreCard[];
};

const ROW_GAP = 10;
const SIDE_PAD = spacing.lg;
const STRIP_GAP = 8;
const ICON_BOX = 28;
const ICON_SIZE = 14;

export function ExploreSarhSection({ sections }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const { top, bottom } = splitExploreRows(sections);

  const inner = width - SIDE_PAD * 2;
  const squareW = Math.round((inner - ROW_GAP * 2) / 3);
  const wideW = Math.round((inner - ROW_GAP) / 2);
  const cardH = squareW;

  if (sections.length === 0) return null;

  const open = (item: HomeExploreCard) => {
    safePush(item.route as never, undefined, router);
  };

  return (
    <View style={styles.wrap}>
      <SectionHeader title="استكشف سرح" />
      <View style={styles.strips}>
        <ExploreStrip
          items={top}
          cardW={squareW}
          cardH={cardH}
          styles={styles}
          onPress={open}
        />
        {bottom.length > 0 ? (
          <ExploreStrip
            items={bottom}
            cardW={wideW}
            cardH={cardH}
            styles={styles}
            onPress={open}
          />
        ) : null}
      </View>
    </View>
  );
}

function ExploreStrip({
  items,
  cardW,
  cardH,
  styles,
  onPress,
}: {
  items: HomeExploreCard[];
  cardW: number;
  cardH: number;
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
          height={cardH}
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
  height,
  styles,
  onPress,
}: {
  item: HomeExploreCard;
  width: number;
  height: number;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.titleAr}. ${item.descriptionAr}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width, height },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconRing} pointerEvents="none">
        <AppIcon name={item.icon} size={ICON_SIZE} color={styles.accent.color} />
      </View>
      <View style={styles.titleSlot} pointerEvents="none">
        <RtlTextShell>
          <RtlText style={styles.title} numberOfLines={1}>
            {item.titleAr}
          </RtlText>
        </RtlTextShell>
      </View>
      <View style={styles.descSlot} pointerEvents="none">
        <RtlTextShell>
          <RtlText style={styles.desc} numberOfLines={2}>
            {item.descriptionAr}
          </RtlText>
        </RtlTextShell>
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
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
      backgroundColor: colors.bgElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      overflow: 'hidden',
      direction: 'ltr',
    },
    titleSlot: {
      position: 'absolute',
      left: 8,
      right: 8,
      top: '50%',
      transform: [{ translateY: -9 }],
      alignItems: 'center',
    },
    descSlot: {
      position: 'absolute',
      left: 8,
      right: 8,
      top: '50%',
      marginTop: 12,
      alignItems: 'center',
    },
    title: {
      ...typography.smallHeading,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textPrimary,
      textAlign: 'center',
      width: '100%',
    },
    desc: {
      ...typography.caption,
      fontSize: 11,
      lineHeight: 16,
      color: colors.textMuted,
      textAlign: 'center',
      width: '100%',
    },
    iconRing: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: ICON_BOX,
      height: ICON_BOX,
      borderRadius: ICON_BOX / 2,
      borderWidth: 1,
      borderColor: colors.electric,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    accent: { color: colors.electric },
    pressed: {
      transform: [{ scale: motion.pressScale }],
      opacity: 0.94,
    },
  });
}
