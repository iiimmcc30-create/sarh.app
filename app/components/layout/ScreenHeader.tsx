// Powered by OnSpace.AI
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ds } from '@/constants/designSystem';
import { controls, layout, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { alignInlineEnd, getRtlRow, rtlBackIcon } from '@/lib/rtl';

interface ScreenHeaderProps {
  title: string;
  arabic?: string;
  showBack?: boolean;
  rightIcon?: string;
  onRightPress?: () => void;
  showSidebar?: boolean;
  onSidebar?: () => void;
}

export function ScreenHeader({
  title,
  arabic,
  showBack,
  rightIcon,
  onRightPress,
  showSidebar,
  onSidebar,
}: ScreenHeaderProps) {
  const router = useRouter();
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors, theme.scheme),
    colors: theme.colors,
  }));

  return (
    <View style={[styles.container, getRtlRow()]}>
      <View style={styles.side}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="رجوع"
            onPress={() => router.back()}
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <AppIcon name={rtlBackIcon()} size={ds.icon.md} color={colors.textPrimary} />
          </Pressable>
        ) : showSidebar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="فتح القائمة"
            onPress={onSidebar}
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <AppIcon name="menu-burger" size={ds.icon.md} color={colors.textPrimary} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.titleWrap}>
        <Text style={styles.title}>{title}</Text>
        {arabic ? <Text style={styles.arabic}>{arabic}</Text> : null}
      </View>

      <View style={[styles.side, alignInlineEnd()]}>
        {rightIcon ? (
          <Pressable
            accessibilityRole="button"
            onPress={onRightPress}
            hitSlop={12}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <AppIcon name={rightIcon} size={ds.icon.md} color={colors.textPrimary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors, _scheme: 'light' | 'dark') {
  return StyleSheet.create({
    container: {
      ...getRtlRow(),
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      minHeight: layout.headerHeight,
      backgroundColor: colors.screenRoot,
    },
    side: {
      width: controls.iconButton,
    },
    /** Physical LTR shell — keeps centered Arabic titles visually correct under app RTL. */
    titleWrap: {
      flex: 1,
      direction: 'ltr',
      alignItems: 'center',
    },
    title: {
      ...typography.h3,
      color: colors.textPrimary,
      lineHeight: 26,
      width: '100%',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    arabic: {
      ...typography.micro,
      color: colors.textMuted,
      marginTop: 1,
      width: '100%',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    iconBtn: {
      width: controls.iconButton,
      height: controls.iconButton,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgElevated,
      borderWidth: 0,
    },
    iconBtnPressed: {
      transform: [{ scale: 0.94 }],
      opacity: 0.82,
    },
  });
}

export default ScreenHeader;
