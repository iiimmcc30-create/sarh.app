import { useCallback, useEffect, useMemo, useState } from 'react';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { formatRelativeTimeAr } from '@/lib/formatRelativeTime';
import { rtlBackIcon, getRtlDirection, getRtlRow, getRtlText } from '@/lib/rtl';
import { useApp } from '@/hooks/useApp';
import { type Listing } from '@/services/types';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserProfile, setFollowUser } from '@/services/users';
import { openUserProfile } from '@/lib/openUserProfile';
import { API_BASE } from '@/services/api';
import { authFetch } from '@/services/authFetch';
import { promptReport } from '@/services/reports';
import { alertMessage, confirmDestructive, presentActionSheet } from '@/lib/actionSheet';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { ImageViewerModal } from '@/components/ui/ImageViewerModal';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { ListingCommentsSection } from '@/components/feature/ListingCommentsSection';
import { ListingFeePaymentSheet } from '@/components/listing/ListingFeePaymentSheet';
import { ListingVideoPlayer } from '@/components/listing/ListingVideoPlayer';
import { listingPhotoUris, listingVideoUrl } from '@/lib/listingMedia';
import { resolveMediaUrl } from '@/services/media';
import { navigateToCreateListing } from '@/lib/navigateToCreateListing';
import {
  LISTING_EDIT_LIMIT_MESSAGE_AR,
  listingAllowsOwnerEdit,
} from '@/lib/listingLimits';
import { usePaidServices } from '@/hooks/usePaidServices';
import { firstEnabledPromoteGoal, isPromoteGoalEnabled } from '@/services/paidServices';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CoverTrailRow } from '@/components/ui/CoverTrailRow';
import { RtlText } from '@/components/ui/RtlText';
import { RtlTextShell } from '@/components/ui/RtlTextShell';

const CATEGORY_LABELS: Record<string, string> = {
  camels: 'إبل',
  sheep: 'أغنام',
  goats: 'ماعز',
  cows: 'أبقار',
  horses: 'خيول',
  birds: 'دواجن',
  feed: 'أعلاف',
  equipment: 'معدات',
  livestock: 'المواشي',
  transport: 'النقل',
  slaughter: 'الذبائح',
};

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, isAuthenticated, user } = useAuth();
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const { listings, me, removeListing } = useApp();
  const { width: screenWidth } = useWindowDimensions();
  const cachedListing = useMemo(
    () => listings.find((l) => l.id === id) ?? null,
    [listings, id],
  );
  const [listing, setListing] = useState<Listing | null>(cachedListing);
  const [loading, setLoading] = useState(!cachedListing);
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [imageViewerIndex, setImageViewerIndex] = useState(0);

  // ─── Boost / promote ────────────────────────────────────────────────────
  const [feeModalVisible, setFeeModalVisible] = useState(false);
  const { flags: paidFlags, hasAnyBoostService } = usePaidServices();

  const loadListing = useCallback(async () => {
    if (!id) return;
    try {
      const res = await (accessToken
        ? authFetch(`${API_BASE}/api/listings/${id}`)
        : fetch(`${API_BASE}/api/listings/${id}`));
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !json.data) return;
      const raw = json.data;
      setListing({
        id: raw.id,
        title: raw.title,
        arabicTitle: raw.arabicTitle,
        price: raw.price,
        currency: raw.currency || 'SAR',
        category: raw.category,
        categoryId: raw.categoryId ?? raw.marketCategory?.id,
        subcategoryId: raw.subcategoryId ?? raw.marketSubcategory?.id,
        categoryNameAr: raw.marketCategory?.nameAr,
        subcategoryNameAr: raw.marketSubcategory?.nameAr,
        breed: raw.breed || '',
        age: raw.age || '',
        location: raw.location,
        arabicLocation: raw.arabicLocation,
        country: raw.country,
        contactPhone: raw.contactPhone || undefined,
        weightKg: typeof raw.weightKg === 'number' ? raw.weightKg : undefined,
        requiresWeight:
          raw.marketCategory?.requiresWeight === true ||
          raw.marketSubcategory?.requiresWeight === true ||
          raw.category === 'slaughter',
        images: (raw.images ?? [])
          .map((uri: string) => {
            const rawUri = typeof uri === 'string' ? uri.trim() : '';
            return resolveMediaUrl(rawUri) ?? rawUri;
          })
          .filter((uri: string) => uri.length > 0),
        videoUrl: resolveMediaUrl(
          listingVideoUrl({ images: raw.images, videoUrl: raw.videoUrl }),
        ),
        thumbnailUrl: resolveMediaUrl(
          typeof raw.thumbnailUrl === 'string' && raw.thumbnailUrl.trim()
            ? raw.thumbnailUrl
            : undefined,
        ),
        description: raw.description,
        arabicDescription: raw.arabicDescription,
        seller: {
          id: raw.seller?.id,
          username: raw.seller?.username || '',
          displayName: raw.seller?.displayName || '',
          arabicName: raw.seller?.arabicName || '',
          avatar: raw.seller?.avatar,
          verified: raw.seller?.verified ?? false,
          followers: raw.seller?.followersCount ?? raw.seller?.followers ?? 0,
          following: raw.seller?.followingCount ?? 0,
          rating: typeof raw.seller?.rating === 'number' ? raw.seller.rating : null,
          reviewCount: raw.seller?.reviewCount ?? 0,
          country: raw.seller?.country || 'SA',
          bio: raw.seller?.bio || '',
        },
        featured: raw.featured ?? false,
        pinned: raw.pinned ?? false,
        postedAt: new Date(raw.createdAt).toLocaleDateString('ar-SA'),
        createdAt: raw.createdAt,
        editCount: typeof raw.editCount === 'number' ? raw.editCount : 0,
      });
    } catch {
      /* keep cache */
    } finally {
      setLoading(false);
    }
  }, [id, accessToken]);

  useEffect(() => {
    if (!cachedListing) return;
    setListing((prev) => {
      if (!prev || prev.id !== cachedListing.id) return cachedListing;
      return prev;
    });
  }, [cachedListing]);

  useEffect(() => {
    if (!id) return;
    if (!listing) setLoading(true);
    void loadListing();
  }, [id, accessToken, loadListing]);

  const sellerId = listing?.seller.id;

  const refreshSellerFollowState = useCallback(async () => {
    if (!sellerId || sellerId === me.id || !isAuthenticated || !accessToken) {
      setIsFollowing(null);
      return null;
    }
    const profile = await fetchUserProfile(sellerId);
    setIsFollowing(profile?.isFollowing ?? null);
    return profile;
  }, [accessToken, isAuthenticated, sellerId, me.id]);

  useEffect(() => {
    void refreshSellerFollowState();
  }, [refreshSellerFollowState]);

  const openSellerChat = (draftMessage?: string) => {
    if (!listing) return;
    if (!isAuthenticated) {
      Alert.alert('تسجيل الدخول', 'يجب تسجيل الدخول لمراسلة البائع');
      return;
    }
    const image =
      listing.images?.[0] ||
      listing.thumbnailUrl ||
      undefined;
    void import('@/lib/messageListingContext').then(({ saveMessageListingContext }) =>
      saveMessageListingContext({
        listingId: listing.id,
        title: listing.arabicTitle || listing.title,
        price: listing.price,
        currency: listing.currency || 'SAR',
        image,
        location: listing.arabicLocation || listing.location,
        peerUserId: listing.seller.id,
      }),
    );
    router.push({
      pathname: '/butchers/chat',
      params: {
        receiverId: listing.seller.id,
        receiverName: listing.seller.arabicName,
        receiverAvatar: listing.seller.avatar ?? '',
        accountType: 'LIVESTOCK_TRADER',
        threadType: 'DIRECT',
        listingId: listing.id,
        listingTitle: listing.arabicTitle || listing.title,
        listingPrice: String(listing.price),
        listingCurrency: listing.currency || 'SAR',
        listingImage: image ?? '',
        listingLocation: listing.arabicLocation || listing.location || '',
        ...(draftMessage?.trim() ? { draftMessage: draftMessage.trim() } : {}),
      },
    } as never);
  };

  const openSellerCall = async () => {
    if (!listing) return;
    if (!listing.contactPhone) {
      Alert.alert('لا يوجد رقم', 'لم يُذكر رقم تواصل في هذا الإعلان.');
      return;
    }
    const phone = listing.contactPhone.replace(/\D/g, '');
    if (!phone) {
      Alert.alert('رقم غير صالح', 'تعذّر قراءة رقم التواصل.');
      return;
    }
    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      Alert.alert('تعذّر الاتصال', 'تحقق من صحة رقم التواصل.');
    }
  };

  const handleFollowSeller = async () => {
    if (!listing || !accessToken || isFollowing === null) {
      Alert.alert('تسجيل الدخول', 'يجب تسجيل الدخول للمتابعة');
      return;
    }
    setFollowLoading(true);
    try {
      const result = await setFollowUser(listing.seller.id, !isFollowing);
      if (!result) throw new Error('follow_failed');
      const refreshed = await refreshSellerFollowState();
      if (!refreshed) throw new Error('profile_refetch_failed');
    } catch (error) {
      await refreshSellerFollowState();
      Alert.alert('خطأ', 'تعذّرت المتابعة');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading && !listing) {
    return (
      <SafeAreaView style={styles.screen}>
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.electricBright} />
      </SafeAreaView>
    );
  }

  if (!listing) {
    return (
      <SafeAreaView style={styles.screen}>
        <Text style={styles.notFound}>لم يتم العثور على الإعلان</Text>
      </SafeAreaView>
    );
  }

  const isOwner = !!me.id && listing.seller.id === me.id;

  const openPromote = (promoteGoal?: 'visibility' | 'pinned' | 'featured') => {
    // زر ترقية الإعلان يتبع تبديل الرسوم/الترقية في لوحة الإدارة
    if (!paidFlags.listingFeesEnabled) return;
    const goal =
      promoteGoal && isPromoteGoalEnabled(promoteGoal, paidFlags)
        ? promoteGoal
        : firstEnabledPromoteGoal(paidFlags);
    if (!goal) return;
    router.push(`/listing/${listing.id}/promote?goal=${goal}` as never);
  };

  const timeLabel = listing.createdAt
    ? formatRelativeTimeAr(listing.createdAt)
    : listing.postedAt;
  const images = listingPhotoUris(listing);
  const videoUri = listingVideoUrl(listing);
  const categoryLabel = CATEGORY_LABELS[listing.category] ?? '';

  const handleStartLive = () => {
    Alert.alert('البث المباشر', 'قريباً 🔴\nميزة البث المباشر للإعلانات ستتوفر قريباً.');
  };

  const canEditListing = listingAllowsOwnerEdit(listing.editCount, user?.role);

  const handleEdit = () => {
    if (!canEditListing) {
      Alert.alert('تعديل غير متاح', LISTING_EDIT_LIMIT_MESSAGE_AR);
      return;
    }
    void navigateToCreateListing({ editId: listing.id });
  };

  const handleDelete = async () => {
    const confirmed = await confirmDestructive(
      'حذف الإعلان',
      'هل أنت متأكد من حذف هذا الإعلان؟',
    );
    if (!confirmed) return;
    const result = await removeListing(listing.id);
    if (result.ok) {
      router.back();
    } else {
      await alertMessage(
        'خطأ',
        result.error || 'فشل حذف الإعلان. يرجى المحاولة لاحقاً.',
      );
    }
  };

  const galleryImageHeight = screenWidth * 0.65;

  // Owner management actions — single horizontal row
  const ownerActions = [
    {
      key: 'live',
      icon: 'signal-stream',
      label: 'بث مباشر',
      onPress: handleStartLive,
      badge: 'قريباً',
      danger: false,
    },
    ...(canEditListing
      ? [
          {
            key: 'edit',
            icon: 'create-outline',
            label: 'تعديل',
            onPress: handleEdit,
            danger: false,
          },
        ]
      : []),
    ...(paidFlags.listingFeesEnabled
      ? [
          {
            key: 'pay-fee',
            icon: 'receipt-outline',
            label: 'سداد الرسوم',
            onPress: () => setFeeModalVisible(true),
            danger: false,
          },
          ...(hasAnyBoostService
            ? [
                {
                  key: 'promote',
                  icon: 'rocket-outline',
                  label: 'ترقية الإعلان',
                  onPress: () => openPromote(),
                  danger: false,
                },
              ]
            : []),
        ]
      : []),
    {
      key: 'delete',
      icon: 'trash-outline',
      label: 'حذف',
      onPress: handleDelete,
      danger: true,
    },
  ];

  const showOwnerMenu = async () => {
    const key = await presentActionSheet({
      title: 'إدارة الإعلان',
      message: 'اختر الإجراء المطلوب',
      items: [
        ...(canEditListing
          ? [{ key: 'edit', label: 'تعديل الإعلان', icon: 'create-outline' }]
          : []),
        ...(paidFlags.listingFeesEnabled
          ? [
              { key: 'pay-fee', label: 'سداد الرسوم', icon: 'receipt-outline' },
              ...(hasAnyBoostService
                ? [{ key: 'promote', label: 'ترقية الإعلان', icon: 'rocket-outline' }]
                : []),
            ]
          : []),
        { key: 'delete', label: 'حذف الإعلان', icon: 'trash-outline', destructive: true },
        { key: 'cancel', label: 'إلغاء', cancel: true },
      ],
    });
    if (key === 'edit') handleEdit();
    if (key === 'pay-fee' && paidFlags.listingFeesEnabled) setFeeModalVisible(true);
    if (key === 'promote' && paidFlags.listingFeesEnabled) openPromote();
    if (key === 'delete') void handleDelete();
  };

  return (
    <View style={[styles.screen, getRtlDirection()]}>
      <SafeAreaView edges={['top']} style={styles.topSafe}>
        <View style={[styles.topBar, getRtlRow()]}>
          <Pressable onPress={() => router.back()} hitSlop={8} style={styles.topBarBtn}>
            <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
          </Pressable>
          <View style={[styles.topBarActions, getRtlRow()]}>
            {isOwner ? (
              <Pressable hitSlop={8} style={styles.topBarBtn} onPress={showOwnerMenu}>
                <AppIcon name="ellipsis-horizontal" size={20} color={colors.textPrimary} />
              </Pressable>
            ) : null}
            {!isOwner ? (
              <Pressable
                hitSlop={8}
                style={styles.topBarBtn}
                onPress={() => promptReport('listing', listing.id, isAuthenticated)}
              >
                <AppIcon name="flag-outline" size={20} color={colors.textPrimary} />
              </Pressable>
            ) : null}
            <Pressable
              hitSlop={8}
              style={styles.topBarBtn}
              onPress={() => Alert.alert('تم الحفظ', 'تم حفظ الإعلان في المفضّلة ❤️')}
            >
              <AppIcon name="heart-outline" size={20} color={colors.textPrimary} />
            </Pressable>
            <Pressable
              hitSlop={8}
              style={styles.topBarBtn}
              onPress={() =>
                Share.share({
                  message: `${listing.arabicTitle} — ${listing.price.toLocaleString()} ${listing.currency}\nhttps://alsfat.com/l/${listing.id}`,
                })
              }
            >
              <AppIcon name="share-outline" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerSection}>
          <RtlTextShell>
            <RtlText style={styles.title} numberOfLines={3} ellipsizeMode="tail">
              {listing.arabicTitle || listing.title}
            </RtlText>
          </RtlTextShell>

          <View style={[styles.headerMetaRow, getRtlRow()]}>
            <View style={[styles.headerMetaChip, getRtlRow()]}>
              <Text style={[styles.headerMetaText, getRtlText()]} numberOfLines={1}>
                {listing.arabicLocation || listing.location}
              </Text>
              <AppIcon name="map-marker-outline" size={13} color={colors.textMuted} />
            </View>
            {listing.weightKg != null && listing.weightKg > 0 ? (
              <View style={styles.headerMetaChip}>
                <Text style={[styles.headerMetaText, getRtlText()]} numberOfLines={1}>
                  {`الوزن: ${listing.weightKg.toLocaleString('ar-SA')} كجم`}
                </Text>
              </View>
            ) : null}
            <View style={[styles.headerMetaChip, getRtlRow()]}>
              <Text style={[styles.headerMetaText, getRtlText()]} numberOfLines={1}>
                {timeLabel || 'الآن'}
              </Text>
              <AppIcon name="time-outline" size={13} color={colors.textMuted} />
            </View>
          </View>

          {!isOwner ? (
            <View style={styles.sellerRow}>
              <Pressable
                onPress={handleFollowSeller}
                disabled={followLoading || isFollowing === null}
                style={[styles.followPill, isFollowing === true && styles.followingPill]}
              >
                {isFollowing === null && isAuthenticated ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <RtlTextShell>
                    <Text
                      style={[
                        styles.followPillText,
                        getRtlText(),
                        isFollowing === true && styles.followingPillText,
                      ]}
                    >
                      {isFollowing ? 'متابَع' : 'متابعة'}
                    </Text>
                  </RtlTextShell>
                )}
              </Pressable>
              <Pressable
                onPress={() => openUserProfile(router, listing.seller.id)}
                style={styles.sellerInline}
              >
                <CoverTrailRow justify="flex-end" gap={8} style={styles.sellerInlineTrail}>
                  <RtlTextShell flex>
                    <RtlText style={styles.sellerInlineName} numberOfLines={1}>
                      {listing.seller.arabicName || listing.seller.displayName || listing.seller.username}
                    </RtlText>
                  </RtlTextShell>
                  {listing.seller.verified ? <VerificationBadge size={16} /> : null}
                  <Image
                    source={uriSource(listing.seller.avatar)}
                    style={styles.sellerInlineAvatar}
                    contentFit="cover"
                  />
                </CoverTrailRow>
              </Pressable>
            </View>
          ) : null}

          {listing.contactPhone ? (
            <View style={[styles.contactPhoneRow, getRtlRow()]}>
              <Text style={[styles.contactPhoneText, getRtlText()]} numberOfLines={1}>
                {listing.contactPhone}
              </Text>
              <AppIcon name="call-outline" size={14} color={colors.textMuted} />
            </View>
          ) : null}
        </View>

        <ImageViewerModal
          visible={imageViewerVisible}
          images={images}
          initialIndex={imageViewerIndex}
          onClose={() => setImageViewerVisible(false)}
        />

        {(listing.arabicDescription || listing.description || categoryLabel || listing.breed || listing.age) ? (
          <View style={styles.descriptionSection}>
            {categoryLabel || listing.breed || listing.age ? (
              <RtlTextShell>
                <View style={[styles.specMetaLine, getRtlRow()]}>
                  {categoryLabel ? (
                    <Text style={[styles.specMetaText, getRtlText()]}>{categoryLabel}</Text>
                  ) : null}
                  {listing.breed ? (
                    <Text style={[styles.specMetaText, getRtlText()]}>{listing.breed}</Text>
                  ) : null}
                  {listing.age ? (
                    <Text style={[styles.specMetaText, getRtlText()]}>{listing.age}</Text>
                  ) : null}
                </View>
              </RtlTextShell>
            ) : null}
            {listing.arabicDescription ? (
              <RtlTextShell>
                <RtlText style={styles.descArabic}>{listing.arabicDescription}</RtlText>
              </RtlTextShell>
            ) : null}
            {listing.description && listing.description !== listing.arabicDescription ? (
              <RtlTextShell>
                <RtlText style={styles.desc}>{listing.description}</RtlText>
              </RtlTextShell>
            ) : null}
          </View>
        ) : null}

        {videoUri ? (
          <View style={styles.mediaSection}>
            <View style={styles.mediaLabelWrap}>
              <RtlTextShell>
                <RtlText style={styles.mediaHeading}>الفيديو</RtlText>
              </RtlTextShell>
            </View>
            <View style={styles.mediaBleed}>
              <ListingVideoPlayer
                uri={videoUri}
                posterUri={listing.thumbnailUrl}
                height={galleryImageHeight}
                style={styles.mediaPlayer}
              />
            </View>
          </View>
        ) : null}

        {images.length > 0 ? (
          <View style={styles.mediaSection}>
            <View style={styles.mediaLabelWrap}>
              <RtlTextShell>
                <RtlText style={styles.mediaHeading}>
                  الصور ({images.length.toLocaleString('ar-SA')})
                </RtlText>
              </RtlTextShell>
            </View>
            {images.map((uri, index) => (
              <Pressable
                key={`${uri}-${index}`}
                onPress={() => {
                  setImageViewerIndex(index);
                  setImageViewerVisible(true);
                }}
                style={styles.mediaBleed}
              >
                <Image
                  source={uriSource(uri)}
                  style={{ width: screenWidth, height: galleryImageHeight }}
                  contentFit="cover"
                  transition={250}
                />
              </Pressable>
            ))}
          </View>
        ) : null}

        <View style={styles.priceSection}>
          {listing.price > 0 ? (
            <RtlTextShell>
              <RtlText style={styles.price}>
                {`السعر: ${(listing.price % 1 === 0 ? Math.round(listing.price) : listing.price).toLocaleString('ar-SA')} ريال`}
              </RtlText>
            </RtlTextShell>
          ) : (
            <RtlTextShell>
              <RtlText style={styles.priceOnRequest}>السعر عند الطلب</RtlText>
            </RtlTextShell>
          )}
          {(listing.pinned || listing.featured) ? (
            <View style={styles.priceBadges}>
              {listing.pinned ? (
                <View style={[styles.pinned, getRtlRow()]}>
                  <AppIcon name="pin" size={11} color="#fff" />
                  <Text style={styles.pinnedText}>مثبّت</Text>
                </View>
              ) : null}
              {listing.featured ? (
                <View style={[styles.featured, getRtlRow()]}>
                  <AppIcon name="star" size={11} color="#1A1300" />
                  <Text style={styles.featuredText}>مميز</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {isOwner ? (
          <View style={[styles.ownerToolsSection, getRtlRow()]}>
            {ownerActions.map((a) => (
              <Pressable
                key={a.key}
                onPress={a.onPress}
                style={({ pressed }) => [
                  styles.ownerToolChip,
                  a.danger && styles.ownerToolChipDanger,
                  pressed && styles.ownerActionPressed,
                ]}
              >
                <AppIcon
                  name={a.icon}
                  size={18}
                  color={a.danger ? colors.rose : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.ownerToolLabel,
                    getRtlText(),
                    a.danger && styles.ownerActionTextDanger,
                  ]}
                >
                  {a.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <ListingCommentsSection listingId={listing.id} layout="edge" />
      </ScrollView>

      {/* Bottom CTA for buyers */}
      {!isOwner ? (
        <SafeAreaView edges={['bottom']} style={styles.ctaBar}>
          <Pressable
            onPress={() => openSellerChat()}
            style={({ pressed }) => [styles.ctaBtnApp, pressed && { opacity: 0.88 }]}
          >
            <AppIcon name="chatbubbles" size={20} color="#fff" />
            <Text style={styles.ctaBtnAppText}>مراسلة</Text>
          </Pressable>
          {listing.contactPhone ? (
            <Pressable
              onPress={() => void openSellerCall()}
              style={({ pressed }) => [styles.ctaBtnCall, pressed && { opacity: 0.88 }]}
            >
              <AppIcon name="call" size={20} color="#fff" />
              <Text style={styles.ctaBtnCallText}>اتصل</Text>
            </Pressable>
          ) : (
            <View style={{ flex: 1 }}>
              <PrimaryButton title="مراسلة البائع" onPress={() => openSellerChat()} />
            </View>
          )}
        </SafeAreaView>
      ) : null}

      {listing ? (
        <ListingFeePaymentSheet
          visible={feeModalVisible && paidFlags.listingFeesEnabled}
          listingId={listing.id}
          listingTitle={listing.arabicTitle || listing.title}
          onClose={() => setFeeModalVisible(false)}
        />
      ) : null}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.screenRoot },
    notFound: { ...typography.feedBody, color: colors.textMuted, textAlign: 'center', marginTop: 80 },
    scrollContent: {
      paddingBottom: 140,
    },
    topSafe: {
      backgroundColor: colors.bgDeep,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSoft,
    },
    topBar: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      minHeight: 48,
    },
    topBarActions: {
      alignItems: 'center',
      gap: 2,
    },
    topBarBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerSection: {
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.lg,
      backgroundColor: colors.screenRoot,
    },
    headerMetaRow: {
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.sm,
      width: '100%',
    },
    headerMetaChip: {
      flexGrow: 0,
      flexShrink: 1,
      alignItems: 'center',
      gap: 4,
      maxWidth: '100%',
    },
    headerMetaText: {
      ...typography.caption,
      color: colors.textMuted,
      flexShrink: 1,
    },
    descriptionSection: {
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderHairline,
      backgroundColor: colors.screenRoot,
    },
    specMetaLine: {
      flexWrap: 'wrap',
      gap: spacing.sm,
      width: '100%',
    },
    specMetaText: {
      ...typography.caption,
      color: colors.textMuted,
    },
    mediaSection: {
      gap: spacing.sm,
      backgroundColor: colors.screenRoot,
    },
    mediaLabelWrap: {
      paddingHorizontal: spacing.lg,
    },
    mediaHeading: {
      ...typography.smallHeading,
      color: colors.textMuted,
    },
    mediaBleed: {
      width: '100%',
      overflow: 'hidden',
      backgroundColor: colors.bgElevated,
    },
    mediaPlayer: {
      borderRadius: 0,
    },
    priceSection: {
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderHairline,
      backgroundColor: colors.screenRoot,
    },
    price: {
      ...typography.valueLarge,
      color: colors.textBrandStrong,
    },
    priceOnRequest: {
      ...typography.valueLarge,
      color: colors.textBrandStrong,
    },
    priceBadges: {
      flexDirection: 'row',
      direction: 'ltr',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    featured: {
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.gold,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    featuredText: { ...typography.badge, color: '#1A1300' },
    pinned: {
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.electric,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    pinnedText: { ...typography.badge, color: '#fff' },
    title: {
      ...typography.sectionHeading,
      color: colors.textBrandStrong,
    },
    sellerRow: {
      flexDirection: 'row',
      direction: 'ltr',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingTop: spacing.xs,
    },
    sellerInline: {
      flexShrink: 1,
      minWidth: 0,
      maxWidth: '72%',
    },
    sellerInlineTrail: {
      width: '100%',
    },
    sellerInlineAvatar: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.bgElevated,
      borderWidth: 1.5,
      borderColor: colors.electric,
      flexShrink: 0,
    },
    sellerInlineName: {
      ...typography.feedTitle,
      color: colors.textSecondary,
    },
    contactPhoneRow: {
      alignItems: 'center',
      gap: 6,
      paddingTop: spacing.xs,
    },
    contactPhoneText: {
      ...typography.caption,
      color: colors.textMuted,
      flexShrink: 1,
    },
    ownerToolsSection: {
      flexWrap: 'wrap',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderHairline,
      backgroundColor: colors.screenRoot,
      width: '100%',
    },
    ownerToolChip: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
      flexShrink: 0,
    },
    ownerToolChipDanger: {
      backgroundColor: `${colors.rose}10`,
    },
    ownerToolLabel: {
      ...typography.feedBody,
      color: colors.textSecondary,
    },
    ownerActionPressed: {
      opacity: 0.82,
    },
    ownerActionTextDanger: {
      color: colors.rose,
    },
    followPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.electricBright,
      flexShrink: 0,
    },
    followingPill: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.borderMid,
    },
    followPillText: {
      ...typography.button,
      color: '#fff',
    },
    followingPillText: { color: colors.textMuted },
    desc: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    descArabic: {
      ...typography.body,
      color: colors.textPrimary,
      lineHeight: 24,
    },
    ctaBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.sm,
      backgroundColor: colors.bgPrimary,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.borderSoft,
    },
    ctaBtnApp: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: radius.lg,
      backgroundColor: colors.electric,
    },
    ctaBtnAppText: {
      ...typography.button,
      color: '#fff',
    },
    ctaBtnCall: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      borderRadius: radius.lg,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.electricBright,
    },
    ctaBtnCallText: {
      ...typography.button,
      color: colors.electricBright,
    },
  });
}
