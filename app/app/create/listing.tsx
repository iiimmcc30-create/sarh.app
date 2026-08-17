// SAFAT — Create Listing (إضافة عرض)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ListingBoostSheet } from '@/components/listing/ListingBoostSheet';
import { menuCardStyle } from '@/components/feature/SidebarMenu';
import { Image } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { AppLogo } from '@/components/ui/AppLogo';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getRtlRow } from '@/lib/rtl';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';
import { Country } from '@/services/types';
import { resolveMediaUrl } from '@/services/media';
import { needsUpload } from '@/services/mediaUri';
import { uploadImageFromUri } from '@/services/upload';
import {
  LISTING_EDIT_LIMIT_MESSAGE_AR,
  listingAllowsOwnerEdit,
  sanitizeListingLimitMessage,
} from '@/lib/listingLimits';
import { cloudinaryVideoFirstFrameUrl } from '@/lib/listingMedia';
import { ListingVideoSection, type ListingVideoState } from '@/components/listing/ListingVideoSection';
import { uploadListingVideo } from '@/services/listingVideo';
import { LocationMapPreview } from '@/components/feature/LocationMapPreview';
import { categoryRequiresWeight } from '@/lib/listingCategories';
import { resolveLegacyListingCategory } from '@/lib/marketCategoriesFallback';
import { useMarketCategories } from '@/hooks/useMarketCategories';
import { usePaidServices } from '@/hooks/usePaidServices';
import type { MarketCategory } from '@/services/categories';
import {
  classifyListingTitle,
  findCategoryBySlug,
  suggestionMode,
  type CategorySuggestion,
} from '@/lib/categoryIntelligence';
import {
  detectCurrentListingLocation,
  formatListingAddress,
} from '@/lib/listingLocation';

const GCC_COUNTRIES: { code: Country; ar: string; flag: string; currency: string }[] = [
  { code: 'SA', ar: 'السعودية', flag: '🇸🇦', currency: 'SAR' },
];

const STEPS = ['الأساسيات', 'التفاصيل', 'المراجعة'];

function normalizeContactPhone(value: string, country: Country): string {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (country === 'SA') {
    if (digits.startsWith('0')) digits = `966${digits.slice(1)}`;
    else if (digits.length === 9 && digits.startsWith('5')) digits = `966${digits}`;
  }
  return digits ? `+${digits}` : '';
}

export default function CreateListingScreen() {
  const { colors, gradients } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = typeof editId === 'string' && editId.length > 0;
  const { addListing, updateListing } = useApp();
  const { accessToken, user } = useAuth();

  const [step, setStep] = useState(0);
  const [loadingListing, setLoadingListing] = useState(isEditing);
  const [pendingCategoryIds, setPendingCategoryIds] = useState<{
    parentId?: string;
    subId?: string;
  } | null>(null);
  const { categories: parents, loading: categoriesLoading } = useMarketCategories();
  const [parentCategory, setParentCategory] = useState<MarketCategory | null>(null);
  const [subCategory, setSubCategory] = useState<MarketCategory | null>(null);
  const [titleAr, setTitleAr] = useState('');
  const [descAr, setDescAr] = useState('');
  const [price, setPrice] = useState('');
  const [country, setCountry] = useState<Country>('SA');
  const [location, setLocation] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [videoState, setVideoState] = useState<ListingVideoState>({ status: 'idle' });
  const [submitting, setSubmitting] = useState(false);
  const [showBoostUpsell, setShowBoostUpsell] = useState(false);
  const [publishedListingId, setPublishedListingId] = useState<string | null>(null);
  const [categoryLocked, setCategoryLocked] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);
  const [stepError, setStepError] = useState<string | null>(null);
  const { hasAnyBoostService } = usePaidServices();
  const titleDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isEditing || !editId || !accessToken) {
      if (!isEditing) setLoadingListing(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await authFetch(`${API_BASE}/api/listings/${editId}`);
        const json = await res.json().catch(() => ({}));
        if (!active) return;
        if (!res.ok || !json.success || !json.data) {
          Alert.alert('خطأ', 'تعذر تحميل الإعلان');
          router.back();
          return;
        }
        const raw = json.data;
        const editCount = typeof raw.editCount === 'number' ? raw.editCount : 0;
        if (!listingAllowsOwnerEdit(editCount, user?.role)) {
          Alert.alert('تعديل غير متاح', LISTING_EDIT_LIMIT_MESSAGE_AR);
          router.back();
          return;
        }
        setTitleAr(raw.arabicTitle ?? raw.title ?? '');
        setDescAr(raw.arabicDescription ?? raw.description ?? '');
        setPrice(raw.price != null ? String(raw.price) : '');
        setCountry((raw.country as Country) || 'SA');
        setLocation(raw.arabicLocation ?? raw.location ?? '');
        setContactPhone(raw.contactPhone ?? '');
        setWeightKg(raw.weightKg != null ? String(raw.weightKg) : '');
        setImageUris(
          (Array.isArray(raw.images) ? raw.images : [])
            .map((uri: string) => resolveMediaUrl(uri) ?? uri)
            .filter(Boolean),
        );
        if (raw.videoUrl) {
          const video = resolveMediaUrl(raw.videoUrl) ?? raw.videoUrl;
          const thumb = resolveMediaUrl(raw.thumbnailUrl) ?? raw.thumbnailUrl ?? null;
          setVideoState({
            status: 'ready',
            videoUrl: video,
            thumbnailUrl: thumb,
            meta: {
              localUri: video,
              thumbnailUri: thumb,
              durationSecs: typeof raw.videoDuration === 'number' ? raw.videoDuration : 0,
              width: raw.videoWidth ?? 0,
              height: raw.videoHeight ?? 0,
              fileSizeBytes: raw.videoFileSize ?? 0,
            },
          });
        }
        setPendingCategoryIds({
          parentId: raw.categoryId ?? raw.marketCategory?.id,
          subId: raw.subcategoryId ?? raw.marketSubcategory?.id,
        });
        setCategoryLocked(true);
      } catch {
        if (active) {
          Alert.alert('خطأ', 'تعذر تحميل الإعلان');
          router.back();
        }
      } finally {
        if (active) setLoadingListing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [accessToken, editId, isEditing, router, user?.role]);

  const selectedCountry = GCC_COUNTRIES.find((c) => c.code === country)!;

  const subOptions = useMemo(
    () => parentCategory?.children?.filter((c) => c.isActive) ?? [],
    [parentCategory],
  );

  useEffect(() => {
    if (!pendingCategoryIds || parents.length === 0) return;
    const parent = parents.find((item) => item.id === pendingCategoryIds.parentId) ?? null;
    if (!parent) return;
    setParentCategory(parent);
    const sub = parent.children?.find((item) => item.id === pendingCategoryIds.subId) ?? null;
    setSubCategory(sub);
  }, [parents, pendingCategoryIds]);

  const needsWeight = categoryRequiresWeight({
    category: parentCategory?.legacyCategory || parentCategory?.slug,
    requiresWeight: parentCategory?.requiresWeight,
  });

  const applySuggestion = (next: CategorySuggestion | null) => {
    setSuggestion(next);
    const mode = suggestionMode(next);
    if (!next || mode === 'none' || categoryLocked) return;
    const found = findCategoryBySlug(parents, next.parentSlug, next.childSlug);
    if (!found) return;
    if (mode === 'auto' || mode === 'suggest') {
      setParentCategory(found.parent);
      if (found.child) setSubCategory(found.child);
    }
  };

  useEffect(() => {
    if (categoryLocked || parents.length === 0) return;
    if (titleDebounce.current) clearTimeout(titleDebounce.current);
    titleDebounce.current = setTimeout(() => {
      applySuggestion(classifyListingTitle(titleAr, { categories: parents }));
    }, 400);
    return () => {
      if (titleDebounce.current) clearTimeout(titleDebounce.current);
    };
    // categoryLocked / applySuggestion intentionally omitted — lock must freeze auto updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleAr, parents, categoryLocked]);

  const detectLocation = async (force = false) => {
    setLocating(true);
    const result = await detectCurrentListingLocation();
    if (result.geo) {
      setLat(result.geo.latitude);
      setLng(result.geo.longitude);
      const label = formatListingAddress(result.geo);
      if (label && (force || !location.trim())) setLocation(label);
    }
    setLocating(false);
  };

  useEffect(() => {
    if (isEditing) return;
    void detectLocation(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  const selectParent = (cat: MarketCategory) => {
    setParentCategory(cat);
    setSubCategory(null);
    setWeightKg('');
    setCategoryLocked(true);
  };

  const selectSub = (sub: MarketCategory) => {
    setSubCategory(sub);
    setCategoryLocked(true);
  };

  const reSuggest = () => {
    setCategoryLocked(false);
    applySuggestion(classifyListingTitle(titleAr, { categories: parents }));
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('إذن مطلوب', 'يرجى السماح بالوصول إلى الصور لإضافتها للإعلان');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 8 - imageUris.length,
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUris((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 8));
    }
  };

  const removeImage = (index: number) => {
    setImageUris((prev) => prev.filter((_, i) => i !== index));
  };

  const hasListingVideo =
    videoState.status === 'picked' ||
    videoState.status === 'ready' ||
    videoState.status === 'uploading';

  const stepHint = (): string | null => {
    if (step === 0) {
      if (titleAr.trim().length < 3) return 'أدخل عنوان العرض';
      if (!location.trim()) return 'حدد موقع العرض';
      if (!parentCategory || !subCategory) return 'اختر التصنيف';
      return null;
    }
    if (step === 1) {
      if (descAr.trim().length < 10) return 'أدخل وصف العرض';
      if (!price.trim() || Number(price) <= 0) return 'أدخل السعر';
      const weightValid =
        !needsWeight || (/^\d+(\.\d{1,2})?$/.test(weightKg.trim()) && Number(weightKg) > 0);
      if (!weightValid) return 'أدخل الوزن';
      const normalizedPhone = normalizeContactPhone(contactPhone, country);
      if (contactPhone.trim() && !/^\+[0-9]{8,15}$/.test(normalizedPhone)) return 'تحقق من رقم الجوال';
      return null;
    }
    return null;
  };

  const canContinue = () => stepHint() == null;

  const handleNext = () => {
    const hint = stepHint();
    if (hint) {
      setStepError(hint);
      return;
    }
    setStepError(null);
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      void handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!parentCategory || !subCategory || !accessToken) return;
    setSubmitting(true);

    try {
      const uploadedUrls: string[] = [];
      for (const uri of imageUris) {
        if (!needsUpload(uri)) {
          uploadedUrls.push(resolveMediaUrl(uri) ?? uri);
          continue;
        }
        try {
          const url = await uploadImageFromUri(accessToken, uri, 'listings');
          uploadedUrls.push(url);
        } catch {
          if (__DEV__) {
            uploadedUrls.push(`https://picsum.photos/seed/${Date.now()}-${uploadedUrls.length}/800/600`);
          } else {
            throw new Error('تعذّر رفع الصور. تحقق من الاتصال وحاول مجدداً.');
          }
        }
      }

      let videoFields: {
        videoUrl?: string;
        thumbnailUrl?: string;
        videoDuration?: number;
        videoWidth?: number;
        videoHeight?: number;
        videoFileSize?: number;
      } = {};

      if (videoState.status === 'ready' && videoState.videoUrl) {
        const readyThumb =
          resolveMediaUrl(videoState.thumbnailUrl) ??
          videoState.thumbnailUrl ??
          cloudinaryVideoFirstFrameUrl(videoState.videoUrl) ??
          undefined;
        videoFields = {
          videoUrl: resolveMediaUrl(videoState.videoUrl) ?? videoState.videoUrl,
          thumbnailUrl: readyThumb,
        };
      } else if (videoState.status === 'picked' && videoState.meta) {
        setVideoState({ status: 'uploading', meta: videoState.meta, progress: 0 });
        try {
          const result = await uploadListingVideo(accessToken, videoState.meta, (p) => {
            setVideoState((prev) =>
              prev.status === 'uploading' ? { ...prev, progress: p } : prev,
            );
          });
          const thumb =
            resolveMediaUrl(result.thumbnailUrl) ??
            result.thumbnailUrl ??
            cloudinaryVideoFirstFrameUrl(result.videoUrl) ??
            undefined;
          videoFields = {
            videoUrl: resolveMediaUrl(result.videoUrl) ?? result.videoUrl,
            thumbnailUrl: thumb,
            videoDuration: result.videoDuration,
            videoWidth: result.videoWidth,
            videoHeight: result.videoHeight,
            videoFileSize: result.videoFileSize,
          };
          setVideoState({
            status: 'ready',
            meta: videoState.meta,
            videoUrl: result.videoUrl,
            thumbnailUrl: thumb ?? null,
          });
        } catch {
          if (uploadedUrls.length === 0) {
            setVideoState({ status: 'failed', meta: videoState.meta, error: 'فشل رفع الفيديو' });
            Alert.alert('خطأ', 'تعذّر رفع الفيديو. أضف صورة أو أعد المحاولة.');
            setSubmitting(false);
            return;
          }
          setVideoState({ status: 'failed', meta: videoState.meta, error: 'فشل رفع الفيديو' });
        }
      }

      if (uploadedUrls.length === 0) {
        const cover =
          videoFields.thumbnailUrl ??
          cloudinaryVideoFirstFrameUrl(videoFields.videoUrl) ??
          undefined;
        if (!cover || !videoFields.videoUrl) {
          Alert.alert(
            'وسائط مطلوبة',
            'أضف صورة واحدة على الأقل، أو فيديو ليُستخدم إطار بدايته كصورة الإعلان.',
          );
          setSubmitting(false);
          return;
        }
        uploadedUrls.push(cover);
        videoFields.thumbnailUrl = cover;
      }

      const title = titleAr.trim();
      const weightNum =
        weightKg.trim() && /^\d+(\.\d{1,2})?$/.test(weightKg.trim())
          ? Number(weightKg)
          : undefined;
      const legacyCategory = resolveLegacyListingCategory(subCategory, parentCategory);
      const locationLabel = location.trim();
      const payload = {
        title,
        arabicTitle: title,
        description: descAr.trim(),
        arabicDescription: descAr.trim(),
        price: Number(price),
        currency: selectedCountry.currency,
        category: legacyCategory,
        categoryId: parentCategory.id,
        subcategoryId: subCategory.id,
        quantity: 1,
        location: locationLabel,
        arabicLocation: locationLabel,
        country,
        contactPhone: contactPhone.trim()
          ? normalizeContactPhone(contactPhone, country)
          : undefined,
        weightKg: weightNum && weightNum > 0 ? weightNum : undefined,
        images: uploadedUrls,
        ...videoFields,
        ...(isEditing && videoState.status === 'idle'
          ? { videoUrl: null, thumbnailUrl: null }
          : {}),
      };

      const result =
        isEditing && editId
          ? await updateListing(editId, payload)
          : await addListing(payload);

      if (result.ok && !isEditing && result.listingId && hasAnyBoostService) {
        setPublishedListingId(result.listingId);
        setShowBoostUpsell(true);
      } else if (result.ok) {
        router.replace('/(tabs)/market');
      } else {
        Alert.alert(
          'خطأ',
          sanitizeListingLimitMessage(
            result.error ||
              (isEditing
                ? 'فشل تعديل الإعلان. يرجى التحقق من المدخلات والمحاولة مجدداً.'
                : 'فشل نشر الإعلان. يرجى التحقق من المدخلات والمحاولة مجدداً.'),
          ),
        );
      }
    } catch (err: any) {
      Alert.alert('خطأ', sanitizeListingLimitMessage(err?.message || 'فشل نشر الإعلان.'));
    } finally {
      setSubmitting(false);
    }
  };

  const categoryMode = suggestionMode(suggestion);

  if (loadingListing) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.electricBright} />
        <Text style={styles.loadingText}>جاري تحميل الإعلان...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.header, getRtlRow()]}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>إلغاء</Text>
          </Pressable>
          <Text style={styles.headerTitle}>{isEditing ? 'تعديل العرض' : 'إضافة عرض'}</Text>
          <AppLogo size={34} showRing={false} />
        </View>

        <View style={styles.progressRow}>
          {STEPS.map((_, i) => (
            <View
              key={STEPS[i]}
              style={[styles.progressSeg, i <= step && styles.progressSegActive]}
            />
          ))}
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <View style={styles.stepContent}>
              <View style={styles.mediaRow}>
                <Pressable
                  onPress={pickImages}
                  style={({ pressed }) => [styles.mediaTile, pressed && styles.pressed]}
                >
                  <AppIcon name="images-outline" size={22} color={colors.electricBright} />
                  <Text style={styles.mediaTitle}>صور</Text>
                  <Text style={styles.mediaSub}>
                    {imageUris.length > 0 ? `${imageUris.length} صور` : 'أضف صور العرض'}
                  </Text>
                </Pressable>
                {videoState.status === 'idle' ? (
                  <ListingVideoSection
                    variant="tile"
                    state={videoState}
                    onChange={setVideoState}
                    disabled={submitting}
                    style={styles.mediaTileFlex}
                  />
                ) : (
                  <View style={styles.mediaTile}>
                    <AppIcon name="videocam" size={22} color={colors.electricBright} />
                    <Text style={styles.mediaTitle}>فيديو</Text>
                    <Text style={styles.mediaSub}>تمت الإضافة ✓</Text>
                  </View>
                )}
              </View>

              {imageUris.length > 0 ? (
                <View style={styles.imageGrid}>
                  {imageUris.map((uri, idx) => (
                    <View key={uri} style={styles.imageThumbWrap}>
                      <Image source={{ uri }} style={styles.imageThumb} contentFit="cover" />
                      <Pressable style={styles.imageRemove} onPress={() => removeImage(idx)} hitSlop={6}>
                        <AppIcon name="close-circle" size={20} color={colors.rose} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : null}

              {videoState.status !== 'idle' ? (
                <ListingVideoSection
                  state={videoState}
                  onChange={setVideoState}
                  disabled={submitting}
                />
              ) : null}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>موقع العرض</Text>
                <View style={[styles.inputWrap, location.trim() ? styles.inputFilled : null]}>
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="حدد موقع العرض يدوياً"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                  />
                  {locating ? (
                    <ActivityIndicator size="small" color={colors.electricBright} />
                  ) : (
                    <Pressable onPress={() => void detectLocation(true)} hitSlop={8}>
                      <AppIcon name="refresh" size={16} color={colors.textMuted} />
                    </Pressable>
                  )}
                  <AppIcon name="location-outline" size={18} color={colors.electricBright} />
                </View>
                <Pressable onPress={() => setShowMap((v) => !v)} style={styles.linkBtn}>
                  <Text style={styles.linkText}>{showMap ? 'إخفاء الخريطة' : 'اختيار من الخريطة'}</Text>
                </Pressable>
                {showMap ? (
                  <LocationMapPreview
                    country={country}
                    cityLabel={location.trim() || undefined}
                    lat={lat}
                    lng={lng}
                    height={180}
                    showLocateButton
                    onLocate={() => void detectLocation(true)}
                    locating={locating}
                  />
                ) : null}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>عنوان العرض</Text>
                <View style={[styles.inputWrap, titleAr.trim() ? styles.inputFilled : null]}>
                  <TextInput
                    value={titleAr}
                    onChangeText={(v) => {
                      setTitleAr(v);
                      setStepError(null);
                    }}
                    placeholder="مثال: أغنام حريات للبيع"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    maxLength={80}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <View style={styles.categoryLabelRow}>
                  {parentCategory ? (
                    <Pressable onPress={reSuggest} hitSlop={6}>
                      <Text style={styles.linkText}>إعادة الاقتراح</Text>
                    </Pressable>
                  ) : null}
                  <Text style={styles.fieldLabel}>التصنيف</Text>
                </View>
                <Pressable
                  onPress={() => setCategoryPickerOpen(true)}
                  style={[
                    styles.inputWrap,
                    styles.categoryField,
                    parentCategory ? styles.inputFilled : null,
                    !categoryLocked && categoryMode === 'auto' ? styles.inputAuto : null,
                  ]}
                >
                  <View style={styles.categoryValue}>
                    <Text
                      style={[
                        styles.categoryValueText,
                        !parentCategory && { color: colors.textMuted },
                      ]}
                    >
                      {parentCategory
                        ? `${parentCategory.nameAr}${subCategory ? ` · ${subCategory.nameAr}` : ''}${
                            !categoryLocked && categoryMode === 'auto' ? ' ✓' : ''
                          }`
                        : 'اختر التصنيف'}
                    </Text>
                  </View>
                  <AppIcon name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
                {categoriesLoading && parents.length === 0 ? (
                  <ActivityIndicator size="small" color={colors.electricBright} />
                ) : null}
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContent}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>موقع العرض</Text>
                <View style={[styles.inputWrap, location.trim() ? styles.inputFilled : null]}>
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="حدد موقع العرض يدوياً"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                  />
                  <AppIcon name="location-outline" size={18} color={colors.electricBright} />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>عنوان العرض</Text>
                <View style={[styles.inputWrap, titleAr.trim() ? styles.inputFilled : null]}>
                  <TextInput
                    value={titleAr}
                    onChangeText={(v) => {
                      setTitleAr(v);
                      setStepError(null);
                    }}
                    placeholder="مثال: أغنام حريات للبيع"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    maxLength={80}
                  />
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>التصنيف</Text>
                <Pressable
                  onPress={() => setCategoryPickerOpen(true)}
                  style={[
                    styles.inputWrap,
                    styles.categoryField,
                    parentCategory ? styles.inputFilled : null,
                    !categoryLocked && categoryMode === 'auto' ? styles.inputAuto : null,
                  ]}
                >
                  <View style={styles.categoryValue}>
                    <Text
                      style={[
                        styles.categoryValueText,
                        !parentCategory && { color: colors.textMuted },
                      ]}
                    >
                      {parentCategory
                        ? `${parentCategory.nameAr}${subCategory ? ` · ${subCategory.nameAr}` : ''}`
                        : 'اختر التصنيف'}
                    </Text>
                  </View>
                  <AppIcon name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>الوصف</Text>
                <View style={[styles.inputWrap, styles.textareaWrap]}>
                  <TextInput
                    value={descAr}
                    onChangeText={setDescAr}
                    placeholder="اكتب وصف العرض بالتفصيل..."
                    placeholderTextColor={colors.textMuted}
                    style={[styles.input, styles.textarea]}
                    multiline
                    maxLength={1000}
                  />
                  <Text style={styles.charCount}>{descAr.length}/1000</Text>
                </View>
              </View>

              <View style={styles.compactRow}>
                <View style={styles.compactField}>
                  <Text style={styles.compactLabel}>السعر</Text>
                  <View style={styles.compactInput}>
                    <TextInput
                      value={price}
                      onChangeText={(t) => setPrice(t.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      style={styles.compactText}
                      keyboardType="numeric"
                    />
                    <Text style={styles.compactUnit}>ر.س</Text>
                  </View>
                </View>
                <View style={styles.compactField}>
                  <Text style={styles.compactLabel}>
                    الوزن{needsWeight ? '' : ' (اختياري)'}
                  </Text>
                  <View style={styles.compactInput}>
                    <TextInput
                      value={weightKg}
                      onChangeText={(v) => setWeightKg(v.replace(/[^\d.]/g, ''))}
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      style={styles.compactText}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.compactUnit}>كجم</Text>
                  </View>
                </View>
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>الجوال</Text>
                <View style={[styles.inputWrap, styles.phoneField]}>
                  <TextInput
                    value={contactPhone}
                    onChangeText={(text) => setContactPhone(text.replace(/[^0-9+\s()-]/g, ''))}
                    placeholder="05XXXXXXXX"
                    placeholderTextColor={colors.textMuted}
                    style={styles.input}
                    keyboardType="phone-pad"
                    maxLength={20}
                  />
                  <AppIcon name="call-outline" size={18} color={colors.electricBright} />
                </View>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <View style={styles.reviewCard}>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>التصنيف</Text>
                  <Text style={styles.reviewValue}>
                    {parentCategory?.nameAr || '—'}
                    {subCategory ? ` · ${subCategory.nameAr}` : ''}
                  </Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>العنوان</Text>
                  <Text style={styles.reviewValue}>{titleAr || '—'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>الموقع</Text>
                  <Text style={styles.reviewValue}>{location || '—'}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>السعر</Text>
                  <Text style={styles.reviewValue}>
                    {price ? `${Number(price).toLocaleString()} ر.س` : '—'}
                  </Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={styles.reviewLabel}>الوسائط</Text>
                  <Text style={styles.reviewValue}>
                    {imageUris.length} صور
                    {hasListingVideo ? ' · فيديو' : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.termsBox}>
                <AppIcon name="information-circle-outline" size={16} color={colors.textMuted} />
                <Text style={styles.termsText}>
                  بالنشر، تؤكد أن الإعلان صحيح ويتوافق مع شروط سرح. يمكن نشر إعلان واحد كل 24 ساعة، وتعديله مرة واحدة.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          {stepError ? <Text style={styles.stepError}>{stepError}</Text> : null}
          <Pressable
            style={[styles.continueBtn, (!canContinue() || submitting) && styles.continueBtnDisabled]}
            onPress={handleNext}
            disabled={submitting}
          >
            <LinearGradient
              colors={canContinue() && !submitting ? gradients.electric : [colors.bgSurface, colors.bgSurface]}
              style={styles.continueBtnInner}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.continueBtnText, !canContinue() && { color: colors.textMuted }]}>
                  {step === STEPS.length - 1
                    ? isEditing
                      ? 'حفظ التعديل'
                      : 'نشر العرض'
                    : 'التالي'}
                </Text>
              )}
            </LinearGradient>
          </Pressable>
          {step > 0 ? (
            <Pressable onPress={() => setStep((s) => s - 1)} style={styles.backStep}>
              <Text style={styles.linkText}>رجوع</Text>
            </Pressable>
          ) : null}
        </View>

        <Modal
          visible={categoryPickerOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setCategoryPickerOpen(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setCategoryPickerOpen(false)}>
            <Pressable style={styles.modalSheet} onPress={() => undefined}>
              <Text style={styles.modalTitle}>اختر التصنيف</Text>
              <ScrollView style={styles.modalScroll}>
                {parents.map((cat) => (
                  <View key={cat.id} style={styles.modalGroup}>
                    <Pressable
                      onPress={() => selectParent(cat)}
                      style={[
                        styles.modalParent,
                        parentCategory?.id === cat.id && styles.modalParentActive,
                      ]}
                    >
                      <Text style={styles.modalParentText}>{cat.nameAr}</Text>
                    </Pressable>
                    {parentCategory?.id === cat.id ? (
                      <View style={styles.subList}>
                        {subOptions.map((sub) => (
                          <Pressable
                            key={sub.id}
                            onPress={() => {
                              selectSub(sub);
                              setCategoryPickerOpen(false);
                            }}
                            style={[
                              styles.subChip,
                              subCategory?.id === sub.id && styles.subChipActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.subChipText,
                                subCategory?.id === sub.id && styles.subChipTextActive,
                              ]}
                            >
                              {sub.nameAr}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>

        {publishedListingId && hasAnyBoostService ? (
          <ListingBoostSheet
            visible={showBoostUpsell}
            listingId={publishedListingId}
            showPublishBanner
            onClose={() => {
              setShowBoostUpsell(false);
              router.replace('/(tabs)/market');
            }}
            onSkip={() => {
              setShowBoostUpsell(false);
              router.replace('/(tabs)/market');
            }}
          />
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    flex: { flex: 1 },
    center: { alignItems: 'center', justifyContent: 'center' },
    loadingText: { ...typography.body, color: colors.textMuted, marginTop: spacing.md },
    header: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      minHeight: 52,
    },
    cancelBtn: { minWidth: 52, paddingVertical: 8 },
    cancelText: { ...typography.body, color: colors.textPrimary },
    headerTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    progressRow: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    progressSeg: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderSoft,
    },
    progressSegActive: { backgroundColor: colors.electric },
    scrollView: { flex: 1 },
    scroll: { paddingBottom: spacing.lg },
    stepContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      gap: spacing.md,
    },
    mediaRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    mediaTile: {
      flex: 1,
      minHeight: 108,
      borderRadius: radius.lg,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: spacing.md,
    },
    mediaTileFlex: { flex: 1 },
    mediaTitle: { ...typography.feedTitle, color: colors.textPrimary },
    mediaSub: { ...typography.caption, color: colors.textMuted, textAlign: 'center' },
    pressed: { opacity: 0.82 },
    fieldGroup: { gap: 6, width: '100%', alignItems: 'stretch' },
    fieldLabel: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '600',
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    inputWrap: {
      direction: 'ltr',
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      minHeight: 48,
      width: '100%',
    },
    inputFilled: { borderColor: colors.borderMid },
    inputAuto: { borderColor: `${colors.electric}66` },
    input: {
      flex: 1,
      minWidth: 0,
      ...typography.body,
      color: colors.textPrimary,
      paddingVertical: Platform.OS === 'ios' ? 12 : 8,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    textareaWrap: {
      flexDirection: 'column',
      alignItems: 'stretch',
      minHeight: 120,
      paddingTop: spacing.sm,
      paddingBottom: spacing.sm,
    },
    textarea: {
      textAlignVertical: 'top',
      minHeight: 88,
      width: '100%',
    },
    charCount: {
      ...typography.micro,
      color: colors.textSubtle,
      alignSelf: 'flex-end',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    linkBtn: { alignSelf: 'flex-end' },
    linkText: { ...typography.caption, color: colors.electricBright },
    categoryLabelRow: {
      direction: 'ltr',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
    },
    categoryField: { minHeight: 56, alignItems: 'center' },
    categoryValue: { flex: 1, minWidth: 0, alignItems: 'flex-end' },
    categoryValueText: {
      ...typography.body,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    compactRow: {
      direction: 'ltr',
      flexDirection: 'row-reverse',
      gap: 8,
      width: '100%',
    },
    compactField: { flex: 1, gap: 4, minWidth: 0, alignItems: 'stretch' },
    compactLabel: {
      ...typography.micro,
      color: colors.textMuted,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    compactInput: {
      direction: 'ltr',
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 4,
      minHeight: 44,
      borderRadius: radius.md,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      paddingHorizontal: 8,
      width: '100%',
    },
    compactText: {
      ...typography.caption,
      color: colors.textPrimary,
      flex: 1,
      minWidth: 0,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    compactUnit: { ...typography.micro, color: colors.textMuted, flexShrink: 0 },
    phoneField: {
      minHeight: 54,
    },
    imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    imageThumbWrap: {
      width: 72,
      height: 72,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.bgSurface,
    },
    imageThumb: { width: '100%', height: '100%' },
    imageRemove: {
      position: 'absolute',
      top: 2,
      right: 2,
    },
    reviewCard: { ...menuCardStyle(colors) },
    reviewRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSoft,
    },
    reviewLabel: { ...typography.caption, color: colors.textMuted },
    reviewValue: { ...typography.bodyStrong, color: colors.textPrimary, textAlign: 'right', flex: 1 },
    termsBox: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-start',
      padding: spacing.md,
      backgroundColor: `${colors.electric}10`,
      borderRadius: radius.lg,
    },
    termsText: {
      ...typography.caption,
      color: colors.textMuted,
      flex: 1,
      lineHeight: 18,
      textAlign: 'right',
    },
    bottomBar: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      backgroundColor: colors.screenRoot,
    },
    stepError: {
      ...typography.caption,
      color: colors.rose,
      textAlign: 'center',
      marginBottom: 8,
    },
    continueBtn: { borderRadius: radius.xl, overflow: 'hidden' },
    continueBtnDisabled: { opacity: 0.5 },
    continueBtnInner: {
      paddingVertical: 14,
      alignItems: 'center',
      borderRadius: radius.xl,
    },
    continueBtnText: { ...typography.button, color: '#fff' },
    backStep: { alignItems: 'center', paddingTop: 10 },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: colors.bgDeep,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      padding: spacing.lg,
      maxHeight: '72%',
    },
    modalTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'right', marginBottom: spacing.md },
    modalScroll: { maxHeight: 420 },
    modalGroup: { marginBottom: spacing.md },
    modalParent: {
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.bgSurface,
    },
    modalParentActive: { backgroundColor: `${colors.electric}18` },
    modalParentText: { ...typography.bodyStrong, color: colors.textPrimary, textAlign: 'right' },
    subList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      justifyContent: 'flex-end',
      marginTop: spacing.sm,
    },
    subChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
    },
    subChipActive: { backgroundColor: `${colors.electric}22` },
    subChipText: { ...typography.caption, color: colors.textMuted, fontWeight: '600' },
    subChipTextActive: { color: colors.electricBright },
  });
}
