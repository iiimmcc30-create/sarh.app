import { NotificationBellButton } from '@/components/notifications/NotificationBellButton';
import { SarhLogoMark } from '@/components/ui/SarhLogoMark';
import { ds } from '@/constants/designSystem';
import { type ThemeColors } from '@/constants/theme';
import { radius, space } from '@/design-system';
import { AVATAR_SIZE, SarhAvatar, SarhSurface } from '@/design-system/components';
import { Row } from '@/design-system/layout';
import { useLayout } from '@/hooks/useLayout';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

export const HOME_APP_BAR_H = ds.homeAppBar.height;
const BAR_H = space[40];
const TOOL = space[40];
const ICON_SIZE = space[20];
const AVATAR = AVATAR_SIZE.sm;
/** Shared shell identity metrics — Home and Community headers stay aligned. */
export const SHELL_AVATAR_SIZE = AVATAR;
export const SHELL_AVATAR_BTN = space[40];
export const SHELL_TOOL = TOOL;
export const SHELL_ICON_SIZE = ICON_SIZE;
export const SHELL_BAR_H = BAR_H;
export const SHELL_LOGO_SIZE = 28;
/** Measured chrome stack: padding + identity row. */
export const HOME_APP_BAR_STACK_H = space[8] + BAR_H + space[8];

type HomeAppBarProps = {
  onAvatarPress: () => void;
  displayName: string;
  avatarUri?: string | null;
  children?: ReactNode;
};

/** Home header: user avatar, centered Sarh mark, notifications. */
export function HomeAppBar({
  onAvatarPress,
  displayName,
  avatarUri,
  children,
}: HomeAppBarProps) {
  const { colors: themeColors } = useTheme();
  const { gutter } = useLayout();
  const colorStyles = useThemedStyles(({ colors }) => createColorStyles(colors));

  return (
    <SarhSurface tone="background" style={[styles.shell, colorStyles.shell]}>
      <View style={[styles.inner, { paddingHorizontal: gutter }]}>
        <Row justify="between" align="center" style={styles.bar}>
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
              size="sm"
              accessibilityLabel={displayName}
              style={[styles.avatar, colorStyles.avatar]}
            />
          </Pressable>

          <View pointerEvents="none" style={styles.logoSlot}>
            <SarhLogoMark size={SHELL_LOGO_SIZE} color={themeColors.electric} />
          </View>

          <View style={styles.toolsCluster}>
            <NotificationBellButton
              bare
              size={TOOL}
              iconSize={ICON_SIZE}
              style={styles.iconBtn}
              iconColor={themeColors.textPrimary}
              badgeBorderColor={themeColors.screenRoot}
            />
          </View>
        </Row>
        {children}
      </View>
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
    overflow: 'visible',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    width: '100%',
    overflow: 'visible',
    paddingTop: space[8],
    paddingBottom: space[8],
  },
  bar: {
    width: '100%',
    minHeight: BAR_H,
    flexGrow: 0,
    flexShrink: 0,
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  logoSlot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolsCluster: {
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtn: {
    width: TOOL,
    height: TOOL,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  avatarBtn: {
    flexGrow: 0,
    flexShrink: 0,
    width: SHELL_AVATAR_BTN,
    height: SHELL_AVATAR_BTN,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  avatar: {
    width: AVATAR,
    height: AVATAR,
    borderRadius: radius[999],
    borderWidth: 2,
  },
});

export default HomeAppBar;
