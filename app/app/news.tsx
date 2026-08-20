import { Image, uriSource } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { EditorialStoryViewer } from '@/components/feature/EditorialStoryViewer';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { fetchEditorialStories, type EditorialStory } from '@/services/editorialStories';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewsScreen() {
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
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
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScreenHeader title="الأخبار" showBack />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 48 }} />
      ) : (
        <AppScrollView contentContainerStyle={styles.content}>
          {stories.length === 0 ? (
            <Text style={styles.empty}>لا توجد أخبار حالياً</Text>
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
                <Text style={styles.title} numberOfLines={2}>
                  {story.titleAr}
                </Text>
              </Pressable>
            ))
          )}
        </AppScrollView>
      )}
      {viewerIndex != null ? (
        <EditorialStoryViewer
          stories={stories}
          startIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
        />
      ) : null}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.screenRoot },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
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
      ...typography.cardHeading,
      color: '#fff',
      padding: spacing.md,
      textAlign: 'right',
      writingDirection: 'rtl',
      zIndex: 1,
    },
    empty: {
      ...typography.feedBody,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 48,
    },
  });
}
