import type { ReactNode } from 'react';
import { UserIdentityRow, USER_IDENTITY } from '@/components/ui/UserIdentityRow';
import { sarh } from '@/constants/sarhTokens';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

export const SIDEBAR_PROFILE = {
  avatarSize: USER_IDENTITY.sidebarAvatarSize,
  avatarRadius: USER_IDENTITY.sidebarAvatarRadius,
  avatarBorder: USER_IDENTITY.sidebarAvatarBorder,
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

/** Sidebar wrapper over UserIdentityRow — padding, divider, section badge. */
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

  const footer = (
    <>
      {badgeLabel ? (
        <View style={styles.badgePill}>
          <Text style={styles.badgePillText}>{badgeLabel}</Text>
        </View>
      ) : null}
      {badge}
    </>
  );

  return (
    <UserIdentityRow
      avatarUri={avatarUri}
      displayName={displayName}
      username={username}
      onPress={onPress}
      colors={colors}
      avatarSize={SIDEBAR_PROFILE.avatarSize}
      avatarRadius={SIDEBAR_PROFILE.avatarRadius}
      avatarBorderWidth={SIDEBAR_PROFILE.avatarBorder}
      avatarBorderColor={sarh.color.action}
      nameLines={SIDEBAR_PROFILE.nameLines}
      nameStyle={styles.displayName}
      footer={badgeLabel || badge ? footer : undefined}
      style={[styles.row, showDivider && styles.rowDivider, style]}
    />
  );
}

function createStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    row: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    rowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderMid,
    },
    displayName: {
      ...typography.h3,
      fontSize: 17,
      fontWeight: '600',
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
