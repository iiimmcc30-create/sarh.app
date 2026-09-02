import { SarhLogoMark } from '@/components/ui/SarhLogoMark';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { API_BASE } from '@/services/api';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { SARH_BUTCHER_LOGIN_URL } from '@/constants/sarhOfficial';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SAUDI_DIAL = '+966';
const RIYADH = { lat: 24.7136, lng: 46.6753 };

function envelopeData(json: Record<string, unknown>) {
  if (json && json.success && json.data && typeof json.data === 'object') {
    return json.data as Record<string, unknown>;
  }
  return json;
}

export default function ButcherJoinScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors: c }) => createStyles(c));

  const [phoneDigits, setPhoneDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [phoneToken, setPhoneToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [commercialReg, setCommercialReg] = useState('');
  const [cityAr, setCityAr] = useState('الرياض');
  const [city, setCity] = useState('Riyadh');
  const [addressAr, setAddressAr] = useState('');
  const [address, setAddress] = useState('');
  const [openTime, setOpenTime] = useState('06:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [accepted, setAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fullPhone = useMemo(() => {
    const digits = phoneDigits.replace(/\D/g, '').replace(/^0/, '');
    return `${SAUDI_DIAL}${digits}`;
  }, [phoneDigits]);

  const phoneValid =
    phoneDigits.replace(/\D/g, '').replace(/^0/, '').length === 9 &&
    phoneDigits.replace(/\D/g, '').replace(/^0/, '').startsWith('5');

  async function sendOtp() {
    setError('');
    if (!phoneValid) {
      setError('أدخل رقم جوال سعودي صحيح يبدأ بـ 5');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, channel: 'sms' }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(json.messageAr ?? json.message_ar ?? 'فشل إرسال رمز التحقق'));
        return;
      }
      setOtpSent(true);
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError('أدخل رمز التحقق المكوّن من 6 أرقام');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, code: otp, purpose: 'join' }),
      });
      const json = await res.json().catch(() => ({}));
      const data = envelopeData(json);
      if (!res.ok) {
        setError(String(json.messageAr ?? json.message_ar ?? 'رمز التحقق غير صحيح'));
        return;
      }
      const token = String(data.phone_token ?? '');
      if (!token) {
        setError('تعذّر التحقق من الجوال');
        return;
      }
      setPhoneToken(token);
      setIsNewUser(Boolean(data.is_new_user));
      if (!shopPhone) setShopPhone(fullPhone);
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    setError('');
    if (!phoneToken) {
      setError('تحقق من رقم الجوال أولاً');
      return;
    }
    if (!accepted) {
      setError('يجب الموافقة على صحة البيانات');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/butcher-applications/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: fullPhone,
          phone_token: phoneToken,
          displayName: displayName.trim(),
          arabicName: displayName.trim(),
          email: email.trim() || undefined,
          username: isNewUser ? username.trim().toLowerCase() : undefined,
          password: isNewUser && password ? password : undefined,
          nameAr: nameAr.trim(),
          nameEn: nameEn.trim(),
          shopPhone: shopPhone.trim() || fullPhone,
          commercialReg: commercialReg.trim(),
          country: 'SA',
          city: city.trim(),
          cityAr: cityAr.trim(),
          address: address.trim() || addressAr.trim(),
          addressAr: addressAr.trim(),
          lat: RIYADH.lat,
          lng: RIYADH.lng,
          openTime,
          closeTime,
          acceptedTerms: true,
          confirmAccuracy: true,
        }),
      });
      const json = await res.json().catch(() => ({}));
      const data = envelopeData(json);
      if (!res.ok) {
        setError(String(json.messageAr ?? json.message_ar ?? 'تعذّر إرسال الطلب'));
        return;
      }
      router.replace({
        pathname: '/join/success',
        params: {
          n: String(data.applicationNumber ?? ''),
          name: String(data.nameAr ?? nameAr),
        },
      });
    } catch {
      setError('تعذّر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <LinearGradient
        colors={['#07131C', '#0C1C27', '#07131C']}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(32,182,111,0.18)', 'transparent']}
        style={styles.glow}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
      />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <SarhLogoMark size={64} color="#F4F7F9" />
          <Text style={styles.kicker}>سرح للمنشآت</Text>
          <Text style={styles.title}>انضمام الملاحم</Text>
          <Text style={styles.lead}>
            قدّم طلب انضمام رسمي إلى منصة سرح. يراجع الفريق الطلب ثم يجهّز حساب الإدارة
            الخاص بالملحمة.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>صاحب الطلب</Text>
          <Text style={styles.label}>رقم الجوال</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.dial}>{SAUDI_DIAL}</Text>
            <TextInput
              style={styles.inputFlex}
              value={phoneDigits}
              onChangeText={setPhoneDigits}
              keyboardType="phone-pad"
              placeholder="5xxxxxxxx"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />
          </View>
          {otpSent ? (
            <>
              <Text style={styles.label}>رمز التحقق</Text>
              <TextInput
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="000000"
                placeholderTextColor={colors.textMuted}
                textAlign="center"
              />
              <Pressable style={styles.secondaryBtn} onPress={verifyOtp} disabled={loading}>
                <Text style={styles.secondaryBtnText}>تأكيد الرمز</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.secondaryBtn} onPress={sendOtp} disabled={loading}>
              <Text style={styles.secondaryBtnText}>إرسال رمز التحقق</Text>
            </Pressable>
          )}
          {phoneToken ? <Text style={styles.ok}>تم التحقق من الجوال</Text> : null}

          <Text style={styles.label}>الاسم</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="الاسم الكامل"
            placeholderTextColor={colors.textMuted}
            textAlign="right"
          />
          <Text style={styles.label}>البريد الإلكتروني</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="name@example.com"
            placeholderTextColor={colors.textMuted}
            textAlign="right"
          />
          {isNewUser ? (
            <>
              <Text style={styles.label}>اسم المستخدم</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder="latin_username"
                placeholderTextColor={colors.textMuted}
                textAlign="left"
              />
              <Text style={styles.label}>كلمة المرور (اختياري)</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                textAlign="right"
              />
            </>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>بيانات الملحمة</Text>
          <Text style={styles.label}>اسم الملحمة (عربي)</Text>
          <TextInput style={styles.input} value={nameAr} onChangeText={setNameAr} textAlign="right" />
          <Text style={styles.label}>اسم الملحمة (إنجليزي)</Text>
          <TextInput style={styles.input} value={nameEn} onChangeText={setNameEn} textAlign="left" />
          <Text style={styles.label}>هاتف المحل</Text>
          <TextInput
            style={styles.input}
            value={shopPhone}
            onChangeText={setShopPhone}
            keyboardType="phone-pad"
            textAlign="right"
          />
          <Text style={styles.label}>السجل التجاري</Text>
          <TextInput
            style={styles.input}
            value={commercialReg}
            onChangeText={setCommercialReg}
            textAlign="right"
          />
          <Text style={styles.label}>المدينة</Text>
          <TextInput style={styles.input} value={cityAr} onChangeText={setCityAr} textAlign="right" />
          <Text style={styles.label}>المدينة (إنجليزي)</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} textAlign="left" />
          <Text style={styles.label}>العنوان</Text>
          <TextInput
            style={styles.input}
            value={addressAr}
            onChangeText={setAddressAr}
            placeholder="الحي، الشارع"
            placeholderTextColor={colors.textMuted}
            textAlign="right"
          />
          <Text style={styles.label}>العنوان (إنجليزي)</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} textAlign="left" />
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>الفتح</Text>
              <TextInput style={styles.input} value={openTime} onChangeText={setOpenTime} textAlign="center" />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>الإغلاق</Text>
              <TextInput style={styles.input} value={closeTime} onChangeText={setCloseTime} textAlign="center" />
            </View>
          </View>
        </View>

        <Pressable style={styles.checkRow} onPress={() => setAccepted((v) => !v)}>
          <View style={[styles.checkbox, accepted && styles.checkboxOn]} />
          <Text style={styles.checkText}>
            أؤكد أن البيانات صحيحة وأوافق على مراجعة الطلب من فريق سرح.
          </Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.submit, loading && { opacity: 0.7 }]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>إرسال طلب الانضمام</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => void Linking.openURL(SARH_BUTCHER_LOGIN_URL)}
          accessibilityRole="link"
        >
          <Text style={styles.loginLink}>لديك حساب ملحمة؟ تسجيل الدخول</Text>
        </Pressable>
        <Text style={styles.footnote}>لن يتم إنشاء حساب دفترة في هذه المرحلة.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: '#07131C' },
    glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 280 },
    scroll: { padding: spacing.xl, gap: spacing.lg, paddingBottom: 48 },
    hero: { alignItems: 'center', gap: 10, paddingTop: spacing.md },
    kicker: { ...typography.caption, color: colors.gold, letterSpacing: 1 },
    title: { ...typography.display, color: colors.textPrimary, textAlign: 'center' },
    lead: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      maxWidth: 520,
    },
    card: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.xxl,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      padding: spacing.lg,
      gap: 8,
    },
    section: { ...typography.cardHeading, color: colors.textPrimary, marginBottom: 8, textAlign: 'right' },
    label: { ...typography.caption, color: colors.textMuted, textAlign: 'right', marginTop: 8 },
    input: {
      borderWidth: 1,
      borderColor: colors.borderMid,
      borderRadius: radius.lg,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.textPrimary,
      backgroundColor: colors.bgElevated,
    },
    inputFlex: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.borderMid,
      borderRadius: radius.lg,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.textPrimary,
      backgroundColor: colors.bgElevated,
    },
    phoneRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
    dial: { color: colors.textSecondary, paddingHorizontal: 8 },
    row: { flexDirection: 'row-reverse', gap: 12 },
    col: { flex: 1 },
    secondaryBtn: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.emerald,
      borderRadius: radius.lg,
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryBtnText: { color: colors.emerald, fontWeight: '600' },
    ok: { color: colors.success, textAlign: 'right', marginTop: 8 },
    checkRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 12 },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.borderMid,
      marginTop: 2,
    },
    checkboxOn: { backgroundColor: colors.emerald, borderColor: colors.emerald },
    checkText: { flex: 1, color: colors.textSecondary, textAlign: 'right', lineHeight: 22 },
    error: { color: colors.danger, textAlign: 'center' },
    submit: {
      backgroundColor: colors.emerald,
      borderRadius: radius.xl,
      paddingVertical: 16,
      alignItems: 'center',
    },
    submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
    loginLink: {
      color: colors.gold,
      textAlign: 'center',
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    footnote: { color: colors.textMuted, textAlign: 'center' },
  });
}
