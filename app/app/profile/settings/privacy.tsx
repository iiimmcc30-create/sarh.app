import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { alertMessage } from '@/lib/actionSheet';
import { rtlDirection, rtlRow, rtlText } from '@/lib/rtl';
import {
  DEFAULT_PRIVACY_SETTINGS,
  fetchPrivacySettings,
  updatePrivacySettings,
  type PrivacySettings,
} from '@/services/users';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type PrivacyToggleKey = keyof PrivacySettings;

const TOGGLES: Array<{
  key: PrivacyToggleKey;
  label: string;
  description: string;
}> = [
  {
    key: 'showInSearch',
    label: 'إظهار الحساب في نتائج البحث',
    description: 'عند الإيقاف لن يظهر حسابك عند البحث عن المستخدمين.',
  },
  {
    key: 'allowPrivateMessages',
    label: 'السماح بالرسائل الخاصة',
    description: 'عند الإيقاف لن يتمكن الآخرون من بدء محادثة معك.',
  },
  {
    key: 'showFollowingList',
    label: 'السماح برؤية الأشخاص الذين أتابعهم',
    description: 'عند الإيقاف ستكون قائمة «يتابع» خاصة بك فقط.',
  },
];

export default function PrivacySettingsScreen() {
  const { me } = useApp();
  const { accessToken, isLoading: authLoading } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [savingKey, setSavingKey] = useState<PrivacyToggleKey | null>(null);

  const loadSettings = useCallback(async () => {
    if (authLoading) return;

    if (!accessToken || !me.id) {
      setSettings(null);
      setLoadError(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(false);

    const data = await fetchPrivacySettings(me.id);
    setSettings(data);
    setLoadError(false);
    setLoading(false);
  }, [accessToken, authLoading, me.id]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleToggle = async (key: PrivacyToggleKey, value: boolean) => {
    if (!accessToken || !me.id || !settings || savingKey) return;

    const previous = settings[key];
    setSettings({ ...settings, [key]: value });
    setSavingKey(key);

    try {
      const result = await updatePrivacySettings({ [key]: value }, me.id, settings);
      if (!result.settings) {
        setSettings({ ...settings, [key]: previous });
        await alertMessage('تعذّr الحفظ', result.message ?? 'لم نتمكن من تحديث إعداد الخصوصية. تحقق من الاتصال وحاول مجدداً.');
        return;
      }
      setSettings(result.settings);
      setLoadError(false);
    } catch {
      setSettings({ ...settings, [key]: previous });
      await alertMessage('خطأ', 'تعذّر الاتصال بالخادم');
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="الخصوصية" showBack />
      {loading || authLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.electricBright} />
        </View>
      ) : !accessToken ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>يجب تسجيل الدخول لعرض إعدادات الخصوصية</Text>
        </View>
      ) : !settings ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>تعذّر تحميل إعدادات الخصوصية</Text>
          <PrimaryButton title="إعادة المحاولة" onPress={() => void loadSettings()} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, rtlDirection]}
        >
          {loadError ? (
            <View style={styles.notice}>
              <Text style={styles.noticeText}>
                عُرضت الإعدادات الافتراضية. قد تحتاج تحديث التطبيق أو الخادم لمزامنة تفضيلاتك.
              </Text>
              <PrimaryButton
                title="إعادة المحاولة"
                onPress={() => void loadSettings()}
                variant="outline"
              />
            </View>
          ) : null}

          <Text style={styles.intro}>
            اختر ما تريد مشاركته مع الآخرين في سرح. يمكنك تغيير هذه الإعدادات في أي وقت.
          </Text>

          <View style={styles.card}>
            {TOGGLES.map((item, index) => (
              <View
                key={item.key}
                style={[
                  styles.row,
                  rtlRow,
                  index < TOGGLES.length - 1 && styles.rowDivider,
                ]}
              >
                <View style={styles.textWrap}>
                  <Text style={[styles.label, rtlText]}>{item.label}</Text>
                  <Text style={[styles.description, rtlText]}>{item.description}</Text>
                </View>
                <Switch
                  value={settings[item.key]}
                  onValueChange={(value) => void handleToggle(item.key, value)}
                  disabled={savingKey === item.key}
                  trackColor={{
                    false: colors.bgDeep,
                    true: colors.electric,
                  }}
                  thumbColor="#fff"
                  ios_backgroundColor={colors.bgDeep}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgDeep,
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xxl,
      gap: spacing.md,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
      gap: spacing.md,
    },
    errorText: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    notice: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: `${colors.amber}14`,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: `${colors.amber}40`,
    },
    noticeText: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
      lineHeight: 20,
    },
    intro: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'right',
      writingDirection: 'rtl',
      lineHeight: 24,
    },
    card: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      overflow: 'hidden',
    },
    row: {
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderHairline,
    },
    textWrap: {
      flex: 1,
      gap: 4,
    },
    label: {
      ...typography.bodyStrong,
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
      textAlign: 'right',
    },
    description: {
      ...typography.caption,
      color: colors.textMuted,
      lineHeight: 20,
      textAlign: 'right',
    },
  });
}
