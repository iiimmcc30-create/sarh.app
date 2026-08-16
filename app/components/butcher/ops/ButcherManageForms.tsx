import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { butcherTypography } from '@/constants/butcherTypography';
import { radius, spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import { uploadImageFromUri } from '@/services/upload';
import {
  CATEGORY_LABELS,
  CUT_LABELS,
  CutType,
  MeatCategory,
} from '@/services/butcherData';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';
import { FilterChip, FilterChipRow } from '@/components/ui/FilterChip';

export function isLocalImageUri(uri: string) {
  return (
    uri.startsWith('file://') ||
    uri.startsWith('content://') ||
    uri.startsWith('ph://') ||
    uri.startsWith('assets-library://')
  );
}

// ─── Add / Edit Product Form ───────────────────────────────────────────────────
export function AddProductForm({
  onClose,
  onSuccess,
  butcherCountry,
  product,
}: {
  onClose: () => void;
  onSuccess: () => void;
  butcherCountry: string;
  product?: any;
}) {
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const apf = useThemedStyles(({ colors }) => createProductFormStyles(colors));
  const [loading, setLoading] = useState(false);
  const [imageUris, setImageUris] = useState<string[]>(
    Array.isArray(product?.images) ? product.images.filter(Boolean) : [],
  );
  const [form, setForm] = useState({
    nameAr: product?.nameAr ?? '',
    category: (product?.category ?? 'lamb') as MeatCategory,
    pricePerKg: product?.pricePerKg?.toString() ?? '',
    priceFixed: product?.priceFixed?.toString() ?? '',
    availableQuantity: product?.availableQuantity?.toString() ?? '',
    freshness: product?.freshness ?? 'fresh',
    inStock: product?.inStock ?? true,
  });

  const ALL_CATEGORIES = Object.entries(CATEGORY_LABELS) as [MeatCategory, any][];
  const ALL_CUTS: CutType[] = ['whole','half','quarter','ribs','leg','shoulder','liver','mixed','custom'];
  const [selectedCuts, setSelectedCuts] = useState<CutType[]>(
    (product?.availableCuts?.length ? product.availableCuts : ['whole']) as CutType[]
  );

  const toggleCut = (cut: CutType) => {
    setSelectedCuts((prev) =>
      prev.includes(cut) ? prev.filter((c) => c !== cut) : [...prev, cut]
    );
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'يرجى السماح بالوصول إلى الصور لإضافتها للمنتج');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - imageUris.length,
      quality: 0.85,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUris((prev) =>
        [...prev, ...result.assets.map((a) => a.uri)].slice(0, 5),
      );
    }
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.nameAr.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال اسم المنتج');
      return;
    }
    if (!form.pricePerKg && !form.priceFixed) {
      Alert.alert('خطأ', 'يرجى تحديد السعر');
      return;
    }
    if (!accessToken) {
      Alert.alert('خطأ', 'يرجى تسجيل الدخول أولاً');
      return;
    }

    setLoading(true);
    try {
      const uploadedImages: string[] = [];
      for (const uri of imageUris) {
        if (isLocalImageUri(uri)) {
          uploadedImages.push(await uploadImageFromUri(accessToken, uri, 'butchers'));
        } else {
          uploadedImages.push(uri);
        }
      }

      const payload: Record<string, unknown> = {
        nameAr: form.nameAr,
        nameEn: form.nameAr,
        category: form.category,
        pricePerKg: form.pricePerKg ? parseFloat(form.pricePerKg) : null,
        priceFixed: form.priceFixed ? parseFloat(form.priceFixed) : null,
        availableQuantity: form.availableQuantity.trim()
          ? parseFloat(form.availableQuantity)
          : undefined,
        availableCuts: selectedCuts,
        freshness: form.freshness,
        descriptionAr: form.nameAr,
        descriptionEn: form.nameAr,
        inStock: form.inStock,
        images: uploadedImages,
      };

      if (!product) {
        payload.country = butcherCountry || 'SA';
      }

      const url = product
        ? `${API_BASE}/api/butchers/products/${product.id}`
        : `${API_BASE}/api/butchers/products`;
      const res = await fetch(url, {
        method: product ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        Alert.alert('نجاح', product ? 'تم تحديث المنتج' : 'تمت إضافة المنتج بنجاح');
        onSuccess();
        onClose();
      } else {
        Alert.alert('خطأ', data.messageAr || data.message || (product ? 'فشل تحديث المنتج' : 'فشل إضافة المنتج'));
      }
    } catch (err) {
      console.error(err);
      Alert.alert('خطأ', err instanceof Error ? err.message : 'تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={apf.wrap}>
      <View style={apf.handle} />
      <RtlTextShell>
        <RtlText style={apf.title}>{product ? 'تعديل المنتج' : 'إضافة منتج جديد'}</RtlText>
      </RtlTextShell>

      <RtlTextShell>
        <RtlText style={apf.label}>اسم المنتج بالعربي</RtlText>
      </RtlTextShell>
      <TextInput
        style={apf.input}
        placeholder="مثال: خروف كامل طازج"
        placeholderTextColor={colors.textSubtle}
        value={form.nameAr}
        onChangeText={(v) => setForm({ ...form, nameAr: v })}
        textAlign="right"
      />

      <RtlTextShell>
        <RtlText style={apf.label}>الفئة</RtlText>
      </RtlTextShell>
      <FilterChipRow contentPaddingHorizontal={0} style={{ marginBottom: spacing.lg }}>
        {ALL_CATEGORIES.map(([cat, info]) => (
          <FilterChip
            key={cat}
            label={info.ar}
            selected={form.category === cat}
            onPress={() => setForm({ ...form, category: cat })}
          />
        ))}
      </FilterChipRow>

      <RtlTextShell>
        <RtlText style={apf.label}>التسعير</RtlText>
      </RtlTextShell>
      <View style={apf.priceRow}>
        <View style={{ flex: 1 }}>
          <RtlTextShell>
            <RtlText style={apf.priceLabel}>سعر/كغ</RtlText>
          </RtlTextShell>
          <TextInput
            style={apf.input}
            placeholder="0"
            placeholderTextColor={colors.textSubtle}
            value={form.pricePerKg}
            onChangeText={(v) => setForm({ ...form, pricePerKg: v })}
            keyboardType="numeric"
            textAlign="center"
          />
        </View>
        <View style={apf.orShell}>
          <Text style={apf.orText}>أو</Text>
        </View>
        <View style={{ flex: 1 }}>
          <RtlTextShell>
            <RtlText style={apf.priceLabel}>سعر ثابت</RtlText>
          </RtlTextShell>
          <TextInput
            style={apf.input}
            placeholder="0"
            placeholderTextColor={colors.textSubtle}
            value={form.priceFixed}
            onChangeText={(v) => setForm({ ...form, priceFixed: v })}
            keyboardType="numeric"
            textAlign="center"
          />
        </View>
      </View>

      <RtlTextShell>
        <RtlText style={apf.label}>الكمية المتاحة (كغ)</RtlText>
      </RtlTextShell>
      <TextInput
        style={apf.input}
        placeholder="مثال: 50"
        placeholderTextColor={colors.textSubtle}
        value={form.availableQuantity}
        onChangeText={(v) => setForm({ ...form, availableQuantity: v })}
        keyboardType="numeric"
        textAlign="center"
      />

      <RtlTextShell>
        <RtlText style={apf.label}>طرق التقطيع المتاحة</RtlText>
      </RtlTextShell>
      <View style={apf.cutsGrid}>
        {ALL_CUTS.map((cut) => (
          <Pressable
            key={cut}
            onPress={() => toggleCut(cut)}
            style={[apf.cutChip, selectedCuts.includes(cut) && apf.cutChipActive]}
          >
            <View style={apf.chipTextShell}>
              <Text style={[apf.cutLabel, selectedCuts.includes(cut) && apf.cutLabelActive]}>
                {CUT_LABELS[cut].ar}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <RtlTextShell>
        <RtlText style={apf.label}>الطزاجة</RtlText>
      </RtlTextShell>
      <View style={apf.freshnessRow}>
        {[
          { id: 'fresh',   label: 'طازج'  },
          { id: 'chilled', label: 'مبرد'  },
          { id: 'frozen',  label: 'مجمد'  },
        ].map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => setForm({ ...form, freshness: opt.id })}
            style={[apf.freshnessBtn, form.freshness === opt.id && apf.freshnessBtnActive]}
          >
            <View style={apf.chipTextShell}>
              <Text style={apf.freshnessLabel}>{opt.label}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <RtlTextShell>
        <RtlText style={apf.label}>التوفر</RtlText>
      </RtlTextShell>
      <View style={apf.freshnessRow}>
        {[
          { id: true,  label: 'متوفر' },
          { id: false, label: 'غير متوفر' },
        ].map((opt) => (
          <Pressable
            key={String(opt.id)}
            onPress={() => setForm({ ...form, inStock: opt.id })}
            style={[apf.freshnessBtn, form.inStock === opt.id && apf.freshnessBtnActive]}
          >
            <View style={apf.chipTextShell}>
              <Text style={apf.freshnessLabel}>{opt.label}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      <RtlTextShell>
        <RtlText style={apf.label}>صور المنتج</RtlText>
      </RtlTextShell>
      <View style={apf.imageGrid}>
        {imageUris.map((uri, idx) => (
          <View key={`${uri}-${idx}`} style={apf.imageThumbWrap}>
            <Image source={{ uri }} style={apf.imageThumb} contentFit="cover" />
            <Pressable style={apf.imageRemove} onPress={() => removeImage(idx)} hitSlop={6}>
              <AppIcon name="close-circle" size={22} color={colors.danger} />
            </Pressable>
          </View>
        ))}
        {imageUris.length < 5 && (
          <Pressable style={apf.uploadBox} onPress={pickImages} disabled={loading}>
            <AppIcon name="camera-outline" size={28} color={colors.electricBright} />
            <View style={apf.chipTextShell}>
              <Text style={apf.uploadText}>إضافة صورة</Text>
            </View>
          </Pressable>
        )}
      </View>
      <RtlTextShell>
        <RtlText style={apf.uploadHint}>حتى 5 صور · JPG أو PNG</RtlText>
      </RtlTextShell>

      <View style={apf.actions}>
        <Pressable style={apf.cancelBtn} onPress={onClose} disabled={loading}>
          <View style={apf.chipTextShell}>
            <Text style={apf.cancelText}>إلغاء</Text>
          </View>
        </Pressable>
        <Pressable style={apf.saveBtn} onPress={handleSave} disabled={loading}>
          <LinearGradient colors={[colors.electric, colors.cyan]} style={apf.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={apf.chipTextShell}>
                <Text style={apf.saveBtnText}>{product ? 'تحديث المنتج' : 'حفظ المنتج'}</Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Add / Edit Offer Form ───────────────────────────────────────────────────
export function AddOfferForm({
  onClose,
  onSuccess,
  butcherCountry,
  offer,
}: {
  onClose: () => void;
  onSuccess: () => void;
  butcherCountry: string;
  offer?: any;
}) {
  const { accessToken } = useAuth();
  const { colors } = useTheme();
  const apf = useThemedStyles(({ colors }) => createProductFormStyles(colors));
  const [loading, setLoading] = useState(false);
  const [imageUri, setImageUri] = useState<string>(offer?.image ?? '');
  const [form, setForm] = useState({
    titleAr: offer?.titleAr ?? '',
    descriptionAr: offer?.descriptionAr ?? '',
    originalPrice: offer?.originalPrice?.toString() ?? '',
    offerPrice: offer?.offerPrice?.toString() ?? '',
    discountPercent: offer?.discountPercent?.toString() ?? '',
    validUntil: offer?.validUntil
      ? new Date(offer.validUntil).toISOString().slice(0, 10)
      : '',
  });

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'يرجى السماح بالوصول إلى الصور لإرفاق صورة العرض');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.85,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!form.titleAr.trim() || !form.descriptionAr.trim()) {
      Alert.alert('خطأ', 'يرجى إدخال عنوان ووصف العرض');
      return;
    }
    if (!imageUri.trim()) {
      Alert.alert('خطأ', 'يرجى إرفاق صورة العرض');
      return;
    }
    if (!form.validUntil.trim()) {
      Alert.alert('خطأ', 'يرجى تحديد تاريخ انتهاء العرض');
      return;
    }

    const originalPrice = form.originalPrice ? parseFloat(form.originalPrice) : null;
    const offerPrice = form.offerPrice ? parseFloat(form.offerPrice) : null;
    let discountPercent = form.discountPercent ? parseInt(form.discountPercent, 10) : null;
    if (!discountPercent && originalPrice && offerPrice && originalPrice > 0) {
      discountPercent = Math.round((1 - offerPrice / originalPrice) * 100);
    }

    const validUntil = new Date(`${form.validUntil}T23:59:59.000Z`).toISOString();

    setLoading(true);
    try {
      let imageUrl = imageUri.trim();
      if (isLocalImageUri(imageUrl)) {
        imageUrl = await uploadImageFromUri(accessToken!, imageUrl, 'butchers');
      }

      const payload = {
        titleAr: form.titleAr,
        titleEn: form.titleAr,
        descriptionAr: form.descriptionAr,
        descriptionEn: form.descriptionAr,
        originalPrice,
        offerPrice,
        discountPercent,
        image: imageUrl,
        validUntil,
        country: butcherCountry || 'SA',
      };
      const url = offer
        ? `${API_BASE}/api/butchers/offers/${offer.id}`
        : `${API_BASE}/api/butchers/offers`;
      const res = await fetch(url, {
        method: offer ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        Alert.alert('نجاح', offer ? 'تم تحديث العرض' : 'تمت إضافة العرض');
        onSuccess();
        onClose();
      } else {
        Alert.alert('خطأ', data.messageAr || data.message || 'فشل حفظ العرض');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('خطأ', 'تعذر الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={apf.wrap}>
      <View style={apf.handle} />
      <RtlTextShell>
        <RtlText style={apf.title}>{offer ? 'تعديل العرض' : 'إضافة عرض جديد'}</RtlText>
      </RtlTextShell>

      <RtlTextShell>
        <RtlText style={apf.label}>عنوان العرض</RtlText>
      </RtlTextShell>
      <TextInput
        style={apf.input}
        placeholder="مثال: عرض نهاية الأسبوع"
        placeholderTextColor={colors.textSubtle}
        value={form.titleAr}
        onChangeText={(v) => setForm({ ...form, titleAr: v })}
        textAlign="right"
      />

      <RtlTextShell>
        <RtlText style={apf.label}>الوصف</RtlText>
      </RtlTextShell>
      <TextInput
        style={[apf.input, { minHeight: 72 }]}
        placeholder="وصف مختصر للعرض"
        placeholderTextColor={colors.textSubtle}
        value={form.descriptionAr}
        onChangeText={(v) => setForm({ ...form, descriptionAr: v })}
        textAlign="right"
        multiline
      />

      <View style={apf.priceRow}>
        <View style={{ flex: 1 }}>
          <RtlTextShell>
            <RtlText style={apf.priceLabel}>السعر الأصلي</RtlText>
          </RtlTextShell>
          <TextInput
            style={apf.input}
            placeholder="0"
            placeholderTextColor={colors.textSubtle}
            value={form.originalPrice}
            onChangeText={(v) => setForm({ ...form, originalPrice: v })}
            keyboardType="numeric"
            textAlign="center"
          />
        </View>
        <View style={{ flex: 1 }}>
          <RtlTextShell>
            <RtlText style={apf.priceLabel}>سعر العرض</RtlText>
          </RtlTextShell>
          <TextInput
            style={apf.input}
            placeholder="0"
            placeholderTextColor={colors.textSubtle}
            value={form.offerPrice}
            onChangeText={(v) => setForm({ ...form, offerPrice: v })}
            keyboardType="numeric"
            textAlign="center"
          />
        </View>
      </View>

      <RtlTextShell>
        <RtlText style={apf.label}>نسبة الخصم % (اختياري)</RtlText>
      </RtlTextShell>
      <TextInput
        style={apf.input}
        placeholder="20"
        placeholderTextColor={colors.textSubtle}
        value={form.discountPercent}
        onChangeText={(v) => setForm({ ...form, discountPercent: v })}
        keyboardType="numeric"
        textAlign="center"
      />

      <RtlTextShell>
        <RtlText style={apf.label}>صورة العرض</RtlText>
      </RtlTextShell>
      <Pressable onPress={pickImage} style={apf.uploadBoxWide}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={apf.previewImgWide} contentFit="cover" />
        ) : (
          <>
            <AppIcon name="image-outline" size={28} color={colors.textMuted} />
            <View style={apf.chipTextShell}>
              <Text style={apf.uploadText}>إرفاق صورة</Text>
            </View>
          </>
        )}
      </Pressable>
      {imageUri ? (
        <Pressable onPress={() => setImageUri('')} style={apf.removeImageLink}>
          <RtlTextShell>
            <RtlText style={apf.removeImageText}>إزالة الصورة</RtlText>
          </RtlTextShell>
        </Pressable>
      ) : null}

      <RtlTextShell>
        <RtlText style={apf.label}>تاريخ الانتهاء (YYYY-MM-DD)</RtlText>
      </RtlTextShell>
      <TextInput
        style={apf.input}
        placeholder="2026-12-31"
        placeholderTextColor={colors.textSubtle}
        value={form.validUntil}
        onChangeText={(v) => setForm({ ...form, validUntil: v })}
        textAlign="center"
      />

      <View style={apf.actions}>
        <Pressable style={apf.cancelBtn} onPress={onClose} disabled={loading}>
          <View style={apf.chipTextShell}>
            <Text style={apf.cancelText}>إلغاء</Text>
          </View>
        </Pressable>
        <Pressable style={apf.saveBtn} onPress={handleSave} disabled={loading}>
          <LinearGradient colors={[colors.gold, colors.amber]} style={apf.saveBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={apf.chipTextShell}>
                <Text style={apf.saveBtnText}>{offer ? 'تحديث العرض' : 'حفظ العرض'}</Text>
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function createProductFormStyles(colors: ThemeColors) {
  return StyleSheet.create({
  wrap: { gap: spacing.sm },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.borderMid,
    alignSelf: 'center', marginBottom: spacing.md,
  },
  /** Physical LTR shell — same as listing title / SidebarMenuItem. */
  chipTextShell: {
    direction: 'ltr',
  },
  title: {
    ...butcherTypography.title,
    color: colors.textPrimary,
    width: '100%',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: spacing.md,
  },
  label: {
    ...butcherTypography.emphasis,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  input: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSoft,
    paddingHorizontal: spacing.md, paddingVertical: 12,
    ...butcherTypography.body, color: colors.textPrimary,
    marginBottom: spacing.md,
    writingDirection: 'rtl',
  },
  priceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, marginBottom: spacing.md },
  priceLabel: {
    ...butcherTypography.meta,
    color: colors.textMuted,
    width: '100%',
    textAlign: 'center',
    writingDirection: 'rtl',
    marginBottom: 4,
  },
  orShell: {
    direction: 'ltr',
    marginTop: 24,
  },
  orText: {
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  cutsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.lg },
  cutChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: radius.pill, backgroundColor: colors.bgElevated,
    borderWidth: 1.5, borderColor: colors.borderSoft,
  },
  cutChipActive: { borderColor: colors.electric, backgroundColor: colors.electric + '22' },
  cutLabel: {
    ...butcherTypography.meta,
    color: colors.textMuted,
  },
  cutLabelActive: { color: colors.textBrandStrong },
  freshnessRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  freshnessBtn: {
    flex: 1, paddingVertical: 10,
    borderRadius: radius.xl, borderWidth: 1.5, borderColor: colors.borderSoft,
    backgroundColor: colors.bgElevated, alignItems: 'center',
  },
  freshnessBtnActive: { borderColor: colors.electric, backgroundColor: colors.electric + '22' },
  freshnessLabel: {
    ...butcherTypography.secondary,
    color: colors.textSecondary,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  imageThumbWrap: {
    width: 88,
    height: 88,
    borderRadius: radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  imageThumb: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.bgElevated,
  },
  imageRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: colors.bgOverlay,
    borderRadius: 12,
  },
  uploadBox: {
    width: 88,
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.electricBright + '55',
    borderStyle: 'dashed',
    backgroundColor: colors.electric + '08',
  },
  uploadBoxWide: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: colors.electricBright + '55',
    borderStyle: 'dashed',
    backgroundColor: colors.electric + '08',
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  previewImgWide: {
    width: '100%',
    height: '100%',
  },
  removeImageLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
  },
  removeImageText: {
    ...butcherTypography.emphasis,
    color: colors.danger,
  },
  uploadText: {
    ...butcherTypography.emphasis,
    color: colors.textBrandStrong,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  uploadHint: {
    ...butcherTypography.meta,
    color: colors.textSubtle,
    marginBottom: spacing.lg,
  },
  actions: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: {
    flex: 1, paddingVertical: 13,
    borderRadius: radius.xl,
    borderWidth: 1, borderColor: colors.borderSoft,
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
  },
  cancelText: {
    ...butcherTypography.primary,
    color: colors.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  saveBtn: { flex: 2, borderRadius: radius.xl, overflow: 'hidden' },
  saveBtnGrad: {
    paddingVertical: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnText: {
    ...butcherTypography.primary,
    color: '#fff',
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  });
}

