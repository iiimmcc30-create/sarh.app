import type { ReactNode } from 'react';
import { Image, uriSource } from '@/components/ui/AppImage';
import { sarh } from '@/constants/sarhTokens';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

export const SIDEBAR_PROFILE = {
  avatarSize: 58,
  avatarRadius: 16,
  avatarBorder: 2,
  nameLines: 2,
} as const;

export type SidebarProfileRowProps = {
  avatarUri?: string | null;
  displayName: string;
  username?: string;
  onPress?: () => void;
  /** Small pill under the username (e.g. «قسم الملاحم»). */
  badgeLabel?: string;
  badge?: ReactNode;
  showDivider?: boolean;
  colors?: ThemeColors;
  style?: ViewStyle;
};

/**
 * Canonical sidebar profile row — avatar beside name with LTR text shells
 * so long Arabic names render fully under app RTL.
 */
export function SidebarProfileRow({
  avatarUri,
  displayName,
  username,
  onPress,
  badgeLabel,
  badge,
  showDivider = true,
  colors: colorsProp,
  style,
}: SidebarProfileRowProps) {
  const theme = useTheme();
  const colors = colorsProp ?? theme.colors;
  const styles = useThemedStyles(({ colors, scheme }) =>
    createStyles(colors, scheme === 'dark'),
  );

  const handle = username
    ? username.startsWith('@')
      ? username
      : `@${username}`
    : null;

  const content = (
    <>
      <Image
        source={uriSource(avatarUri)}
        style={styles.avatar}
        contentFit="cover"
      />
      <View style={styles.profileText}>
        <View style={styles.nameShell}>
          <Text style={styles.displayName} numberOfLines={SIDEBAR_PROFILE.nameLines}>
            {displayName}
          </Text>
        </View>
        {handle ? (
          <View style={styles.handleShell}>
            <Text style={styles.usernameText} numberOfLines={1}>
              {handle}
            </Text>
          </View>
        ) : null}
        {badgeLabel ? (
          <View style={styles.badgePill}>
            <Text style={styles.badgePillText}>{badgeLabel}</Text>
          </View>
        ) : null}
        {badge}
      </View>
    </>
  );

  const rowStyle = [
    styles.row,
    showDivider && styles.rowDivider,
    style,
  ];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={rowStyle}>
        {content}
      </Pressable>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderMid,
    },
    avatar: {
      width: SIDEBAR_PROFILE.avatarSize,
      height: SIDEBAR_PROFILE.avatarSize,
      borderRadius: SIDEBAR_PROFILE.avatarRadius,
      borderWidth: SIDEBAR_PROFILE.avatarBorder,
      borderColor: sarh.color.action,
      backgroundColor: colors.bgElevated,
      flexShrink: 0,
    },
    profileText: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    nameShell: {
      direction: 'ltr',
      width: '100%',
      minWidth: 0,
    },
    handleShell: {
      direction: 'ltr',
      width: '100%',
      minWidth: 0,
    },
    displayName: {
      ...typography.h3,
      fontSize: 17,
      fontWeight: '600',
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    usernameText: {
      ...typography.caption,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    badgePill: {
      marginTop: 4,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: isDark ? sarh.color.actionMuted : '#E8F9E3',
    },
    badgePillText: {
      ...typography.micro,
      fontWeight: '600',
      color: isDark ? colors.textPrimary : '#3FA82E',
      writingDirection: 'rtl',
    },
  });
}

export default SidebarProfileRow;
