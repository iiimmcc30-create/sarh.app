import { Image, uriSource } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { EditorialStoryViewer } from '@/components/feature/EditorialStoryViewer';
import { AppText } from '@/design-system/components';
import { Screen, ScreenBody } from '@/design-system/layout';
import { functional } from '@/design-system';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { fetchEditorialStories, type EditorialStory } from '@/services/editorialStories';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { type ThemeColors } from '@/constants/theme';

export default function NewsScreen() {
  const styles = useThemedStyles(({ colors: c }) => createStyles(c));
  const [stories, setStories] = useState<EditorialStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setStories(await fetchEditorialStories());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen edges={['top', 'bottom']}>
      <ScreenHeader variant="screen" title="الأخبار" showBack />
      {loading ? (
        <ScreenBody scroll={false}>
          <ActivityIndicator style={styles.loader} />
        </ScreenBody>
      ) : (
        <ScreenBody padTop="lg" padBottom="xxxl" gap="md">
          {stories.length === 0 ? (
            <AppText variant="bodySmall" color="textMuted" align="center">
              لا توجد أخبار حالياً
            </AppText>
          ) : (
            stories.map((story, index) => (
              <Pressable
                key={story.id}
                style={styles.card}
                onPress={() => setViewerIndex(index)}
              >
                <Image source={uriSource(story.imageUrl)} style={styles.image} contentFit="cover" />
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.72)']}
                  style={styles.gradient}
                />
                <AppText
                  variant="heading3"
                  numberOfLines={2}
                  style={[styles.title, { color: functional.onPrimary }]}
                >
                  {story.titleAr}
                </AppText>
              </Pressable>
            ))
          )}
        </ScreenBody>
      )}
      {viewerIndex != null ? (
        <EditorialStoryViewer
          stories={stories}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    loader: { marginTop: 48 },
    card: {
      height: 168,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: colors.bgElevated,
      justifyContent: 'flex-end',
    },
    image: { ...StyleSheet.absoluteFillObject },
    gradient: { ...StyleSheet.absoluteFillObject },
    title: {
      padding: 12,
      zIndex: 1,
    },
  });
}
