// SAFAT — Login screen (Sarh identity · reference layout)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { AppLogo } from '@/components/ui/AppLogo';
import {
  getRtlDirection,
  getRtlRow,
  getRtlText,
  marginEnd,
  marginStart,
} from '@/lib/rtl';
import { useAuth } from '@/contexts/AuthContext';
import {
  BRAND_LOGIN_SUBTITLE_AR,
  BRAND_NAME_AR,
  BRAND_TERMS_SHORT_AR,
} from '@/constants/brandCopy';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';

const SAUDI_DIAL = '+966';
const CONTROL_H = 52;
const LOGO_BOX = 88;

export default function PhoneScreen() {
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const router = useRouter();
  const { signInWithPassword, sendOtp } = useAuth();

  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [useOtpFlow, setUseOtpFlow] = useState(false);
  const [otpChannel, setOtpChannel] = useState<'sms' | 'whatsapp'>('sms');

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const cleanPhoneDigits = phone
    .trim()
    .replace(/\D/g, '')
    .replace(/^0/, '');
  const fullPhone = `${SAUDI_DIAL}${cleanPhoneDigits}`;
  const isPhoneValid = cleanPhoneDigits.length >= 9 && cleanPhoneDigits.startsWith('5');

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handlePasswordLogin = async () => {
    setError('');
    if (!isPhoneValid) {
      setError('أدخل رقم جوال صحيح');
      shake();
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      shake();
      return;
    }
    setLoading(true);
    const result = await signInWithPassword(fullPhone, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? 'بيانات الدخول غير صحيحة');
      shake();
      return;
    }
    router.replace('/(tabs)');
  };

  const handleSendOtp = async () => {
    setError('');
    if (!isPhoneValid) {
      setError('أدخل رقم جوال صحيح للتحقق');
      shake();
      return;
    }
    setLoading(true);
    const result = await sendOtp(fullPhone, otpChannel);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? 'فشل إرسال الرمز');
      shake();
      return;
    }
    router.push({
      pathname: '/auth/otp',
      params: { phone: fullPhone, channel: otpChannel, devMode: result.devMode ? '1' : '0' },
    });
  };

  const switchMode = (otp: boolean) => {
    setUseOtpFlow(otp);
    setError('');
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0a1620', '#07131C', '#040a10']}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[`${colors.electric}22`, 'transparent', 'transparent']}
        style={styles.skyGlow}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 0.45 }}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.header}>
              <View style={styles.logoBox}>
                <AppLogo size={LOGO_BOX - 16} showRing={false} />
              </View>
              <Text style={styles.brandName}>{BRAND_NAME_AR}</Text>
              <Text style={styles.brandSub}>{BRAND_LOGIN_SUBTITLE_AR}</Text>
              <Text style={styles.loginHeading}>تسجيل الدخول</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.tabBar}>
                <Pressable
                  onPress={() => switchMode(false)}
                  style={[styles.tabItem, !useOtpFlow && styles.tabItemActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: !useOtpFlow }}
                >
                  <AppIcon
                    name="lock-closed-outline"
                    size={17}
                    color={!useOtpFlow ? colors.electricBright : colors.textMuted}
                  />
                  <Text style={[styles.tabText, !useOtpFlow && styles.tabTextActive]}>
                    كلمة المرور
                  </Text>
                  {!useOtpFlow ? <View style={styles.tabUnderline} /> : null}
                </Pressable>
                <Pressable
                  onPress={() => switchMode(true)}
                  style={[styles.tabItem, useOtpFlow && styles.tabItemActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: useOtpFlow }}
                >
                  <AppIcon
                    name="chatbubble-ellipses-outline"
                    size={17}
                    color={useOtpFlow ? colors.electricBright : colors.textMuted}
                  />
                  <Text style={[styles.tabText, useOtpFlow && styles.tabTextActive]}>
                    رمز الجوال
                  </Text>
                  {useOtpFlow ? <View style={styles.tabUnderline} /> : null}
                </Pressable>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>رقم الجوال</Text>
                <Animated.View style={[styles.inputWrap, { transform: [{ translateX: shakeAnim }] }]}>
                  <AppIcon
                    name="call-outline"
                    size={18}
                    color={colors.textMuted}
                    style={styles.inputLeadingIcon}
                  />
                  <TextInput
                    style={styles.phoneInput}
                    value={phone}
                    onChangeText={(t) => {
                      setPhone(t.replace(/[^\d\s]/g, ''));
                      setError('');
                    }}
                    placeholder="05xxxxxxxx"
                    placeholderTextColor={colors.textSubtle}
                    keyboardType="phone-pad"
                    textAlign="right"
                    maxLength={10}
                    autoComplete="tel"
                    accessibilityLabel="05xxxxxxxx"
                  />
                </Animated.View>

                {useOtpFlow ? (
                  <View style={styles.otpBlock}>
                    <Text style={styles.fieldLabel}>طريقة إرسال الرمز</Text>
                    <View style={styles.channelRow}>
                      <Pressable
                        style={[styles.channelBtn, otpChannel === 'sms' && styles.channelBtnActive]}
                        onPress={() => setOtpChannel('sms')}
                      >
                        <AppIcon
                          name="mail-outline"
                          size={16}
                          color={otpChannel === 'sms' ? colors.electricBright : colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.channelLabel,
                            otpChannel === 'sms' && styles.channelLabelActive,
                          ]}
                        >
                          رسالة نصية
                        </Text>
                      </Pressable>
                      <Pressable
                        style={[
                          styles.channelBtn,
                          otpChannel === 'whatsapp' && styles.channelBtnActive,
                        ]}
                        onPress={() => setOtpChannel('whatsapp')}
                      >
                        <AppIcon
                          name="whatsapp"
                          size={16}
                          color={otpChannel === 'whatsapp' ? '#25D366' : colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.channelLabel,
                            otpChannel === 'whatsapp' && styles.channelLabelWhatsapp,
                          ]}
                        >
                          واتساب
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  <View style={styles.passwordBlock}>
                    <Text style={styles.fieldLabel}>كلمة المرور</Text>
                    <View style={styles.inputWrap}>
                      <AppIcon
                        name="lock-closed-outline"
                        size={18}
                        color={colors.textMuted}
                        style={styles.inputLeadingIcon}
                      />
                      <TextInput
                        style={styles.textInput}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="أدخل كلمة المرور"
                        placeholderTextColor={colors.textSubtle}
                        secureTextEntry={!showPassword}
                        textAlign="right"
                        autoComplete="password"
                      />
                      <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                        <AppIcon
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={colors.textMuted}
                        />
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <AppIcon name="alert-circle-outline" size={15} color={colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {!useOtpFlow ? (
                <View style={styles.rememberRow}>
                  <Pressable
                    onPress={() => setRememberMe(!rememberMe)}
                    style={styles.rememberLeft}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: rememberMe }}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                      {rememberMe ? <AppIcon name="checkmark" size={12} color="#fff" /> : null}
                    </View>
                    <Text style={styles.rememberText}>تذكرني</Text>
                  </Pressable>
                  <Pressable onPress={() => router.push('/auth/forgot-password')} hitSlop={8}>
                    <Text style={styles.forgotLink}>نسيت كلمة المرور؟</Text>
                  </Pressable>
                </View>
              ) : null}

              <Pressable
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={useOtpFlow ? handleSendOtp : handlePasswordLogin}
                disabled={loading}
              >
                <LinearGradient
                  colors={gradients.electric}
                  style={styles.submitGrad}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.submitText}>
                      {useOtpFlow ? 'إرسال رمز التحقق' : 'تسجيل الدخول'}
                    </Text>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            <View style={styles.footer}>
              <Pressable onPress={() => router.push('/auth/register')}>
                <Text style={styles.footerMuted}>ليس لديك حساب؟</Text>
                <Text style={styles.footerLinkActive}>إنشاء حساب</Text>
              </Pressable>
              <Text style={styles.disclaimerText}>
                بالمتابعة أنت توافق على{' '}
                <Text style={styles.disclaimerLink} onPress={() => router.push('/info/terms')}>
                  {BRAND_TERMS_SHORT_AR}
                </Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bgDeep,
      ...getRtlDirection(),
    },
    skyGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 360,
    },
    safe: { flex: 1 },
    kav: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xxxl,
      alignItems: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xl,
      gap: 6,
      width: '100%',
    },
    logoBox: {
      width: LOGO_BOX,
      height: LOGO_BOX,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(16, 38, 51, 0.92)',
      borderWidth: 1,
      borderColor: colors.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
      overflow: 'hidden',
    },
    brandName: {
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
      fontSize: 26,
      lineHeight: 34,
      color: colors.electricBright,
      textAlign: 'center',
    },
    brandSub: {
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loginHeading: {
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
      fontSize: 32,
      lineHeight: 42,
      color: colors.textPrimary,
      textAlign: 'center',
      marginTop: spacing.sm,
    },
    card: {
      width: '100%',
      maxWidth: 520,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      backgroundColor: 'rgba(12, 28, 39, 0.88)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      gap: spacing.lg,
    },
    tabBar: {
      ...getRtlRow(),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderHairline,
    },
    tabItem: {
      flex: 1,
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingBottom: spacing.sm,
      paddingTop: spacing.xs,
      position: 'relative',
    },
    tabItemActive: {},
    tabText: {
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
      fontSize: 14,
      color: colors.textMuted,
    },
    tabTextActive: {
      color: colors.textPrimary,
    },
    tabUnderline: {
      position: 'absolute',
      bottom: 0,
      left: spacing.sm,
      right: spacing.sm,
      height: 2,
      borderRadius: 1,
      backgroundColor: colors.electric,
    },
    formGroup: { gap: spacing.sm, width: '100%' },
    fieldLabel: {
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
      fontSize: 14,
      color: colors.textPrimary,
      ...getRtlText(),
      marginBottom: 2,
    },
    forgotLink: {
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
      fontSize: 13,
      color: colors.electricBright,
      textDecorationLine: 'underline',
    },
    inputWrap: {
      ...getRtlRow(),
      alignItems: 'center',
      backgroundColor: 'rgba(7, 19, 28, 0.72)',
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.borderHairline,
      paddingHorizontal: spacing.md,
      height: CONTROL_H,
      width: '100%',
    },
    inputLeadingIcon: marginEnd(10),
    textInput: {
      flex: 1,
      ...typography.body,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      height: '100%',
      ...getRtlText(),
    },
    phoneInput: {
      flex: 1,
      ...typography.body,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      height: '100%',
      ...getRtlText(),
    },
    passwordBlock: { gap: spacing.sm },
    otpBlock: { gap: spacing.sm, marginTop: spacing.xs },
    channelRow: {
      ...getRtlRow(),
      gap: spacing.sm,
    },
    channelBtn: {
      flex: 1,
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 44,
      borderRadius: radius.md,
      backgroundColor: 'rgba(7, 19, 28, 0.72)',
      borderWidth: 1,
      borderColor: colors.borderHairline,
    },
    channelBtnActive: {
      borderColor: colors.electric,
      backgroundColor: `${colors.electric}12`,
    },
    channelLabel: {
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
      fontSize: 13,
      color: colors.textMuted,
    },
    channelLabelActive: {
      color: colors.electricBright,
    },
    channelLabelWhatsapp: {
      color: '#25D366',
    },
    errorContainer: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      padding: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.2)',
      width: '100%',
    },
    errorText: {
      ...typography.caption,
      color: colors.danger,
      ...getRtlText(),
      flex: 1,
    },
    rememberRow: {
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    rememberLeft: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: spacing.sm,
    },
    rememberText: {
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
      fontSize: 13,
      color: colors.textMuted,
      ...getRtlText(),
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.borderHairline,
      backgroundColor: 'rgba(7, 19, 28, 0.72)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.electric,
      borderColor: colors.electric,
    },
    submitBtn: {
      width: '100%',
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitGrad: {
      height: CONTROL_H,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitText: {
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
      fontSize: 16,
      color: '#fff',
    },
    footer: {
      alignItems: 'center',
      marginTop: spacing.xl,
      gap: spacing.md,
      width: '100%',
    },
    footerMuted: {
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
    },
    footerLinkActive: {
      fontFamily: OFFICIAL_APP_FONT,
      fontWeight: '700',
      fontSize: 15,
      color: colors.electricBright,
      textAlign: 'center',
      marginTop: 4,
    },
    disclaimerText: {
      ...typography.caption,
      color: colors.textSubtle,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: spacing.lg,
    },
    disclaimerLink: {
      color: colors.textBrandStrong,
      fontWeight: '600',
    },
  });
}
