import { useCallback, useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image, uriSource } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { EditorialStoryViewer } from '@/components/feature/EditorialStoryViewer';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import type { EditorialStory } from '@/services/editorialStories';

const SCREEN_W = Dimensions.get('window').width;
const CARD_GAP = 12;
const SIDE_PAD = spacing.lg;
/** ~3.4 cards visible — close to the reference, slightly under the original 3.5. */
const VISIBLE_CARDS = 3.4;
const CARD_W = Math.round(
  (SCREEN_W - SIDE_PAD - CARD_GAP * 3) / VISIBLE_CARDS,
);
const CARD_H = Math.round(CARD_W * (4 / 3));
const DOT_SIZE = 6;
const DOT_ACTIVE_W = 22;

type Props = {
  stories: EditorialStory[];
  loading?: boolean;
};

export function EditorialStoriesBar({ stories, loading }: Props) {
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [activeDot, setActiveDot] = useState(0);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const step = CARD_W + CARD_GAP;
      const idx = Math.round(x / step);
      setActiveDot(Math.max(0, Math.min(stories.length - 1, idx)));
    },
    [stories.length],
  );

  if (!loading && stories.length === 0) {
    return null;
  }

  return (
    <>
      <View style={styles.wrap}>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroller}
          contentContainerStyle={[styles.row, getRtlRow()]}
          onScroll={onScroll}
          scrollEventThrottle={16}
          decelerationRate="fast"
          snapToInterval={CARD_W + CARD_GAP}
          snapToAlignment="start"
        >
          {loading && stories.length === 0
            ? [0, 1, 2].map((i) => (
                <View key={`sk-${i}`} style={[styles.card, styles.skeleton]} />
              ))
            : stories.map((story, index) => (
                <Pressable
                  key={story.id}
                  style={styles.card}
                  onPress={() => setViewerIndex(index)}
                >
                  <Image
                    source={uriSource(story.imageUrl)}
                    style={StyleSheet.absoluteFillObject}
                    contentFit="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.75)']}
                    locations={[0.35, 1]}
                    style={styles.gradient}
                  />
                  <View style={styles.cardTitleShell}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {story.titleAr}
                    </Text>
                  </View>
                </Pressable>
              ))}
        </ScrollView>

        {stories.length > 1 ? (
          <View style={[styles.dots, getRtlRow()]}>
            {stories.map((story, i) => (
              <View
                key={story.id}
                style={[styles.dot, i === activeDot && styles.dotActive]}
              />
            ))}
          </View>
        ) : null}
      </View>

      {viewerIndex != null ? (
        <EditorialStoryViewer
          stories={stories}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingTop: spacing.xs,
      paddingBottom: spacing.md,
    },
    scroller: {
      flexGrow: 0,
    },
    row: {
      paddingHorizontal: SIDE_PAD,
      gap: CARD_GAP,
      paddingBottom: spacing.sm,
    },
    card: {
      width: CARD_W,
      height: CARD_H,
      borderRadius: 16,
      overflow: 'hidden',
      backgroundColor: colors.bgElevated,
      justifyContent: 'flex-end',
    },
    skeleton: {
      backgroundColor: colors.borderSoft,
      opacity: 0.45,
    },
    gradient: {
      ...StyleSheet.absoluteFillObject,
    },
    cardTitleShell: {
      width: '100%',
            paddingHorizontal: 10,
      paddingBottom: 10,
      zIndex: 1,
    },
    cardTitle: {
      ...typography.cardHeading,
      color: '#fff',
      width: '100%',
            writingDirection: 'rtl',
      textShadowColor: 'rgba(0,0,0,0.45)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
    },
    dots: {
      justifyContent: 'center',
      alignItems: 'center',
      gap: 7,
      marginTop: spacing.sm,
    },
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      backgroundColor: '#FFFFFF',
    },
    dotActive: {
      width: DOT_ACTIVE_W,
      height: DOT_SIZE,
      borderRadius: DOT_SIZE / 2,
      backgroundColor: colors.emerald,
    },
  });
}
