import { ListingBoostTitleIcons } from '@/components/listing/ListingBoostTitleIcons';
import { PromotionStatsSheet } from '@/components/listing/PromotionStatsSheet';
import { Image, uriSource } from '@/components/ui/AppImage';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/hooks/useApp';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { navigateToCreateListing } from '@/lib/navigateToCreateListing';
import { resolveCurrentUserId } from '@/lib/currentUser';
import { getRtlText, rtlBackIcon, rtlForwardIcon, getRtlRow, getRtlDirection } from '@/lib/rtl';
import { searchListings } from '@/services/listings';
import type { Listing } from '@/services/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

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

function listingThumb(listing: Listing): string | undefined {
  const first = listing.images?.[0];
  return first && first.trim().length > 0 ? first : undefined;
}

export default function PromoteHubScreen() {
  const { styles, colors } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors),
    colors: theme.colors,
  }));
  const router = useRouter();
  const { me } = useApp();
  const { user, accessToken } = useAuth();
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [statsListingId, setStatsListingId] = useState<string | null>(null);

  const userId = resolveCurrentUserId(user, me);

  const loadListings = useCallback(async () => {
    if (!userId) {
      setMyListings([]);
      setLoadingListings(false);
      return;
    }
    setLoadingListings(true);
    try {
      const rows = await searchListings({ sellerId: userId }, accessToken);
      setMyListings(rows.slice(0, 30));
    } catch {
      setMyListings([]);
    } finally {
      setLoadingListings(false);
    }
  }, [accessToken, userId]);

  useFocusEffect(
    useCallback(() => {
      void loadListings();
    }, [loadListings]),
  );

  const openPromote = (listingId: string) => {
    router.push(`/listing/${listingId}/promote` as never);
  };

  return (
    <ScreenScaffold edges={['top']}>
      <View style={[styles.screen, getRtlDirection()]}>
        <View style={[styles.header, getRtlRow()]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>الترويج</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.hero}>
            <View style={styles.heroIconWrap}>
              <AppIcon name="rocket-outline" size={28} color={colors.electric} />
            </View>
            <Text style={styles.heroTitle}>اختر إعلاناً لبدء الترويج</Text>
            <Text style={styles.heroSub}>
              زِد ظهور إعلانك، ثبّته في الأعلى، أو أضف نجمة مميزة — كل خيار له تأثير مختلف
            </Text>
          </View>

          {loadingListings ? (
            <ActivityIndicator color={colors.electric} style={{ marginVertical: spacing.xl }} />
          ) : myListings.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIconWrap}>
                <AppIcon name="megaphone-outline" size={36} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>لا توجد إعلانات بعد</Text>
              <Text style={styles.emptySub}>انشر إعلاناً في السوق ثم عد لترويجه ورفع مشاهداته</Text>
              <Pressable style={styles.createBtn} onPress={() => void navigateToCreateListing()}>
                <AppIcon name="add-circle-outline" size={18} color="#fff" />
                <Text style={styles.createBtnText}>إنشاء إعلان</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.listingsList}>
              {myListings.map((listing) => {
                const thumb = listingThumb(listing);
                const title = listing.arabicTitle || listing.title;
                const location = listing.arabicLocation || listing.location;

                return (
                  <Pressable
                    key={listing.id}
                    style={({ pressed }) => [styles.listingCard, pressed && styles.listingCardPressed]}
                    onPress={() => openPromote(listing.id)}
                  >
                    <View style={styles.thumbWrap}>
                      {thumb ? (
                        <Image source={uriSource(thumb)} style={styles.thumb} contentFit="cover" />
                      ) : (
                        <View style={styles.thumbPlaceholder}>
                          <Text style={styles.thumbEmoji}>
                            {CATEGORY_ICONS[listing.category] || '📦'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.listingBody}>
                      <View style={[styles.titleRow, getRtlRow()]}>
                        <Text style={styles.listingTitle} numberOfLines={2}>
                          {title}
                        </Text>
                        <ListingBoostTitleIcons
                          pinned={listing.pinned}
                          featured={listing.featured}
                        />
                      </View>

                      {listing.price > 0 ? (
                        <Text style={styles.listingPrice}>
                          {listing.price.toLocaleString('ar-SA')} {listing.currency}
                        </Text>
                      ) : null}

                      <View style={[styles.locationRow, getRtlRow()]}>
                        <AppIcon name="map-marker-outline" size={13} color={colors.textMuted} />
                        <Text style={styles.locationText} numberOfLines={1}>
                          {location}
                        </Text>
                      </View>

                      {listing.promoted ? (
                        <View style={[styles.reachPill, getRtlRow()]}>
                          <AppIcon name="trending-up-outline" size={12} color="#7C3AED" />
                          <Text style={styles.reachPillText}>ترويج نشط — زيادة ظهور</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.cardActions}>
                      {listing.promoted ? (
                        <Pressable
                          style={styles.statsBtn}
                          onPress={(e) => {
                            e.stopPropagation?.();
                            setStatsListingId(listing.id);
                          }}
                          hitSlop={8}
                        >
                          <AppIcon name="stats-chart-outline" size={18} color="#7C3AED" />
                        </Pressable>
                      ) : null}
                      <View style={styles.chevronWrap}>
                        <AppIcon name={rtlForwardIcon()} size={18} color={colors.electric} />
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </ScrollView>

        <PromotionStatsSheet
          visible={!!statsListingId}
          listingId={statsListingId}
          listingTitle={
            myListings.find((l) => l.id === statsListingId)?.arabicTitle ??
            myListings.find((l) => l.id === statsListingId)?.title
          }
          onClose={() => setStatsListingId(null)}
        />
      </View>
    </ScreenScaffold>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: { flex: 1 },
    header: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bgSurface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    headerSpacer: { width: 40 },
    headerTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      fontWeight: '800',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
    },
    hero: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
    },
    heroIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: `${colors.electric}14`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    heroTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      fontWeight: '800',
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    heroSub: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
      writingDirection: 'rtl',
      paddingHorizontal: spacing.md,
    },
    emptyBox: {
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.xl,
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      backgroundColor: colors.bgElevated,
    },
    emptyIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.bgSurface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    emptySub: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    createBtn: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: 8,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: 999,
      backgroundColor: colors.electric,
    },
    createBtnText: {
      ...typography.bodyStrong,
      color: '#fff',
    },
    listingsList: { gap: spacing.sm },
    listingCard: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: colors.bgElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
    },
    listingCardPressed: {
      opacity: 0.92,
      transform: [{ scale: 0.995 }],
    },
    thumbWrap: {
      width: 72,
      height: 72,
      borderRadius: radius.lg,
      overflow: 'hidden',
      flexShrink: 0,
    },
    thumb: {
      width: '100%',
      height: '100%',
    },
    thumbPlaceholder: {
      flex: 1,
      backgroundColor: colors.bgDeep,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbEmoji: { fontSize: 28 },
    listingBody: {
      flex: 1,
      gap: 4,
      minWidth: 0,
    },
    titleRow: {
      alignItems: 'flex-start',
      gap: 6,
    },
    listingTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      ...getRtlText(),
      ...getRtlText(),
      flex: 1,
      lineHeight: 20,
    },
    listingPrice: {
      ...typography.caption,
      color: colors.textBrandStrong,
      fontWeight: '800',
      ...getRtlText(),
      ...getRtlText(),
    },
    locationRow: {
      alignItems: 'center',
      gap: 4,
    },
    locationText: {
      ...typography.micro,
      color: colors.textMuted,
      flex: 1,
      ...getRtlText(),
      ...getRtlText(),
    },
    reachPill: {
      alignSelf: 'flex-end',
      alignItems: 'center',
      gap: 4,
      marginTop: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: '#7C3AED12',
    },
    reachPillText: {
      ...typography.micro,
      color: '#7C3AED',
      fontWeight: '700',
      writingDirection: 'rtl',
    },
    cardActions: {
      alignItems: 'center',
      gap: spacing.xs,
      flexShrink: 0,
    },
    statsBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: '#7C3AED30',
      backgroundColor: '#7C3AED08',
      alignItems: 'center',
      justifyContent: 'center',
    },
    chevronWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: `${colors.electric}12`,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
