import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { AppText } from '@/components/ui/AppText';
import { BrandSwitch } from '@/components/feature/SidebarMenu';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { getRtlRow } from '@/lib/rtl';
import { closeThenPush } from '@/lib/safeNavigate';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type NavItem = {
  key: string;
  icon: string;
  label: string;
  route: string;
};

const PRIMARY_ITEMS: NavItem[] = [
  { key: 'profile', icon: 'person-outline', label: 'الملف الشخصي', route: '/(tabs)/profile' },
  { key: 'notifications', icon: 'notifications-outline', label: 'الإشعارات', route: '/notifications' },
  { key: 'favorites', icon: 'heart-outline', label: 'المفضلة', route: '/favorites' },
  { key: 'butchers', icon: 'storefront-outline', label: 'ملاحم سرح', route: '/butchers' },
  { key: 'promote', icon: 'megaphone-outline', label: 'تعزيز سرح', route: '/promote' },
  { key: 'news', icon: 'newspaper-outline', label: 'قطاع الأخبار', route: '/news' },
  { key: 'services', icon: 'briefcase-outline', label: 'خدمات الوزارة', route: '/sarh-services' },
];

const SECONDARY_ITEMS: NavItem[] = [
  { key: 'info', icon: 'information-outline', label: 'مركز المعلومات', route: '/settings/info' },
  { key: 'help', icon: 'lifebuoy', label: 'مركز المساعدة', route: '/support' },
  { key: 'settings', icon: 'settings-outline', label: 'الإعدادات والخصوصية', route: '/profile/settings' },
];

type AppSidebarProps = {
  onClose: () => void;
};

export function AppSidebar({ onClose }: AppSidebarProps) {
  const { colors, preference, setPreference } = useTheme();
  const { me } = useApp();
  const { isAuthenticated } = useAuth();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const isDark = preference !== 'light';

  const displayName = isAuthenticated
    ? me.arabicName || me.displayName || me.username || 'حسابي'
    : 'ضيف';
  const username = isAuthenticated && me.username ? `@${me.username}` : '@guest';

  const go = (route: string) => {
    closeThenPush(route);
  };

  return (
    <SafeAreaView style={styles.panel} edges={['top', 'bottom']}>
      <View style={[styles.closeRow, getRtlRow()]}>
        <Pressable
          onPress={onClose}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="إغلاق القائمة"
          style={styles.closeBtn}
        >
          <AppIcon name="close" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <AppScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          onPress={() => go('/(tabs)/profile')}
          style={[styles.header, getRtlRow()]}
          accessibilityRole="button"
          accessibilityLabel={displayName}
        >
          <Image source={uriSource(me.avatar)} style={styles.avatar} contentFit="cover" />
          <View style={styles.identity}>
            <AppText style={styles.name} numberOfLines={2}>
              {displayName}
            </AppText>
            <AppText style={styles.handle} numberOfLines={1}>
              {username}
            </AppText>
          </View>
        </Pressable>

        <View style={styles.divider} />

        {PRIMARY_ITEMS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => go(item.route)}
            style={({ pressed }) => [styles.row, getRtlRow(), pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <AppIcon name={item.icon} size={20} color={colors.textPrimary} />
            <AppText style={styles.rowLabel}>{item.label}</AppText>
          </Pressable>
        ))}

        <View style={styles.divider} />

        {SECONDARY_ITEMS.map((item) => (
          <Pressable
            key={item.key}
            onPress={() => go(item.route)}
            style={({ pressed }) => [styles.row, styles.rowSecondary, getRtlRow(), pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <AppIcon name={item.icon} size={18} color={colors.textMuted} />
            <AppText style={styles.rowLabelSecondary}>{item.label}</AppText>
          </Pressable>
        ))}

        <Pressable
          onPress={() => void setPreference(isDark ? 'light' : 'dark')}
          style={[styles.row, styles.rowSecondary, getRtlRow()]}
          accessibilityRole="button"
          accessibilityLabel="المظهر"
        >
          <AppIcon name="weather-night" size={18} color={colors.textMuted} />
          <AppText style={styles.rowLabelSecondary}>المظهر</AppText>
          <View style={styles.switchSlot}>
            <BrandSwitch
              value={isDark}
              onValueChange={(next) => void setPreference(next ? 'dark' : 'light')}
              colors={colors}
            />
          </View>
        </Pressable>
      </AppScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    panel: {
      width: '82%',
      maxWidth: 340,
      height: '100%',
      backgroundColor: colors.screenRoot,
    },
    closeRow: {
      justifyContent: 'flex-end',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    header: {
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.bgSurface,
    },
    identity: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    name: {
      ...typography.cardHeadingLarge,
      color: colors.textPrimary,
    },
    handle: {
      ...typography.caption,
      color: colors.textMuted,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderHairline,
      marginVertical: spacing.sm,
    },
    row: {
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 48,
      paddingVertical: 10,
    },
    rowSecondary: {
      minHeight: 42,
      paddingVertical: 8,
    },
    rowLabel: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      flex: 1,
    },
    rowLabelSecondary: {
      ...typography.secondary,
      color: colors.textSecondary,
      flex: 1,
    },
    switchSlot: {
      flexShrink: 0,
    },
    pressed: {
      opacity: 0.72,
    },
  });
}

export default AppSidebar;
