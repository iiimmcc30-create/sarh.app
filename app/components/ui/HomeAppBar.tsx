import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { ds } from '@/constants/designSystem';
import { BRAND_NAME_AR, BRAND_NAME_EN } from '@/constants/brandCopy';
import { sarh } from '@/constants/sarhTokens';
import { shadow, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type HomeAppBarProps = {
  onMenu: () => void;
  onSearch: () => void;
  onLive?: () => void;
  showLive?: boolean;
};

export function HomeAppBar({ onMenu, onSearch, onLive, showLive }: HomeAppBarProps) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
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

function createStyles(colors: ThemeColors) {
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
      fontWeight: '700',
      color: colors.textPrimary,
      writingDirection: 'rtl',
    },
    logoSep: {
      fontSize: 16,
      fontWeight: '400',
      color: colors.textMuted,
    },
    logoEn: {
      fontSize: 16,
      fontWeight: '600',
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
      backgroundColor: colors.bgGlassStrong,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      ...shadow.soft,
    },
  });
}

export default HomeAppBar;
