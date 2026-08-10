import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { getRtlDirection, getRtlRow } from '@/lib/rtl';
import {
  fetchFaqs,
  FAQ_CATEGORY_LABEL_AR,
  type FaqCategory,
  type FaqItem,
} from '@/services/support';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SupportFaqScreen() {
  const router = useRouter();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [categories, setCategories] = useState<{ value: string; labelAr: string }[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | undefined>();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchFaqs({ search: search.trim() || undefined, category });
    setFaqs(data?.faqs ?? []);
    setCategories(data?.categories ?? []);
    setLoading(false);
  }, [search, category]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const categoryChips = useMemo(() => {
    const all = [{ value: '', labelAr: 'الكل' }, ...categories];
    return all;
  }, [categories]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="الأسئلة الشائعة" showBack />
      <ScrollView contentContainerStyle={[styles.content, getRtlDirection()]}>
        <AppTextInput
          label="بحث"
          value={search}
          onChangeText={setSearch}
          placeholder="ابحث عن سؤال..."
          onSubmitEditing={() => void load()}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {categoryChips.map((cat) => (
            <Pressable
              key={cat.value || 'all'}
              onPress={() => setCategory(cat.value || undefined)}
              style={[styles.chip, (category ?? '') === cat.value && styles.chipActive]}
            >
              <Text style={[styles.chipText, (category ?? '') === cat.value && styles.chipTextActive]}>
                {cat.labelAr}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : faqs.length === 0 ? (
          <Text style={styles.empty}>لا توجد أسئلة مطابقة</Text>
        ) : (
          faqs.map((faq) => {
            const open = expandedId === faq.id;
            return (
              <GlassCard key={faq.id} style={styles.faqCard}>
                <Pressable onPress={() => toggle(faq.id)} style={styles.faqHeader}>
                  <View style={styles.faqTitleWrap}>
                    <Text style={styles.faqCategory}>
                      {FAQ_CATEGORY_LABEL_AR[faq.category as FaqCategory] ?? faq.category}
                    </Text>
                    <Text style={styles.faqQuestion}>{faq.questionAr}</Text>
                  </View>
                  <AppIcon name={open ? 'chevron-up' : 'chevron-down'} size={18} color={styles.muted.color} />
                </Pressable>
                {open ? <Text style={styles.faqAnswer}>{faq.answerAr}</Text> : null}
              </GlassCard>
            );
          })
        )}

        <View style={styles.footer}>
          <Text style={styles.footerTitle}>لم تجد إجابة لسؤالك؟</Text>
          <PrimaryButton
            title="إنشاء تذكرة دعم"
            fullWidth
            onPress={() => router.push('/support/tickets/create' as never)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.huge },
    chips: { gap: spacing.sm },
    chip: {
      borderRadius: 999,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    chipActive: { backgroundColor: colors.electric, borderColor: colors.electric },
    chipText: { ...typography.caption, color: colors.textSecondary },
    chipTextActive: { color: '#fff' },
    loader: { marginTop: spacing.lg },
    empty: { ...typography.body, color: colors.textMuted, textAlign: 'center' },
    faqCard: { gap: spacing.sm },
    faqHeader: { ...getRtlRow(), alignItems: 'flex-start', gap: spacing.md },
    faqTitleWrap: { flex: 1, gap: 4 },
    faqCategory: { ...typography.micro, color: colors.textBrandStrong },
    faqQuestion: { ...typography.bodyStrong, color: colors.textPrimary, lineHeight: 22 },
    faqAnswer: { ...typography.body, color: colors.textSecondary, lineHeight: 22 },
    footer: { gap: spacing.md, marginTop: spacing.lg, alignItems: 'center' },
    footerTitle: { ...typography.bodyStrong, color: colors.textPrimary },
    muted: { color: colors.textMuted },
  });
}
