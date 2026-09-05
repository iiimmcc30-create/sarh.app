import { SarhLogoMark } from '@/components/ui/SarhLogoMark';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { ButcherLocationPicker } from '@/components/feature/ButcherLocationPicker';
import { API_BASE } from '@/services/api';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { SARH_BUTCHER_LOGIN_URL } from '@/constants/sarhOfficial';
import {
  DOCUMENT_TYPE_LABELS,
} from '@/lib/butcherApplicationLabels';
import {
  maxBytesLabelForDocumentType,
  validatePickedDocumentFile,
} from '@/lib/butcherApplicationValidation';
import {
  pickApplicationDocument,
  type PickedApplicationFile,
} from '@/lib/pickApplicationDocument';
import { hasValidCoords } from '@/lib/butcherLocation';
import type { ButcherApplicationDocumentType } from '@/services/butcherApplicationTypes';
import {
  ActivityIndicator,
  Linking,
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

const REQUIRED_DOCS: ButcherApplicationDocumentType[] = [
  'commercial_license',
  'national_id',
  'municipal_permit',
  'shop_photo',
];

function envelopeData(json: Record<string, unknown>) {
  if (json && json.success && json.data && typeof json.data === 'object') {
    return json.data as Record<string, unknown>;
  }
  return json;
}

async function appendJoinFile(
  form: FormData,
  field: string,
  file: PickedApplicationFile,
) {
  if (Platform.OS === 'web') {
    const res = await fetch(file.localUri);
    const blob = await res.blob();
    form.append(field, blob, file.originalFileName);
    return;
  }
  form.append(field, {
    uri: file.localUri,
    name: file.originalFileName,
    type: file.mimeType,
  } as never);
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
  const [cityAr, setCityAr] = useState('');
  const [city, setCity] = useState('');
  const [addressAr, setAddressAr] = useState('');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [bioAr, setBioAr] = useState('');
  const [bioEn, setBioEn] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [openTime, setOpenTime] = useState('06:00');
  const [closeTime, setCloseTime] = useState('22:00');
  const [docs, setDocs] = useState<Partial<Record<ButcherApplicationDocumentType, PickedApplicationFile>>>({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [confirmAccuracy, setConfirmAccuracy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');

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

  async function pickDoc(type: ButcherApplicationDocumentType) {
    setError('');
    const picked = await pickApplicationDocument();
    if (!picked) return;
    const issue = validatePickedDocumentFile(
      type,
      picked.mimeType ?? 'application/octet-stream',
      picked.fileSizeBytes,
    );
    if (issue) {
      setError(issue.message);
      return;
    }
    setDocs((prev) => ({ ...prev, [type]: picked }));
  }

  async function submit() {
    setError('');
    setUploadStatus('');
    if (!phoneToken) {
      setError('تحقق من رقم الجوال أولاً');
      return;
    }
    if (!acceptedTerms) {
      setError('يجب الموافقة على الشروط');
      return;
    }
    if (!confirmAccuracy) {
      setError('يجب تأكيد صحة البيانات');
      return;
    }
    if (!hasValidCoords(lat, lng)) {
      setError('يجب تحديد موقع المحل على الخريطة');
      return;
    }
    for (const type of REQUIRED_DOCS) {
      const file = docs[type];
      if (!file) {
        setError('مستند مطلوب غير مرفوع');
        return;
      }
      const issue = validatePickedDocumentFile(
        type,
        file.mimeType ?? 'application/octet-stream',
        file.fileSizeBytes,
      );
      if (issue) {
        setError(issue.message);
        return;
      }
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('phone', fullPhone);
      form.append('phone_token', phoneToken);
      form.append('displayName', displayName.trim());
      form.append('arabicName', displayName.trim());
      if (email.trim()) form.append('email', email.trim());
      if (isNewUser) form.append('username', username.trim().toLowerCase());
      if (isNewUser && password) form.append('password', password);
      form.append('nameAr', nameAr.trim());
      form.append('nameEn', nameEn.trim());
      form.append('shopPhone', shopPhone.trim() || fullPhone);
      form.append('commercialReg', commercialReg.trim());
      form.append('country', 'SA');
      form.append('city', city.trim());
      form.append('cityAr', cityAr.trim());
      form.append('address', address.trim() || addressAr.trim());
      form.append('addressAr', addressAr.trim());
      form.append('lat', String(lat));
      form.append('lng', String(lng));
      if (bioAr.trim()) form.append('bioAr', bioAr.trim());
      if (bioEn.trim()) form.append('bioEn', bioEn.trim());
      if (specialties.trim()) form.append('specialties', specialties.trim());
      form.append('openTime', openTime);
      form.append('closeTime', closeTime);
      form.append('acceptedTerms', 'true');
      form.append('confirmAccuracy', 'true');
      for (const type of REQUIRED_DOCS) {
        await appendJoinFile(form, type, docs[type]!);
      }
      if (docs.other) await appendJoinFile(form, 'other', docs.other);
      setUploadStatus('جاري رفع المستندات وإرسال الطلب...');
      const res = await fetch(`${API_BASE}/api/butcher-applications/join`, {
        method: 'POST',
        body: form,
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
      setUploadStatus('');
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
            قدّم طلب انضمام رسمي إلى منصة سرح بنفس متطلبات نموذج الملاحم داخل التطبيق.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>1. التحقق من الجوال</Text>
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
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>2. بيانات صاحب الطلب</Text>
          <Text style={styles.label}>الاسم</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="الاسم الكامل"
            placeholderTextColor={colors.textMuted}
            textAlign="right"
          />
          <Text style={styles.label}>البريد الإلكتروني (اختياري)</Text>
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
          <Text style={styles.section}>3. بيانات الملحمة</Text>
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
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>4. بيانات الموقع</Text>
          <ButcherLocationPicker
            lat={hasValidCoords(lat, lng) ? lat : null}
            lng={hasValidCoords(lat, lng) ? lng : null}
            onChange={({ lat: nextLat, lng: nextLng }) => {
              setLat(nextLat);
              setLng(nextLng);
            }}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>5. النشاط وأوقات العمل</Text>
          <Text style={styles.label}>نبذة عربية (اختياري)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={bioAr}
            onChangeText={setBioAr}
            multiline
            textAlign="right"
          />
          <Text style={styles.label}>نبذة إنجليزية (اختياري)</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={bioEn}
            onChangeText={setBioEn}
            multiline
            textAlign="left"
          />
          <Text style={styles.label}>التخصصات (اختياري)</Text>
          <TextInput
            style={styles.input}
            value={specialties}
            onChangeText={setSpecialties}
            placeholder="لحم بقري، غنم"
            placeholderTextColor={colors.textMuted}
            textAlign="right"
          />
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

        <View style={styles.card}>
          <Text style={styles.section}>6. المستندات المطلوبة</Text>
          <Text style={styles.hint}>المسموح: PDF أو JPG أو PNG أو WEBP.</Text>
          {[...REQUIRED_DOCS, 'other' as const].map((type) => {
            const picked = docs[type];
            const required = type !== 'other';
            return (
              <Pressable key={type} style={styles.fileBtn} onPress={() => void pickDoc(type)}>
                <Text style={styles.fileTitle}>
                  {DOCUMENT_TYPE_LABELS[type]}
                  {required ? ' *' : ' (اختياري)'}
                </Text>
                <Text style={styles.hint}>حتى {maxBytesLabelForDocumentType(type)}</Text>
                <Text style={picked ? styles.ok : styles.hint}>
                  {picked ? picked.originalFileName : 'اختيار ملف'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.checkRow} onPress={() => setAcceptedTerms((v) => !v)}>
          <View style={[styles.checkbox, acceptedTerms && styles.checkboxOn]} />
          <Text style={styles.checkText}>أوافق على الشروط ومراجعة الطلب من فريق سرح.</Text>
        </Pressable>
        <Pressable style={styles.checkRow} onPress={() => setConfirmAccuracy((v) => !v)}>
          <View style={[styles.checkbox, confirmAccuracy && styles.checkboxOn]} />
          <Text style={styles.checkText}>أؤكد أن البيانات والمستندات صحيحة.</Text>
        </Pressable>

        {uploadStatus ? <Text style={styles.ok}>{uploadStatus}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.submit, loading && { opacity: 0.7 }]}
          onPress={() => void submit()}
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
    section: { ...typography.cardHeading, color: colors.textPrimary, marginBottom: 8,  },
    label: { ...typography.caption, color: colors.textMuted,  marginTop: 8 },
    hint: { ...typography.caption, color: colors.textMuted,  },
    input: {
      borderWidth: 1,
      borderColor: colors.borderMid,
      borderRadius: radius.lg,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: colors.textPrimary,
      backgroundColor: colors.bgElevated,
    },
    multiline: { minHeight: 84, textAlignVertical: 'top' },
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
    phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    dial: { color: colors.textSecondary, paddingHorizontal: 8 },
    row: { flexDirection: 'row', gap: 12 },
    col: { flex: 1 },
    fileBtn: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: colors.borderMid,
      borderRadius: radius.lg,
      padding: 12,
      gap: 4,
    },
    fileTitle: { color: colors.textPrimary,  fontWeight: '600' },
    secondaryBtn: {
      marginTop: 8,
      borderWidth: 1,
      borderColor: colors.emerald,
      borderRadius: radius.lg,
      paddingVertical: 12,
      alignItems: 'center',
    },
    secondaryBtnText: { color: colors.emerald, fontWeight: '600' },
    ok: { color: colors.success,  marginTop: 8 },
    checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: colors.borderMid,
      marginTop: 2,
    },
    checkboxOn: { backgroundColor: colors.emerald, borderColor: colors.emerald },
    checkText: { flex: 1, color: colors.textSecondary,  lineHeight: 22 },
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
