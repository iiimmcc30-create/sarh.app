// SAFAT — Login (واجهة دخول بأسلوب iOS)
import { AppIcon } from '@/components/ui/FlaticonIcon';
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
import { getRtlText, getRtlRow } from '@/lib/rtl';
import { useAuth } from '@/contexts/AuthContext';
import {
  BRAND_LOGIN_SUBTITLE_AR,
  BRAND_NAME_AR,
  BRAND_TERMS_SHORT_AR,
} from '@/constants/brandCopy';

const COUNTRY_CODES = [{ flag: '🇸🇦', code: '+966', label: 'السعودية' }];

export default function PhoneScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const router = useRouter();
  const { signInWithPassword, sendOtp } = useAuth();

  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [phone, setPhone] = useState('');
  const [countryIdx, setCountryIdx] = useState(0);
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
      new RegExp(`^(?:${currentCountry.code.replace('+', '')}|00${currentCountry.code.replace('+', '')})`),
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

  return (
    <View style={styles.root}>
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
            <View style={styles.hero}>
              <AppLogo size={64} showRing={false} />
              <Text style={styles.largeTitle}>تسجيل الدخول</Text>
              <Text style={styles.sub}>
                {BRAND_NAME_AR} · {BRAND_LOGIN_SUBTITLE_AR}
              </Text>
            </View>

            <View style={styles.segment}>
              <Pressable
                onPress={() => {
                  setUseOtpFlow(false);
                  setError('');
                }}
                style={[styles.segmentItem, !useOtpFlow && styles.segmentItemActive]}
              >
                <Text style={[styles.segmentText, !useOtpFlow && styles.segmentTextActive]}>
                  كلمة المرور
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  setUseOtpFlow(true);
                  setError('');
                }}
                style={[styles.segmentItem, useOtpFlow && styles.segmentItemActive]}
              >
                <Text style={[styles.segmentText, useOtpFlow && styles.segmentTextActive]}>
                  رمز الجوال
                </Text>
              </Pressable>
            </View>

            <Animated.View style={[styles.group, { transform: [{ translateX: shakeAnim }] }]}>
              <View style={styles.row}>
                <TextInput
                  style={styles.rowInput}
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t);
                    setError('');
                  }}
                  placeholder="5xxxxxxxx"
                  placeholderTextColor={colors.textSubtle}
                  keyboardType="phone-pad"
                  textAlign="right"
                  maxLength={12}
                  autoComplete="tel"
                />
                <Text style={styles.rowPrefix}>{currentCountry.code}</Text>
              </View>

              {!useOtpFlow ? (
                <>
                  <View style={styles.rowDivider} />
                  <View style={styles.row}>
                    <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                      <AppIcon
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </Pressable>
                    <TextInput
                      style={styles.rowInput}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="كلمة المرور"
                      placeholderTextColor={colors.textSubtle}
                      secureTextEntry={!showPassword}
                      textAlign="right"
                      autoComplete="password"
                    />
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.rowDivider} />
                  <View style={[styles.row, styles.channelInner]}>
                    <Pressable
                      onPress={() => setOtpChannel('whatsapp')}
                      style={[styles.miniChip, otpChannel === 'whatsapp' && styles.miniChipActive]}
                    >
                      <Text
                        style={[
                          styles.miniChipText,
                          otpChannel === 'whatsapp' && styles.miniChipTextActive,
                        ]}
                      >
                        واتساب
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setOtpChannel('sms')}
                      style={[styles.miniChip, otpChannel === 'sms' && styles.miniChipActive]}
                    >
                      <Text
                        style={[
                          styles.miniChipText,
                          otpChannel === 'sms' && styles.miniChipTextActive,
                        ]}
                      >
                        رسالة نصية
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </Animated.View>

            {!useOtpFlow ? (
              <Pressable
                onPress={() => router.push('/auth/forgot-password')}
                style={styles.forgotBtn}
              >
                <Text style={styles.link}>نسيت كلمة المرور؟</Text>
              </Pressable>
            ) : null}

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Pressable
              style={({ pressed }) => [
                styles.cta,
                (!isPhoneValid || loading) && styles.ctaDisabled,
                pressed && !loading && styles.ctaPressed,
              ]}
              onPress={useOtpFlow ? handleSendOtp : handlePasswordLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.ctaText}>
                  {useOtpFlow ? 'إرسال الرمز' : 'متابعة'}
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => setRememberMe(!rememberMe)}
              style={[styles.rememberRow, getRtlRow()]}
            >
              <Text style={styles.rememberText}>البقاء قيد تسجيل الدخول</Text>
              <View style={[styles.iosCheck, rememberMe && styles.iosCheckOn]}>
                {rememberMe ? <AppIcon name="checkmark" size={12} color="#fff" /> : null}
              </View>
            </Pressable>

            <View style={styles.footer}>
              <Pressable onPress={() => router.push('/auth/register')}>
                <Text style={styles.footerText}>
                  ليس لديك حساب؟ <Text style={styles.link}>إنشاء حساب</Text>
                </Text>
              </Pressable>
              <Text style={styles.disclaimer}>
                بالمتابعة أنت توافق على{' '}
                <Text style={styles.link} onPress={() => router.push('/info/terms')}>
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
    root: { flex: 1, backgroundColor: colors.screenRoot },
    safe: { flex: 1 },
    kav: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: 22,
      paddingTop: 28,
      paddingBottom: 32,
    },
    hero: {
      alignItems: 'center',
      marginBottom: 28,
      gap: 8,
    },
    largeTitle: {
      ...typography.h1,
      fontSize: 32,
      lineHeight: 40,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    sub: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
    },
    segment: {
      ...getRtlRow(),
      backgroundColor: colors.bgElevated,
      borderRadius: 10,
      padding: 3,
      marginBottom: 16,
    },
    segmentItem: {
      flex: 1,
      height: 34,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentItemActive: {
      backgroundColor: colors.bgSurface,
    },
    segmentText: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '600',
    },
    segmentTextActive: {
      color: colors.textPrimary,
    },
    group: {
      backgroundColor: colors.bgSurface,
      borderRadius: 14,
      overflow: 'hidden',
    },
    row: {
      ...getRtlRow(),
      alignItems: 'center',
      minHeight: 52,
      paddingHorizontal: 14,
      gap: 10,
    },
    rowDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderHairline,
      marginStart: 14,
    },
    rowInput: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      height: 52,
      textAlign: 'right',
    },
    rowPrefix: {
      ...typography.body,
      color: colors.textMuted,
    },
    channelInner: {
      justifyContent: 'flex-end',
      gap: 8,
    },
    miniChip: {
      paddingHorizontal: 12,
      height: 30,
      borderRadius: 8,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    miniChipActive: {
      backgroundColor: `${colors.electric}22`,
    },
    miniChipText: {
      ...typography.caption,
      color: colors.textMuted,
    },
    miniChipTextActive: {
      color: colors.electricBright,
      fontWeight: '600',
    },
    forgotBtn: {
      alignSelf: 'flex-start',
      paddingVertical: 12,
    },
    link: {
      ...typography.caption,
      color: colors.electricBright,
      fontWeight: '600',
    },
    errorText: {
      ...typography.caption,
      color: colors.danger,
      textAlign: 'center',
      marginBottom: 10,
      ...getRtlText(),
    },
    cta: {
      height: 52,
      borderRadius: 14,
      backgroundColor: colors.electric,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    ctaDisabled: { opacity: 0.45 },
    ctaPressed: { opacity: 0.88 },
    ctaText: { ...typography.button, color: '#fff' },
    rememberRow: {
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 16,
    },
    rememberText: { ...typography.caption, color: colors.textMuted },
    iosCheck: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.borderMid,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iosCheckOn: {
      backgroundColor: colors.electric,
      borderColor: colors.electric,
    },
    footer: {
      marginTop: 'auto',
      paddingTop: 28,
      alignItems: 'center',
      gap: 10,
    },
    footerText: {
      ...typography.body,
      color: colors.textMuted,
      textAlign: 'center',
    },
    disclaimer: {
      ...typography.caption,
      color: colors.textSubtle,
      textAlign: 'center',
      lineHeight: 18,
      paddingHorizontal: 12,
    },
  });
}
