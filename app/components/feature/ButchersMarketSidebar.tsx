import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { useRouter, useSegments } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { spacing, typography } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { getRtlText, borderInlineEnd, getRtlDirection, getRtlRow, rtlForwardIcon } from '@/lib/rtl';

export type ButchersMarketMenuItem = {
  key: string;
  icon: string;
  label: string;
  route: string;
  matchRoutes?: string[];
};

export const BUTCHERS_MARKET_MENU: ButchersMarketMenuItem[] = [
  { key: 'home', icon: 'home-outline', label: 'الرئيسية', route: '/(tabs)' },
  {
    key: 'butchers',
    icon: 'storefront-outline',
    label: 'الملاحم',
    route: '/butchers',
    matchRoutes: ['/butchers', '/butchers/map'],
  },
  {
    key: 'orders',
    icon: 'bag-outline',
    label: 'طلباتي',
    route: '/butchers/my-orders',
    matchRoutes: ['/butchers/my-orders', '/butchers/order'],
  },
  {
    key: 'favorites',
    icon: 'heart-outline',
    label: 'تفضيلاتي',
    route: '/butchers/favorites',
  },
  {
    key: 'invoices',
    icon: 'receipt-outline',
    label: 'الفواتير',
    route: '/butchers/invoices',
    matchRoutes: ['/butchers/invoices', '/butchers/invoice'],
  },
  {
    key: 'register',
    icon: 'document-text-outline',
    label: 'سجل ملحمتك',
    route: '/butchers/apply',
  },
  {
    key: 'support',
    icon: 'chatbubble-ellipses-outline',
    label: 'الدعم والمساعدة',
    route: '/settings/support',
  },
  {
    key: 'privacy',
    icon: 'shield-outline',
    label: 'سياسة الخصوصية',
    route: '/info/privacy',
  },
];

const SIDEBAR = {
  bg: '#FFFFFF',
  text: '#111111',
  textMuted: '#6B7280',
  border: '#E5E7EB',
  electric: '#69D84F',
  electricSoft: '#E8F9E3',
  electricDark: '#3FA82E',
};

type Props = {
  onClose: () => void;
};

function isItemActive(item: ButchersMarketMenuItem, path: string): boolean {
  const matches = item.matchRoutes ?? [item.route];
  return matches.some((route) => path === route || path.startsWith(`${route}/`));
}

export function ButchersMarketSidebarPanel({ onClose }: Props) {
  const router = useRouter();
  const segments = useSegments();
  const { me } = useApp();
  const currentPath = `/${segments.join('/')}`;

  const handleNav = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 120);
  };

  return (
    <SafeAreaView style={[styles.panel, borderInlineEnd(StyleSheet.hairlineWidth, SIDEBAR.border)]} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
          <AppIcon name="close" size={22} color={SIDEBAR.text} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => handleNav('/(tabs)/profile')}
        style={[styles.profileRow, getRtlRow()]}
      >
        <Image source={uriSource(me.avatar)} style={styles.avatar} contentFit="cover" />
        <View style={styles.profileText}>
          <Text style={styles.displayName} numberOfLines={1}>
            {me.arabicName || me.displayName || me.username}
          </Text>
          <Text style={styles.usernameText} numberOfLines={1}>
            @{me.username || 'user'}
          </Text>
          <View style={styles.brandPill}>
            <Text style={styles.brandPillText}>قسم الملاحم</Text>
          </View>
        </View>
      </Pressable>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, getRtlDirection()]}
      >
        {BUTCHERS_MARKET_MENU.map((item) => {
          const active = isItemActive(item, currentPath);
          return (
            <Pressable
              key={item.key}
              onPress={() => handleNav(item.route)}
              style={({ pressed }) => [
                styles.menuRow,
                getRtlRow(),
                active && styles.menuRowActive,
                pressed && styles.menuRowPressed,
              ]}
            >
              {active ? <View style={styles.activeBar} /> : null}
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <AppIcon
                  name={item.icon}
                  size={20}
                  color={active ? SIDEBAR.electricDark : SIDEBAR.textMuted}
                />
              </View>
              <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                {item.label}
              </Text>
              <AppIcon name={rtlForwardIcon()} size={16} color={SIDEBAR.textMuted} />
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>سرح · سوق الملاحم</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  panel: {
    width: '88%',
    maxWidth: 400,
    alignSelf: 'stretch',
    backgroundColor: SIDEBAR.bg,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  header: {
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileRow: {
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SIDEBAR.border,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: SIDEBAR.electric,
    backgroundColor: '#F3F4F6',
  },
  profileText: {
    flex: 1,
    minWidth: 0,
    gap: 3,
    alignItems: 'flex-start',
  },
  displayName: {
    ...typography.h3,
    fontSize: 17,
    fontWeight: '800',
    color: SIDEBAR.text,
    writingDirection: 'rtl',
    ...getRtlText(),
  },
  usernameText: {
    ...typography.caption,
    color: SIDEBAR.textMuted,
    writingDirection: 'rtl',
    ...getRtlText(),
  },
  brandPill: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: SIDEBAR.electricSoft,
  },
  brandPillText: {
    ...typography.micro,
    fontWeight: '700',
    color: SIDEBAR.electricDark,
    writingDirection: 'rtl',
  },
  scroll: {
    flex: 1,
    ...getRtlDirection(),
  },
  scrollContent: {
    paddingVertical: spacing.sm,
    paddingBottom: spacing.lg,
  },
  menuRow: {
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    borderRadius: 14,
    position: 'relative',
    overflow: 'hidden',
  },
  menuRowActive: {
    backgroundColor: SIDEBAR.electricSoft,
  },
  menuRowPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  activeBar: {
    position: 'absolute',
    start: 0,
    top: 8,
    bottom: 8,
    width: 4,
    borderRadius: 4,
    backgroundColor: SIDEBAR.electric,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: '#DFF5D6',
  },
  menuLabel: {
    ...typography.bodyStrong,
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: SIDEBAR.text,
    writingDirection: 'rtl',
    ...getRtlText(),
  },
  menuLabelActive: {
    color: SIDEBAR.electricDark,
    fontWeight: '800',
  },
  footer: {
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SIDEBAR.border,
    alignItems: 'center',
  },
  footerText: {
    ...typography.micro,
    color: SIDEBAR.textMuted,
    writingDirection: 'rtl',
  },
});
