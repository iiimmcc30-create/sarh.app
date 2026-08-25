import { AppIcon } from '@/components/ui/FlaticonIcon';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { AppLogo } from '@/components/ui/AppLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useAuthCopy } from '@/hooks/useAuthCopy';
import { useTheme } from '@/hooks/useTheme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlText, marginStart, rtlForwardIcon, isAppRtl } from '@/lib/rtl';
import { OFFICIAL_APP_FONT } from '@/constants/fonts';
import { spacing, typography, type ThemeColors } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SAUDI_DIAL = '+966';

export default function PhoneLoginScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors: c }) => createStyles(c));
  const router = useRouter();
  const { signInWithPassword } = useAuth();
  const { copy } = useAuthCopy();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const cleanPhoneDigits = phone.trim().replace(/\D/g, '').replace(/^0/, '');
  const fullPhone = `${SAUDI_DIAL}${cleanPhoneDigits}`;
  const isPhoneValid =
    cleanPhoneDigits.length >= 9 && cleanPhoneDigits.startsWith('5');

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setError('');
    if (!isPhoneValid) {
      setError(copy.errPhone);
      shake();
      return;
    }
    if (password.length < 6) {
      setError(copy.errPassword);
      shake();
      return;
    }
    setLoading(true);
    const result = await signInWithPassword(fullPhone, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? copy.errGeneric);
      shake();
      return;
    }
    router.replace('/(tabs)');
  };

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
          <Pressable
            onPress={() => router.replace('/auth/welcome')}
            style={styles.backBtn}
            hitSlop={12}
            accessibilityLabel={copy.back}
          >
            <AppIcon name={rtlForwardIcon()} size={22} color={colors.textPrimary} />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}
          >
            <View style={styles.header}>
              <AppLogo size={72} showRing={false} shape="square" />
              <Text style={styles.brand}>{copy.brandName}</Text>
              <Text style={styles.title}>{copy.loginTitle}</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>{copy.phoneLabel}</Text>
              <Animated.View
                style={[styles.inputWrap, { transform: [{ translateX: shakeAnim }] }]}
              >
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
                  textAlign="right"
                  maxLength={10}
                  autoComplete="tel"
                />
              </Animated.View>

              <Text style={[styles.label, styles.labelSpaced]}>
                {copy.passwordLabel}
              </Text>
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
                  textAlign="right"
                  autoComplete="password"
                />
              </View>

              <Pressable
                onPress={() => router.push('/auth/forgot-password')}
                style={styles.forgot}
              >
                <Text style={styles.forgotText}>{copy.forgotPassword}</Text>
              </Pressable>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  (loading || !isPhoneValid || password.length < 6) && styles.btnDisabled,
                  pressed && styles.pressed,
                ]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>{copy.loginCta}</Text>
                )}
              </Pressable>

              <Pressable
                onPress={() => router.push('/auth/register')}
                style={styles.footerLink}
              >
                <Text style={styles.footerText}>{copy.createAccountLink}</Text>
              </Pressable>
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
    backBtn: {
      alignSelf: 'flex-start',
      padding: spacing.md,
      ...marginStart(spacing.sm),
    },
    scroll: {
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing.xxl,
      flexGrow: 1,
    },
    header: {
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xxl,
      marginTop: spacing.lg,
    },
    brand: {
      ...typography.cardHeading,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      ...getRtlText(),
    },
    title: {
      ...typography.sectionHeading,
      fontFamily: OFFICIAL_APP_FONT,
      color: colors.textPrimary,
      ...getRtlText(),
    },
    form: { gap: spacing.xs },
    label: {
      ...typography.smallHeading,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
      ...getRtlText(),
    },
    labelSpaced: { marginTop: spacing.lg },
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
    eye: { padding: 4 },
    forgot: { alignSelf: 'flex-start', marginTop: spacing.sm },
    forgotText: {
      ...typography.smallHeading,
      color: colors.electricBright,
      ...getRtlText(),
    },
    error: {
      ...typography.caption,
      color: colors.danger,
      marginTop: spacing.md,
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
    footerLink: {
      alignItems: 'center',
      marginTop: spacing.xl,
      paddingVertical: spacing.sm,
    },
    footerText: {
      ...typography.smallHeading,
      color: colors.textMuted,
      ...getRtlText(),
    },
  });
}
