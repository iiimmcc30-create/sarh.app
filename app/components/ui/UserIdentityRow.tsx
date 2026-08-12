import type { ReactNode } from 'react';
import { Image, uriSource } from '@/components/ui/AppImage';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { sarh } from '@/constants/sarhTokens';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

export const USER_IDENTITY = {
  sidebarAvatarSize: 58,
  sidebarAvatarRadius: 16,
  sidebarAvatarBorder: 2,
  listAvatarSize: 44,
  listAvatarRadius: 16,
  listAvatarBorder: 2,
} as const;

export type UserIdentityRowProps = {
  avatarUri?: string | null;
  displayName: string;
  username?: string;
  verified?: boolean;
  /** Defaults to sidebar green action border when set; pass 0 for flat lists. */
  avatarSize?: number;
  avatarRadius?: number;
  avatarBorderWidth?: number;
  avatarBorderColor?: string;
  nameLines?: number;
  /** Renders under username (e.g. section badge pill). */
  footer?: ReactNode;
  /** Right-side slot (follow button, unblock, counts, …). */
  trailing?: ReactNode;
  onPress?: () => void;
  colors?: ThemeColors;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  nameStyle?: TextStyle;
  usernameStyle?: TextStyle;
};

/**
 * Canonical avatar + name row — same LTR shell alignment as sidebar profile rows.
 * Prevents Arabic display names from clipping under app RTL.
 */
export function UserIdentityRow({
  avatarUri,
  displayName,
  username,
  verified = false,
  avatarSize = USER_IDENTITY.sidebarAvatarSize,
  avatarRadius = USER_IDENTITY.sidebarAvatarRadius,
  avatarBorderWidth = USER_IDENTITY.sidebarAvatarBorder,
  avatarBorderColor,
  nameLines = 2,
  footer,
  trailing,
  onPress,
  colors: colorsProp,
  style,
  contentStyle,
  nameStyle,
  usernameStyle,
}: UserIdentityRowProps) {
  const theme = useTheme();
  const colors = colorsProp ?? theme.colors;
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  const handle = username
    ? username.startsWith('@')
      ? username
      : `@${username}`
    : null;

  const borderColor =
    avatarBorderColor ??
    (avatarBorderWidth > 0 ? sarh.color.action : colors.borderMid);

  const content = (
    <>
      <Image
        source={uriSource(avatarUri)}
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarRadius,
            borderWidth: avatarBorderWidth,
            borderColor,
          },
        ]}
        contentFit="cover"
      />
      <View style={[styles.profileText, contentStyle]}>
        <View style={styles.nameRow}>
          <View style={styles.nameShell}>
            <Text
              style={[styles.displayName, nameStyle]}
              numberOfLines={nameLines}
            >
              {displayName}
            </Text>
          </View>
          {verified ? <VerificationBadge size={14} /> : null}
        </View>
        {handle ? (
          <View style={styles.handleShell}>
            <Text style={[styles.usernameText, usernameStyle]} numberOfLines={1}>
              {handle}
            </Text>
          </View>
        ) : null}
        {footer}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </>
  );

  const rowStyle = [styles.row, style];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={rowStyle}>
        {content}
      </Pressable>
    );
  }

  return <View style={rowStyle}>{content}</View>;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: spacing.md,
      minWidth: 0,
    },
    avatar: {
      backgroundColor: colors.bgElevated,
      flexShrink: 0,
    },
    profileText: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    nameRow: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      width: '100%',
      minWidth: 0,
    },
    nameShell: {
      direction: 'ltr',
      flex: 1,
      minWidth: 0,
    },
    handleShell: {
      direction: 'ltr',
      width: '100%',
      minWidth: 0,
    },
    displayName: {
      ...typography.bodyStrong,
      fontSize: 15,
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
    trailing: {
      flexShrink: 0,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

export default UserIdentityRow;
