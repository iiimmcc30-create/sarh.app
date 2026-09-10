import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { UserIdentityRow, USER_IDENTITY } from '@/components/ui/UserIdentityRow';
import { radius, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow } from '@/lib/rtl';
import { confirmDestructive, alertMessage } from '@/lib/actionSheet';
import { showToast } from '@/lib/toast';
import { fetchBlockedUsers, setBlockUser, type BlockedUser } from '@/services/users';
import { AppText, SarhDivider } from '@/design-system/components';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BlockedUsersScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await fetchBlockedUsers();
    setUsers(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleUnblock = async (user: BlockedUser) => {
    const confirmed = await confirmDestructive(
      'إلغاء الحظر',
      `هل تريد إلغاء حظر ${user.arabicName || user.displayName}؟`,
      'إلغاء الحظر',
    );
    if (!confirmed) return;

    setActionId(user.id);
    const result = await setBlockUser(user.id, false);
    setActionId(null);
    if (!result.ok) {
      await alertMessage('تعذّر إلغاء الحظر', result.message, 'close-circle-outline');
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    void showToast('تم إلغاء الحظر', 'success');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="المحظورين" showBack />
      <AppScrollView contentContainerStyle={styles.content}>

        <AppText variant="caption" color="textMuted" style={styles.description}>
          الحسابات المحظورة لن تظهر منشوراتها وإعلاناتها في خلاصتك، ولا يمكنها التواصل معك.
        </AppText>

        {loading ? (
          <ActivityIndicator color={colors.electricBright} style={styles.loader} />
        ) : users.length === 0 ? (
          <View style={styles.emptyBox}>
            <AppIcon name="block" size={32} color={colors.textMuted} />
            <AppText variant="body" color="textMuted">لا يوجد حسابات محظورة</AppText>
          </View>
        ) : (
          <View style={styles.listCard}>
            {users.map((user, idx) => (
              <View key={user.id}>
                <View style={[styles.row, getRtlRow()]}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <UserIdentityRow
                      avatarUri={user.avatar}
                      displayName={user.arabicName || user.displayName}
                      username={user.username}
                      verified={user.verified}
                      avatarSize={USER_IDENTITY.listAvatarSize}
                      avatarRadius={USER_IDENTITY.listAvatarRadius}
                      avatarBorderWidth={USER_IDENTITY.listAvatarBorder}
                      colors={colors}
                      nameLines={2}
                      style={{ flex: 1 }}
                    />
                  </View>
                  <Pressable
                    style={({ pressed }) => [styles.unblockBtn, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => void handleUnblock(user)}
                    disabled={actionId === user.id}
                  >
                    {actionId === user.id ? (
                      <ActivityIndicator size="small" color={colors.textPrimary} />
                    ) : (
                      <AppText variant="caption" color="textPrimary" style={styles.unblockText}>
                        إلغاء الحظر
                      </AppText>
                    )}
                  </Pressable>
                </View>
                {idx < users.length - 1 ? <SarhDivider inset /> : null}
              </View>
            ))}
          </View>
        )}
      </AppScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    content: {
      padding: spacing.lg,
      paddingBottom: 48,
      gap: spacing.lg,
    },
    description: {
      lineHeight: 20,
    },
    loader: { marginTop: spacing.xl },
    emptyBox: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xxl,
    },
    listCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      overflow: 'hidden',
    },
    row: {
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    unblockBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill ?? 999,
      borderWidth: 1,
      borderColor: colors.borderMid,
      backgroundColor: colors.bgElevated,
      minWidth: 96,
      alignItems: 'center',
      flexShrink: 0,
    },
    unblockText: {
      fontWeight: '600',
    },
  });
}
