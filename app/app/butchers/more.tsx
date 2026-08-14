// SAFAT — Butchers market "More" hub (المزيد) — user summary + section shortcuts
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { SidebarMenuItem } from '@/components/ui/SidebarMenuItem';
import { menuCardStyle } from '@/components/feature/SidebarMenu';
import { ButchersTabBar } from '@/components/butchers/ButchersTabBar';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow, getRtlText } from '@/lib/rtl';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      router.push('/auth/phone');
      return;
    }
    router.push('/butchers/apply');
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="المزيد" />

      <AppScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
        <View style={[styles.userCard, getRtlRow()]}>
          <View style={styles.avatarWrap}>
            {me.avatar ? (
              <Image source={uriSource(me.avatar)} style={styles.avatar} contentFit="cover" />
            ) : (
              <AppIcon name="person-outline" size={28} color={colors.electricBright} />
            )}
          </View>
          <View style={styles.userText}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={[styles.phoneRow, getRtlRow()]}>
              <AppIcon name="call-outline" size={13} color={colors.textMuted} />
              <Text style={styles.userPhone} numberOfLines={1}>
                {formatPhone(phone)}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>حسابي</Text>
        <View style={styles.card}>
          <SidebarMenuItem
            icon="heart-outline"
            title="تفضيلاتي"
            subtitle="الملاحم المفضلة لديك"
            colors={colors}
            showDivider
            onPress={() => router.push('/butchers/favorites')}
          />
          <SidebarMenuItem
            icon="receipt-outline"
            title="الفواتير"
            subtitle="فواتير طلباتك المكتملة"
            colors={colors}
            showDivider={false}
            onPress={() => router.push('/butchers/invoices')}
          />
        </View>

        <Text style={styles.sectionLabel}>الخدمات والدعم</Text>
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
            onPress={() => router.push('/support')}
          />
          <SidebarMenuItem
            icon="shield-outline"
            title="سياسة الخصوصية"
            colors={colors}
            showDivider={false}
            onPress={() => router.push('/info/privacy')}
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
    scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.lg },
    userCard: {
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
      borderRadius: 16,
      backgroundColor: colors.bgElevated,
    },
    avatarWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.electric + '18',
    },
    avatar: { width: '100%', height: '100%' },
    userText: { flex: 1, minWidth: 0, gap: 4 },
    userName: {
      ...typography.h3,
      color: colors.textPrimary,
      ...getRtlText(),
    },
    phoneRow: { alignItems: 'center', gap: 6 },
    userPhone: {
      ...typography.caption,
      color: colors.textMuted,
      ...getRtlText(),
    },
    sectionLabel: {
      ...typography.bodyStrong,
      fontSize: 13,
      color: colors.textMuted,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xs,
      ...getRtlText(),
    },
    card: menuCardStyle(colors),
  });
}
