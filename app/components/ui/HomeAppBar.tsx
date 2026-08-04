import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { ds } from '@/constants/designSystem';
import { BRAND_NAME_AR, BRAND_NAME_EN } from '@/constants/brandCopy';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { rtlRow } from '@/lib/rtl';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

type HomeAppBarProps = {
  onMenu: () => void;
  onSearch: () => void;
  onLive?: () => void;
  showLive?: boolean;
};

export function HomeAppBar({ onMenu, onSearch, onLive, showLive }: HomeAppBarProps) {
  const { scheme } = useTheme();
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors, theme.scheme),
    colors: theme.colors,
  }));

  return (
    <View style={[styles.bar, rtlRow]}>
      <Pressable onPress={onMenu} style={styles.iconBtn} hitSlop={8}>
        <AppIcon name="menu" size={ds.icon.md} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.logoWrap}>
        <Text style={styles.logoAr}>{BRAND_NAME_AR}</Text>
        <Text style={styles.logoSep}> | </Text>
        <Text style={styles.logoEn}>{BRAND_NAME_EN}</Text>
      </View>

      <View style={[styles.actions, rtlRow]}>
        {showLive && onLive ? (
          <Pressable style={styles.iconBtn} hitSlop={8} onPress={onLive}>
            <AppIcon name="signal-stream" size={ds.icon.sm} color={colors.liveRed} />
          </Pressable>
        ) : null}
        <Pressable style={styles.iconBtn} hitSlop={8} onPress={onSearch}>
          <AppIcon name="search" size={ds.icon.md} color={colors.textPrimary} />
        </Pressable>
        <NotificationBellButton
          size={ds.iconBtn.md}
          iconSize={ds.icon.md}
          style={styles.iconBtn}
        />
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const isDark = scheme === 'dark';
  return StyleSheet.create({
    bar: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      minHeight: 56,
      backgroundColor: isDark ? colors.bgDeep : 'transparent',
    },
    logoWrap: {
      ...rtlRow,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      minWidth: 0,
    },
    logoAr: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.textPrimary,
      writingDirection: 'rtl',
    },
    logoSep: {
      fontSize: 17,
      fontWeight: '500',
      color: colors.textMuted,
    },
    logoEn: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    actions: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconBtn: {
      width: ds.iconBtn.md,
      height: ds.iconBtn.md,
      borderRadius: ds.radius.pill,
      backgroundColor: isDark ? colors.bgElevated : 'rgba(255,255,255,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? colors.borderSoft : 'rgba(255,255,255,0.1)',
      ...(Platform.OS === 'ios'
        ? {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDark ? 0.18 : 0.18,
            shadowRadius: 6,
          }
        : { elevation: 2 }),
    },
  });
}
