import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { useAppUser } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { alertMessage } from '@/lib/actionSheet';
import {
  fetchPrivacySettings,
  updatePrivacySettings,
  type PrivacySettings,
} from '@/services/users';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { AppText, SarhButton, SarhSettingsRow, SarhSettingsSection } from '@/design-system/components';
import { Screen, ScreenBody, Stack } from '@/design-system/layout';
import { colors, space } from '@/design-system';

type PrivacyToggleKey = {
  [Key in keyof PrivacySettings]: PrivacySettings[Key] extends boolean ? Key : never;
}[keyof PrivacySettings];

const TOGGLES: {
  key: PrivacyToggleKey;
  label: string;
  icon: string;
  section: 'الظهور' | 'التواصل';
}[] = [
  {
    key: 'showInSearch',
    label: 'إظهار الحساب في نتائج البحث',
    icon: 'search',
    section: 'الظهور',
  },
  {
    key: 'showFollowingList',
    label: 'السماح برؤية الأشخاص الذين أتابعهم',
    icon: 'people-outline',
    section: 'الظهور',
  },
  {
    key: 'allowPrivateMessages',
    label: 'السماح بالرسائل الخاصة',
    icon: 'chatbubble-ellipses-outline',
    section: 'التواصل',
  },
];

const SECTIONS = ['الظهور', 'التواصل'] as const;

/** Layout only — theme colors are read at render. */
const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center' },
  notice: { paddingHorizontal: space[16], paddingTop: space[16] },
});

export default function PrivacySettingsScreen() {
  const { me } = useAppUser();
  const { accessToken, isLoading: authLoading } = useAuth();
  useTheme();
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

    setLoadError(false);

    const data = await fetchPrivacySettings(me.id);
    setSettings(data);
    setLoadError(false);
    setLoading(false);
  }, [accessToken, authLoading, me.id]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Yield once so the fetch is not a synchronous setState inside the effect.
      await Promise.resolve();
      if (!cancelled) await loadSettings();
    })();
    return () => {
      cancelled = true;
    };
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
        await alertMessage('تعذّر الحفظ', result.message ?? 'لم نتمكن من تحديث إعداد الخصوصية. تحقق من الاتصال وحاول مجدداً.');
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

  const header = <ScreenHeader variant="screen" title="الخصوصية" showBack />;

  if (!settings && (loading || authLoading)) {
    return (
      <Screen edges={['top', 'bottom']}>
        {header}
        <ScreenBody scroll={false} style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </ScreenBody>
      </Screen>
    );
  }

  if (!accessToken || !settings) {
    return (
      <Screen edges={['top', 'bottom']}>
        {header}
        <ScreenBody scroll={false} width="form" style={styles.centered}>
          <Stack gap="md" align="center">
            <AppText variant="body" color="textMuted" align="center">
              {accessToken
                ? 'تعذّر تحميل إعدادات الخصوصية'
                : 'يجب تسجيل الدخول لعرض إعدادات الخصوصية'}
            </AppText>
            {accessToken ? (
              <SarhButton title="إعادة المحاولة" onPress={() => void loadSettings()} />
            ) : null}
          </Stack>
        </ScreenBody>
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      {header}
      <ScreenBody gutter={false} padBottom="xxl">
        {loadError ? (
          <Stack gap="sm" style={styles.notice}>
            <AppText variant="caption" color="warning">
              عُرضت الإعدادات الافتراضية. قد تحتاج تحديث التطبيق أو الخادم لمزامنة تفضيلاتك.
            </AppText>
            <SarhButton
              title="إعادة المحاولة"
              onPress={() => void loadSettings()}
              variant="secondary"
            />
          </Stack>
        ) : null}

        {SECTIONS.map((section) => {
          const items = TOGGLES.filter((item) => item.section === section);
          return (
            <SarhSettingsSection key={section} title={section}>
              {items.map((item, index) => (
                <SarhSettingsRow
                  key={item.key}
                  icon={item.icon}
                  title={item.label}
                  switchValue={settings[item.key]}
                  onSwitchChange={(value) => void handleToggle(item.key, value)}
                  disabled={savingKey === item.key}
                  showDivider={index < items.length - 1}
                />
              ))}
            </SarhSettingsSection>
          );
        })}
      </ScreenBody>
    </Screen>
  );
}
