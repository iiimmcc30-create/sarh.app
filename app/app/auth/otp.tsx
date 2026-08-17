// Powered by OnSpace.AI
// SAFAT — OTP Verification Screen (شاشة التحقق من رمز OTP)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { getRtlRow, getRtlText, inlineEnd, rtlForwardIcon } from '@/lib/rtl';

import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';

function formatDisplayPhone(phone: string): string {
  return phone.replace(/^(\+966)(\d)(\d{3})(\d{3})(\d{3})$/, '+966 $2$3 $4 $5');
}

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone: string;
    requestId: string;
    expiresIn: string;
    channel: 'sms' | 'whatsapp';
  }>();

  const { verifyOtp, sendOtp } = useAuth();

  const totalSeconds   = parseInt(params.expiresIn ?? '120', 10);
  const [otp, setOtp]              = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown]  = useState(totalSeconds);
  const [loading, setLoading]      = useState(false);
  const [error, setError]          = useState('');
  const [success, setSuccess]      = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const inputs = useRef<(TextInput | null)[]>([]);
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0)).current;

  // ── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const minutes = String(Math.floor(countdown / 60)).padStart(2, '0');
  const seconds = String(countdown % 60).padStart(2, '0');

  // ── Auto-submit when all digits filled ────────────────────────────────────
  useEffect(() => {
    const code = otp.join('');
    if (code.length === OTP_LENGTH) handleVerify(code);
  }, [otp]);

  // ── Shake animation ────────────────────────────────────────────────────────
  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 55, useNativeDriver: true }),
    ]).start();
  };

  // ── Success animation ──────────────────────────────────────────────────────
  const playSuccess = () => {
    setSuccess(true);
    Animated.spring(successScale, {
      toValue: 1, tension: 60, friction: 7, useNativeDriver: true,
    }).start();
  };

  // ── Handle digit input ─────────────────────────────────────────────────────
  const handleChange = (text: string, idx: number) => {
    setError('');
    if (text.length > 1) {
      const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
      const arr = [...otp];
      for (let i = 0; i < OTP_LENGTH; i++) arr[i] = digits[i] ?? '';
      setOtp(arr);
      inputs.current[OTP_LENGTH - 1]?.focus();
      return;
    }

    const digit = text.replace(/\D/g, '').slice(-1);
    const arr = [...otp];
    arr[idx] = digit;
    setOtp(arr);

    if (digit && idx < OTP_LENGTH - 1) inputs.current[idx + 1]?.focus();
  };

  const handleKeyPress = (key: string, idx: number) => {
    if (key === 'Backspace' && !otp[idx] && idx > 0) {
      const arr = [...otp];
      arr[idx - 1] = '';
      setOtp(arr);
      inputs.current[idx - 1]?.focus();
    }
  };

  // ── Verify OTP (عبر الباك اند) ────────────────────────────────────────────
  const handleVerify = async (code: string) => {
    if (loading) return;
    setError('');
    setLoading(true);

    const result = await verifyOtp(params.phone, code);

    if (!result.success) {
      setLoading(false);
      setError(result.error ?? 'رمز التحقق غير صحيح');
      shake();
      return;
    }

    playSuccess();

    setTimeout(() => {
      if (result.isNew) {
        router.push({
          pathname: '/auth/register',
          params: { phone: params.phone, token: result.phoneToken },
        });
      } else {
        router.replace('/(tabs)');
      }
    }, 1200);
  };

  // ── Resend Code ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setError('');
    setResendLoading(true);
    const result = await sendOtp(params.phone, params.channel);
    setResendLoading(false);

    if (!result.success) {
      setError(result.error ?? 'فشل إعادة إرسال الرمز');
      shake();
      return;
    }

    setCountdown(120);
    setOtp(['', '', '', '', '', '']);
    inputs.current[0]?.focus();
  };

  if (success) {
    return (
      <View style={styles.root}>
        <View style={styles.successCenter}>
          <Animated.View style={[styles.successRing, { transform: [{ scale: successScale }] }]}>
            <LinearGradient colors={[colors.electric, colors.electricBright]} style={styles.successInner}>
              <AppIcon name="checkmark" size={52} color="#fff" />
            </LinearGradient>
          </Animated.View>
          <Text style={styles.successTitle}>تم التحقق بنجاح</Text>
          <Text style={styles.successSub}>جارٍ الدخول...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <AppIcon name={rtlForwardIcon()} size={22} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.largeTitle}>رمز التحقق</Text>
            <Text style={styles.cardSub}>
              أرسلنا رمزاً من {OTP_LENGTH} أرقام إلى{'\n'}
              <Text style={styles.phoneHighlight}>
                {formatDisplayPhone(params.phone || '')}
              </Text>
            </Text>
          </View>

          <View style={styles.card}>

            {/* OTP boxes */}
            <Animated.View style={[styles.otpRow, { transform: [{ translateX: shakeAnim }] }]}>
              {otp.map((digit, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.otpBox,
                    digit ? styles.otpBoxFilled : null,
                    error ? styles.otpBoxError : null,
                  ]}
                >
                  <TextInput
                    ref={(r) => { inputs.current[idx] = r; }}
                    style={styles.otpInput}
                    value={digit}
                    onChangeText={(t) => handleChange(t, idx)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, idx)}
                    keyboardType="number-pad"
                    maxLength={1}
                    textAlign="center"
                    selectTextOnFocus
                    autoFocus={idx === 0}
                    caretHidden
                  />
                </View>
              ))}
            </Animated.View>

            {/* Error message */}
            {error ? (
              <View style={styles.errorContainer}>
                <AppIcon name="alert-circle-outline" size={15} color={colors.danger} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Loading indicator */}
            {loading && (
              <ActivityIndicator size="small" color={colors.electricBright} style={{ marginTop: 10 }} />
            )}

            {/* Countdown + Resend */}
            <View style={styles.resendRow}>
              {countdown > 0 ? (
                <>
                  <Text style={styles.countdownText}>ينتهي الرمز خلال</Text>
                  <View style={styles.countdownBadge}>
                    <Text style={styles.countdownValue}>{minutes}:{seconds}</Text>
                  </View>
                </>
              ) : (
                <Pressable
                  onPress={handleResend}
                  disabled={resendLoading}
                  style={styles.resendActionBtn}
                >
                  <AppIcon name="refresh" size={15} color={colors.electricBright} />
                  <Text style={styles.resendActionText}>
                    {resendLoading ? 'جارٍ الإرسال...' : 'إعادة إرسال الرمز'}
                  </Text>
                </Pressable>
              )}
            </View>

            {/* Verify Button (Manual fallback) */}
            <Pressable
              style={[
                styles.verifyBtn,
                (loading || otp.join('').length < OTP_LENGTH) && styles.verifyBtnDisabled,
              ]}
              onPress={() => handleVerify(otp.join(''))}
              disabled={loading || otp.join('').length < OTP_LENGTH}
            >
              <Text style={styles.verifyText}>تأكيد</Text>
            </Pressable>

          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.screenRoot },
  safe: { flex: 1 },
  kav: { flex: 1, paddingHorizontal: 22, paddingTop: 56 },

  backBtn: {
    position: 'absolute', top: 8, ...inlineEnd(8),
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },

  header: { alignItems: 'center', marginBottom: 28, gap: 8 },
  largeTitle: {
    ...typography.h1,
    fontSize: 32,
    lineHeight: 40,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  card: {
    width: '100%',
    gap: spacing.md,
  },
  cardSub: { ...typography.body, color: colors.textMuted, textAlign: 'center', lineHeight: 22 },
  phoneHighlight: { color: colors.textPrimary, fontWeight: '600' },

  otpRow: {
    flexDirection: 'row', justifyContent: 'center', gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  otpBox: {
    width: 42, height: 50, borderRadius: 12,
    backgroundColor: colors.bgDeep, borderWidth: 1.5, borderColor: colors.borderHairline,
    alignItems: 'center', justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: colors.electric,
    backgroundColor: `${colors.electric}18`,
  },
  otpBoxError: { borderColor: colors.danger, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  otpInput: {
    ...typography.sectionHeading, color: colors.textPrimary,
    width: '100%', height: '100%', textAlign: 'center',
  },

  errorContainer: {
    ...getRtlRow(), alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 10,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)',
    width: '100%',
  },
  errorText: { ...typography.caption, color: colors.danger, ...getRtlText(), flex: 1 },

  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: 5 },
  countdownText: { ...typography.secondary, color: colors.textMuted },
  countdownBadge: {
    backgroundColor: colors.bgDeep, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1, borderColor: colors.borderHairline,
  },
  countdownValue: { ...typography.badge, color: '#f59e0b' },
  resendActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resendActionText: { ...typography.button, color: colors.textBrandStrong },

  verifyBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.electric,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  verifyBtnDisabled: { opacity: 0.45 },
  verifyText: { ...typography.button, color: '#fff' },

  // Success screen
  successCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  successRing: {
    width: 120, height: 120, borderRadius: 60,
    shadowColor: colors.electricBright, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 30, elevation: 16,
  },
  successInner: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  successTitle: { ...typography.display, color: colors.textPrimary, textAlign: 'center' },
  successSub: { ...typography.secondary, color: colors.textMuted },
  });
}
