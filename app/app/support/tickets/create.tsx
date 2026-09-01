import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { FilterChip, FilterChipRow } from '@/components/ui/FilterChip';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useAuth } from '@/contexts/AuthContext';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { getRtlDirection, getRtlRow } from '@/lib/rtl';
import {
  createTicket,
  TICKET_CATEGORY_LABEL_AR,
  type SupportTicketCategory,
} from '@/services/support';
import { uploadSupportFileFromUri } from '@/services/upload';

const CATEGORIES = (Object.keys(TICKET_CATEGORY_LABEL_AR) as SupportTicketCategory[]).filter(
  (c) => c !== 'ORDER_HELP' && c !== 'OTHER_HELP',
);

export default function CreateSupportTicketScreen() {
  const router = useRouter();
  const { accessToken } = useAuth();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [category, setCategory] = useState<SupportTicketCategory>('OTHER');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<
    { uri: string; fileUrl?: string; fileName?: string; mimeType?: string }[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = subject.trim().length >= 3 && description.trim().length >= 10;

  const pickAttachments = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('الإذن مطلوب', 'يرجى السماح بالوصول للصور');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      setAttachments((prev) => [
        ...prev,
        ...result.assets.slice(0, 8 - prev.length).map((a) => ({
          uri: a.uri,
          fileName: a.fileName ?? undefined,
          mimeType: a.mimeType ?? undefined,
        })),
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!accessToken || !canSubmit) return;
    setSubmitting(true);
    try {
      const uploaded = await Promise.all(
        attachments.map(async (item) => {
          if (item.fileUrl) return item;
          const result = await uploadSupportFileFromUri(accessToken, item.uri, {
            originalFileName: item.fileName,
            mimeType: item.mimeType,
          });
          return { ...item, fileUrl: result.fileUrl, mimeType: result.mimeType };
        }),
      );

      const res = await createTicket({
        category,
        subject: subject.trim(),
        description: description.trim(),
        attachments: uploaded
          .filter((a) => a.fileUrl)
          .map((a) => ({
            fileUrl: a.fileUrl!,
            fileName: a.fileName,
            mimeType: a.mimeType,
          })),
      });

      if (!res.ok) {
        Alert.alert('تعذر الإرسال', res.error ?? 'حاول مرة أخرى');
        return;
      }

      Alert.alert('تم الإرسال', `رقم التذكرة: ${res.ticket?.ticketNumber ?? ''}`, [
        {
          text: 'موافق',
          onPress: () => {
            if (res.ticket?.id) {
              router.replace({
                pathname: '/support/tickets/[id]',
                params: { id: res.ticket.id },
              } as never);
            } else {
              router.back();
            }
          },
        },
      ]);
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message : 'فشل رفع المرفقات');
    } finally {
      setSubmitting(false);
    }
  };

  const categoryLabel = useMemo(
    () => TICKET_CATEGORY_LABEL_AR[category],
    [category],
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="تذكرة دعم جديدة" showBack />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={[styles.content, getRtlDirection()]}>
          <GlassCard style={styles.section}>
            <Text style={styles.label}>تصنيف المشكلة</Text>
            <FilterChipRow contentPaddingHorizontal={0}>
              {CATEGORIES.map((cat) => (
                <FilterChip
                  key={cat}
                  label={TICKET_CATEGORY_LABEL_AR[cat]}
                  selected={category === cat}
                  onPress={() => setCategory(cat)}
                />
              ))}
            </FilterChipRow>
            <Text style={styles.selectedHint}>المحدد: {categoryLabel}</Text>
          </GlassCard>

          <AppTextInput label="عنوان المشكلة" value={subject} onChangeText={setSubject} />
          <AppTextInput
            label="وصف المشكلة بالتفصيل"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            style={styles.textArea}
          />

          <GlassCard style={styles.section}>
            <View style={styles.attachHeader}>
              <Text style={styles.label}>المرفقات (اختياري)</Text>
              <Pressable onPress={() => void pickAttachments()}>
                <Text style={styles.link}>إضافة</Text>
              </Pressable>
            </View>
            {attachments.length === 0 ? (
              <Text style={styles.hint}>صور أو فيديو — حتى 8 ملفات</Text>
            ) : (
              attachments.map((item, index) => (
                <View key={`${item.uri}-${index}`} style={styles.attachRow}>
                  <Text style={styles.attachName} numberOfLines={1}>
                    {item.fileName ?? `مرفق ${index + 1}`}
                  </Text>
                  <Pressable
                    onPress={() => setAttachments((prev) => prev.filter((_, i) => i !== index))}
                  >
                    <Text style={styles.remove}>حذف</Text>
                  </Pressable>
                </View>
              ))
            )}
          </GlassCard>

          <PrimaryButton
            title="إرسال التذكرة"
            fullWidth
            loading={submitting}
            disabled={!canSubmit || submitting}
            onPress={() => void handleSubmit()}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    flex: { flex: 1 },
    content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.huge },
    section: { gap: spacing.sm },
    label: { ...typography.bodyStrong, color: colors.textPrimary },
    selectedHint: { ...typography.micro, color: colors.textMuted },
    textArea: { minHeight: 140, textAlignVertical: 'top' },
    attachHeader: { ...getRtlRow(), justifyContent: 'space-between', alignItems: 'center' },
    link: { ...typography.caption, color: colors.electric },
    hint: { ...typography.caption, color: colors.textMuted },
    attachRow: { ...getRtlRow(), justifyContent: 'space-between', gap: spacing.sm },
    attachName: { ...typography.caption, color: colors.textSecondary, flex: 1 },
    remove: { ...typography.caption, color: colors.danger },
  });
}
