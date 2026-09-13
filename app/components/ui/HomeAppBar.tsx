import { AppIcon } from '@/components/ui/FlaticonIcon';
import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { ds } from '@/constants/designSystem';
import { type ThemeColors } from '@/constants/theme';
import { radius, space } from '@/design-system';
import { AppText, SarhAvatar, SarhIconButton, SarhSurface } from '@/design-system/components';
import { Row } from '@/design-system/layout';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Pressable, StyleSheet } from 'react-native';

export const HOME_APP_BAR_H = ds.homeAppBar.height;
const BAR_H = HOME_APP_BAR_H;
const TOOL = space[48];
const ICON_SIZE = space[20];

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
  const { colors: themeColors } = useTheme();
  const { gutter } = useLayout();
  const colorStyles = useThemedStyles(({ colors }) => createColorStyles(colors));

  return (
    <SarhSurface tone="background" style={[styles.shell, colorStyles.shell]}>
      <Row justify="between" align="center" style={[styles.bar, { paddingHorizontal: gutter }]}>
        <Row align="center" gap="md" style={styles.profileCluster}>
          <Pressable
            onPress={onAvatarPress}
            style={styles.avatarBtn}
            hitSlop={space[4]}
            accessibilityRole="button"
            accessibilityLabel="القائمة الجانبية"
          >
            <SarhAvatar
              uri={avatarUri}
              name={displayName}
              size="md"
              accessibilityLabel={displayName}
              style={[styles.avatar, colorStyles.avatar]}
            />
          </Pressable>

          <Pressable
            onPress={onProfilePress}
            style={styles.nameTap}
            hitSlop={space[4]}
            accessibilityRole="button"
            accessibilityLabel={displayName}
          >
            <AppText variant="heading3" color="textPrimary" numberOfLines={1} ellipsizeMode="tail">
              {displayName}
            </AppText>
          </Pressable>
        </Row>

        <Row align="center" gap="xs" style={styles.toolsCluster}>
          <SarhIconButton
            chrome="ghost"
            size="sm"
            accessibilityLabel="بحث"
            onPress={onSearch}
            style={styles.iconBtn}
          >
            <AppIcon name="search" size={ICON_SIZE} color={themeColors.textPrimary} />
          </SarhIconButton>
          <NotificationBellButton
            bare
            size={TOOL}
            iconSize={ICON_SIZE}
            style={styles.iconBtn}
            iconColor={themeColors.textPrimary}
            badgeBorderColor={themeColors.screenRoot}
          />
        </Row>
      </Row>
    </SarhSurface>
  );
}

function createColorStyles(colors: ThemeColors) {
  return StyleSheet.create({
    shell: { borderBottomColor: colors.borderHairline },
    avatar: {
      borderColor: colors.electric,
      backgroundColor: colors.bgField,
    },
  });
}

const styles = StyleSheet.create({
  shell: {
    flexGrow: 0,
    flexShrink: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bar: {
    width: '100%',
    minHeight: BAR_H,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space[12],
  },
  toolsCluster: {
    alignItems: 'center',
    gap: space[4],
  },
  iconBtn: {
    width: TOOL,
    height: TOOL,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  profileCluster: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    gap: space[12],
  },
  nameTap: {
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '70%',
    minHeight: space[48],
    justifyContent: 'center',
  },
  avatarBtn: {
    flexShrink: 0,
    minWidth: space[48],
    minHeight: space[48],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: space[40],
    height: space[40],
    borderRadius: radius[999],
    borderWidth: 2,
  },
});

export default HomeAppBar;
