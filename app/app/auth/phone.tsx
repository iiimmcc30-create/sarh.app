// SAFAT — Login screen (modern RTL-first layout)
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
import { radius, shadow, spacing, typography, type ThemeColors } from '@/constants/theme';
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
  BRAND_LOGIN_WELCOME_AR,
  BRAND_TERMS_SHORT_AR,
} from '@/constants/brandCopy';

const COUNTRY_CODES = [{ flag: '🇸🇦', code: '+966', label: 'السعودية' }];
const CONTROL_H = 52;

export default function PhoneScreen() {
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const router = useRouter();
  const { signInWithPassword, sendOtp } = useAuth();

  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [phone, setPhone] = useState('');
  const [countryIdx, setCountryIdx] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [useOtpFlow, setUseOtpFlow] = useState(false);
  const [otpChannel, setOtpChannel] = useState<'sms' | 'whatsapp'>('sms');

  const shakeAnim = useRef(new Animated.Value(0)).current;
  const currentCountry = COUNTRY_CODES[countryIdx];
  const cleanPhoneDigits = phone
    .trim()
    .replace(/^\+/, '')
    .replace(
      new RegExp(
        `^(?:${currentCountry.code.replace('+', '')}|00${currentCountry.code.replace('+', '')})`,
      ),
      '',
    )
    .replace(/^0/, '');
  const fullPhone = `${currentCountry.code}${cleanPhoneDigits}`;
  const isPhoneValid = cleanPhoneDigits.replace(/\D/g, '').length >= 9;

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
        colors={[`${colors.electric}18`, 'transparent']}
        style={styles.heroGlow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
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
              <AppLogo size={80} showRing={false} />
              <Text style={styles.title}>{BRAND_LOGIN_WELCOME_AR}</Text>
              <Text style={styles.sub}>{BRAND_LOGIN_SUBTITLE_AR}</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.modeSwitch}>
                <Pressable
                  onPress={() => switchMode(false)}
                  style={[styles.modeItem, !useOtpFlow && styles.modeItemActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: !useOtpFlow }}
                >
                  <AppIcon
                    name="lock-closed-outline"
                    size={16}
                    color={!useOtpFlow ? colors.electricBright : colors.textMuted}
                  />
                  <Text style={[styles.modeText, !useOtpFlow && styles.modeTextActive]}>
                    كلمة المرور
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => switchMode(true)}
                  style={[styles.modeItem, useOtpFlow && styles.modeItemActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: useOtpFlow }}
                >
                  <AppIcon
                    name="chatbubble-ellipses-outline"
                    size={16}
                    color={useOtpFlow ? colors.electricBright : colors.textMuted}
                  />
                  <Text style={[styles.modeText, useOtpFlow && styles.modeTextActive]}>
                    رمز الجوال
                  </Text>
                </Pressable>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.fieldLabel}>رقم الجوال</Text>
                <Animated.View style={[styles.inputWrap, { transform: [{ translateX: shakeAnim }] }]}>
                  <Pressable
                    style={styles.countryBtn}
                    onPress={() => setShowPicker((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel="اختيار الدولة"
                  >
                    <AppIcon
                      name={showPicker ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color={colors.textMuted}
                    />
                    <Text style={styles.countryCode}>{currentCountry.code}</Text>
                    <Text style={styles.countryFlag}>{currentCountry.flag}</Text>
                  </Pressable>
                  <View style={styles.inputDivider} />
                  <TextInput
                    style={styles.phoneInput}
                    value={phone}
                    onChangeText={(t) => {
                      setPhone(t);
                      setError('');
                    }}
                    placeholder="05xxxxxxxx"
                    placeholderTextColor={colors.textSubtle}
                    keyboardType="phone-pad"
                    textAlign="right"
                    maxLength={12}
                    autoComplete="tel"
                    accessibilityLabel="05xxxxxxxx"
                  />
                  <AppIcon
                    name="call-outline"
                    size={18}
                    color={colors.textMuted}
                    style={styles.inputIcon}
                  />
                </Animated.View>

                {showPicker ? (
                  <View style={styles.pickerDropdown}>
                    {COUNTRY_CODES.map((c, i) => (
                      <Pressable
                        key={c.code}
                        style={[styles.pickerItem, i === countryIdx && styles.pickerItemActive]}
                        onPress={() => {
                          setCountryIdx(i);
                          setShowPicker(false);
                        }}
                      >
                        <Text style={styles.pickerFlag}>{c.flag}</Text>
                        <Text style={styles.pickerLabel}>{c.label}</Text>
                        <Text style={styles.pickerCode}>{c.code}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

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
                    <View style={styles.fieldHeader}>
                      <Text style={styles.fieldLabel}>كلمة المرور</Text>
                      <Pressable
                        onPress={() => router.push('/auth/forgot-password')}
                        hitSlop={8}
                      >
                        <Text style={styles.forgotLink}>نسيت كلمة المرور؟</Text>
                      </Pressable>
                    </View>
                    <View style={styles.inputWrap}>
                      <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                        <AppIcon
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={colors.textMuted}
                        />
                      </Pressable>
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
                      <AppIcon
                        name="lock-closed-outline"
                        size={18}
                        color={colors.textMuted}
                        style={styles.inputIcon}
                      />
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

              <Pressable
                onPress={() => setRememberMe(!rememberMe)}
                style={styles.rememberRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: rememberMe }}
              >
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                  {rememberMe ? <AppIcon name="checkmark" size={12} color="#fff" /> : null}
                </View>
                <Text style={styles.rememberText}>البقاء قيد تسجيل الدخول</Text>
              </Pressable>

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
                <Text style={styles.footerLinkText}>
                  ليس لديك حساب؟{' '}
                  <Text style={styles.footerLinkActive}>إنشاء حساب</Text>
                </Text>
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
      backgroundColor: colors.screenRoot,
      ...getRtlDirection(),
    },
    heroGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 280,
    },
    safe: { flex: 1 },
    kav: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxxl,
      alignItems: 'center',
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xl,
      gap: spacing.sm,
      width: '100%',
    },
    title: {
      ...typography.h1,
      fontSize: 28,
      lineHeight: 36,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    sub: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
      lineHeight: 20,
    },
    card: {
      width: '100%',
      maxWidth: 520,
      borderRadius: radius.xl,
      padding: spacing.lg,
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      gap: spacing.lg,
      ...shadow.card,
    },
    modeSwitch: {
      ...getRtlRow(),
      backgroundColor: colors.bgDeep,
      borderRadius: radius.lg,
      padding: 4,
      gap: 4,
    },
    modeItem: {
      flex: 1,
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 42,
      borderRadius: radius.md,
    },
    modeItemActive: {
      backgroundColor: colors.bgElevated,
    },
    modeText: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '600',
    },
    modeTextActive: {
      color: colors.textPrimary,
    },
    formGroup: { gap: spacing.sm, width: '100%' },
    fieldHeader: {
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
    },
    fieldLabel: {
      ...typography.smallHeading,
      color: colors.textPrimary,
      ...getRtlText(),
    },
    forgotLink: {
      ...typography.caption,
      color: colors.textBrandStrong,
      fontWeight: '600',
    },
    inputWrap: {
      ...getRtlRow(),
      alignItems: 'center',
      backgroundColor: colors.bgDeep,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderHairline,
      paddingHorizontal: spacing.md,
      height: CONTROL_H,
      width: '100%',
    },
    inputIcon: marginStart(8),
    textInput: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      height: '100%',
      ...getRtlText(),
    },
    countryBtn: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 4,
      height: '100%',
    },
    countryCode: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    countryFlag: { fontSize: 16 },
    inputDivider: {
      width: StyleSheet.hairlineWidth,
      height: 24,
      backgroundColor: colors.borderHairline,
      ...marginEnd(8),
      ...marginStart(4),
    },
    phoneInput: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      height: '100%',
      ...getRtlText(),
    },
    pickerDropdown: {
      backgroundColor: colors.bgDeep,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderHairline,
      overflow: 'hidden',
      width: '100%',
    },
    pickerItem: {
      ...getRtlRow(),
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderHairline,
    },
    pickerItemActive: {
      backgroundColor: `${colors.electric}14`,
    },
    pickerFlag: { fontSize: 16 },
    pickerLabel: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      ...getRtlText(),
      ...marginEnd(10),
    },
    pickerCode: {
      ...typography.caption,
      color: colors.textMuted,
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
      borderRadius: radius.lg,
      backgroundColor: colors.bgDeep,
      borderWidth: 1,
      borderColor: colors.borderHairline,
    },
    channelBtnActive: {
      borderColor: colors.electric,
      backgroundColor: `${colors.electric}12`,
    },
    channelLabel: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '600',
    },
    channelLabelActive: {
      color: colors.electricBright,
    },
    channelLabelWhatsapp: {
      color: '#25D366',
      fontWeight: '600',
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
      justifyContent: 'flex-start',
      gap: spacing.sm,
      width: '100%',
    },
    rememberText: {
      ...typography.caption,
      color: colors.textMuted,
      ...getRtlText(),
    },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.borderHairline,
      backgroundColor: colors.bgDeep,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.electric,
      borderColor: colors.electric,
    },
    submitBtn: {
      width: '100%',
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    submitBtnDisabled: { opacity: 0.7 },
    submitGrad: {
      height: CONTROL_H,
      alignItems: 'center',
      justifyContent: 'center',
    },
    submitText: {
      ...typography.button,
      color: '#fff',
    },
    footer: {
      alignItems: 'center',
      marginTop: spacing.xl,
      gap: spacing.md,
      width: '100%',
    },
    footerLinkText: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
    },
    footerLinkActive: {
      color: colors.textBrandStrong,
      fontWeight: '700',
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
