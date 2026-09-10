import { AppScrollView } from '@/components/ui/AppScrollView';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { getPolicyBySlug, POLICY_LAST_UPDATED_PLACEHOLDER } from '@/constants/sarhPolicies';
import { fetchPublicPolicy } from '@/services/content';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, SarhDivider } from '@/design-system/components';

export default function PolicyDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const fallback = slug ? getPolicyBySlug(String(slug)) : undefined;
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(fallback?.titleAr ?? 'السياسة');
  const [sections, setSections] = useState(fallback?.sections ?? []);
  const [updatedLabel, setUpdatedLabel] = useState(
    fallback?.lastUpdatedLabel ?? POLICY_LAST_UPDATED_PLACEHOLDER,
  );

  useEffect(() => {
    let alive = true;
    if (!slug) {
      setLoading(false);
      return;
    }
    void fetchPublicPolicy(String(slug)).then((doc) => {
      if (!alive || !doc) {
        setLoading(false);
        return;
      }
      setTitle(doc.titleAr);
      setSections(doc.sections);
      setUpdatedLabel(doc.lastUpdatedLabel);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [slug]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title={title} showBack />

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.electricBright} />
        </View>
      ) : (
        <AppScrollView contentContainerStyle={styles.content}>
          {sections.map((section, i) => (
            <View key={`${section.title}-${i}`}>
              <View style={styles.section}>
                {section.title ? (
                  <AppText variant="label" color="textPrimary">{section.title}</AppText>
                ) : null}
                <AppText variant="body" color="textSecondary" style={styles.body}>
                  {section.body}
                </AppText>
              </View>
              {i < sections.length - 1 ? <SarhDivider /> : null}
            </View>
          ))}
          <AppText variant="micro" color="textMuted" align="center" style={styles.updated}>
            آخر تحديث: {updatedLabel}
          </AppText>
          <View style={{ height: 32 }} />
        </AppScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { paddingBottom: 32 },
    section: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    body: { lineHeight: 24 },
    updated: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  });
}
