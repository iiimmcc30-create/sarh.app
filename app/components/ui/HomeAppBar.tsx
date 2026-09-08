import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { spacing, type ThemeColors } from '@/constants/theme';
import { ds } from '@/constants/designSystem';
import { AppText, SarhAvatar, SarhIconButton, SarhSurface } from '@/design-system/components';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, View } from 'react-native';

export const HOME_APP_BAR_H = ds.homeAppBar.height;
const BAR_H = HOME_APP_BAR_H;
const ICON_BTN = 44;
const ICON_SIZE = 24;
const AVATAR = 42;

type HomeAppBarProps = {
  onSearch: () => void;
  onProfilePress: () => void;
  onAvatarPress: () => void;
  displayName: string;
  avatarUri?: string | null;
};

/** Home header: avatar + name at the start (right in RTL), search + notifications opposite. */
export function HomeAppBar({
  onSearch,
  onProfilePress,
  onAvatarPress,
  displayName,
  avatarUri,
}: HomeAppBarProps) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));

  return (
    <SarhSurface tone="background" style={styles.shell}>
      <View style={[styles.bar, getRtlRow()]}>
        <View style={[styles.profileCluster, getRtlRow()]}>
          <Pressable
            onPress={onAvatarPress}
            style={styles.avatarBtn}
            accessibilityRole="button"
            accessibilityLabel="القائمة الجانبية"
          >
            <SarhAvatar
              uri={avatarUri}
              name={displayName}
              size="md"
              accessibilityLabel={displayName}
              style={styles.avatar}
            />
          </Pressable>

          <Pressable
            onPress={onProfilePress}
            style={styles.nameTap}
            accessibilityRole="button"
            accessibilityLabel={displayName}
          >
            <AppText
              variant="body"
              color="textPrimary"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={styles.displayName}
            >
              {displayName}
            </AppText>
          </Pressable>
        </View>

        <View style={[styles.toolsCluster, getRtlRow()]}>
          <SarhIconButton
            chrome="ghost"
            size="sm"
            accessibilityLabel="بحث"
            onPress={onSearch}
            style={styles.iconBtn}
          >
            <AppIcon name="search" size={ICON_SIZE} color={colors.textPrimary} />
          </SarhIconButton>
          <NotificationBellButton
            bare
            size={ICON_BTN}
            iconSize={ICON_SIZE}
            style={styles.iconBtn}
            iconColor={colors.textPrimary}
            badgeBorderColor={colors.bgDeep}
          />
        </View>
      </View>
    </SarhSurface>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    shell: {
      backgroundColor: colors.bgDeep,
      flexGrow: 0,
      flexShrink: 0,
    },
    bar: {
      width: '100%',
      minHeight: BAR_H,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.bgDeep,
    },
    toolsCluster: {
      alignItems: 'center',
      gap: 4,
    },
    iconBtn: {
      width: ICON_BTN,
      height: ICON_BTN,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },
    profileCluster: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: 8,
    },
    nameTap: {
      flexShrink: 1,
      minWidth: 0,
      maxWidth: '70%',
    },
    displayName: {
      // Legacy header lock — no design-system size is 17/24.
      fontSize: 17,
      lineHeight: 24,
    },
    avatarBtn: {
      flexShrink: 0,
    },
    avatar: {
      width: AVATAR,
      height: AVATAR,
      borderRadius: AVATAR / 2,
      borderWidth: 1.5,
      borderColor: colors.electricBright,
      backgroundColor: colors.bgElevated,
    },
  });
}

export default HomeAppBar;
