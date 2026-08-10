import type { ReactNode } from 'react';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import {
  SidebarMenuItem as SidebarMenuItemRow,
  type SidebarMenuItemProps,
} from '@/components/ui/SidebarMenuItem';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';

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
        <Text style={[sectionStyles.title, { color: colors.textMuted }]}>{title}</Text>
      ) : null}
      <View
        style={[
          sectionStyles.card,
          {
            backgroundColor: colors.bgElevated,
            borderColor: colors.borderSoft,
          },
        ]}
      >
        {children}
      </View>
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
}: {
  preference: 'light' | 'dark' | 'system';
  colors: ThemeColors;
  onToggle: () => void;
}) {
  const isDark = preference !== 'light';
  const isRtl = I18nManager.isRTL;

  return (
    <View
      style={[
        themeStyles.wrap,
        {
          direction: isRtl ? 'rtl' : 'ltr',
          backgroundColor: colors.bgElevated,
          borderColor: colors.borderSoft,
        },
      ]}
    >
      <View
        style={[
          themeStyles.header,
          {
            flexDirection: 'row',
            direction: isRtl ? 'rtl' : 'ltr',
          },
        ]}
      >
        <Text
          style={[
            themeStyles.title,
            {
              color: colors.textPrimary,
              textAlign: isRtl ? 'right' : 'left',
              writingDirection: isRtl ? 'rtl' : 'ltr',
            },
          ]}
        >
          المظهر
        </Text>
        <AppIcon name={isDark ? 'weather-night' : 'sunny-outline'} size={20} color={colors.textMuted} />
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
        {
          backgroundColor: colors.bgElevated,
          borderColor: colors.borderSoft,
        },
        pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
      ]}
    >
      <View style={logoutStyles.spacer} />
      <Text style={[logoutStyles.text, { color: colors.rose }]}>تسجيل الخروج</Text>
      <View style={[logoutStyles.iconWrap, { backgroundColor: `${colors.rose}14` }]}>
        <AppIcon name="log-out-outline" size={20} color={colors.rose} />
      </View>
    </Pressable>
  );
}

const sectionStyles = StyleSheet.create({
  block: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  title: {
    ...typography.caption,
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
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
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 4,
  },
  title: {
    ...typography.bodyStrong,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
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
    fontWeight: '700',
    fontSize: 13,
  },
});

const logoutStyles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    direction: 'ltr',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 56,
  },
  spacer: {
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  text: {
    ...typography.bodyStrong,
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'right',
    writingDirection: 'rtl',
    flexShrink: 1,
  },
});
