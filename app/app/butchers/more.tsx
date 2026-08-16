// SAFAT — Butchers market "More" hub (المزيد) — user summary + section shortcuts
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SidebarMenuItem } from '@/components/ui/SidebarMenuItem';
import { menuCardStyle } from '@/components/feature/SidebarMenu';
import { ButchersTabBar } from '@/components/butchers/ButchersTabBar';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { butcherTypography } from '@/constants/butcherTypography';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { safePush } from '@/lib/safeNavigate';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';

function formatPhone(phone?: string): string {
  if (!phone) return 'لم يتم إضافة رقم جوال';
  return phone;
}

export default function ButchersMoreScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const { me } = useApp();
  const { user, isAuthenticated } = useAuth();

  const displayName = me.arabicName || me.displayName || me.username || 'مستخدم سرح';
  const phone = user?.phone;

  const goRegister = () => {
    if (!isAuthenticated) {
      safePush('/auth/phone', undefined, router);
      return;
    }
    safePush('/butchers/apply', undefined, router);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="المزيد" />

      <AppScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.userRow}>
            <CoverTrailRow justify="flex-end" gap={10} style={styles.coverTrail}>
              <RtlTextShell flex>
                <RtlText style={styles.userName} numberOfLines={1}>
                  {displayName}
                </RtlText>
                <RtlText style={styles.userPhone} numberOfLines={1}>
                  {formatPhone(phone)}
                </RtlText>
              </RtlTextShell>
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
          <RtlTextShell>
            <RtlText style={styles.sectionLabel}>حسابي</RtlText>
          </RtlTextShell>
        </View>
        <View style={styles.card}>
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
          <RtlTextShell>
            <RtlText style={styles.sectionLabel}>الخدمات والدعم</RtlText>
          </RtlTextShell>
        </View>
        <View style={styles.card}>
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
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    card: menuCardStyle(colors),
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
