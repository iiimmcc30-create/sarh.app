// Powered by OnSpace.AI
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  imageCardOverlay,
  imageCardOverlayStrong,
  radius,
  spacing,
  typography,
  type ThemeColors,
} from '@/constants/theme';
import { ambientShadow, ds } from '@/constants/designSystem';
import { sarh } from '@/constants/sarhTokens';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { formatRelativeTimeAr } from '@/lib/formatRelativeTime';
import { getRtlText, inlineStart, getRtlDirection, getRtlRow } from '@/lib/rtl';
import { Listing, getCountryInfo } from '@/services/types';
import { UserProfileLink } from '@/components/feature/UserProfileLink';
import { ListingBoostTitleIcons } from '@/components/listing/ListingBoostTitleIcons';
import { VerificationBadge } from '@/components/ui/VerificationBadge';

interface ListingCardProps {
  listing: Listing;
  onPress?: () => void;
  variant?: 'grid' | 'feature' | 'profile' | 'list';
  /** Feed list layout variant for home vs market screens. */
  listMode?: 'home' | 'market';
  compact?: boolean;
}

const CATEGORY_ICONS: Record<Listing['category'], string> = {
  camels: '🐪',
  sheep: '🐑',
  goats: '🐐',
  cows: '🐄',
  horses: '🐎',
  birds: '🦅',
  feed: '🌾',
  equipment: '⚙️',
};

const VIDEO_EXT = /\.(mp4|mov|webm|m4v)(\?|$)/i;
const NEW_LISTING_MS = 24 * 60 * 60 * 1000;

function listingImageUri(listing: Listing): string | undefined {
  const first = listing.images?.[0];
  return first && first.trim().length > 0 ? first : undefined;
}

function listingHasVideo(listing: Listing): boolean {
  return (listing.images ?? []).some((uri) => VIDEO_EXT.test(uri));
}

function listingTimeLabel(listing: Listing): string {
  if (listing.createdAt) return formatRelativeTimeAr(listing.createdAt);
  return listing.postedAt || '';
}

function isNewListing(listing: Listing): boolean {
  if (!listing.createdAt) return false;
  const t = new Date(listing.createdAt).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < NEW_LISTING_MS;
}

function formatCount(n: number): string {
  return n.toLocaleString('ar-SA');
}

function ListingCardInner({
  listing,
  onPress,
  variant = 'grid',
  listMode = 'market',
  compact = false,
}: ListingCardProps) {
  const country = getCountryInfo(listing.country);
  const thumbUri = listingImageUri(listing);
  const { scheme, colors } = useTheme();
  const styles = useThemedStyles(({ colors: c, scheme: s }) => createStyles(c, s));
  const cardOverlay = imageCardOverlay(scheme);
  const cardOverlayStrong = imageCardOverlayStrong(scheme);
  const desc = listing.arabicDescription || listing.description;
  const timeLabel = listingTimeLabel(listing);
  const title = listing.arabicTitle || listing.title;
  const location = listing.arabicLocation || listing.location;
  const seller = listing.seller;
  const sellerName =
    seller?.arabicName || seller?.displayName || seller?.username || 'بائع';
  const sellerId = seller?.id;
  const photoCount = (listing.images ?? []).filter(
    (uri) => uri && uri.trim().length > 0 && !VIDEO_EXT.test(uri),
  ).length;

  if (variant === 'list') {
    const showNew = isNewListing(listing);
    const hasVideo = listingHasVideo(listing);

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.listRow, getRtlDirection(), pressed && styles.pressed]}
      >
        <View style={styles.listContent}>
          <View style={[styles.listTitleRow, getRtlRow()]}>
            <View style={[styles.listTitleWrap, getRtlRow()]}>
              <Text style={styles.listTitle} numberOfLines={2} ellipsizeMode="tail">
                {title}
              </Text>
              <ListingBoostTitleIcons pinned={listing.pinned} featured={listing.featured} />
            </View>
            <View style={styles.listMenuDots}>
              <AppIcon name="menu-dots-vertical" size={16} color={colors.textMuted} />
            </View>
          </View>

          <View style={[styles.listMetaItem, getRtlRow()]}>
            <AppIcon name="map-marker-outline" size={13} color={colors.textMuted} />
            <Text style={styles.listMetaText} numberOfLines={1}>
              {location}
            </Text>
          </View>

          {listing.price > 0 ? (
            <View style={[styles.listPriceRow, getRtlRow()]}>
              <Text style={styles.listPriceAmount}>
                {listing.price.toLocaleString('ar-SA')}
              </Text>
              <Text style={styles.listPriceCurrency}>{listing.currency}</Text>
            </View>
          ) : null}

          {timeLabel ? (
            <View style={[styles.listMetaItem, getRtlRow()]}>
              <AppIcon name="time-outline" size={12} color={colors.textSubtle} />
              <Text style={styles.listStatText}>{timeLabel}</Text>
            </View>
          ) : null}

          {!listing.pinned && !listing.featured && showNew ? (
            <Text style={styles.listStatusNew}>جديد</Text>
          ) : null}

          <UserProfileLink userId={sellerId} style={[styles.listSeller, getRtlRow()]}>
            <Image source={uriSource(seller?.avatar)} style={styles.listAvatar} />
            <Text style={styles.listSellerName} numberOfLines={1}>
              {sellerName}
            </Text>
            {seller?.verified ? <VerificationBadge size={14} /> : null}
          </UserProfileLink>
        </View>

        <View style={styles.listThumbWrap}>
          {thumbUri ? (
            <Image
              source={uriSource(thumbUri)}
              style={styles.listThumb}
              contentFit="cover"
              transition={0}
              priority="low"
            />
          ) : (
            <View style={styles.listThumbPlaceholder}>
              <Text style={styles.listThumbIcon}>{CATEGORY_ICONS[listing.category] || '📦'}</Text>
            </View>
          )}
          <View style={styles.listHeartOverlay}>
            <AppIcon name="heart-outline" size={16} color="#fff" />
          </View>
          {hasVideo ? (
            <View style={styles.listVideoBadge}>
              <AppIcon name="play" size={10} color="#fff" variant="sr" />
            </View>
          ) : null}
          {photoCount > 1 ? (
            <View style={styles.listPhotoCountBadge}>
              <AppIcon name="image-outline" size={10} color="#fff" />
              <Text style={styles.listPhotoCountText}>{photoCount}</Text>
            </View>
          ) : null}
        </View>
      </Pressable>
    );
  }

  if (variant === 'profile') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.profileCard, getRtlDirection(), pressed && styles.pressed]}
      >
        {thumbUri ? (
          <Image source={uriSource(thumbUri)} style={styles.profileImg} contentFit="cover" transition={250} />
        ) : (
          <View style={styles.profilePlaceholder}>
            <Text style={styles.profilePlaceholderIcon}>{CATEGORY_ICONS[listing.category] || '📦'}</Text>
          </View>
        )}
        <LinearGradient
          colors={cardOverlay}
          style={styles.profileOverlay}
        />
        <View style={styles.profileInfo}>
          <View style={[styles.profileTitleRow, getRtlRow()]}>
            <Text style={styles.profileTitle} numberOfLines={2}>
              {listing.arabicTitle}
            </Text>
            <ListingBoostTitleIcons pinned={listing.pinned} featured={listing.featured} size="md" />
          </View>
          <Text style={styles.profilePrice}>
            {listing.price.toLocaleString('ar-SA')} {listing.currency}
          </Text>
        </View>
      </Pressable>
    );
  }

  if (variant === 'feature') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.feature,
          compact && styles.featureCompact, getRtlDirection(),
          pressed && styles.pressed,
        ]}
      >
        <Image source={uriSource(thumbUri)} style={styles.featureImg} contentFit="cover" transition={250} />
        <LinearGradient
          colors={cardOverlayStrong}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.featureContent, compact && styles.featureContentCompact]}>
          <View style={[styles.featureTitleRow, getRtlRow()]}>
            <Text style={[styles.featureTitle, compact && styles.featureTitleCompact]} numberOfLines={2}>
              {listing.arabicTitle}
            </Text>
            <ListingBoostTitleIcons pinned={listing.pinned} featured={listing.featured} size="md" />
          </View>
          <View style={[styles.row, getRtlRow()]}>
            <Text style={[styles.featurePrice, compact && styles.featurePriceCompact]}>
              {listing.price.toLocaleString('ar-SA')} {listing.currency}
            </Text>
            <View style={styles.locationPill}>
              <Text style={styles.flag}>{country.flag}</Text>
              <Text style={[styles.locationText, compact && styles.locationTextCompact]} numberOfLines={1}>
                {listing.arabicLocation}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  // تغذية مثل حراج: بطاقات بعرض كامل تحت بعض
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.harajCard, getRtlDirection(), pressed && styles.pressed]}
    >
      <View style={[styles.harajTitleRow, getRtlRow()]}>
        <Text style={styles.harajTitle} numberOfLines={2}>
          {title}
        </Text>
        <ListingBoostTitleIcons pinned={listing.pinned} featured={listing.featured} />
      </View>

      <View style={[styles.harajMeta, getRtlRow()]}>
        <View style={[styles.harajMetaItem, getRtlRow()]}>
          <AppIcon name="map-marker-outline" size={13} color={colors.textMuted} />
          <Text style={styles.harajMetaText}>{location}</Text>
        </View>
        <View style={[styles.harajMetaItem, getRtlRow()]}>
          <AppIcon name="time-outline" size={13} color={colors.textMuted} />
          <Text style={styles.harajMetaText}>{timeLabel || 'الآن'}</Text>
        </View>
      </View>

      <View style={[styles.harajSellerRow, getRtlRow()]}>
        <UserProfileLink userId={sellerId} style={[styles.harajSellerInfo, getRtlRow()]}>
          <Image source={uriSource(seller?.avatar)} style={styles.harajAvatar} />
          <Text style={styles.harajSellerName} numberOfLines={1}>
            {sellerName}
          </Text>
          {seller?.verified ? <VerificationBadge size={14} /> : null}
        </UserProfileLink>
      </View>

      {desc ? (
        <Text style={styles.harajDesc} numberOfLines={8}>
          {desc}
        </Text>
      ) : null}

      {listing.price > 0 ? (
        <Text style={styles.harajPrice}>
          {listing.price.toLocaleString('ar-SA')} {listing.currency}
        </Text>
      ) : null}

      <View style={styles.harajImgWrap}>
        {thumbUri ? (
          <Image source={uriSource(thumbUri)} style={styles.harajImg} contentFit="cover" transition={250} />
        ) : (
          <View style={styles.harajImgPlaceholder}>
            <Text style={styles.harajImgPlaceholderIcon}>
              {CATEGORY_ICONS[listing.category] || '📦'}
            </Text>
          </View>
        )}
        {photoCount > 1 ? (
          <View style={styles.harajPhotoCountBadge}>
            <AppIcon name="image-outline" size={11} color="#fff" />
            <Text style={styles.harajPhotoCountText}>{photoCount}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const tokens = scheme === 'light' ? ds.light : ds.dark;
  return StyleSheet.create({
  pressed: {
    opacity: 0.92,
  },

  // قائمة السوق — بطاقة موحّدة في الرئيسية والملف والسوق
  listRow: {
    ...getRtlRow(),
    alignItems: 'stretch',
    minHeight: 156,
    paddingVertical: 0,
    paddingStart: ds.space.md,
    paddingEnd: 0,
    gap: ds.space.md,
    backgroundColor: colors.bgSurface,
    borderRadius: sarh.radius.card,
    marginHorizontal: ds.space.md,
    marginVertical: ds.space.xs,
    borderWidth: scheme === 'dark' ? 1 : StyleSheet.hairlineWidth,
    borderColor: scheme === 'dark' ? colors.borderSoft : tokens.stroke,
    overflow: 'hidden',
  ...ambientShadow(scheme, scheme === 'dark' ? 'soft' : 'card'),
  },
  listContent: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingVertical: ds.space.md,
    paddingEnd: ds.space.xs,
    justifyContent: 'center',
  },
  listTitleRow: {
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: ds.space.sm,
  },
  listTitleWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  listMenuDots: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  listTitle: {
    ...typography.bodyStrong,
    fontSize: 15,
    lineHeight: 20,
    color: colors.textPrimary,
    fontWeight: '600',
    writingDirection: 'rtl',
    flex: 1,
  },
  listPriceRow: {
    alignItems: 'baseline',
    gap: 5,
    marginTop: 2,
  },
  listPriceAmount: {
    fontSize: 18,
    lineHeight: 24,
    color: colors.textPrimary,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  listPriceCurrency: {
    ...typography.caption,
    lineHeight: 18,
    color: colors.textMuted,
    fontWeight: '600',
    writingDirection: 'rtl',
  },
  listMetaRow: {
    ...getRtlRow(),
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: 2,
  },
  listMetaItem: {
    ...getRtlRow(),
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
    marginTop: 2,
  },
  listMetaText: {
    ...typography.caption,
    lineHeight: 16,
    color: colors.textSecondary,
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  listStatusNew: {
    ...typography.micro,
    color: colors.cyan,
    fontWeight: '600',
  },
  listStatusFeatured: {
    ...typography.micro,
    color: colors.gold,
    fontWeight: '600',
  },
  listStatusPinned: {
    ...typography.micro,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  listSeller: {
    ...getRtlRow(),
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    maxWidth: '100%',
  },
  listAvatar: {
    width: 20,
    height: 20,
    borderRadius: 12,
    backgroundColor: colors.bgElevated,
  },
  listSellerName: {
    ...typography.caption,
    lineHeight: 16,
    color: colors.textPrimary,
    flexShrink: 1,
    writingDirection: 'rtl',
  },
  listStatText: {
    ...typography.caption,
    lineHeight: 16,
    color: colors.textSubtle,
    writingDirection: 'rtl',
  },
  listThumbWrap: {
    width: ds.listingThumb,
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    flexShrink: 0,
    position: 'relative',
  },
  listHeartOverlay: {
    position: 'absolute',
    top: 8,
    start: 8,
    width: 28,
    height: 28,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listThumb: {
    ...StyleSheet.absoluteFillObject,
  },
  listThumbPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listThumbIcon: { fontSize: 28 },
  listVideoBadge: {
    position: 'absolute',
    top: 6,
    start: 6,
    width: 20,
    height: 20,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listPhotoCountBadge: {
    position: 'absolute',
    bottom: 6,
    end: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  listPhotoCountText: {
    ...typography.micro,
    color: '#fff',
    fontWeight: '600',
    fontSize: 10,
  },

  profileCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    aspectRatio: 0.82,
  },
  profileImg: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
  },
  profilePlaceholderIcon: { fontSize: 36 },
  profileOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  profileInfo: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: spacing.sm,
    gap: 2,
  },
  profileTitleRow: {
    alignItems: 'center',
    gap: 6,
  },
  profileTitle: {
    ...typography.caption,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
  },
  profilePrice: {
    ...typography.micro,
    color: colors.gold,
    fontWeight: '600',
    textAlign: 'right',
  },
  profileStar: {
    position: 'absolute',
    top: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Feature
  feature: {
    width: 280,
    height: 380,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    marginEnd: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderMid,
    backgroundColor: colors.bgSurface,
  },
  featureCompact: {
    width: 248,
    height: 268,
    borderRadius: radius.xl,
    marginEnd: spacing.md,
  },
  featureImg: {
    width: '100%',
    height: '100%',
  },
  featureContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
  },
  featureContentCompact: {
    padding: spacing.md,
  },
  featureTitleRow: {
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 2,
  },
  featureTitle: {
    ...typography.h2,
    color: '#fff',
    marginBottom: 2,
    flex: 1,
  },
  featureTitleCompact: {
    ...typography.h3,
    marginBottom: 0,
  },
  featurePrice: {
    ...typography.h3,
    color: colors.gold,
  },
  featurePriceCompact: {
    ...typography.bodyStrong,
    fontSize: 14,
  },
  featuredBadge: {
    position: 'absolute',
    ...getRtlRow(),
    alignItems: 'center',
    backgroundColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 4,
  },
  featuredText: {
    ...typography.micro,
    color: '#1A1300',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgOverlay,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.borderSoft,
  },
  locationText: {
    ...typography.caption,
    color: '#fff',
  },
  locationTextCompact: {
    fontSize: 11,
    maxWidth: 88,
  },
  row: {
    ...getRtlRow(),
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flag: {
    fontSize: 14,
  },

  harajCard: {
    width: '100%',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSoft,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  harajTitleRow: {
    alignItems: 'flex-start',
    gap: 8,
  },
  harajTitle: {
    ...typography.h3,
    color: colors.textBrandStrong,
    fontWeight: '600',
    ...getRtlText(),
    ...getRtlText(),
    lineHeight: 26,
    flex: 1,
  },
  harajMeta: {
    ...getRtlRow(),
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  harajMetaItem: {
    ...getRtlRow(),
    alignItems: 'center',
    gap: 4,
  },
  harajMetaText: {
    ...typography.caption,
    color: colors.textMuted,
    writingDirection: 'rtl',
  },
  harajSellerRow: {
    ...getRtlRow(),
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  harajSellerInfo: {
    ...getRtlRow(),
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  harajAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bgElevated,
  },
  harajSellerName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    flexShrink: 1,
    ...getRtlText(),
    ...getRtlText(),
  },
  harajFeatured: {
    ...getRtlRow(),
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  harajFeaturedText: {
    ...typography.micro,
    color: '#1A1300',
    fontWeight: '600',
  },
  harajDesc: {
    ...typography.body,
    color: colors.textSecondary,
    ...getRtlText(),
    ...getRtlText(),
    lineHeight: 24,
  },
  harajPrice: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    fontWeight: '600',
    ...getRtlText(),
    ...getRtlText(),
  },
  harajImgWrap: {
    width: '100%',
    aspectRatio: 16 / 10,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    marginTop: spacing.xs,
  },
  harajImg: {
    width: '100%',
    height: '100%',
  },
  harajImgPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  harajImgPlaceholderIcon: { fontSize: 40 },
  harajPhotoCountBadge: {
    position: 'absolute',
    bottom: 8,
    end: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  harajPhotoCountText: {
    ...typography.micro,
    color: '#fff',
    fontWeight: '600',
    fontSize: 11,
  },
  });
}

export const ListingCard = memo(ListingCardInner, (prev, next) =>
  prev.variant === next.variant &&
  prev.listMode === next.listMode &&
  prev.compact === next.compact &&
  prev.onPress === next.onPress &&
  prev.listing.id === next.listing.id &&
  prev.listing.price === next.listing.price &&
  prev.listing.featured === next.listing.featured &&
  prev.listing.pinned === next.listing.pinned &&
  prev.listing.images?.[0] === next.listing.images?.[0] &&
  prev.listing.arabicTitle === next.listing.arabicTitle &&
  prev.listing.views === next.listing.views,
);

export default ListingCard;
