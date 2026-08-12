import type { ReactNode } from 'react';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import {
  SidebarMenuItem as SidebarMenuItemRow,
  type SidebarMenuItemProps,
} from '@/components/ui/SidebarMenuItem';
import { appFont } from '@/constants/fonts';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { I18nManager, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

/** Shared elevated surface — More tab / reference contrast style. */
export const MENU_CARD = {
  radius: 14,
  controlRadius: 14,
  sectionTitlePad: spacing.lg,
} as const;

/** Elevated card surface: no border, high contrast on screenRoot. */
export function menuCardStyle(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: colors.bgElevated,
    borderRadius: MENU_CARD.radius,
    overflow: 'hidden',
  };
}

/** Elevated control (search bars, icon buttons) — same contrast, no border. */
export function elevatedControlStyle(colors: ThemeColors): ViewStyle {
  return {
    backgroundColor: colors.bgElevated,
    borderRadius: MENU_CARD.controlRadius,
    borderWidth: 0,
  };
}

/**
 * Data shape for building sidebar/settings menus.
 * Prefer `title`; `label` is kept for existing call sites.
 */
export type SidebarNavItem = {
  key: string;
  icon: string;
  title?: string;
  label?: string;
  subtitle?: string;
  route?: string;
  onPress?: () => void;
  badge?: number;
  accent?: string;
};

export function SidebarSection({
  title,
  children,
  colors,
}: {
  title?: string;
  children: ReactNode;
  colors: ThemeColors;
}) {
  return (
    <View style={sectionStyles.block}>
      {title ? (
        <View style={sectionStyles.titleShell}>
          <Text style={[sectionStyles.title, { color: colors.textPrimary }]}>{title}</Text>
        </View>
      ) : null}
      <View style={[sectionStyles.card, menuCardStyle(colors)]}>{children}</View>
    </View>
  );
}

/**
 * Adapter over the canonical SidebarMenuItem design-system row.
 * Accepts the existing data object API used by sidebars/settings.
 */
export function SidebarMenuRow({
  item,
  colors,
  onPress,
  iconColor,
  isLast = false,
  active = false,
  showChevron = true,
}: {
  item: SidebarNavItem;
  colors: ThemeColors;
  onPress: () => void;
  iconColor?: string;
  isLast?: boolean;
  active?: boolean;
  showChevron?: boolean;
}) {
  const title = item.title ?? item.label ?? '';

  return (
    <SidebarMenuItemRow
      icon={item.icon}
      title={title}
      subtitle={item.subtitle}
      onPress={onPress}
      badge={item.badge}
      active={active}
      showDivider={!isLast}
      showChevron={showChevron}
      iconColor={iconColor ?? item.accent}
      colors={colors}
      variant="outline"
    />
  );
}

/** Canonical design-system row — preferred for new code. */
export { SidebarMenuItemRow as SidebarMenuItem };
export type { SidebarMenuItemProps };

export function SidebarThemeToggle({
  preference,
  colors,
  onToggle,
  variant = 'outline',
}: {
  preference: 'light' | 'dark' | 'system';
  colors: ThemeColors;
  onToggle: () => void;
  variant?: 'default' | 'outline';
}) {
  const isDark = preference !== 'light';
  const isRtl = I18nManager.isRTL;
  const isOutline = variant === 'outline';
  const iconTint = isOutline ? colors.textPrimary : colors.textMuted;

  return (
    <View
      style={[
        themeStyles.wrap,
        isOutline && themeStyles.wrapOutline,
        isOutline ? menuCardStyle(colors) : null,
        {
          direction: isRtl ? 'rtl' : 'ltr',
          backgroundColor: isOutline ? undefined : colors.bgSurface,
          borderColor: isOutline ? 'transparent' : colors.borderSoft,
        },
      ]}
    >
      <View style={[themeStyles.header, themeStyles.headerCover]}>
        <View style={themeStyles.coverTrail}>
          <View style={themeStyles.titleShell}>
            <Text style={[themeStyles.title, { color: colors.textPrimary }]}>المظهر</Text>
          </View>
          <AppIcon name={isDark ? 'weather-night' : 'sunny-outline'} size={22} color={iconTint} />
        </View>
      </View>
      <View
        style={[
          themeStyles.track,
          {
            flexDirection: 'row',
            direction: isRtl ? 'rtl' : 'ltr',
            backgroundColor: colors.bgDeep,
            borderColor: colors.borderHairline,
          },
        ]}
      >
        <Pressable
          onPress={() => isDark && onToggle()}
          style={[
            themeStyles.option,
            { flexDirection: 'row' },
            !isDark && { backgroundColor: colors.electric, shadowColor: colors.electric },
          ]}
        >
          <AppIcon name="sunny-outline" size={16} color={!isDark ? '#fff' : colors.textMuted} />
          <Text style={[themeStyles.optionText, { color: !isDark ? '#fff' : colors.textMuted }]}>
            فاتح
          </Text>
        </Pressable>
        <Pressable
          onPress={() => !isDark && onToggle()}
          style={[
            themeStyles.option,
            { flexDirection: 'row' },
            isDark && { backgroundColor: colors.electric, shadowColor: colors.electric },
          ]}
        >
          <AppIcon name="weather-night" size={16} color={isDark ? '#fff' : colors.textMuted} />
          <Text style={[themeStyles.optionText, { color: isDark ? '#fff' : colors.textMuted }]}>
            داكن
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function SidebarLogoutButton({
  colors,
  onPress,
}: {
  colors: ThemeColors;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="تسجيل الخروج"
      onPress={onPress}
      style={({ pressed }) => [
        logoutStyles.btn,
        menuCardStyle(colors),
        pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={logoutStyles.chevronSlot} />
      <View style={logoutStyles.coverTrail}>
        <View style={logoutStyles.textShell}>
          <Text style={[logoutStyles.text, { color: colors.rose }]}>تسجيل الخروج</Text>
        </View>
        <View style={logoutStyles.iconWrapOutline}>
          <AppIcon name="log-out-outline" size={22} color={colors.rose} />
        </View>
      </View>
    </Pressable>
  );
}

const sectionStyles = StyleSheet.create({
  block: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  titleShell: {
    width: '100%',
    direction: 'ltr',
    marginBottom: spacing.sm,
    paddingHorizontal: MENU_CARD.sectionTitlePad,
  },
  title: {
    ...typography.bodyStrong,
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  card: {},
});

const themeStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  wrapOutline: {
    marginHorizontal: 0,
    marginTop: 0,
    borderRadius: 14,
    borderWidth: 0,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 4,
  },
  headerCover: {
    paddingHorizontal: spacing.lg - 4,
  },
  coverTrail: {
    flexDirection: 'row',
    direction: 'ltr',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    width: '100%',
  },
  titleShell: {
    flex: 1,
    direction: 'ltr',
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 15,
    fontWeight: '600',
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  track: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.md,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  optionText: {
    ...typography.caption,
    fontWeight: '600',
    fontSize: 13,
  },
});

const logoutStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    direction: 'ltr',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minHeight: 52,
  },
  chevronSlot: {
    width: 18,
    flexShrink: 0,
  },
  coverTrail: {
    flex: 1,
    flexDirection: 'row',
    direction: 'ltr',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    minWidth: 0,
  },
  iconWrapOutline: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  /**
   * Physical LTR shell with bounded width — same as SidebarMenuItem /
   * listing title. Prevents Arabic logout label from clipping under
   * overflow:hidden parents.
   */
  textShell: {
    flex: 1,
    minWidth: 0,
    direction: 'ltr',
  },
  text: {
    ...typography.bodyStrong,
    fontFamily: appFont.semibold,
    fontWeight: '600',
    fontSize: 15,
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
