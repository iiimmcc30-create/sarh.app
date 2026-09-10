import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { radius, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow, rtlForwardIcon, rtlInputText } from '@/lib/rtl';
import { AppText, SarhDivider } from '@/design-system/components';
import { Alert, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

const CHANNELS = [
  {
    icon: 'call',
    label: 'الهاتف',
    value: '+966 591 298 136',
    href: 'tel:+966591298136',
  },
  {
    icon: 'whatsapp',
    label: 'واتساب',
    value: '+966 591 298 136',
    href: 'https://wa.me/966591298136',
  },
  {
    icon: 'mail',
    label: 'البريد الإلكتروني',
    value: 'sarh@sarhsa.online',
    href: 'mailto:sarh@sarhsa.online',
  },
  {
    icon: 'globe-outline',
    label: 'الموقع الإلكتروني',
    value: 'sarhsa.online',
    href: 'https://sarhsa.online',
  },
];

export default function ContactScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScreenHeader title="تواصل معنا" showBack />
      <AppScrollView contentContainerStyle={styles.scroll}>

        {/* Channels */}
        <View style={styles.section}>
          <AppText variant="label" color="textSecondary">قنوات التواصل</AppText>
          <View style={styles.channelList}>
            {CHANNELS.map((ch, idx) => (
              <View key={ch.href}>
                <Pressable
                  style={({ pressed }) => [
                    styles.channelRow,
                    getRtlRow(),
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => Linking.openURL(ch.href)}
                >
                  <View style={styles.channelIconWrap}>
                    <AppIcon name={ch.icon} size={18} color={colors.electricBright} />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <AppText variant="caption" color="textMuted">{ch.label}</AppText>
                    <AppText variant="label" color="textPrimary">{ch.value}</AppText>
                  </View>
                  <AppIcon name={rtlForwardIcon()} size={16} color={colors.textMuted} />
                </Pressable>
                {idx < CHANNELS.length - 1 ? <SarhDivider inset /> : null}
              </View>
            ))}
          </View>
        </View>

        {/* Message form */}
        <View style={styles.section}>
          <AppText variant="label" color="textSecondary">أرسل رسالة مباشرة</AppText>
          <View style={styles.formCard}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="اسمك"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, rtlInputText]}
              returnKeyType="next"
            />
            <SarhDivider />
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="رسالتك"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, styles.inputMultiline, rtlInputText]}
              multiline
              numberOfLines={4}
              returnKeyType="send"
              textAlignVertical="top"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={sending}
            onPress={handleSend}
            style={({ pressed }) => [
              styles.sendBtn,
              { opacity: pressed || sending ? 0.7 : 1 },
            ]}
          >
            <AppIcon name="send" size={16} color={colors.screenRoot} />
            <AppText variant="label" style={{ color: colors.screenRoot }}>
              {sending ? 'جارٍ الإرسال…' : 'إرسال عبر البريد'}
            </AppText>
          </Pressable>
        </View>

        {/* Working hours */}
        <View style={styles.section}>
          <AppText variant="label" color="textSecondary">أوقات العمل</AppText>
          <AppText variant="body" color="textSecondary">
            الأحد — الخميس · ٩ص — ٦م (بتوقيت الرياض)
          </AppText>
        </View>

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

    channelList: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      overflow: 'hidden',
    },
    channelRow: {
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    channelIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      flexShrink: 0,
    },

    formCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      overflow: 'hidden',
    },
    input: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      color: colors.textPrimary,
      fontSize: 15,
      minHeight: 44,
    },
    inputMultiline: {
      minHeight: 100,
    },

    sendBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.electricBright,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      minHeight: 48,
    },
  });
}
