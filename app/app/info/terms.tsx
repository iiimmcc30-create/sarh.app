import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow } from '@/lib/rtl';
import { AppText, SarhDivider } from '@/design-system/components';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const TERMS = [
  {
    title: 'القبول بالشروط',
    content: `باستخدامك منصة سرح فإنك توافق على الالتزام بهذه الشروط والأحكام. إن كنت لا توافق على أي بند منها، يُرجى عدم استخدام المنصة.`,
  },
  {
    title: 'شروط التسجيل',
    content: `• يجب أن يكون عمرك 18 سنة أو أكثر.\n• يُلزم تقديم معلومات صحيحة ودقيقة عند التسجيل.\n• أنت مسؤول عن سرية كلمة المرور وحماية حسابك.\n• لكل مستخدم حساب واحد فقط.`,
  },
  {
    title: 'قواعد النشر',
    content: `• يُسمح فقط بنشر إعلانات الحيوانات والمعدات الزراعية المتوافقة مع أنظمة المملكة.\n• يُحظر نشر إعلانات مضللة أو صور غير حقيقية.\n• يُحظر نشر أي محتوى مسيء أو مخالف للأنظمة السعودية.\n• تحتفظ المنصة بحق حذف أي إعلان مخالف دون إشعار مسبق.`,
  },
  {
    title: 'المعاملات التجارية',
    content: `المنصة وسيلة للتواصل بين البائعين والمشترين فقط. لا تكون سرح طرفاً في أي صفقة بين المستخدمين. أي نزاع تجاري هو مسؤولية الأطراف المتعاقدة مباشرة.`,
  },
  {
    title: 'الاشتراكات',
    content: `• بعض الميزات تتطلب اشتراكاً مدفوعاً موضحاً في صفحة باقات الاشتراك.\n• تُجدَّد الاشتراكات تلقائياً ما لم تُلغَ قبل تاريخ التجديد.`,
  },
  {
    title: 'الملكية الفكرية',
    content: `جميع حقوق الملكية الفكرية للمنصة محفوظة لمؤسسة ماد يونيت للتجارة. لا يُسمح بنسخ أو توزيع أو استخدام أي محتوى من المنصة تجارياً دون إذن خطي مسبق.`,
  },
  {
    title: 'إخلاء المسؤولية',
    content: `تُقدَّم المنصة "كما هي" دون ضمانات صريحة أو ضمنية. لا تتحمل سرح أو مؤسسة ماد يونيت للتجارة مسؤولية أي خسائر تنتج عن استخدام المنصة أو المعاملات المُبرمة عبرها.`,
  },
  {
    title: 'القانون الواجب التطبيق',
    content: `تخضع هذه الشروط لأنظمة وقوانين المملكة العربية السعودية، وتختص المحاكم السعودية بالفصل في أي نزاع ينشأ عن تطبيقها.`,
  },
];

export default function TermsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="الشروط والأحكام" showBack />
      <AppScrollView contentContainerStyle={styles.scroll}>

        {/* Banner */}
        <View style={styles.topBanner}>
          <AppIcon name="document-text" size={26} color={colors.textSecondary} />
          <AppText variant="heading3" color="textPrimary">شروط الاستخدام</AppText>
          <AppText variant="caption" color="textMuted">آخر تحديث: يناير 2024</AppText>
        </View>

        <SarhDivider />

        {TERMS.map((item, i) => (
          <View key={i}>
            <View style={styles.section}>
              <View style={[getRtlRow(), { alignItems: 'center', gap: spacing.sm }]}>
                <View style={styles.numBadge}>
                  <AppText variant="micro" color="textSecondary" align="center">{i + 1}</AppText>
                </View>
                <AppText variant="label" color="textPrimary">{item.title}</AppText>
              </View>
              <AppText variant="body" color="textSecondary" style={styles.sectionContent}>
                {item.content}
              </AppText>
            </View>
            {i < TERMS.length - 1 ? <SarhDivider /> : null}
          </View>
        ))}

        <SarhDivider />

        {/* Contact */}
        <View style={styles.section}>
          <AppText variant="label" color="textPrimary">للاستفسار</AppText>
          {[
            { icon: 'mail-outline', href: 'mailto:sarh@sarhsa.online', text: 'sarh@sarhsa.online' },
            { icon: 'call-outline', href: 'tel:+966591298136', text: '+966 591 298 136' },
          ].map((item) => (
            <Pressable
              key={item.href}
              style={({ pressed }) => [styles.contactRow, getRtlRow(), { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => Linking.openURL(item.href)}
            >
              <AppIcon name={item.icon} size={16} color={colors.electricBright} />
              <AppText variant="body" color="primary">{item.text}</AppText>
            </Pressable>
          ))}
        </View>

        <AppText variant="micro" color="textMuted" align="center" style={styles.footer}>
          © 2024 مؤسسة ماد يونيت للتجارة · سرح · جميع الحقوق محفوظة
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
    topBanner: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.lg,
    },
    section: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    numBadge: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      flexShrink: 0,
    },
    sectionContent: { lineHeight: 26 },
    contactRow: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    footer: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  });
}
