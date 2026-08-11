// Header bell icon with unread badge — navigates to notification center

import { AppIcon } from '@/components/ui/FlaticonIcon';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { spacing, radius, type ThemeColors } from '@/constants/theme';
import { inlineStart } from '@/lib/rtl';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useUnreadNotificationCount } from '@/hooks/useUnreadNotificationCount';

type NotificationBellButtonProps = {
  size?: number;
  iconSize?: number;
  style?: object;
};

export function NotificationBellButton({
  size = 48,
  iconSize = 20,
  style,
}: NotificationBellButtonProps) {
  const router = useRouter();
  const { unreadCount } = useUnreadNotificationCount();
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  return (
    <Pressable
      style={[styles.iconBtn, { width: size, height: size }, style]}
      hitSlop={8}
      onPress={() => router.push('/notifications')}
      accessibilityLabel="الإشعارات"
      accessibilityRole="button"
    >
      <AppIcon name="bell" size={iconSize} color={colors.textPrimary} />
      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 99 ? '٩٩+' : unreadCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    iconBtn: {
      borderRadius: radius.md,
      backgroundColor: colors.bgGlassStrong,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    badge: {
      position: 'absolute',
      top: -2,
      ...inlineStart(-2),
      minWidth: 18,
      height: 18,
      paddingHorizontal: spacing.xs,
      borderRadius: 9,
      backgroundColor: colors.danger,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.bgDeep,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#fff',
      lineHeight: 12,
    },
  });
}
