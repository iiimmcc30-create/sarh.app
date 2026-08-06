import type { ReactNode } from 'react';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { rtlDirection, rtlRow, rtlText } from '@/lib/rtl';

export type SidebarMenuItem = {
  key: string;
  icon: string;
  label: string;
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
  title: string;
  children: ReactNode;
  colors: ThemeColors;
}) {
  return (
    <View style={[sectionStyles.block, rtlDirection]}>
      <Text style={[sectionStyles.title, rtlText, { color: colors.textMuted }]}>{title}</Text>
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

export function SidebarMenuRow({
  item,
  colors,
  onPress,
  iconColor,
  isLast = false,
}: {
  item: SidebarMenuItem;
  colors: ThemeColors;
  onPress: () => void;
  iconColor?: string;
  isLast?: boolean;
}) {
  const tint = iconColor ?? colors.textMuted;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        rowStyles.row,
        rtlRow,
        rtlDirection,
        !isLast && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: colors.borderHairline,
        },
        pressed && rowStyles.rowPressed,
      ]}
    >
      <View style={rowStyles.labelWrap}>
        <Text style={[rowStyles.label, rtlText, { color: colors.textPrimary }]}>{item.label}</Text>
        {item.subtitle ? (
          <Text style={[rowStyles.subtitle, rtlText, { color: colors.textMuted }]}>
            {item.subtitle}
          </Text>
        ) : null}
      </View>
      <View style={[rowStyles.iconWrap, { backgroundColor: `${tint}18` }]}>
        <AppIcon name={item.icon} size={20} color={tint} />
      </View>
      {item.badge && item.badge > 0 ? (
        <View style={[rowStyles.badge, { backgroundColor: colors.electric }]}>
          <Text style={rowStyles.badgeText}>
            {item.badge > 99 ? '99+' : item.badge}
          </Text>
        </View>
      ) : (
        <AppIcon name="chevron-back" size={16} color={colors.textSubtle} />
      )}
    </Pressable>
  );
}

export function SidebarThemeToggle({
  preference,
  colors,
  onToggle,
}: {
  preference: 'light' | 'dark';
  colors: ThemeColors;
  onToggle: () => void;
}) {
  const isDark = preference === 'dark';

  return (
    <View
      style={[
        themeStyles.wrap,
        rtlDirection,
        {
          backgroundColor: colors.bgElevated,
          borderColor: colors.borderSoft,
        },
      ]}
    >
      <View style={[themeStyles.header, rtlRow, rtlDirection]}>
        <Text style={[themeStyles.title, rtlText, { color: colors.textPrimary }]}>المظهر</Text>
        <AppIcon name={isDark ? 'weather-night' : 'sunny-outline'} size={20} color={colors.textMuted} />
      </View>
      <View style={[themeStyles.track, { backgroundColor: colors.bgDeep, borderColor: colors.borderHairline }]}>
        <Pressable
          onPress={() => isDark && onToggle()}
          style={[
            themeStyles.option,
            !isDark && { backgroundColor: colors.electric, shadowColor: colors.electric },
          ]}
        >
          <AppIcon name="sunny-outline" size={16} color={!isDark ? '#fff' : colors.textMuted} />
          <Text style={[themeStyles.optionText, { color: !isDark ? '#fff' : colors.textMuted }]}>فاتح</Text>
        </Pressable>
        <Pressable
          onPress={() => !isDark && onToggle()}
          style={[
            themeStyles.option,
            isDark && { backgroundColor: colors.electric, shadowColor: colors.electric },
          ]}
        >
          <AppIcon name="weather-night" size={16} color={isDark ? '#fff' : colors.textMuted} />
          <Text style={[themeStyles.optionText, { color: isDark ? '#fff' : colors.textMuted }]}>داكن</Text>
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
      onPress={onPress}
      style={({ pressed }) => [
        logoutStyles.btn,
        rtlRow,
        rtlDirection,
        {
          backgroundColor: colors.bgElevated,
          borderColor: colors.borderSoft,
        },
        pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
      ]}
    >
      <Text style={[logoutStyles.text, rtlText, { color: colors.rose }]}>تسجيل الخروج</Text>
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
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: spacing.sm,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});

const rowStyles = StyleSheet.create({
  row: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    minHeight: 56,
  },
  rowPressed: {
    opacity: 0.76,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.bodyStrong,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    ...typography.caption,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  badge: {
    minWidth: 24,
    height: 22,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
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
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  track: {
    ...rtlRow,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
    gap: 4,
  },
  option: {
    flex: 1,
    ...rtlRow,
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
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...typography.bodyStrong,
    fontWeight: '700',
    fontSize: 15,
    flex: 1,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
