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
        <View style={styles.card}>
          <View style={styles.userRow}>
            <View style={styles.coverTrail}>
              <View style={styles.rtlTextShellFlex}>
                <Text style={styles.userName} numberOfLines={1}>
                  {displayName}
                </Text>
                <Text style={styles.userPhone} numberOfLines={1}>
                  {formatPhone(phone)}
                </Text>
              </View>
              <View style={styles.avatarWrap}>
                {me.avatar ? (
                  <Image source={uriSource(me.avatar)} style={styles.avatar} contentFit="cover" />
                ) : (
                  <AppIcon name="person-outline" size={22} color={colors.textPrimary} />
                )}
              </View>
            </View>
          </View>
        </View>

        <View style={styles.sectionLabelWrap}>
          <View style={styles.rtlTextShell}>
            <Text style={styles.sectionLabel}>حسابي</Text>
          </View>
        </View>
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

        <View style={styles.sectionLabelWrap}>
          <View style={styles.rtlTextShell}>
            <Text style={styles.sectionLabel}>الخدمات والدعم</Text>
          </View>
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
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 10,
      width: '100%',
    },
    rtlTextShell: {
      width: '100%',
      direction: 'ltr',
    },
    rtlTextShellFlex: {
      flex: 1,
      minWidth: 0,
      direction: 'ltr',
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
      ...typography.bodyStrong,
      fontSize: 15,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    userPhone: {
      ...typography.caption,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
      marginTop: 2,
    },
    sectionLabelWrap: {
      marginTop: spacing.xs,
      paddingHorizontal: spacing.lg,
    },
    sectionLabel: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
  });
}
