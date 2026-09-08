import { Image, uriSource } from '@/components/ui/AppImage';
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { AppText } from '@/components/ui/AppText';
import { MinistryServiceCard } from '@/components/feature/MinistryServiceCard';
import { PostItem } from '@/components/feature/PostItem';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { MEWA_FALLBACK_AVATAR, MEWA_FALLBACK_COVER, MEWA_USERNAME } from '@/constants/branding';
import { sarhProfileShareUrl } from '@/constants/sarhOfficial';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { openPostDetail } from '@/lib/openPost';
import { requireAuth, sharePost, showPostMenu } from '@/lib/postInteractions';
import { getRtlRow, rtlBackIcon } from '@/lib/rtl';
import { safePush } from '@/lib/safeNavigate';
import { fetchUserPosts } from '@/services/posts';
import {
  fetchMinistryAccount,
  fetchOfficialServices,
  type MinistryAccount,
  type OfficialService,
} from '@/services/officialServices';
import { setFollowUser } from '@/services/users';
import { SarhButton } from '@/design-system/components';
import { showToast } from '@/lib/toast';
import type { Post } from '@/services/types';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  View,
} from 'react-native';
import { AppScrollView } from '@/components/ui/AppScrollView';
import { SafeAreaView } from 'react-native-safe-area-context';

type MinistryTab = 'info' | 'posts' | 'services';

const TABS: Array<{ key: MinistryTab; label: string }> = [
  { key: 'info', label: 'المعلومات' },
  { key: 'posts', label: 'المنشورات' },
  { key: 'services', label: 'الخدمات' },
];

function formatFollowersAr(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}م مُتابع`;
  }
  if (n >= 10_000) {
    const v = n / 1_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} ألف مُتابع`;
  }
  return `${n.toLocaleString('en-US')} مُتابع`;
}

function parseTab(value?: string): MinistryTab {
  if (value === 'posts' || value === 'services' || value === 'info') return value;
  return 'info';
}

export default function MinistryProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const {
    me,
    likedPosts,
    bookmarkedPosts,
    toggleLike,
    toggleBookmark,
    deletePost,
  } = useApp();

  const [tab, setTab] = useState<MinistryTab>(parseTab(params.tab));
  const [account, setAccount] = useState<MinistryAccount | null>(null);
  const [services, setServices] = useState<OfficialService[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const load = useCallback(async () => {
    const [nextAccount, servicesResult] = await Promise.all([
      fetchMinistryAccount(),
      fetchOfficialServices(),
    ]);
    setAccount(nextAccount);
    setServices(servicesResult.services.filter((item) => item.active !== false));
    if (nextAccount?.id) {
      const userPosts = await fetchUserPosts(nextAccount.id);
      setPosts(userPosts);
    } else {
      setPosts([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        setLoading(true);
        await load();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const followersLabel = useMemo(
    () => formatFollowersAr(account?.followersCount ?? 0),
    [account?.followersCount],
  );

  const handleFollow = async () => {
    if (!account?.id) {
      Alert.alert('الحساب', 'تعذّر تحميل حساب الوزارة حالياً');
      return;
    }
    if (!isAuthenticated) {
      Alert.alert('تسجيل الدخول', 'يجب تسجيل الدخول للمتابعة');
      return;
    }
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const result = await setFollowUser(account.id, !account.isFollowing);
      if (!result) throw new Error('follow_failed');
      const refreshed = await fetchMinistryAccount();
      if (refreshed) setAccount(refreshed);
    } catch {
      void showToast('تعذّرت المتابعة، حاول مجدداً', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${account?.arabicName || ''}\n${sarhProfileShareUrl(account?.username || MEWA_USERNAME)}`,
      });
    } catch {
      // dismissed
    }
  };

  const openService = (service: OfficialService) => {
    safePush(`/ministry/services/${service.id}`, undefined, router);
  };

  const renderInfo = () => (
    <View style={styles.block}>
      <AppText style={styles.sectionTitle}>الوصف</AppText>
      {account?.about ? <AppText style={styles.body}>{account.about}</AppText> : null}
      <AppText style={[styles.sectionTitle, styles.sectionSpaced]}>المعلومات</AppText>
      {account?.website ? (
        <InfoRow
          styles={styles}
          label="الموقع الإلكتروني"
          value={account.website}
          onPress={() => void Linking.openURL(account.website!)}
          link
        />
      ) : null}
      {account?.publicPhone ? (
        <InfoRow
          styles={styles}
          label="الهاتف"
          value={account.publicPhone}
          onPress={() => void Linking.openURL(`tel:${account.publicPhone}`)}
        />
      ) : null}
      {account?.publicEmail ? (
        <InfoRow
          styles={styles}
          label="البريد الإلكتروني"
          value={account.publicEmail}
          onPress={() => void Linking.openURL(`mailto:${account.publicEmail}`)}
        />
      ) : null}
    </View>
  );

  const renderPosts = () => {
    if (posts.length === 0) {
      return (
        <View style={styles.empty}>
          <AppText style={styles.emptyTitle}>لا توجد منشورات بعد</AppText>
        </View>
      );
    }
    return posts.map((post) => (
      <PostItem
        key={post.id}
        variant="profile"
        post={{
          ...post,
          liked: likedPosts.has(post.id),
          bookmarked: bookmarkedPosts.has(post.id),
        }}
        onPress={() => openPostDetail(router, post.id)}
        onLike={() => requireAuth(isAuthenticated, 'الإعجاب') && toggleLike(post.id)}
        onComment={() => openPostDetail(router, post.id, { focusComment: isAuthenticated })}
        onBookmark={() => requireAuth(isAuthenticated, 'الحفظ') && toggleBookmark(post.id)}
        onShare={() => sharePost(post)}
        onMenu={() => showPostMenu(post, me, router, deletePost, isAuthenticated)}
      />
    ));
  };

  const renderServices = () => {
    if (services.length === 0) {
      return (
        <View style={styles.empty}>
          <AppText style={styles.emptyTitle}>لا توجد خدمات متاحة حالياً</AppText>
        </View>
      );
    }
    return (
      <View style={styles.serviceList}>
        {services.map((service) => (
          <MinistryServiceCard
            key={service.id}
            service={service}
            onPress={() => openService(service)}
          />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={[styles.nav, getRtlRow()]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="رجوع"
          onPress={() => router.back()}
          style={styles.navBtn}
        >
          <AppIcon name={rtlBackIcon()} size={20} color={colors.textPrimary} />
        </Pressable>
        <AppText style={styles.navTitle} numberOfLines={1}>
          {account?.arabicName || ''}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="مشاركة"
          onPress={() => void handleShare()}
          style={styles.navBtn}
        >
          <AppIcon name="share-outline" size={18} color={colors.textPrimary} />
        </Pressable>
      </View>

      <AppScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.electricBright}
          />
        }
      >
        <View style={styles.coverWrap}>
          <Image
            source={account?.coverImage ? uriSource(account.coverImage) : MEWA_FALLBACK_COVER}
            style={styles.cover}
            contentFit="cover"
          />
        </View>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarRing}>
            <Image
              source={account?.avatar ? uriSource(account.avatar) : MEWA_FALLBACK_AVATAR}
              style={styles.avatar}
              contentFit="cover"
              accessibilityLabel={account?.arabicName || ''}
            />
          </View>
        </View>

        <View style={styles.identity}>
          <View style={[styles.nameRow, getRtlRow()]}>
            <AppText style={styles.name}>{account?.arabicName || ''}</AppText>
            {account?.verified ? <VerificationBadge size={18} /> : null}
          </View>
          <AppText style={styles.followers}>{followersLabel}</AppText>
          {account?.bio ? <AppText style={styles.bio}>{account.bio}</AppText> : null}
          <SarhButton
            title={account?.isFollowing ? 'متابَع' : 'متابعة'}
            variant={account?.isFollowing ? 'secondary' : 'primary'}
            size="sm"
            onPress={() => void handleFollow()}
            loading={followLoading}
            accessibilityLabel={account?.isFollowing ? 'متابَع' : 'متابعة'}
          />
        </View>

        <View style={[styles.tabs, getRtlRow()]}>
          {TABS.map((item) => {
            const active = tab === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setTab(item.key)}
                style={styles.tabItem}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <AppText style={[styles.tabLabel, active && styles.tabLabelOn]}>
                  {item.label}
                </AppText>
                {active ? <View style={styles.tabLine} /> : <View style={styles.tabLineOff} />}
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.electricBright} style={styles.loader} />
        ) : tab === 'info' ? (
          renderInfo()
        ) : tab === 'posts' ? (
          renderPosts()
        ) : (
          renderServices()
        )}
      </AppScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  styles,
  label,
  value,
  onPress,
  link,
}: {
  styles: ReturnType<typeof createStyles>;
  label: string;
  value: string;
  onPress: () => void;
  link?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.infoRow} accessibilityRole="link">
      <AppText style={styles.infoLabel}>{label}</AppText>
      <AppText style={[styles.infoValue, link && styles.infoLink]}>{value}</AppText>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.screenRoot },
    nav: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    navBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    navTitle: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '700',
      flex: 1,
      textAlign: 'center',
    },
    scroll: {
      paddingBottom: spacing.huge,
    },
    coverWrap: {
      height: 148,
      backgroundColor: colors.bgDeep,
    },
    cover: {
      width: '100%',
      height: '100%',
    },
    avatarWrap: {
      alignItems: 'center',
      marginTop: -48,
    },
    avatarRing: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: '#FFFFFF',
      borderWidth: 4,
      borderColor: colors.screenRoot,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      shadowColor: '#07131C',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 10,
      elevation: 6,
    },
    avatar: {
      width: 78,
      height: 78,
    },
    identity: {
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.sm,
    },
    nameRow: {
      alignItems: 'center',
      gap: 8,
      justifyContent: 'center',
    },
    name: {
      ...typography.h2,
      color: colors.textPrimary,
      fontWeight: '800',
      textAlign: 'center',
    },
    followers: {
      ...typography.caption,
      color: colors.electric,
      fontWeight: '600',
    },
    bio: {
      ...typography.feedBody,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
    followBtn: {
      marginTop: spacing.xs,
      width: '100%',
      borderRadius: radius.md,
      backgroundColor: colors.textPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 48,
    },
    followBtnOn: {
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.borderMid,
    },
    followText: {
      ...typography.body,
      color: colors.screenRoot,
      fontWeight: '700',
    },
    followTextOn: {
      color: colors.textPrimary,
    },
    tabs: {
      marginTop: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderHairline,
      paddingHorizontal: spacing.sm,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      paddingTop: spacing.sm,
    },
    tabLabel: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '600',
    },
    tabLabelOn: {
      color: colors.electric,
    },
    tabLine: {
      marginTop: 8,
      height: 2,
      width: '70%',
      backgroundColor: colors.electric,
      borderRadius: 2,
    },
    tabLineOff: {
      marginTop: 8,
      height: 2,
    },
    loader: { marginTop: spacing.xl },
    block: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      gap: spacing.sm,
    },
    sectionTitle: {
      ...typography.smallHeading,
      color: colors.textPrimary,
      fontWeight: '700',
    },
    sectionSpaced: {
      marginTop: spacing.md,
    },
    body: {
      ...typography.feedBody,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    infoRow: {
      paddingVertical: spacing.sm,
      gap: 4,
    },
    infoLabel: {
      ...typography.caption,
      color: colors.textMuted,
    },
    infoValue: {
      ...typography.body,
      color: colors.textPrimary,
    },
    infoLink: {
      color: colors.electric,
    },
    empty: {
      paddingVertical: spacing.xxl,
      alignItems: 'center',
    },
    emptyTitle: {
      ...typography.body,
      color: colors.textMuted,
    },
    serviceList: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      gap: spacing.md,
    },
    pressed: {
      opacity: 0.9,
    },
  });
}
