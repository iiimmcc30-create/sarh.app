import { AppIcon } from '@/components/ui/FlaticonIcon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppTextInput } from '@/components/ui/AppTextInput';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { alertMessage } from '@/lib/actionSheet';
import { getRtlRow, getRtlDirection } from '@/lib/rtl';
import {
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
  const { user } = useAuth();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
            <View style={styles.rtlTextShell}>
              <Text style={styles.sectionLabel}>رقم الهاتف</Text>
            </View>
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
            <View style={styles.rtlTextShell}>
              <Text style={styles.sectionLabel}>البريد الإلكتروني</Text>
            </View>
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
            <View style={styles.rtlTextShell}>
              <Text style={styles.sectionLabel}>تاريخ الميلاد</Text>
            </View>
            <AppTextInput
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="YYYY-MM-DD"
              keyboardType="numbers-and-punctuation"
              ltr
            />
            {account?.birthDate ? (
              <View style={styles.rtlTextShell}>
                <Text style={styles.hint}>
                  المحفوظ: {formatBirthDate(account.birthDate)}
                </Text>
              </View>
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
    rtlTextShell: {
      width: '100%',
      direction: 'ltr',
    },
    card: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      padding: spacing.lg,
      gap: spacing.md,
    },
    sectionLabel: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      fontSize: 15,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
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
      ...typography.bodyStrong,
      color: colors.textBrandStrong,
      fontSize: 14,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    hint: {
      ...typography.caption,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
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
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
      lineHeight: 22,
    },
  });
}
