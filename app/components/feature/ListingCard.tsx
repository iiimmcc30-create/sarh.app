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
import { getRtlText, getRtlDirection, getRtlRow } from '@/lib/rtl';
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

/** Western digits with thousands separators — e.g. 1,700 */
function formatEnNumber(n: number): string {
  const value = Number.isFinite(n) ? n : 0;
  const rounded = value % 1 === 0 ? Math.round(value) : value;
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function toWesternDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
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
    const displayTime = toWesternDigits(timeLabel || 'الآن');

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.listRow, getRtlDirection(), pressed && styles.pressed]}
      >
        <View style={styles.listContent}>
          <View style={[styles.listTitleRow, getRtlRow()]}>
            <View style={styles.listTitleShell}>
              <Text style={styles.listTitle} numberOfLines={1} ellipsizeMode="tail">
                {title}
              </Text>
            </View>
            <ListingBoostTitleIcons pinned={listing.pinned} featured={listing.featured} />
            {!listing.pinned && !listing.featured && showNew ? (
              <Text style={styles.listStatusNew}>جديد</Text>
            ) : null}
          </View>

          {/* Single horizontal meta line: location · time · price */}
          <View style={styles.listMetaRow}>
            <View style={styles.listMetaLocation}>
              <AppIcon name="map-marker-outline" size={11} color={colors.textMuted} />
              <Text style={styles.listMetaText} numberOfLines={1} ellipsizeMode="tail">
                {location}
              </Text>
            </View>
            <View style={styles.listMetaFixed}>
              <AppIcon name="time-outline" size={11} color={colors.textMuted} />
              <Text style={styles.listMetaText} numberOfLines={1}>
                {displayTime}
              </Text>
            </View>
            {listing.price > 0 ? (
              <View style={styles.listMetaFixed}>
                <Text style={styles.listPriceAmount}>{formatEnNumber(listing.price)}</Text>
                <View style={styles.listRiyalBadge}>
                  <Text style={styles.listRiyalText}>﷼</Text>
                </View>
              </View>
            ) : null}
          </View>

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
            <AppIcon name="heart-outline" size={14} color="#fff" />
          </View>
          {hasVideo ? (
            <View style={styles.listVideoBadge}>
              <AppIcon name="play" size={10} color="#fff" variant="sr" />
            </View>
          ) : null}
          {photoCount > 1 ? (
            <View style={styles.listPhotoCountBadge}>
              <AppIcon name="image-outline" size={10} color="#fff" />
              <Text style={styles.listPhotoCountText}>{formatEnNumber(photoCount)}</Text>
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

  // External listing card — compact row matching reference proportions
  listRow: {
    ...getRtlRow(),
    alignItems: 'stretch',
    height: 118,
    paddingVertical: 0,
    paddingStart: spacing.md,
    paddingEnd: 0,
    gap: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderRadius: sarh.radius.card,
    marginHorizontal: spacing.md,
    marginVertical: 6,
    borderWidth: scheme === 'dark' ? 1 : StyleSheet.hairlineWidth,
    borderColor: scheme === 'dark' ? colors.borderSoft : tokens.stroke,
    overflow: 'hidden',
    ...ambientShadow(scheme, scheme === 'dark' ? 'soft' : 'card'),
  },
  listContent: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    paddingVertical: 10,
    paddingEnd: spacing.xs,
    justifyContent: 'space-between',
  },
  listTitleRow: {
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  listTitleShell: {
    flex: 1,
    minWidth: 0,
    direction: 'ltr',
  },
  listTitle: {
    ...typography.bodyStrong,
    fontSize: 14,
    lineHeight: 18,
    color: colors.textBrandStrong,
    fontWeight: '600',
    width: '100%',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  /**
   * Physical LTR + row-reverse keeps one clean horizontal line under RTL:
   * visual right → left: location · time · price
   */
  listMetaRow: {
    flexDirection: 'row-reverse',
    direction: 'ltr',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 8,
    width: '100%',
  },
  listMetaLocation: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
  },
  listMetaFixed: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 3,
    flexShrink: 0,
  },
  listMetaText: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.textMuted,
    writingDirection: 'rtl',
    flexShrink: 1,
  },
  listPriceAmount: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.textPrimary,
    fontWeight: '600',
    writingDirection: 'ltr',
    fontVariant: ['tabular-nums'],
  },
  listRiyalBadge: {
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSoft,
  },
  listRiyalText: {
    fontSize: 8,
    lineHeight: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  listStatusNew: {
    ...typography.micro,
    color: colors.cyan,
    fontWeight: '600',
    fontSize: 10,
    flexShrink: 0,
  },
  listSeller: {
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    maxWidth: '100%',
  },
  listAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.bgElevated,
    flexShrink: 0,
  },
  listSellerName: {
    fontSize: 11,
    lineHeight: 14,
    color: colors.textPrimary,
    flexShrink: 1,
    writingDirection: 'rtl',
  },
  listThumbWrap: {
    width: 118,
    alignSelf: 'stretch',
    overflow: 'hidden',
    backgroundColor: colors.bgElevated,
    flexShrink: 0,
    position: 'relative',
  },
  listHeartOverlay: {
    position: 'absolute',
    top: 6,
    start: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
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
