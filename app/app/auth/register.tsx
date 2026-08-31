import { AppIcon } from '@/components/ui/FlaticonIcon';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { AppLogo } from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthCopy } from '@/hooks/useAuthCopy';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { updateAccountSettings } from '@/services/users';
import { interpretOtpVerifyResult } from '@/lib/otpVerifyOutcome';
import { getRtlText, marginStart, rtlForwardIcon, isAppRtl } from '@/lib/rtl';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { BRAND_TERMS_SHORT_AR } from '@/constants/brandCopy';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SAUDI_DIAL = '+966';
type Step = 'phone' | 'name' | 'identity' | 'password' | 'otp';

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const DOB_RE = /^\d{4}-\d{2}-\d{2}$/;

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function animateStepChange() {
  LayoutAnimation.configureNext(
    LayoutAnimation.create(220, 'easeInEaseOut', 'opacity'),
  );
}

export default function RegisterScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors: c }) => createStyles(c));
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; token?: string }>();
  const { sendOtp, verifyOtp, register } = useAuth();
  const { copy } = useAuthCopy();

  const initialStep: Step =
    params.phone && params.token ? 'name' : 'phone';

  const [step, setStep] = useState<Step>(initialStep);
  const [phone, setPhone] = useState(
    params.phone?.replace(/^\+\d{3}/, '') || '',
  );
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const cleanPhoneDigits = phone
    .trim()
    .replace(/\D/g, '')
    .replace(/^0/, '');
  const fullPhone = `${SAUDI_DIAL}${cleanPhoneDigits}`;
  const isPhoneValid =
    cleanPhoneDigits.length >= 9 && cleanPhoneDigits.startsWith('5');
  const usernameOk = USERNAME_RE.test(username.trim().toLowerCase());
  const dobOk = !birthDate.trim() || DOB_RE.test(birthDate.trim());

  const stepIndex = useMemo(() => {
    const order: Step[] = ['phone', 'name', 'identity', 'password', 'otp'];
    return order.indexOf(step);
  }, [step]);

  const goTo = (next: Step) => {
    animateStepChange();
    setError('');
    setStep(next);
  };

  const goBack = () => {
    if (step === 'otp') {
      goTo('password');
      return;
    }
    if (step === 'password') {
      goTo('identity');
      return;
    }
    if (step === 'identity') {
      goTo('name');
      return;
    }
    if (step === 'name') {
      goTo('phone');
      return;
    }
    if (router.canGoBack()) router.back();
    else router.replace('/auth/welcome');
  };

  const advanceFromPhone = () => {
    if (!isPhoneValid) {
      setError(copy.errPhone);
      return;
    }
    goTo('name');
  };

  const advanceFromName = () => {
    if (displayName.trim().length < 2) {
      setError(copy.errName);
      return;
    }
    goTo('identity');
  };

  const advanceFromIdentity = () => {
    if (!usernameOk) {
      setError(copy.errUsername);
      return;
    }
    if (!dobOk) {
      setError(copy.errDob);
      return;
    }
    goTo('password');
  };

  const startRegister = async () => {
    setError('');
    if (password.length < 6) {
      setError(copy.errPassword);
      return;
    }
    if (password !== confirmPassword) {
      setError(copy.errPasswordMatch);
      return;
    }
    if (!agreed) {
      setError(copy.errTerms);
      return;
    }

    setLoading(true);
    const result = await sendOtp(fullPhone, 'sms');
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? copy.errGeneric);
      return;
    }
    goTo('otp');
  };

  const verifyAndCreate = async () => {
    setError('');
    if (otpCode.length !== 6) {
      setError(copy.errOtp);
      return;
    }
    setLoading(true);
    const verified = await verifyOtp(fullPhone, otpCode);
    const otpFlow = interpretOtpVerifyResult(verified);
    if (otpFlow.kind === 'invalid' || otpFlow.kind === 'missing_phone_token') {
      setLoading(false);
      setError(otpFlow.error);
      return;
    }
    if (otpFlow.kind === 'existing_login') {
      setLoading(false);
      return;
    }

    const regResult = await register({
      phone: fullPhone,
      phone_token: otpFlow.phoneToken,
      displayName: displayName.trim(),
      arabicName: displayName.trim(),
      username: username.trim().toLowerCase(),
      country: 'SA',
      password,
    });

    if (!regResult.success) {
      setLoading(false);
      if (regResult.error?.includes('مستخدم') || regResult.error?.includes('username')) {
        setError(regResult.error);
        goTo('identity');
        return;
      }
      setError(regResult.error ?? copy.errGeneric);
      return;
    }

    const dob = birthDate.trim();
    if (dob && DOB_RE.test(dob)) {
      void updateAccountSettings({ birthDate: dob });
    }

    setLoading(false);
  };

  const titleForStep =
    step === 'phone'
      ? copy.stepPhoneTitle
      : step === 'name'
        ? copy.stepNameTitle
        : step === 'identity'
          ? copy.stepUsernameTitle
          : step === 'password'
            ? copy.stepPasswordTitle
            : copy.otpTitle;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[colors.bgDeep, colors.bgPrimary, colors.bgDeep]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.kav}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.topBar}>
            <Pressable onPress={goBack} hitSlop={12} style={styles.backBtn}>
              <AppIcon
                name={rtlForwardIcon()}
                size={22}
                color={colors.textPrimary}
              />
            </Pressable>
            <View style={styles.dots}>
              {(['phone', 'name', 'identity', 'password'] as Step[]).map(
                (s, i) => (
                  <View
                    key={s}
                    style={[
                      styles.dot,
                      i <= Math.min(stepIndex, 3) && styles.dotActive,
                    ]}
                  />
                ),
              )}
            </View>
            <View style={styles.backBtn} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.header}>
              <AppLogo size={56} showRing={false} shape="square" />
            </View>

            <View>
              <Text style={styles.stepTitle}>{titleForStep}</Text>
              {step === 'otp' ? (
                <Text style={styles.stepSub}>{copy.otpSubtitle}</Text>
              ) : null}

              {step === 'phone' ? (
                <View style={styles.block}>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      value={phone}
                      onChangeText={(t) => {
                        setPhone(t.replace(/[^\d\s]/g, ''));
                        setError('');
                      }}
                      placeholder={copy.phonePlaceholder}
                      placeholderTextColor={colors.textSubtle}
                      keyboardType="phone-pad"
                      textAlign={isAppRtl() ? "right" : "left"}
                      maxLength={10}
                      autoFocus
                    />
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      !isPhoneValid && styles.btnDisabled,
                      pressed && styles.pressed,
                    ]}
                    onPress={advanceFromPhone}
                  >
                    <Text style={styles.primaryText}>{copy.continueCta}</Text>
                  </Pressable>
                </View>
              ) : null}

              {step === 'name' ? (
                <View style={styles.block}>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      value={displayName}
                      onChangeText={(t) => {
                        setDisplayName(t);
                        setError('');
                      }}
                      placeholder={copy.namePlaceholder}
                      placeholderTextColor={colors.textSubtle}
                      textAlign={isAppRtl() ? "right" : "left"}
                      maxLength={45}
                      autoFocus
                    />
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      displayName.trim().length < 2 && styles.btnDisabled,
                      pressed && styles.pressed,
                    ]}
                    onPress={advanceFromName}
                  >
                    <Text style={styles.primaryText}>{copy.continueCta}</Text>
                  </Pressable>
                </View>
              ) : null}

              {step === 'identity' ? (
                <View style={styles.block}>
                  <View style={styles.inputWrap}>
                    <Text style={styles.at}>@</Text>
                    <TextInput
                      style={styles.input}
                      value={username}
                      onChangeText={(t) => {
                        setUsername(t.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                        setError('');
                      }}
                      placeholder={copy.usernamePlaceholder}
                      placeholderTextColor={colors.textSubtle}
                      autoCapitalize="none"
                      autoCorrect={false}
                      maxLength={20}
                      autoFocus
                    />
                  </View>
                  <Text
                    style={[
                      styles.hint,
                      username.length > 0 &&
                        (usernameOk ? styles.hintOk : styles.hintBad),
                    ]}
                  >
                    {username.length === 0
                      ? copy.usernameHint
                      : usernameOk
                        ? copy.usernameFormatOk
                        : copy.usernameFormatBad}
                  </Text>

                  <Text style={[styles.label, styles.labelSpaced]}>
                    {copy.stepDobTitle}
                  </Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      value={birthDate}
                      onChangeText={(t) => {
                        setBirthDate(t.replace(/[^\d-]/g, ''));
                        setError('');
                      }}
                      placeholder={copy.dobPlaceholder}
                      placeholderTextColor={colors.textSubtle}
                      keyboardType="numbers-and-punctuation"
                      maxLength={10}
                    />
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      (!usernameOk || !dobOk) && styles.btnDisabled,
                      pressed && styles.pressed,
                    ]}
                    onPress={advanceFromIdentity}
                  >
                    <Text style={styles.primaryText}>{copy.continueCta}</Text>
                  </Pressable>
                </View>
              ) : null}

              {step === 'password' ? (
                <View style={styles.block}>
                  <View style={styles.inputWrap}>
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={8}
                      style={styles.eye}
                    >
                      <AppIcon
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </Pressable>
                    <TextInput
                      style={styles.input}
                      value={password}
                      onChangeText={(t) => {
                        setPassword(t);
                        setError('');
                      }}
                      placeholder={copy.passwordPlaceholder}
                      placeholderTextColor={colors.textSubtle}
                      secureTextEntry={!showPassword}
                      textAlign={isAppRtl() ? "right" : "left"}
                      autoFocus
                    />
                  </View>

                  <Text style={[styles.label, styles.labelSpaced]}>
                    {copy.stepConfirmPasswordTitle}
                  </Text>
                  <View style={styles.inputWrap}>
                    <Pressable
                      onPress={() => setShowConfirm((v) => !v)}
                      hitSlop={8}
                      style={styles.eye}
                    >
                      <AppIcon
                        name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </Pressable>
                    <TextInput
                      style={styles.input}
                      value={confirmPassword}
                      onChangeText={(t) => {
                        setConfirmPassword(t);
                        setError('');
                      }}
                      placeholder={copy.confirmPasswordPlaceholder}
                      placeholderTextColor={colors.textSubtle}
                      secureTextEntry={!showConfirm}
                      textAlign={isAppRtl() ? "right" : "left"}
                    />
                  </View>

                  <Pressable
                    onPress={() => setAgreed((v) => !v)}
                    style={styles.termsRow}
                  >
                    <View
                      style={[styles.check, agreed && styles.checkOn]}
                    >
                      {agreed ? (
                        <AppIcon name="checkmark" size={14} color="#fff" />
                      ) : null}
                    </View>
                    <Text style={styles.termsText}>
                      {copy.termsAgree}
                      {' · '}
                      {BRAND_TERMS_SHORT_AR}
                    </Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      (loading ||
                        password.length < 6 ||
                        password !== confirmPassword ||
                        !agreed) &&
                        styles.btnDisabled,
                      pressed && styles.pressed,
                    ]}
                    onPress={startRegister}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryText}>{copy.registerCta}</Text>
                    )}
                  </Pressable>
                </View>
              ) : null}

              {step === 'otp' ? (
                <View style={styles.block}>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={[styles.input, styles.otpInput]}
                      value={otpCode}
                      onChangeText={(t) => {
                        setOtpCode(t.replace(/\D/g, '').slice(0, 6));
                        setError('');
                      }}
                      placeholder="••••••"
                      placeholderTextColor={colors.textSubtle}
                      keyboardType="number-pad"
                      maxLength={6}
                      textAlign="center"
                      autoFocus
                    />
                  </View>
                  <Pressable
                    style={({ pressed }) => [
                      styles.primaryBtn,
                      (loading || otpCode.length !== 6) && styles.btnDisabled,
                      pressed && styles.pressed,
                    ]}
                    onPress={verifyAndCreate}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.primaryText}>{copy.otpConfirm}</Text>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() => goTo('password')}
                    style={styles.editLink}
                  >
                    <Text style={styles.editText}>{copy.otpEdit}</Text>
                  </Pressable>
                </View>
              ) : null}

              {error ? <Text style={styles.error}>{error}</Text> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgDeep },
    safe: { flex: 1 },
    kav: { flex: 1 },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    dots: { flexDirection: 'row', gap: 6 },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.borderMid,
    },
    dotActive: { backgroundColor: colors.electric, width: 18 },
    scroll: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxl,
      flexGrow: 1,
    },
    header: { alignItems: 'center', marginBottom: spacing.xl, marginTop: spacing.md },
    stepTitle: {
      ...typography.sectionHeading,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      marginBottom: spacing.lg,
      ...getRtlText(),
    },
    stepSub: {
      ...typography.body,
      color: colors.textMuted,
      marginTop: -spacing.md,
      marginBottom: spacing.lg,
      ...getRtlText(),
    },
    block: { gap: spacing.sm },
    label: {
      ...typography.smallHeading,
      color: colors.textSecondary,
      ...getRtlText(),
    },
    labelSpaced: { marginTop: spacing.lg, marginBottom: spacing.xs },
    inputWrap: {
      height: 54,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.borderMid,
      backgroundColor: colors.bgElevated,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
    },
    input: {
      flex: 1,
      ...typography.body,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      paddingVertical: 0,
    },
    otpInput: { letterSpacing: 8, textAlign: 'center' },
    at: {
      ...typography.body,
      color: colors.textMuted,
      ...marginStart(4),
    },
    eye: { padding: 4 },
    hint: {
      ...typography.caption,
      color: colors.textSubtle,
      marginTop: spacing.xs,
      ...getRtlText(),
    },
    hintOk: { color: colors.success },
    hintBad: { color: colors.danger },
    termsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    check: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.borderMid,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkOn: {
      backgroundColor: colors.electric,
      borderColor: colors.electric,
    },
    termsText: {
      flex: 1,
      ...typography.caption,
      color: colors.textSecondary,
      ...getRtlText(),
    },
    primaryBtn: {
      height: 54,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.electric,
      marginTop: spacing.xl,
    },
    btnDisabled: { opacity: 0.45 },
    pressed: { opacity: 0.88 },
    primaryText: {
      ...typography.button,
      fontFamily: OFFICIAL_APP_FONT,
      color: '#fff',
    },
    editLink: { alignItems: 'center', marginTop: spacing.md, padding: spacing.sm },
    editText: {
      ...typography.smallHeading,
      color: colors.textMuted,
      ...getRtlText(),
    },
    error: {
      ...typography.caption,
      color: colors.danger,
      marginTop: spacing.md,
      ...getRtlText(),
    },
  });
}
