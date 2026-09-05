import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { ds } from '@/constants/designSystem';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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
    <View style={styles.shell}>
      <View style={[styles.bar, getRtlRow()]}>
        <View style={[styles.profileCluster, getRtlRow()]}>
          <Pressable
            onPress={onAvatarPress}
            style={styles.avatarBtn}
            accessibilityRole="button"
            accessibilityLabel="القائمة الجانبية"
          >
            <Image
              source={uriSource(avatarUri)}
              style={styles.avatar}
              contentFit="cover"
            />
          </Pressable>

          <Pressable
            onPress={onProfilePress}
            style={styles.nameTap}
            accessibilityRole="button"
            accessibilityLabel={displayName}
          >
            <Text style={styles.displayName} numberOfLines={1}>
              {displayName}
            </Text>
          </Pressable>
        </View>

        <View style={[styles.toolsCluster, getRtlRow()]}>
          <Pressable
            onPress={onSearch}
            style={styles.iconBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="بحث"
          >
            <AppIcon name="search" size={ICON_SIZE} color={colors.textPrimary} />
          </Pressable>
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
    </View>
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
      ...typography.feedTitle,
      fontFamily: OFFICIAL_APP_FONT,
      fontSize: 17,
      lineHeight: 24,
      color: colors.textPrimary,
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
