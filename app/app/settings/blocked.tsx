import { menuCardStyle } from '@/components/feature/SidebarMenu';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { UserIdentityRow, USER_IDENTITY } from '@/components/ui/UserIdentityRow';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlText, getRtlDirection } from '@/lib/rtl';
import { confirmDestructive, alertMessage } from '@/lib/actionSheet';
import { showToast } from '@/lib/toast';
import { fetchBlockedUsers, setBlockUser, type BlockedUser } from '@/services/users';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
    void showToast('تم إلغاء الحظر');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="المحظورين" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, getRtlDirection()]}
      >
        <Text style={styles.description}>
          الحسابات المحظورة لن تظهر منشوراتها وإعلاناتها في خلاصتك، ولا يمكنها التواصل معك.
        </Text>

        {loading ? (
          <ActivityIndicator color={colors.electricBright} style={styles.loader} />
        ) : users.length === 0 ? (
          <View style={styles.emptyBox}>
            <AppIcon name="block" size={32} color={colors.textMuted} />
            <Text style={styles.empty}>لا يوجد حسابات محظورة</Text>
          </View>
        ) : (
          users.map((user) => (
            <View key={user.id} style={[styles.row, menuCardStyle(colors)]}>
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
                style={styles.identity}
                trailing={
                  <Pressable
                    style={styles.unblockBtn}
                    onPress={() => void handleUnblock(user)}
                    disabled={actionId === user.id}
                  >
                    {actionId === user.id ? (
                      <ActivityIndicator size="small" color={colors.textPrimary} />
                    ) : (
                      <Text style={styles.unblockText}>إلغاء الحظر</Text>
                    )}
                  </Pressable>
                }
              />
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.huge,
      gap: spacing.md,
    },
    description: {
      ...typography.caption,
      color: colors.textSecondary,
      lineHeight: 20,
      writingDirection: 'rtl',
      ...getRtlText(),
    },
    loader: { marginTop: spacing.xl },
    emptyBox: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xxl,
    },
    empty: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
    },
    row: {
      padding: spacing.md,
    },
    identity: {
      width: '100%',
    },
    unblockBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderMid,
      backgroundColor: colors.bgSurface,
      minWidth: 96,
      alignItems: 'center',
    },
    unblockText: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '600',
    },
  });
}
