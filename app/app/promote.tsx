import { ListingBoostTitleIcons } from '@/components/listing/ListingBoostTitleIcons';
import { PromotionStatsSheet } from '@/components/listing/PromotionStatsSheet';
import { Image, uriSource } from '@/components/ui/AppImage';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { SIDEBAR_MENU_ITEM } from '@/components/ui/SidebarMenuItem';
import { ScreenScaffold } from '@/components/ui/ScreenScaffold';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/hooks/useApp';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { navigateToCreateListing } from '@/lib/navigateToCreateListing';
import { resolveCurrentUserId } from '@/lib/currentUser';
import { rtlBackIcon } from '@/lib/rtl';
import { searchListings } from '@/services/listings';
import type { Listing } from '@/services/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AppScrollView } from '@/components/ui/AppScrollView';

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
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>تعزيز سرح</Text>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <AppIcon name={rtlBackIcon()} size={22} color={colors.textPrimary} />
          </Pressable>
        </View>

        <AppScrollView contentContainerStyle={styles.scroll}>
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
                <Text style={styles.createBtnText}>إنشاء إعلان</Text>
                <AppIcon name="add-circle-outline" size={18} color="#fff" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.listingsList}>
              {myListings.map((listing, index) => {
                const thumb = listingThumb(listing);
                const title = listing.arabicTitle || listing.title;
                const location = listing.arabicLocation || listing.location;
                const metaParts = [
                  listing.price > 0
                    ? `${listing.price.toLocaleString('ar-SA')} ${listing.currency}`
                    : null,
                  location || null,
                ].filter(Boolean);

                return (
                  <Pressable
                    key={listing.id}
                    style={({ pressed }) => [
                      styles.listingRow,
                      index < myListings.length - 1 && styles.listingRowDivider,
                      pressed && styles.listingRowPressed,
                    ]}
                    onPress={() => openPromote(listing.id)}
                  >
                    {/* Physical LEFT: chevron + optional stats */}
                    <AppIcon
                      name="angle-left"
                      size={SIDEBAR_MENU_ITEM.chevronSize}
                      color={colors.textSubtle}
                    />

                    {listing.promoted ? (
                      <Pressable
                        style={styles.statsBtn}
                        onPress={(e) => {
                          e.stopPropagation?.();
                          setStatsListingId(listing.id);
                        }}
                        hitSlop={8}
                        accessibilityLabel="إحصائيات الترويج"
                      >
                        <AppIcon name="stats-chart-outline" size={16} color="#7C3AED" />
                      </Pressable>
                    ) : null}

                    <View style={styles.spacer} />

                    {/* Physical RIGHT: title meta + thumb/icon */}
                    <View style={styles.listingContent}>
                      <View style={styles.textWrap}>
                        <View style={styles.titleRow}>
                          <ListingBoostTitleIcons
                            pinned={listing.pinned}
                            featured={listing.featured}
                          />
                          <Text style={styles.listingTitle} numberOfLines={2}>
                            {title}
                          </Text>
                        </View>
                        {metaParts.length > 0 ? (
                          <Text style={styles.listingMeta} numberOfLines={1}>
                            {metaParts.join(' · ')}
                          </Text>
                        ) : null}
                        {listing.promoted ? (
                          <Text style={styles.reachText}>ترويج نشط — زيادة ظهور</Text>
                        ) : null}
                      </View>

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
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </AppScrollView>

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
      flexDirection: 'row',
      direction: 'ltr',
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
      fontWeight: '600',
      textAlign: 'center',
      writingDirection: 'rtl',
      flex: 1,
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
      borderRadius: 20,
      backgroundColor: `${colors.electric}14`,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    heroTitle: {
      ...typography.h3,
      color: colors.textPrimary,
      fontWeight: '600',
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
      flexDirection: 'row',
      direction: 'ltr',
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
      writingDirection: 'rtl',
    },
    listingsList: {
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderSoft,
      backgroundColor: colors.bgElevated,
      overflow: 'hidden',
    },
    listingRow: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: SIDEBAR_MENU_ITEM.gap,
      paddingHorizontal: SIDEBAR_MENU_ITEM.paddingHorizontal,
      paddingVertical: SIDEBAR_MENU_ITEM.paddingVertical,
      minHeight: 72,
    },
    listingRowDivider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderHairline,
    },
    listingRowPressed: {
      opacity: 0.76,
    },
    spacer: {
      flex: 1,
      minWidth: SIDEBAR_MENU_ITEM.gap,
    },
    listingContent: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: SIDEBAR_MENU_ITEM.gap,
      flexShrink: 1,
      maxWidth: '88%',
    },
    textWrap: {
      flexShrink: 1,
      gap: 3,
      minWidth: 0,
    },
    titleRow: {
      flexDirection: 'row',
      direction: 'ltr',
      alignItems: 'center',
      gap: 6,
      justifyContent: 'flex-end',
    },
    listingTitle: {
      ...typography.bodyStrong,
      fontSize: SIDEBAR_MENU_ITEM.titleSize,
      fontWeight: SIDEBAR_MENU_ITEM.titleWeight,
      color: colors.textPrimary,
      textAlign: 'right',
      writingDirection: 'rtl',
      flexShrink: 1,
      lineHeight: 20,
    },
    listingMeta: {
      ...typography.caption,
      fontSize: SIDEBAR_MENU_ITEM.subtitleSize,
      color: colors.textMuted,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    reachText: {
      ...typography.micro,
      color: '#7C3AED',
      fontWeight: '600',
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    thumbWrap: {
      width: 48,
      height: 48,
      borderRadius: 12,
      overflow: 'hidden',
      flexShrink: 0,
      backgroundColor: colors.bgDeep,
    },
    thumb: {
      width: '100%',
      height: '100%',
    },
    thumbPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    thumbEmoji: { fontSize: 22 },
    statsBtn: {
      width: 32,
      height: 32,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#7C3AED30',
      backgroundColor: '#7C3AED08',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
  });
}
