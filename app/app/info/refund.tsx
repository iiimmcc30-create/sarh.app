import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { AppText, SarhDivider } from '@/design-system/components';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const REFUND_SECTIONS = [
  {
    title: 'نطاق سياسة الاسترداد',
    content: `تنطبق هذه السياسة على جميع الاشتراكات والمدفوعات التي تتم عبر منصة سرح. نحن نسعى دائماً لضمان رضا مستخدمينا، وندرك أن قد تنشأ حالات تستدعي إعادة النظر في المدفوعات.`,
  },
  {
    title: 'حالات الاسترداد المقبولة',
    content: `• في حال وجود خطأ تقني أدى إلى خصم مزدوج.\n• في حال عدم تفعيل الخدمة المدفوعة خلال 24 ساعة من الدفع.\n• في حال الإلغاء خلال 48 ساعة من الاشتراك الأول وعدم استخدام أي مزايا مدفوعة.\n• في حال إيقاف الخدمة من قِبل المنصة خلال مدة الاشتراك الفعلية.`,
  },
  {
    title: 'حالات عدم القبول',
    content: `• طلبات الاسترداد بعد مرور أكثر من 7 أيام من تاريخ الدفع.\n• الاشتراكات التي استُخدمت مزاياها بالكامل أو جزئياً.\n• في حال إغلاق الحساب طوعياً من قِبل المستخدم.\n• الإعلانات والمنشورات المنشورة ضمن الباقة المدفوعة.`,
  },
  {
    title: 'إجراءات طلب الاسترداد',
    content: `١. تواصل مع فريق الدعم عبر صفحة "تواصل معنا".\n٢. أرسل رقم الطلب أو معرّف الدفع مع وصف المشكلة.\n٣. سيتم مراجعة طلبك خلال 3-5 أيام عمل.\n٤. في حال القبول، يُعاد المبلغ خلال 7-14 يوم عمل إلى وسيلة الدفع الأصلية.`,
  },
  {
    title: 'الجزئي مقابل الكامل',
    content: `قد يُقدَّم استرداد جزئي في حال استخدام جزء من الخدمة. يُحتسب ذلك بناءً على الأيام المتبقية من الاشتراك وفق الصيغة التالية: (المبلغ المدفوع ÷ عدد أيام الاشتراك) × عدد الأيام غير المستخدمة.`,
  },
  {
    title: 'العملات والرسوم',
    content: `جميع المبالغ المستردة بالعملة الأصلية للدفع. لا تتحمل المنصة أي رسوم تحويل أو رسوم بنكية تنشأ عن عملية الاسترداد، وهي تقع على عاتق المستخدم.`,
  },
  {
    title: 'التواصل',
    content: `للاستفسار أو تقديم طلب استرداد:\n📧 sarh@sarhsa.online\nأو عبر صفحة تواصل معنا داخل التطبيق.`,
  },
];

export default function RefundScreen() {
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="سياسة الاسترداد" showBack />
      <AppScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.section}>
          <AppText variant="caption" color="textMuted">
            آخر تحديث: يوليو ٢٠٢٥ · هذه السياسة جزء من شروط وأحكام منصة سرح وتنظّم حالات استرداد المبالغ المدفوعة.
          </AppText>
        </View>

        <SarhDivider />

        {REFUND_SECTIONS.map((section, i) => (
          <View key={i}>
            <View style={styles.section}>
              <AppText variant="label" color="textPrimary">{section.title}</AppText>
              <AppText variant="body" color="textSecondary" style={styles.body}>
                {section.content}
              </AppText>
            </View>
            {i < REFUND_SECTIONS.length - 1 ? <SarhDivider /> : null}
          </View>
        ))}

        <AppText variant="micro" color="textMuted" align="center" style={styles.footer}>
          سرح · جميع الحقوق محفوظة
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
    section: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: spacing.sm,
    },
    body: { lineHeight: 24 },
    footer: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  });
}
