import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useAuth } from '@/contexts/AuthContext';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { getRtlDirection, getRtlRow } from '@/lib/rtl';
import {
  addVerificationDocument,
  fetchVerificationRequest,
  removeVerificationDocument,
  saveVerificationDraft,
  submitVerificationRequest,
  VERIFICATION_STATUS_LABEL_AR,
  type VerificationRequest,
} from '@/services/support';
import { uploadSupportFileFromUri } from '@/services/upload';

export default function AccountVerificationScreen() {
  const { accessToken } = useAuth();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [request, setRequest] = useState<VerificationRequest | null>(null);
  const [userVerified, setUserVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchVerificationRequest();
    if (data) {
      setRequest(data.request);
      setUserVerified(data.userVerified);
      setFullName(data.request.fullName ?? '');
      setNationalId(data.request.nationalId ?? '');
      setBusinessName(data.request.businessName ?? '');
      setBusinessType(data.request.businessType ?? '');
      setAdditionalInfo(data.request.additionalInfo ?? '');
    }
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const editable =
    request &&
    !userVerified &&
    (request.status === 'DRAFT' || request.status === 'NEEDS_AMENDMENTS');

  const saveDraft = async () => {
    setSaving(true);
    const res = await saveVerificationDraft({
      fullName,
      nationalId,
      businessName,
      businessType,
      additionalInfo,
    });
    setSaving(false);
    if (!res.ok) Alert.alert('تعذر الحفظ', res.error ?? 'حاول مرة أخرى');
    else void load();
  };

  const uploadDocument = async (type: 'NATIONAL_ID' | 'COMMERCIAL_REGISTER' | 'OTHER') => {
    if (!accessToken) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('الإذن مطلوب', 'يرجى السماح بالوصول للصور');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
    });
    if (result.canceled) return;

    try {
      setSaving(true);
      const asset = result.assets[0];
      const uploaded = await uploadSupportFileFromUri(accessToken, asset.uri, {
        originalFileName: asset.fileName ?? undefined,
        mimeType: asset.mimeType ?? undefined,
      });
      const res = await addVerificationDocument({
        type,
        fileKey: uploaded.fileKey,
        fileUrl: uploaded.fileUrl,
        originalFileName: uploaded.originalFileName,
        mimeType: uploaded.mimeType,
        fileSizeBytes: uploaded.fileSizeBytes,
      });
      if (!res.ok) Alert.alert('تعذر الرفع', res.error ?? 'حاول مرة أخرى');
      else void load();
    } catch (e) {
      Alert.alert('خطأ', e instanceof Error ? e.message : 'فشل الرفع');
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    await saveDraft();
    setSaving(true);
    const res = await submitVerificationRequest();
    setSaving(false);
    if (!res.ok) Alert.alert('تعذر الإرسال', res.error ?? 'تحقق من البيانات والمستندات');
    else {
      Alert.alert('تم الإرسال', 'سيتم مراجعة طلبك وإشعارك بالنتيجة');
      void load();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <ScreenHeader title="طلب توثيق الحساب" showBack />
        <ActivityIndicator style={styles.loader} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="طلب توثيق الحساب" showBack />
      <ScrollView contentContainerStyle={[styles.content, getRtlDirection()]}>
        <GlassCard style={styles.statusCard}>
          <Text style={styles.statusLabel}>حالة الطلب</Text>
          <Text style={styles.statusValue}>
            {userVerified
              ? 'موثق'
              : VERIFICATION_STATUS_LABEL_AR[request?.status ?? 'DRAFT']}
          </Text>
          {request?.reviewReason ? (
            <Text style={styles.reason}>{request.reviewReason}</Text>
          ) : null}
        </GlassCard>

        <GlassCard style={styles.section}>
          <Text style={styles.sectionTitle}>المتطلبات</Text>
          {[
            'الاسم الكامل كما في الهوية',
            'رقم الهوية الوطنية',
            'صورة واضحة للهوية',
            'للحسابات التجارية: السجل التجاري',
          ].map((item) => (
            <Text key={item} style={styles.requirement}>• {item}</Text>
          ))}
        </GlassCard>

        <AppTextInput label="الاسم الكامل" value={fullName} onChangeText={setFullName} editable={!!editable} />
        <AppTextInput label="رقم الهوية" value={nationalId} onChangeText={setNationalId} editable={!!editable} />
        <AppTextInput label="اسم المنشأة (اختياري)" value={businessName} onChangeText={setBusinessName} editable={!!editable} />
        <AppTextInput label="نوع النشاط (اختياري)" value={businessType} onChangeText={setBusinessType} editable={!!editable} />
        <AppTextInput
          label="معلومات إضافية"
          value={additionalInfo}
          onChangeText={setAdditionalInfo}
          multiline
          numberOfLines={3}
          editable={!!editable}
        />

        {editable ? (
          <>
            <GlassCard style={styles.section}>
              <Text style={styles.sectionTitle}>المستندات</Text>
              <View style={styles.docActions}>
                <Pressable style={styles.docBtn} onPress={() => void uploadDocument('NATIONAL_ID')}>
                  <Text style={styles.docBtnText}>رفع الهوية</Text>
                </Pressable>
                <Pressable style={styles.docBtn} onPress={() => void uploadDocument('COMMERCIAL_REGISTER')}>
                  <Text style={styles.docBtnText}>رفع السجل التجاري</Text>
                </Pressable>
              </View>
              {(request?.documents ?? []).map((doc) => (
                <View key={doc.id} style={styles.docRow}>
                  <Text style={styles.docName}>{doc.originalFileName ?? doc.type}</Text>
                  <Pressable onPress={() => void removeVerificationDocument(doc.id).then(load)}>
                    <Text style={styles.remove}>حذف</Text>
                  </Pressable>
                </View>
              ))}
            </GlassCard>

            <PrimaryButton title="حفظ المسودة" variant="outline" fullWidth loading={saving} onPress={() => void saveDraft()} />
            <PrimaryButton title="إرسال الطلب" fullWidth loading={saving} onPress={() => void submit()} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.huge },
    loader: { marginTop: spacing.xxl },
    statusCard: { gap: spacing.xs },
    statusLabel: { ...typography.caption, color: colors.textMuted },
    statusValue: { ...typography.h3, color: colors.electric },
    reason: { ...typography.body, color: colors.danger, lineHeight: 22 },
    section: { gap: spacing.sm },
    sectionTitle: { ...typography.bodyStrong, color: colors.textPrimary },
    requirement: { ...typography.caption, color: colors.textSecondary, lineHeight: 20 },
    docActions: { ...getRtlRow(), gap: spacing.sm, flexWrap: 'wrap' },
    docBtn: {
      backgroundColor: colors.bgSurface,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    docBtnText: { ...typography.caption, color: colors.electric },
    docRow: { ...getRtlRow(), justifyContent: 'space-between', alignItems: 'center' },
    docName: { ...typography.caption, color: colors.textSecondary, flex: 1 },
    remove: { ...typography.caption, color: colors.danger },
  });
}
