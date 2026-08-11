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
import type { EditorialStory } from '@/services/editorialStories';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = Math.min(148, SCREEN_W * 0.38);
const CARD_H = CARD_W * (4 / 3);
const CARD_GAP = 10;
const SIDE_PAD = spacing.lg;

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
          contentContainerStyle={styles.row}
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
                  <Text style={styles.cardTitle} numberOfLines={3}>
                    {story.titleAr}
                  </Text>
                </Pressable>
              ))}
        </ScrollView>

        {stories.length > 1 ? (
          <View style={styles.dots}>
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
    row: {
      paddingHorizontal: SIDE_PAD,
      gap: CARD_GAP,
      paddingBottom: spacing.sm,
    },
    card: {
      width: CARD_W,
      height: CARD_H,
      borderRadius: 18,
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
    cardTitle: {
      ...typography.caption,
      color: '#fff',
      fontWeight: '700',
      textAlign: 'center',
      paddingHorizontal: 10,
      paddingBottom: 12,
      lineHeight: 18,
      writingDirection: 'rtl',
      textShadowColor: 'rgba(0,0,0,0.45)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 3,
      zIndex: 1,
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 6,
      marginTop: 2,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.textMuted,
      opacity: 0.45,
    },
    dotActive: {
      width: 18,
      borderRadius: 4,
      backgroundColor: colors.emerald,
      opacity: 1,
    },
  });
}
