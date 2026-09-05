// SAFAT — Butchers delivery location picker (خريطة ذكية لموقع التوصيل)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { LocationMapPreview } from '@/components/feature/LocationMapPreview';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { FilterChip } from '@/components/ui/FilterChip';
import { butcherTypography } from '@/constants/butcherTypography';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlText } from '@/lib/rtl';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { reverseGeocodeToAddress } from '@/lib/formatAddress';
import {
  loadDeliveryLocation,
  saveDeliveryLocation,
} from '@/services/butcherDeliveryLocation';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

const LABEL_OPTIONS = ['المنزل', 'العمل', 'آخر'];

export default function ButcherLocationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [cityAr, setCityAr] = useState('');
  const [address, setAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [label, setLabel] = useState('المنزل');
  const [locating, setLocating] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const applyReverseGeocode = async (lat: number, lng: number) => {
    const resolved = await reverseGeocodeToAddress(lat, lng);
    if (resolved) {
      setCityAr(resolved.cityAr);
      setAddress((prev) => prev || resolved.addressAr);
    }
  };

  const locate = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('إذن الموقع', 'يرجى السماح بالوصول للموقع لتحديد مكان التوصيل.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setCoords(next);
      await applyReverseGeocode(next.lat, next.lng);
    } catch {
      Alert.alert('خطأ', 'تعذّر الحصول على موقعك، حاول مجدداً.');
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      const saved = await loadDeliveryLocation();
      if (!active) return;
      if (saved) {
        setLabel(saved.label || 'المنزل');
        setHouseNumber(saved.houseNumber || '');
        setAddress(saved.address || '');
        setCityAr(saved.cityAr || '');
        if (saved.lat != null && saved.lng != null) {
          setCoords({ lat: saved.lat, lng: saved.lng });
        }
        setInitializing(false);
        return;
      }
      setInitializing(false);
      void locate();
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async () => {
    await saveDeliveryLocation({
      label: label.trim() || undefined,
      houseNumber: houseNumber.trim() || undefined,
      address: address.trim() || undefined,
      cityAr: cityAr.trim() || undefined,
      lat: coords?.lat ?? null,
      lng: coords?.lng ?? null,
    });
    router.back();
  };

  const canSave = Boolean(address.trim() || cityAr.trim() || coords);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScreenHeader title="موقع التوصيل" showBack />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <RtlTextShell>
            <RtlText style={styles.hint}>
              اضغط على الخريطة لتحديد موقعك، أو استخدم «موقعي الحالي».
            </RtlText>
          </RtlTextShell>

          <LocationMapPreview
            country="SA"
            cityLabel={cityAr}
            lat={coords?.lat ?? null}
            lng={coords?.lng ?? null}
            height={220}
            showLocateButton
            onLocate={() => void locate()}
            locating={locating}
            onPick={(lat, lng) => {
              setCoords({ lat, lng });
              void applyReverseGeocode(lat, lng);
            }}
          />

          {initializing ? (
            <ActivityIndicator color={colors.electricBright} style={{ marginTop: spacing.lg }} />
          ) : null}

          {/* Label chips */}
          <View style={styles.field}>
            <RtlTextShell>
              <RtlText style={styles.fieldLabel}>نوع العنوان</RtlText>
            </RtlTextShell>
            <View style={styles.chipsRow}>
              {LABEL_OPTIONS.map((opt) => (
                <FilterChip
                  key={opt}
                  label={opt}
                  selected={label === opt}
                  onPress={() => setLabel(opt)}
                />
              ))}
            </View>
          </View>

          {/* House number */}
          <View style={styles.field}>
            <RtlTextShell>
              <RtlText style={styles.fieldLabel}>رقم المنزل / المبنى</RtlText>
            </RtlTextShell>
            <TextInput
              style={styles.input}
              value={houseNumber}
              onChangeText={setHouseNumber}
              placeholder="مثال: 5243"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
            />
          </View>

          {/* Address */}
          <View style={styles.field}>
            <RtlTextShell>
              <RtlText style={styles.fieldLabel}>العنوان / الحي</RtlText>
            </RtlTextShell>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={address}
              onChangeText={setAddress}
              placeholder="اسم الحي أو وصف مختصر للعنوان"
              placeholderTextColor={colors.textMuted}
              textAlign="right"
              multiline
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Pressable
            style={({ pressed }) => [
              styles.saveBtn,
              !canSave && styles.saveBtnDisabled,
              pressed && canSave && { opacity: 0.9 },
            ]}
            onPress={() => void onSave()}
            disabled={!canSave}
          >
            <AppIcon name="checkmark" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>حفظ الموقع</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    flex: { flex: 1 },
    scroll: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
    hint: {
      ...butcherTypography.primary,
      color: colors.textPrimary,
      lineHeight: 22,
    },
    field: { gap: spacing.sm },
    fieldLabel: {
      ...typography.smallHeading,
      color: colors.textPrimary,
    },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    input: {
      ...butcherTypography.body,
      backgroundColor: colors.bgElevated,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: colors.textPrimary,
      ...getRtlText(),
    },
    inputMultiline: { minHeight: 72, textAlignVertical: 'top' },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSoft,
      backgroundColor: colors.screenRoot,
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: 15,
      borderRadius: radius.pill,
      backgroundColor: colors.electric,
    },
    saveBtnDisabled: { opacity: 0.5 },
    saveBtnText: {
      ...butcherTypography.primary,
      color: '#fff',
      writingDirection: 'rtl',
    },
  });
}
