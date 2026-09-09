import { AppIcon } from '@/components/ui/FlaticonIcon';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { getPolicyBySlug, POLICY_LAST_UPDATED_PLACEHOLDER } from '@/constants/sarhPolicies';
import { fetchPublicPolicy } from '@/services/content';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlDirection, getRtlRow } from '@/lib/rtl';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SarhBackButton } from '@/design-system/components';
import { AppText } from '@/components/ui/AppText';

export default function PolicyDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles((theme) => createStyles(theme.colors));
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
    <SafeAreaView style={[styles.container, getRtlDirection()]} edges={['top', 'bottom']}>
      <View style={[styles.header, getRtlRow()]}>
        <SarhBackButton onPress={() => router.back()} color={colors.textPrimary} style={styles.backBtn} />
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.electric} />
        </View>
      ) : (
        <AppScrollView contentContainerStyle={[styles.content, getRtlDirection()]}>
          {sections.map((section, i) => (
            <View key={`${section.title}-${i}`} style={styles.section}>
              {section.title ? (
                <View style={{ width: '100%' }}>
                  <AppText style={styles.sectionTitle}>{section.title}</AppText>
                </View>
              ) : null}
              <View style={{ width: '100%' }}>
                <AppText style={styles.sectionBody}>{section.body}</AppText>
              </View>
            </View>
          ))}
          <Text style={styles.updated}>آخر تحديث: {updatedLabel}</Text>
        </AppScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    header: {
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderHairline,
    },
    backBtn: { width: 36, alignItems: 'center' },
    headerTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      flex: 1,
      textAlign: 'center',
    },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: { padding: spacing.xl, gap: spacing.lg, paddingBottom: spacing.huge },
    section: { gap: spacing.xs },
    /** Physical LTR shell — same as SidebarMenuItem / listing title. */
    sectionTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    sectionBody: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    updated: {
      ...typography.micro,
      color: colors.textSubtle,
      textAlign: 'center',
      marginTop: spacing.md,
    },
  });
}
