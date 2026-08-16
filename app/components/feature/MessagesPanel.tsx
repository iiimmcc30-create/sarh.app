// SAFAT — Messages inbox (Premium · RTL · Mobile-first)
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { getRtlRow, getRtlText } from '@/lib/rtl';
import { Image } from '@/components/ui/AppImage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import {
  filterMessageThreads,
  useMessageThreads,
  type MessageThreadFilter,
  type MessageThreadItem,
} from '@/hooks/useMessageThreads';
import {
  formatListingPrice,
  getAllMessageListingContexts,
  type MessageListingPreview,
} from '@/lib/messageListingContext';
import { UserProfileLink } from '@/components/feature/UserProfileLink';

const FILTERS: { id: MessageThreadFilter; label: string }[] = [
  { id: 'all', label: 'الكل' },
  { id: 'unread', label: 'غير مقروءة' },
  { id: 'transactions', label: 'المعاملات' },
  { id: 'requests', label: 'الطلبات' },
];

function formatThreadTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) {
    return date.toLocaleTimeString('ar-SA', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  ) {
    return 'أمس';
  }
  return date.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
}

interface MessagesPanelProps {
  variant?: 'embedded' | 'standalone';
  showHeader?: boolean;
}

export function MessagesPanel({
  variant = 'standalone',
  showHeader = true,
}: MessagesPanelProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarClearance = 58 + Math.max(insets.bottom, 8) + 6;
  const listBottomPadding =
    variant === 'embedded' ? spacing.lg : tabBarClearance + spacing.xl;
  const { accessToken } = useAuth();
  const { threads, loading, error, refetch } = useMessageThreads(accessToken, 'ALL');
  const [filter, setFilter] = useState<MessageThreadFilter>('all');
  const [search, setSearch] = useState('');
  const [listingByPeer, setListingByPeer] = useState<
    Record<string, MessageListingPreview>
  >({});

  useFocusEffect(
    useCallback(() => {
      void refetch();
      void getAllMessageListingContexts().then(setListingByPeer);
    }, [refetch]),
  );

  const listingTitlesByPeer = useMemo(() => {
    const map: Record<string, string | undefined> = {};
    for (const [peerId, preview] of Object.entries(listingByPeer)) {
      map[peerId] = preview.title;
    }
    return map;
  }, [listingByPeer]);

  const filteredChats = useMemo(
    () => filterMessageThreads(threads, filter, search, listingTitlesByPeer),
    [threads, filter, search, listingTitlesByPeer],
  );

  const openChat = (chat: MessageThreadItem) => {
    const p = chat.participant;
    if (!p) return;
    const isButcher = chat.type === 'BUTCHER';
    const listing = listingByPeer[p.id];
    router.push({
      pathname: '/butchers/chat',
      params: {
        threadId: chat.id,
        receiverId: p.id,
        receiverName: isButcher
          ? chat.butcher?.nameAr || p.arabicName
          : p.arabicName,
        receiverAvatar: isButcher
          ? chat.butcher?.logo || p.avatar || ''
          : p.avatar ?? '',
        threadType: chat.type,
        accountType: isButcher
          ? 'BUTCHER'
          : listing
            ? 'LIVESTOCK_TRADER'
            : 'USER',
        ...(chat.butcherId ? { butcherId: chat.butcherId } : {}),
        ...(listing
          ? {
              listingId: listing.listingId,
              listingTitle: listing.title,
              listingPrice: String(listing.price),
              listingCurrency: listing.currency || 'SAR',
              listingImage: listing.image || '',
              listingLocation: listing.location || '',
            }
          : {}),
      },
    } as never);
  };

  const resolveListingPreview = (chat: MessageThreadItem) => {
    const peerId = chat.participant?.id;
    if (peerId && listingByPeer[peerId]) return listingByPeer[peerId];
    if (chat.type === 'BUTCHER' && chat.butcher) {
      return {
        listingId: chat.butcher.id,
        title: chat.butcher.nameAr,
        price: 0,
        image: chat.butcher.logo || undefined,
        peerUserId: peerId || '',
        location: undefined,
      } satisfies MessageListingPreview;
    }
    return null;
  };

  return (
    <View style={styles.root}>
      {showHeader ? (
        <View style={[styles.header, getRtlRow()]}>
          <Pressable
            style={styles.headerIconBtn}
            onPress={() => router.push('/(tabs)/market' as never)}
            hitSlop={8}
            accessibilityLabel="إنشاء محادثة جديدة"
          >
            <AppIcon name="create-outline" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>الرسائل</Text>
          <View style={styles.headerSide} />
        </View>
      ) : null}

      <View style={styles.searchBar}>
        <AppIcon name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="البحث في الرسائل والإعلانات"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
        style={styles.filtersScroll}
      >
        {FILTERS.map((item) => {
          const active = filter === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => setFilter(item.id)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  active && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: listBottomPadding }}
      >
        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator size="large" color={colors.electricBright} />
            <Text style={styles.emptyText}>جاري تحميل المحادثات...</Text>
          </View>
        ) : error === 'unauthorized' ? (
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <AppIcon name="lock-closed-outline" size={28} color={colors.electricBright} />
            </View>
            <Text style={styles.emptyTitle}>سجّل الدخول</Text>
            <Text style={styles.emptyText}>عرض رسائلك يتطلب تسجيل الدخول</Text>
          </View>
        ) : filteredChats.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconWrap}>
              <AppIcon name="chatbubbles-outline" size={28} color={colors.electricBright} />
            </View>
            <Text style={styles.emptyTitle}>ابدأ محادثة جديدة</Text>
            <Text style={styles.emptyText}>
              تواصل مع البائعين عبر الإعلانات أو الملاحم
            </Text>
            <Pressable
              style={styles.exploreBtn}
              onPress={() => router.push('/(tabs)/market' as never)}
            >
              <Text style={styles.exploreBtnText}>استكشف الإعلانات</Text>
            </Pressable>
          </View>
        ) : (
          filteredChats.map((chat) => {
            const p = chat.participant;
            if (!p) return null;
            const isButcher = chat.type === 'BUTCHER';
            const title = isButcher
              ? chat.butcher?.nameAr || p.arabicName
              : p.arabicName;
            const avatarUri = isButcher
              ? chat.butcher?.logo || p.avatar
              : p.avatar;
            const listing = resolveListingPreview(chat);
            const showListingMeta =
              listing &&
              (listing.price > 0 || Boolean(listing.image) || Boolean(listing.title));

            return (
              <Pressable
                key={chat.id}
                onPress={() => openChat(chat)}
                style={({ pressed }) => [
                  styles.chatRow,
                  pressed && styles.chatRowPressed,
                ]}
              >
                <View style={styles.chatLeading}>
                  {isButcher ? (
                    <View style={styles.avatarWrap}>
                      <Image
                        source={{ uri: avatarUri }}
                        style={styles.avatar}
                        contentFit="cover"
                      />
                    </View>
                  ) : (
                    <UserProfileLink userId={p.id}>
                      <View style={styles.avatarWrap}>
                        <Image
                          source={{ uri: avatarUri }}
                          style={styles.avatar}
                          contentFit="cover"
                        />
                        <View style={styles.onlineDot} />
                      </View>
                    </UserProfileLink>
                  )}
                  {listing?.image ? (
                    <Image
                      source={{ uri: listing.image }}
                      style={styles.listingThumb}
                      contentFit="cover"
                    />
                  ) : null}
                </View>

                <View style={styles.chatBody}>
                  <View style={[styles.chatTop, getRtlRow()]}>
                    <View style={[styles.chatNameRow, getRtlRow()]}>
                      <Text style={styles.displayName} numberOfLines={1}>
                        {title}
                      </Text>
                      {!isButcher && p.verified ? (
                        <AppIcon
                          name="checkmark-circle"
                          size={14}
                          color={colors.electricBright}
                        />
                      ) : null}
                    </View>
                    <Text style={styles.chatTime}>
                      {formatThreadTime(chat.lastMessageAt)}
                    </Text>
                  </View>

                  {showListingMeta && listing.price > 0 ? (
                    <Text style={styles.listingMeta} numberOfLines={1}>
                      {listing.title}
                      {' · '}
                      {formatListingPrice(listing.price, listing.currency)}
                    </Text>
                  ) : showListingMeta && listing.title && isButcher ? (
                    <Text style={styles.listingMeta} numberOfLines={1}>
                      {listing.title}
                    </Text>
                  ) : null}

                  <View style={[styles.chatBottom, getRtlRow()]}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {chat.isMine ? 'أنت: ' : ''}
                      {chat.lastMessage ?? '—'}
                    </Text>
                    {chat.unread > 0 ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>
                          {chat.unread > 99 ? '99+' : chat.unread}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.screenRoot },
    header: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      minHeight: 52,
    },
    headerSide: { width: 40 },
    headerIconBtn: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    title: {
      ...typography.sectionHeading,
      color: colors.textPrimary,
      textAlign: 'center',
      flex: 1,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: PlatformPad,
      borderRadius: radius.lg,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    searchInput: {
      flex: 1,
      ...typography.body,
      color: colors.textPrimary,
      textAlign: 'right',
      paddingVertical: 0,
    },
    filtersScroll: { flexGrow: 0, marginBottom: spacing.sm },
    filtersRow: {
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      paddingBottom: spacing.sm,
    },
    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.borderSoft,
      backgroundColor: 'transparent',
    },
    filterChipActive: {
      backgroundColor: colors.electricBright,
      borderColor: colors.electricBright,
    },
    filterChipText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    filterChipTextActive: {
      color: '#fff',
      fontWeight: '600',
    },
    chatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.borderSoft,
    },
    chatRowPressed: { backgroundColor: colors.bgSurface },
    chatLeading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    avatarWrap: { position: 'relative' },
    avatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    onlineDot: {
      position: 'absolute',
      bottom: 1,
      right: 1,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.emerald,
      borderWidth: 2,
      borderColor: colors.bgDeep,
    },
    listingThumb: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    chatBody: { flex: 1, minWidth: 0 },
    chatTop: {
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 2,
      gap: spacing.sm,
    },
    chatNameRow: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
      minWidth: 0,
    },
    displayName: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      flexShrink: 1,
      ...getRtlText(),
    },
    chatTime: {
      ...typography.micro,
      color: colors.textMuted,
    },
    listingMeta: {
      ...typography.caption,
      color: colors.emerald,
      marginBottom: 2,
      ...getRtlText(),
    },
    chatBottom: {
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    lastMessage: {
      ...typography.caption,
      color: colors.textMuted,
      flex: 1,
      ...getRtlText(),
    },
    unreadBadge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      backgroundColor: colors.electricBright,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unreadCount: {
      ...typography.badge,
      color: '#fff',
      fontWeight: '700',
    },
    empty: {
      alignItems: 'center',
      paddingVertical: spacing.xxxl,
      paddingHorizontal: spacing.xl,
      gap: spacing.sm,
    },
    emptyCard: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.xl,
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
      borderRadius: radius.xl,
      backgroundColor: colors.bgSurface,
      borderWidth: 1,
      borderColor: colors.borderSoft,
    },
    emptyIconWrap: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(32, 182, 111, 0.14)',
      marginBottom: spacing.sm,
    },
    emptyTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      textAlign: 'center',
    },
    emptyText: {
      ...typography.caption,
      color: colors.textMuted,
      textAlign: 'center',
      lineHeight: 20,
    },
    exploreBtn: {
      marginTop: spacing.md,
      backgroundColor: colors.electricBright,
      paddingHorizontal: spacing.xl,
      paddingVertical: 12,
      borderRadius: radius.pill,
    },
    exploreBtnText: {
      ...typography.button,
      color: '#fff',
    },
  });
}

const PlatformPad = 12;
