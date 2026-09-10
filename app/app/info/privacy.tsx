import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { radius, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { PRIVACY_POLICY_URL } from '@/constants/legal';
import { AppText, SarhDivider } from '@/design-system/components';
import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SECTIONS = [
  {
    title: 'مقدمة',
    content: `تلتزم منصة سرح (sarhsa.online)، المملوكة لمؤسسة ماد يونيت للتجارة، بحماية خصوصية مستخدميها. توضّح هذه السياسة كيفية جمع بياناتك الشخصية واستخدامها وحفظها والحفاظ عليها وفق أحكام نظام حماية البيانات الشخصية في المملكة العربية السعودية.`,
  },
  {
    title: 'البيانات التي نجمعها',
    content: `• الاسم ورقم الجوال وعنوان البريد الإلكتروني عند التسجيل.\n• بيانات الحيوانات والإعلانات التي تنشرها.\n• الصور ومقاطع الفيديو التي ترفعها.\n• بيانات الموقع الجغرافي عند استخدام ميزات الخريطة (بإذنك).\n• سجلات الاستخدام والأجهزة لتحسين الخدمة.`,
  },
  {
    title: 'كيف نستخدم بياناتك',
    content: `• تشغيل المنصة وتقديم خدماتها الأساسية.\n• إرسال إشعارات متعلقة بإعلاناتك وعروضك.\n• تحسين تجربة المستخدم وتطوير الميزات.\n• الامتثال للمتطلبات القانونية والتنظيمية في المملكة.\n• منع الاحتيال وحماية أمن المنصة.`,
  },
  {
    title: 'مشاركة البيانات',
    content: `لا نبيع بياناتك الشخصية لأطراف ثالثة. قد نشارك بياناتك مع:\n• مزودي الخدمة التقنية الضروريين لتشغيل المنصة.\n• الجهات الحكومية والقضائية عند الطلب القانوني.\n\nجميع الشركاء ملزمون بسياسات صارمة لحماية البيانات.`,
  },
  {
    title: 'حقوقك',
    content: `يحق لك في أي وقت:\n• الاطلاع على بياناتك الشخصية المحفوظة لدينا.\n• تصحيح أي بيانات غير دقيقة.\n• طلب حذف بياناتك.\n• الاعتراض على معالجة بياناتك لأغراض التسويق.\n\nللتواصل بشأن هذه الحقوق: sarh@sarhsa.online`,
  },
  {
    title: 'حفظ البيانات وأمانها',
    content: `نحفظ بياناتك على خوادم آمنة داخل المملكة العربية السعودية وفق أعلى معايير التشفير. نحتفظ ببياناتك طوال فترة نشاط حسابك، وبعد حذفه لمدة لا تتجاوز ما يقتضيه القانون.`,
  },
  {
    title: 'التعديلات على السياسة',
    content: `يحق لنا تعديل هذه السياسة في أي وقت. سيُبلَّغ المستخدمون بأي تغييرات جوهرية عبر إشعار داخل التطبيق. استمرارك في استخدام المنصة بعد التعديل يُعدّ موافقةً على السياسة المُعدَّلة.`,
  },
];

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="سياسة الخصوصية" showBack />
      <AppScrollView contentContainerStyle={styles.scroll}>

        {/* Banner */}
        <View style={styles.topBanner}>
          <AppIcon name="shield-checkmark" size={26} color={colors.electricBright} />
          <AppText variant="heading3" color="textPrimary">خصوصيتك تهمّنا</AppText>
          <AppText variant="caption" color="textMuted">آخر تحديث: يناير 2024</AppText>
        </View>

        <SarhDivider />

        {SECTIONS.map((sec, i) => (
          <View key={i}>
            <View style={styles.section}>
              <AppText variant="label" color="textPrimary">{sec.title}</AppText>
              <AppText variant="body" color="textSecondary" style={styles.sectionContent}>
                {sec.content}
              </AppText>
            </View>
            {i < SECTIONS.length - 1 ? <SarhDivider /> : null}
          </View>
        ))}

        <SarhDivider />

        {/* Contact */}
        <View style={styles.section}>
          <AppText variant="label" color="textPrimary">تواصل معنا</AppText>
          <AppText variant="body" color="textSecondary">لأي استفسار حول سياسة الخصوصية:</AppText>
          {[
            { icon: 'mail-outline', href: 'mailto:sarh@sarhsa.online', text: 'sarh@sarhsa.online' },
            { icon: 'call-outline', href: 'tel:+966591298136', text: '+966 591 298 136' },
          ].map((item) => (
            <Pressable
              key={item.href}
              style={({ pressed }) => [styles.contactRow, { opacity: pressed ? 0.7 : 1 }]}
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
    sectionContent: { lineHeight: 26 },
    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    footer: {
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
  });
}
