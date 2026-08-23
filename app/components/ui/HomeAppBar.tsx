import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { HomeProfileMenu } from '@/components/ui/HomeProfileMenu';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { ds } from '@/constants/designSystem';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export const HOME_APP_BAR_H = ds.homeAppBar.height;
const BAR_H = HOME_APP_BAR_H;
const ICON_BTN = 44;
const ICON_SIZE = 24;
const AVATAR = 42;

type HomeAppBarProps = {
  onSearch: () => void;
  onProfilePress: () => void;
  onManageProfile: () => void;
  onSettingsPrivacy: () => void;
  onLogout: () => void;
  displayName: string;
  avatarUri?: string | null;
  isAuthenticated?: boolean;
};

/** Home header: flat full-width bar — notifications/search left, profile identity right. */
export function HomeAppBar({
  onSearch,
  onProfilePress,
  onManageProfile,
  onSettingsPrivacy,
  onLogout,
  displayName,
  avatarUri,
  isAuthenticated = true,
}: HomeAppBarProps) {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <View style={styles.shell}>
        <View style={styles.bar}>
          <View style={styles.leftCluster}>
            <NotificationBellButton
              bare
              size={ICON_BTN}
              iconSize={ICON_SIZE}
              style={styles.iconBtn}
              iconColor={colors.textPrimary}
              badgeBorderColor={colors.bgDeep}
            />
            <Pressable
              onPress={onSearch}
              style={styles.iconBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="بحث"
            >
              <AppIcon name="search" size={ICON_SIZE} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.profileCluster}>
            <Pressable
              onPress={() => {
                if (isAuthenticated) {
                  setMenuOpen(true);
                } else {
                  onProfilePress();
                }
              }}
              style={styles.chevronBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="قائمة الحساب"
            >
              <AppIcon name="angle-down" size={16} color={colors.textMuted} />
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

            <Pressable
              onPress={onProfilePress}
              style={styles.avatarBtn}
              accessibilityRole="button"
              accessibilityLabel="الملف الشخصي"
            >
              <Image
                source={uriSource(avatarUri)}
                style={styles.avatar}
                contentFit="cover"
              />
            </Pressable>
          </View>
        </View>
      </View>

      {isAuthenticated ? (
        <HomeProfileMenu
          visible={menuOpen}
          onClose={() => setMenuOpen(false)}
          onManageProfile={onManageProfile}
          onSettingsPrivacy={onSettingsPrivacy}
          onLogout={onLogout}
        />
      ) : null}
    </>
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
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.bgDeep,
    },
    leftCluster: {
      flexDirection: 'row',
      direction: 'ltr',
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
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
      marginLeft: spacing.sm,
    },
    chevronBtn: {
      width: 24,
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
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
      textAlign: 'right',
      writingDirection: 'rtl',
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
