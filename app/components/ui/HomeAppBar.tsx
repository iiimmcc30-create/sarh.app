import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { ambientShadow, ds } from '@/constants/designSystem';
import { BRAND_NAME_AR, BRAND_NAME_EN } from '@/constants/brandCopy';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { rtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  const tokens = scheme === 'light' ? ds.light : ds.dark;
  return StyleSheet.create({
    bar: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
      minHeight: 52,
    },
    logoWrap: {
      ...rtlRow,
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      minWidth: 0,
    },
    logoAr: {
      fontSize: 22,
      fontWeight: '800',
      color: scheme === 'dark' ? '#FFFFFF' : colors.electric,
      writingDirection: 'rtl',
    },
    logoSep: {
      fontSize: 17,
      fontWeight: '500',
      color: scheme === 'dark' ? 'rgba(255,255,255,0.55)' : colors.textMuted,
    },
    logoEn: {
      fontSize: 17,
      fontWeight: '700',
      color: scheme === 'dark' ? '#FFFFFF' : colors.textPrimary,
    },
    actions: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconBtn: {
      width: ds.iconBtn.md,
      height: ds.iconBtn.md,
      borderRadius: ds.radius.pill,
      backgroundColor: tokens.glass,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.stroke,
      ...ambientShadow(scheme, 'soft'),
    },
  });
}
