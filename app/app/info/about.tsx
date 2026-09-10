import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { AppLogo } from '@/components/ui/AppLogo';
import { radius, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow } from '@/lib/rtl';
import {
  BRAND_FOOTER_AR,
  BRAND_GOAL_AR,
  BRAND_MISSION_AR,
  BRAND_NAME_AR,
  BRAND_TAGLINE_AR,
  BRAND_VISION_AR,
  FOUNDER_NAME,
} from '@/constants/brandCopy';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '@/design-system/components';
import { SarhDivider } from '@/design-system/components';

export default function AboutScreen() {
  const { styles, colors } = useThemedStyles(({ colors }) => ({
    styles: createStyles(colors),
    colors,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="من نحن" showBack />
      <AppScrollView contentContainerStyle={styles.scroll}>

        {/* Flat hero */}
        <View style={styles.hero}>
          <AppLogo size={72} showRing={false} />
          <AppText variant="heading2" color="textPrimary" align="center" style={{ marginTop: spacing.md }}>
            {BRAND_NAME_AR}
          </AppText>
          <AppText variant="body" color="textSecondary" align="center">
            {BRAND_TAGLINE_AR}
          </AppText>
        </View>

        <SarhDivider />

        {/* Mission / Vision / Goal */}
        {[
          { title: 'رسالتنا', content: BRAND_MISSION_AR },
          { title: 'رؤيتنا', content: BRAND_VISION_AR },
          { title: 'هدفنا', content: BRAND_GOAL_AR },
        ].map((item) => (
          <View key={item.title} style={styles.section}>
            <AppText variant="label" color="textPrimary">{item.title}</AppText>
            <AppText variant="body" color="textSecondary" style={styles.bodyText}>
              {item.content}
            </AppText>
          </View>
        ))}

        <SarhDivider />

        {/* Features */}
        <View style={styles.section}>
          <AppText variant="label" color="textPrimary">ما نقدّمه</AppText>
          {[
            { icon: 'tag-multiple', label: 'إعلانات واضحة وموثوقة لبيع وشراء الحيوانات والمعدات' },
            { icon: 'broadcast', label: 'بث مباشر للمزادات والعروض الحية' },
            { icon: 'message-text-outline', label: 'تواصل مباشر وسريع بين البائعين والمشترين' },
            { icon: 'shield-check-outline', label: 'بيئة آمنة وموثوقة مع نظام تحقق للحسابات' },
            { icon: 'map-marker-outline', label: 'تغطية شاملة لدول الخليج العربي' },
          ].map((item, i) => (
            <View key={i} style={[styles.featureRow, getRtlRow()]}>
              <View style={styles.featureIcon}>
                <AppIcon name={item.icon} size={18} color={colors.textSecondary} />
              </View>
              <AppText variant="body" color="textSecondary" style={{ flex: 1 }}>
                {item.label}
              </AppText>
            </View>
          ))}
        </View>

        <SarhDivider />

        {/* Ownership */}
        <View style={styles.section}>
          <AppText variant="label" color="textPrimary">المالك والامتثال</AppText>
          <View style={styles.infoCard}>
            {[
              { label: 'مؤسس المشروع', value: FOUNDER_NAME },
              { label: 'المالك الرسمي', value: 'مؤسسة ماد يونيت للتجارة' },
              { label: 'السجل التجاري', value: 'مسجّلة في المركز السعودي للأعمال' },
              { label: 'الموقع', value: 'المملكة العربية السعودية' },
            ].map((row, idx, arr) => (
              <View key={row.label}>
                <View style={[styles.infoRow, getRtlRow()]}>
                  <AppText variant="caption" color="textMuted">{row.label}</AppText>
                  <AppText variant="label" color="textPrimary" style={{ flexShrink: 1 }} numberOfLines={2}>
                    {row.value}
                  </AppText>
                </View>
                {idx < arr.length - 1 ? <SarhDivider inset /> : null}
              </View>
            ))}
          </View>
        </View>

        <SarhDivider />

        {/* Contact */}
        <View style={styles.section}>
          <AppText variant="label" color="textPrimary">تواصل معنا</AppText>
          {[
            { icon: 'call-outline', href: 'tel:+966591298136', text: '+966 591 298 136' },
            { icon: 'mail-outline', href: 'mailto:sarh@sarhsa.online', text: 'sarh@sarhsa.online' },
            { icon: 'globe-outline', href: 'https://sarhsa.online', text: 'sarhsa.online' },
          ].map((item) => (
            <Pressable
              key={item.href}
              style={({ pressed }) => [styles.contactRow, getRtlRow(), { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => Linking.openURL(item.href)}
            >
              <AppIcon name={item.icon} size={18} color={colors.textSecondary} />
              <AppText variant="body" color="primary" style={{ flex: 1 }}>
                {item.text}
              </AppText>
            </Pressable>
          ))}
        </View>

        <AppText variant="micro" color="textMuted" align="center" style={styles.footer}>
          {BRAND_FOOTER_AR}{'\n'}Uicons by Flaticon
        </AppText>

        <View style={{ height: 32 }} />
      </AppScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    scroll: { paddingBottom: 32 },

    hero: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },

    section: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    bodyText: { lineHeight: 26 },

    featureRow: {
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },
    featureIcon: {
      width: 34,
      height: 34,
      borderRadius: radius.md,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      flexShrink: 0,
    },

    infoCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
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

    contactRow: {
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.sm,
    },

    footer: {
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
      lineHeight: 20,
    },
  });
}
