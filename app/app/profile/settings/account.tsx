import { AppIcon } from '@/components/ui/FlaticonIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { alertMessage, confirmDestructive } from '@/lib/actionSheet';
import { getRtlRow, getRtlDirection } from '@/lib/rtl';
import {
  deleteAccount,
  fetchAccountSettings,
  updateAccountSettings,
  type AccountSettings,
} from '@/services/users';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';

function formatPhone(phone: string | null | undefined) {
  if (!phone) return 'غير مضاف';
  return phone;
}

function formatBirthDate(value: string | null | undefined) {
  if (!value) return 'غير محدد';
  const [y, m, d] = value.split('-');
  if (!y || !m || !d) return value;
  return `${d}/${m}/${y}`;
}

export default function AccountInfoScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [account, setAccount] = useState<AccountSettings | null>(null);
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const data =
      (await fetchAccountSettings()) ?? {
        phone: user?.phone ?? null,
        email: user?.email ?? null,
        birthDate: null,
      };
    setAccount(data);
    setEmail(data.email ?? '');
    setBirthDate(data.birthDate ?? '');
    setLoading(false);
  }, [user?.email, user?.phone]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveEmail = async () => {
    const trimmed = email.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      await alertMessage('البريد الإلكتروني', 'أدخل بريداً إلكترونياً صالحاً');
      return;
    }
    setSaving(true);
    const result = await updateAccountSettings({
      email: trimmed || null,
    }, user?.id);
    setSaving(false);
    if (!result.account) {
      await alertMessage('تعذّر الحفظ', result.message ?? 'تحقق من الاتصال وحاول مجدداً');
      return;
    }
    setAccount(result.account);
    setEmail(result.account.email ?? '');
    await alertMessage('تم الحفظ', 'تم تحديث البريد الإلكتروني');
  };

  const saveBirthDate = async () => {
    const trimmed = birthDate.trim();
    if (trimmed && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      await alertMessage('تاريخ الميلاد', 'استخدم الصيغة YYYY-MM-DD');
      return;
    }
    setSaving(true);
    const result = await updateAccountSettings({
      birthDate: trimmed || null,
    }, user?.id);
    setSaving(false);
    if (!result.account) {
      await alertMessage('تعذّر الحفظ', result.message ?? 'تحقق من الاتصال وحاول مجدداً');
      return;
    }
    setAccount(result.account);
    setBirthDate(result.account.birthDate ?? '');
    await alertMessage('تم الحفظ', 'تم تحديث تاريخ الميلاد');
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirmDestructive(
      'حذف الحساب نهائياً',
      'سيتم حذف حسابك وبياناتك وإعلاناتك ومنشوراتك نهائياً. لا يمكن التراجع عن هذا الإجراء.',
      'حذف حسابي',
    );
    if (!confirmed) return;

    setDeleting(true);
    const result = await deleteAccount(user?.id ?? '');
    if (!result.ok) {
      setDeleting(false);
      await alertMessage('تعذّر حذف الحساب', result.message ?? 'حاول مجدداً لاحقاً');
      return;
    }

    await signOut();
    router.replace('/auth/phone' as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="معلومات الحساب" showBack />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, getRtlDirection()]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <RtlTextShell>
              <RtlText style={styles.sectionLabel}>رقم الهاتف</RtlText>
            </RtlTextShell>
            <View style={[styles.row, getRtlRow()]}>
              <Pressable
                style={styles.changeBtn}
                onPress={() => router.push('/profile/settings/change-phone' as any)}
              >
                <Text style={styles.changeBtnText}>تغيير</Text>
              </Pressable>
              <View style={styles.valueShell}>
                <Text style={styles.value}>{formatPhone(account?.phone)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <RtlTextShell>
              <RtlText style={styles.sectionLabel}>البريد الإلكتروني</RtlText>
            </RtlTextShell>
            <AppTextInput
              value={email}
              onChangeText={setEmail}
              placeholder="example@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              ltr
            />
            <PrimaryButton
              title="حفظ البريد"
              onPress={() => void saveEmail()}
              loading={saving}
              fullWidth
              icon="mail-outline"
            />
          </View>

          <View style={styles.card}>
            <RtlTextShell>
              <RtlText style={styles.sectionLabel}>تاريخ الميلاد</RtlText>
            </RtlTextShell>
            <AppTextInput
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
              ltr
            />
            {account?.birthDate ? (
              <RtlTextShell>
                <RtlText style={styles.hint}>
                  المحفوظ: {formatBirthDate(account.birthDate)}
                </RtlText>
              </RtlTextShell>
            ) : null}
            <PrimaryButton
              title="حفظ تاريخ الميلاد"
              onPress={() => void saveBirthDate()}
              loading={saving}
              fullWidth
              icon="calendar-outline"
            />
          </View>

          <View style={styles.noteCard}>
            <AppIcon name="information-circle-outline" size={20} color={styles.noteIcon.color} />
            <View style={styles.noteTextShell}>
              <Text style={styles.noteText}>
                لتغيير رقم الجوال ستحتاج إلى التحقق برمز OTP المرسل إلى الرقم الجديد.
              </Text>
            </View>
          </View>

          <View style={styles.dangerCard}>
            <RtlTextShell>
              <RtlText style={styles.dangerTitle}>حذف الحساب</RtlText>
            </RtlTextShell>
            <RtlTextShell>
              <RtlText style={styles.dangerText}>
                عند حذف حسابك سيتم إلغاء تفعيله وإزالة بياناتك وإعلاناتك ومنشوراتك بشكل
                نهائي. لا يمكن التراجع عن هذا الإجراء.
              </RtlText>
            </RtlTextShell>
            <Pressable
              style={[styles.deleteBtn, deleting && styles.deleteBtnDisabled]}
              onPress={() => void handleDeleteAccount()}
              disabled={deleting}
              accessibilityRole="button"
              accessibilityLabel="حذف الحساب نهائياً"
            >
              {deleting ? (
                <ActivityIndicator size="small" color={styles.deleteBtnText.color} />
              ) : (
                <>
                  <AppIcon name="trash-outline" size={18} color={styles.deleteBtnText.color} />
                  <Text style={styles.deleteBtnText}>حذف حسابي نهائياً</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    content: {
      padding: spacing.lg,
      gap: spacing.md,
      paddingBottom: spacing.xxxl,
    },
    /** Physical LTR shell — same as listing title / SidebarMenuItem. */
    card: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      padding: spacing.lg,
      gap: spacing.md,
    },
    sectionLabel: {
      ...typography.smallHeading,
      color: colors.textPrimary,
    },
    row: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    valueShell: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
    },
    value: {
      ...typography.body,
      color: colors.textSecondary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'ltr',
    },
    changeBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: `${colors.textBrandStrong}18`,
    },
    changeBtnText: {
      ...typography.button,
      color: colors.textBrandStrong,
    },
    hint: {
      ...typography.caption,
      color: colors.textMuted,
    },
    noteCard: {
      ...getRtlRow(),
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.bgElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    noteIcon: { color: colors.textBrandStrong },
    noteTextShell: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
    },
    noteText: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    dangerCard: {
      backgroundColor: `${colors.danger}12`,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.danger}55`,
      padding: spacing.lg,
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    dangerTitle: {
      ...typography.smallHeading,
      color: colors.danger,
    },
    dangerText: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    deleteBtn: {
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.danger,
    },
    deleteBtnDisabled: {
      opacity: 0.6,
    },
    deleteBtnText: {
      ...typography.button,
      color: '#fff',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
  });
}
