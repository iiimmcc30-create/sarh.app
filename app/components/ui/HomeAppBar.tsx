import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { ds } from '@/constants/designSystem';
import { BRAND_NAME_AR, BRAND_NAME_EN } from '@/constants/brandCopy';
import { appFont } from '@/constants/fonts';
import { sarh } from '@/constants/sarhTokens';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow } from '@/lib/rtl';
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
    <View style={[styles.bar, getRtlRow()]}>
      <Pressable onPress={onMenu} style={styles.iconBtn} hitSlop={8}>
        <AppIcon name="menu" size={ds.icon.md} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.logoWrap}>
        <Text style={styles.logoAr}>{BRAND_NAME_AR}</Text>
        <Text style={styles.logoSep}> | </Text>
        <Text style={styles.logoEn}>{BRAND_NAME_EN}</Text>
      </View>

      <View style={[styles.actions, getRtlRow()]}>
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
      backgroundColor: 'transparent',
    },
    logoWrap: {
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      minWidth: 0,
    },
    logoAr: {
      fontSize: 22,
      fontFamily: appFont.semibold,
      fontWeight: '600',
      color: colors.textPrimary,
      writingDirection: 'rtl',
    },
    logoSep: {
      fontSize: 16,
      fontFamily: appFont.regular,
      fontWeight: '400',
      color: colors.textMuted,
    },
    logoEn: {
      fontSize: 16,
      fontFamily: appFont.medium,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    actions: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconBtn: {
      width: ds.iconBtn.md,
      height: ds.iconBtn.md,
      borderRadius: sarh.radius.pill,
      backgroundColor: isDark ? 'rgba(16, 38, 51, 0.72)' : ds.light.glass,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? sarh.color.border : ds.light.stroke,
      ...(Platform.OS === 'ios'
        ? {
            shadowColor: '#101820',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: isDark ? 0.08 : 0.04,
            shadowRadius: 4,
          }
        : { elevation: isDark ? 1 : 0 }),
    },
  });
}

export default HomeAppBar;
