// Powered by OnSpace.AI
// SAFAT — About Us (من نحن)
import { AppIcon } from '@/components/ui/FlaticonIcon';

import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { useRouter } from 'expo-router';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { AppLogo } from '@/components/ui/AppLogo';
import { getRtlRow, rtlBackIcon } from '@/lib/rtl';
import {
  BRAND_FOOTER_AR,
  BRAND_GOAL_AR,
  BRAND_MISSION_AR,
  BRAND_NAME_AR,
  BRAND_TAGLINE_AR,
  BRAND_VISION_AR,
  FOUNDER_NAME,
} from '@/constants/brandCopy';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';

export default function AboutScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleShell}>
          <Text style={styles.headerTitle}>من نحن</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero */}
        <LinearGradient colors={['#0B1330', '#162149', '#1E3A8A']} style={styles.hero}>
          <AppLogo size={96} showRing={false} />
          <RtlTextShell>
            <RtlText style={styles.heroTitle}>{BRAND_NAME_AR}</RtlText>
          </RtlTextShell>
          <RtlTextShell>
            <RtlText style={styles.heroSub}>{BRAND_TAGLINE_AR}</RtlText>
          </RtlTextShell>
        </LinearGradient>

        {/* About text */}
        <View style={styles.section}>
          <RtlTextShell>
            <RtlText style={styles.sectionTitle}>رسالتنا</RtlText>
          </RtlTextShell>
          <RtlTextShell>
            <RtlText style={styles.bodyText}>{BRAND_MISSION_AR}</RtlText>
          </RtlTextShell>
        </View>

        <View style={styles.section}>
          <RtlTextShell>
            <RtlText style={styles.sectionTitle}>رؤيتنا</RtlText>
          </RtlTextShell>
          <RtlTextShell>
            <RtlText style={styles.bodyText}>{BRAND_VISION_AR}</RtlText>
          </RtlTextShell>
        </View>

        <View style={styles.section}>
          <RtlTextShell>
            <RtlText style={styles.sectionTitle}>هدفنا</RtlText>
          </RtlTextShell>
          <RtlTextShell>
            <RtlText style={styles.bodyText}>{BRAND_GOAL_AR}</RtlText>
          </RtlTextShell>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <RtlTextShell>
            <RtlText style={styles.sectionTitle}>ما نقدّمه</RtlText>
          </RtlTextShell>
          {[
            { icon: 'tag-multiple', label: 'إعلانات واضحة وموثوقة لبيع وشراء الحيوانات والمعدات' },
            { icon: 'broadcast', label: 'بث مباشر للمزادات والعروض الحية' },
            { icon: 'message-text-outline', label: 'تواصل مباشر وسريع بين البائعين والمشترين' },
            { icon: 'shield-check-outline', label: 'بيئة آمنة وموثوقة مع نظام تحقق للحسابات' },
            { icon: 'map-marker-outline', label: 'تغطية شاملة لدول الخليج العربي' },
          ].map((item, i) => (
            <View key={i} style={[styles.featureRow, getRtlRow()]}>
              <View style={styles.featureIcon}>
                <AppIcon name={item.icon} size={20} color={colors.electricBright} />
              </View>
              <View style={styles.featureTextShell}>
                <Text style={styles.featureText}>{item.label}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Ownership */}
        <View style={styles.section}>
          <RtlTextShell>
            <RtlText style={styles.sectionTitle}>المالك والامتثال</RtlText>
          </RtlTextShell>
          <View style={styles.infoCard}>
            <View style={[styles.infoRow, getRtlRow()]}>
              <View style={styles.infoLabelShell}>
                <Text style={styles.infoLabel}>مؤسس المشروع</Text>
              </View>
              <View style={styles.infoValueShell}>
                <Text style={styles.infoValue}>{FOUNDER_NAME}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={[styles.infoRow, getRtlRow()]}>
              <View style={styles.infoLabelShell}>
                <Text style={styles.infoLabel}>المالك الرسمي</Text>
              </View>
              <View style={styles.infoValueShell}>
                <Text style={styles.infoValue}>مؤسسة ماد يونيت للتجارة</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={[styles.infoRow, getRtlRow()]}>
              <View style={styles.infoLabelShell}>
                <Text style={styles.infoLabel}>السجل التجاري</Text>
              </View>
              <View style={styles.infoValueShell}>
                <Text style={styles.infoValue}>مسجّلة في المركز السعودي للأعمال</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={[styles.infoRow, getRtlRow()]}>
              <View style={styles.infoLabelShell}>
                <Text style={styles.infoLabel}>الموقع</Text>
              </View>
              <View style={styles.infoValueShell}>
                <Text style={styles.infoValue}>المملكة العربية السعودية</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <RtlTextShell>
            <RtlText style={styles.sectionTitle}>تواصل معنا</RtlText>
          </RtlTextShell>
          <Pressable
            style={[styles.contactBtn, getRtlRow()]}
            onPress={() => Linking.openURL('tel:+966591298136')}
          >
            <AppIcon name="call-outline" size={20} color={colors.electricBright} />
            <View style={styles.contactTextShell}>
              <Text style={styles.contactText}>+966 591 298 136</Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.contactBtn, getRtlRow()]}
            onPress={() => Linking.openURL('mailto:sarh@sarhsa.online')}
          >
            <AppIcon name="mail-outline" size={20} color={colors.electricBright} />
            <View style={styles.contactTextShell}>
              <Text style={styles.contactText}>sarh@sarhsa.online</Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.contactBtn, getRtlRow()]}
            onPress={() => Linking.openURL('https://sarhsa.online')}
          >
            <AppIcon name="globe-outline" size={20} color={colors.electricBright} />
            <View style={styles.contactTextShell}>
              <Text style={styles.contactText}>sarhsa.online</Text>
            </View>
          </Pressable>
        </View>

        <RtlTextShell>
          <RtlText style={styles.version}>
            {BRAND_FOOTER_AR}{'\n'}
            Uicons by Flaticon
          </RtlText>
        </RtlTextShell>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSoft,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.bgGlass,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    headerTitleShell: {
      flex: 1,
          },
    headerTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    hero: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.huge,
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
    },
    /** Physical LTR shell — same as listing title / SidebarMenuItem. */
    heroTitle: {
      ...typography.display,
      color: colors.textPrimary,
      letterSpacing: -0.5,
      width: '100%',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    heroSub: {
      ...typography.body,
      color: colors.textBrand,
      width: '100%',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    scroll: { paddingBottom: 40 },
    section: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSoft,
      gap: spacing.sm,
    },
    sectionTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    bodyText: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 26,
    },
    featureRow: {
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    featureIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: `${colors.electric}15`,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    featureTextShell: {
      flex: 1,
      minWidth: 0,
          },
    featureText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    infoCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      overflow: 'hidden',
    },
    infoRow: {
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    infoLabelShell: {
            flexShrink: 0,
    },
    infoLabel: {
      ...typography.caption,
      color: colors.textMuted,
    },
    infoValueShell: {
      flex: 1,
      minWidth: 0,
          },
    infoValue: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderSoft,
      marginHorizontal: spacing.lg,
    },
    contactBtn: {
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
    },
    contactTextShell: {
      flex: 1,
      minWidth: 0,
          },
    contactText: {
      ...typography.body,
      color: colors.textBrandStrong,
      width: '100%',
            writingDirection: 'ltr',
    },
    version: {
      ...typography.micro,
      color: colors.textSubtle,
      width: '100%',
      textAlign: 'center',
      writingDirection: 'rtl',
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
  });
}
