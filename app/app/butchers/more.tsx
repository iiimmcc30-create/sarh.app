// SAFAT — Butchers market "More" hub (المزيد) — user summary + section shortcuts
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SidebarMenuItem } from '@/components/ui/SidebarMenuItem';
import { ButchersTabBar } from '@/components/butchers/ButchersTabBar';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { butcherTypography } from '@/constants/butcherTypography';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useAppUser } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { safePush } from '@/lib/safeNavigate';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';
import { AppText } from '@/components/ui/AppText';

function formatPhone(phone?: string): string {
  if (!phone) return 'لم يتم إضافة رقم جوال';
  return phone;
}

export default function ButchersMoreScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const { me } = useAppUser();
  const { user } = useAuth();

  const displayName = me.arabicName || me.displayName || me.username || 'مستخدم سرح';
  const phone = user?.phone;

  const goRegister = () => {
    safePush('/join', undefined, router);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="المزيد" />

      <AppScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        <View>
          <View style={styles.userRow}>
            <CoverTrailRow justify="flex-end" gap={10} style={styles.coverTrail}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText style={styles.userName} numberOfLines={1}>
                  {displayName}
                </AppText>
                <AppText style={styles.userPhone} numberOfLines={1}>
                  {formatPhone(phone)}
                </AppText>
              </View>
              <View style={styles.avatarWrap}>
                {me.avatar ? (
                  <Image source={uriSource(me.avatar)} style={styles.avatar} contentFit="cover" />
                ) : (
                  <AppIcon name="person-outline" size={22} color={colors.textPrimary} />
                )}
              </View>
            </CoverTrailRow>
          </View>
        </View>

        <View style={styles.sectionLabelWrap}>
          <View style={{ width: '100%' }}>
            <AppText style={styles.sectionLabel}>حسابي</AppText>
          </View>
        </View>
        <View>
          <SidebarMenuItem
            icon="heart-outline"
            title="تفضيلاتي"
            subtitle="الملاحم المفضلة لديك"
            colors={colors}
            showDivider
            onPress={() => safePush('/butchers/favorites', undefined, router)}
          />
          <SidebarMenuItem
            icon="receipt-outline"
            title="الفواتير"
            subtitle="فواتير طلباتك المكتملة"
            colors={colors}
            showDivider={false}
            onPress={() => safePush('/butchers/invoices', undefined, router)}
          />
        </View>

        <View style={styles.sectionLabelWrap}>
          <View style={{ width: '100%' }}>
            <AppText style={styles.sectionLabel}>الخدمات والدعم</AppText>
          </View>
        </View>
        <View>
          <SidebarMenuItem
            icon="storefront-outline"
            title="سجّل ملحمتك"
            subtitle="انضم كشريك بائع في سرح"
            colors={colors}
            showDivider
            onPress={goRegister}
          />
          <SidebarMenuItem
            icon="chatbubble-ellipses-outline"
            title="الدعم والمساعدة"
            colors={colors}
            showDivider
            onPress={() => safePush('/support', undefined, router)}
          />
          <SidebarMenuItem
            icon="shield-outline"
            title="سياسة الخصوصية"
            colors={colors}
            showDivider={false}
            onPress={() => safePush('/info/privacy', undefined, router)}
          />
        </View>
      </AppScrollView>

      <ButchersTabBar active="more" />
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    flex: { flex: 1 },
    scroll: {
      paddingHorizontal: 0,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    userRow: {
      paddingHorizontal: spacing.lg,
      paddingVertical: 14,
    },
    coverTrail: {
      width: '100%',
    },
    avatarWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgDeep,
      flexShrink: 0,
    },
    avatar: { width: '100%', height: '100%' },
    userName: {
      ...butcherTypography.title,
      color: colors.textPrimary,
    },
    userPhone: {
      ...butcherTypography.secondary,
      color: colors.textMuted,
      marginTop: 2,
    },
    sectionLabelWrap: {
      marginTop: spacing.xs,
      paddingHorizontal: spacing.lg,
    },
    sectionLabel: {
      ...butcherTypography.primary,
      color: colors.textPrimary,
    },
  });
}
