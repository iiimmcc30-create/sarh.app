// SAFAT — Butchers market bottom navigation (الرئيسية · الطلبات · العروض · الخريطة · المزيد)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ambientShadow } from '@/constants/designSystem';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow } from '@/lib/rtl';
import { safeReplace } from '@/lib/safeNavigate';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ButchersTab = 'home' | 'orders' | 'offers' | 'map' | 'more';

type TabDef = {
  key: ButchersTab;
  label: string;
  icon: string;
  route: string;
};

/** Visual RTL order (right → left): الرئيسية · الطلبات · العروض · الخريطة · المزيد */
const TABS: TabDef[] = [
  { key: 'home', label: 'الرئيسية', icon: 'home-outline', route: '/butchers' },
  { key: 'orders', label: 'الطلبات', icon: 'bag-outline', route: '/butchers/my-orders' },
  { key: 'offers', label: 'العروض', icon: 'pricetag-outline', route: '/butchers/offers' },
  { key: 'map', label: 'الخريطة', icon: 'map-outline', route: '/butchers/map' },
  { key: 'more', label: 'المزيد', icon: 'grid-outline', route: '/butchers/more' },
];

export function ButchersTabBar({ active }: { active: ButchersTab }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, scheme } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  const onPress = (tab: TabDef) => {
    if (tab.key === active) return;
    safeReplace(tab.route, undefined, router);
  };

  return (
    <View
      style={[
        styles.bar,
        { paddingBottom: Math.max(insets.bottom, spacing.sm) },
        ambientShadow(scheme, 'soft'),
      ]}
    >
      <View style={[styles.row, getRtlRow()]}>
        {TABS.map((tab) => {
          const focused = tab.key === active;
          const tint = focused ? colors.electricBright : colors.textMuted;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={tab.label}
              onPress={() => onPress(tab)}
              style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
            >
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <AppIcon name={tab.icon} size={24} color={tint} />
              </View>
              <Text
                style={[styles.label, { color: tint }, focused && styles.labelActive]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    bar: {
      backgroundColor: colors.bgElevated,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSoft,
      paddingTop: 10,
      paddingHorizontal: 2,
    },
    row: {
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },
    slot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 4,
      paddingVertical: 4,
      minHeight: 56,
    },
    iconWrap: {
      width: 44,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapActive: {
      backgroundColor: colors.electric + '22',
    },
    pressed: { opacity: 0.6 },
    label: {
      ...typography.caption,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    labelActive: {
      fontWeight: '800',
      fontSize: 13,
    },
  });
}

export default ButchersTabBar;
