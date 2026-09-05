// Powered by OnSpace.AI
// SAFAT — Contact Us (تواصل معنا)
import { AppIcon } from '@/components/ui/FlaticonIcon';

import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { useRouter } from 'expo-router';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow, rtlBackIcon, rtlForwardIcon } from '@/lib/rtl';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';

export default function ContactScreen() {
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const router = useRouter();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!name.trim() || !message.trim()) {
      Alert.alert('تنبيه', 'يرجى تعبئة الاسم والرسالة');
      return;
    }
    setSending(true);
    const subject = encodeURIComponent(`رسالة من ${name} - تطبيق سرح`);
    const body = encodeURIComponent(`الاسم: ${name}\n\n${message}`);
    await Linking.openURL(`mailto:sarh@sarhsa.online?subject=${subject}&body=${body}`);
    setSending(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerTitleShell}>
          <Text style={styles.headerTitle}>تواصل معنا</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Channels */}
        <View style={styles.section}>
          <RtlTextShell>
            <RtlText style={styles.sectionTitle}>قنوات التواصل</RtlText>
          </RtlTextShell>

          <Pressable
            style={[styles.channelCard, getRtlRow()]}
            onPress={() => Linking.openURL('tel:+966591298136')}
          >
            <LinearGradient colors={['#162149', '#1E3A8A']} style={styles.channelIcon}>
              <AppIcon name="call" size={22} color={colors.electricBright} />
            </LinearGradient>
            <View style={styles.channelTextShell}>
              <Text style={styles.channelLabel}>الهاتف والواتساب</Text>
              <Text style={styles.channelValue}>+966 591 298 136</Text>
            </View>
            <AppIcon name={rtlForwardIcon()} size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.channelCard, getRtlRow()]}
            onPress={() => Linking.openURL('https://wa.me/966591298136')}
          >
            <LinearGradient colors={['#18965B', '#20B66F']} style={styles.channelIcon}>
              <AppIcon name="whatsapp" size={22} color="#fff" />
            </LinearGradient>
            <View style={styles.channelTextShell}>
              <Text style={styles.channelLabel}>واتساب</Text>
              <Text style={styles.channelValue}>+966 591 298 136</Text>
            </View>
            <AppIcon name={rtlForwardIcon()} size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.channelCard, getRtlRow()]}
            onPress={() => Linking.openURL('mailto:sarh@sarhsa.online')}
          >
            <LinearGradient colors={['#3730a3', '#6366f1']} style={styles.channelIcon}>
              <AppIcon name="mail" size={22} color="#fff" />
            </LinearGradient>
            <View style={styles.channelTextShell}>
              <Text style={styles.channelLabel}>البريد الإلكتروني</Text>
              <Text style={styles.channelValue}>sarh@sarhsa.online</Text>
            </View>
            <AppIcon name={rtlForwardIcon()} size={18} color={colors.textMuted} />
          </Pressable>

          <Pressable
            style={[styles.channelCard, getRtlRow()]}
            onPress={() => Linking.openURL('https://sarhsa.online')}
          >
            <LinearGradient colors={['#0f4c75', '#1B6CA8']} style={styles.channelIcon}>
              <AppIcon name="globe" size={22} color="#fff" />
            </LinearGradient>
            <View style={styles.channelTextShell}>
              <Text style={styles.channelLabel}>الموقع الإلكتروني</Text>
              <Text style={styles.channelValue}>sarhsa.online</Text>
            </View>
            <AppIcon name={rtlForwardIcon()} size={18} color={colors.textMuted} />
          </Pressable>
        </View>

        {/* Message form */}
        <View style={styles.section}>
          <RtlTextShell>
            <RtlText style={styles.sectionTitle}>أرسل رسالة</RtlText>
          </RtlTextShell>

          <View style={styles.fieldGroup}>
            <RtlTextShell>
              <RtlText style={styles.fieldLabel}>الاسم</RtlText>
            </RtlTextShell>
            <View style={styles.inputWrap}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="اسمك الكريم"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.inputRtl]}
                textAlign="right"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <RtlTextShell>
              <RtlText style={styles.fieldLabel}>الرسالة</RtlText>
            </RtlTextShell>
            <View style={[styles.inputWrap, { alignItems: 'flex-start', paddingVertical: spacing.sm }]}>
              <TextInput
                value={message}
                onChangeText={setMessage}
                placeholder="اكتب رسالتك هنا..."
                placeholderTextColor={colors.textMuted}
                style={[styles.input, styles.inputRtl, { height: 100, textAlignVertical: 'top' }]}
                multiline
                textAlign="right"
              />
            </View>
          </View>

          <Pressable
            style={[styles.sendBtn, sending && { opacity: 0.6 }]}
            onPress={handleSend}
            disabled={sending}
          >
            <LinearGradient colors={gradients.royal} style={[styles.sendBtnInner, getRtlRow()]}>
              <AppIcon name="send" size={18} color="#fff" />
              <Text style={styles.sendBtnText}>{sending ? 'جارٍ الإرسال...' : 'إرسال عبر البريد'}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        <RtlTextShell>
          <RtlText style={styles.footer}>نرد على جميع الرسائل خلال 24 ساعة في أيام العمل</RtlText>
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
    scroll: { paddingBottom: 40 },
    /** Physical LTR shell — same as listing title / SidebarMenuItem. */
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
      marginBottom: spacing.sm,
    },
    channelCard: {
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    channelIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    channelTextShell: {
      flex: 1,
      minWidth: 0,
            gap: 2,
    },
    channelLabel: {
      ...typography.caption,
      color: colors.textMuted,
    },
    channelValue: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      width: '100%',
            writingDirection: 'ltr',
    },
    fieldGroup: { gap: spacing.sm },
    fieldLabel: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '600',
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    input: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      paddingVertical: 12,
    },
    inputRtl: {
    },
    sendBtn: { borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.sm },
    sendBtnInner: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
    },
    sendBtnText: {
      ...typography.bodyStrong,
      color: '#fff',
    },
    footer: {
      ...typography.caption,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'center',
      writingDirection: 'rtl',
      marginTop: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
  });
}
