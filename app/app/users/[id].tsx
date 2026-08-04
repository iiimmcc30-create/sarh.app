// SAFAT — Public User Profile
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { useApp } from '@/hooks/useApp';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserProfile, rateUser, setFollowUser, setBlockUser, type PublicUserProfile } from '@/services/users';
import { fetchUserPosts } from '@/services/posts';
import { searchListings } from '@/services/listings';
import type { Listing } from '@/services/types';
import type { Post } from '@/services/types';
import { promptReport } from '@/services/reports';
import { ListingCard } from '@/components/feature/ListingCard';
import { PostItem } from '@/components/feature/PostItem';
import { ProfileScreenLayout, type ProfileDisplayUser } from '@/components/feature/ProfileScreenLayout';
import { RatingModal } from '@/components/feature/RatingModal';
import { requireAuth, sharePost, showPostMenu } from '@/lib/postInteractions';
import { openPostDetail } from '@/lib/openPost';
import { presentActionSheet, confirmDestructive } from '@/lib/actionSheet';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    me,
    likedPosts,
    bookmarkedPosts,
    toggleLike,
    toggleBookmark,
    deletePost,
  } = useApp();
  const { accessToken, isAuthenticated, isLoading: authLoading } = useAuth();
  const { colors: themeColors } = useTheme();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ratingVisible, setRatingVisible] = useState(false);

  const isOwnProfile = !id || id === me.id;

  const fetchAuthoritativeProfile = useCallback(async () => {
    if (!isAuthenticated || !accessToken) return null;
    const targetId = id || me.id;
    const data = await fetchUserProfile(targetId);
    setProfile(data);
    return data;
  }, [accessToken, id, isAuthenticated, me.id]);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const targetId = id || me.id;
      const data = await fetchAuthoritativeProfile();
      if (!data) {
        setUserPosts([]);
        setUserListings([]);
        return;
      }
      const [postsData, listingsData] = await Promise.all([
        fetchUserPosts(targetId),
        searchListings({ sellerId: targetId }, accessToken),
      ]);
      setUserPosts(postsData);
      setUserListings(listingsData);
    } finally {
      setLoading(false);
    }
  }, [accessToken, fetchAuthoritativeProfile, id, me.id]);

  useFocusEffect(
    useCallback(() => {
      if (authLoading || !isAuthenticated || !accessToken) return;
      if (isOwnProfile) {
        router.replace('/(tabs)/profile');
        return;
      }
      void loadProfile();
    }, [accessToken, authLoading, isAuthenticated, isOwnProfile, loadProfile, router]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  const handleFollow = async () => {
    if (!profile || !accessToken || followLoading) {
      Alert.alert('تسجيل الدخول', 'يجب تسجيل الدخول للمتابعة');
      return;
    }
    setFollowLoading(true);
    try {
      const result = await setFollowUser(profile.id, !profile.isFollowing);
      if (!result) throw new Error('follow_failed');
      await fetchAuthoritativeProfile();
    } catch {
      await fetchAuthoritativeProfile();
      Alert.alert('خطأ', 'تعذّرت المتابعة، حاول مجدداً');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleChat = () => {
    if (!profile) return;
    if (!accessToken) {
      Alert.alert('تسجيل الدخول', 'يجب تسجيل الدخول لبدء محادثة');
      return;
    }
    router.push({
      pathname: '/butchers/chat',
      params: {
        receiverId: profile.id,
        receiverName: profile.arabicName,
        receiverAvatar: profile.avatar ?? '',
        accountType: profile.accountType ?? 'USER',
        threadType:
          profile.accountType === 'BUTCHER' || profile.role === 'BUTCHER'
            ? 'BUTCHER'
            : 'DIRECT',
      },
    } as never);
  };

  const renderPosts = () => {
    if (userPosts.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>لا توجد منشورات بعد</Text>
        </View>
      );
    }

    return userPosts.map((post) => (
      <PostItem
        key={post.id}
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

  const renderAds = () => {
    if (userListings.length === 0) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>لا توجد إعلانات بعد</Text>
        </View>
      );
    }

    return userListings.map((listing) => (
      <ListingCard
        key={listing.id}
        listing={listing}
        variant="list"
        listMode="market"
        onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
      />
    ));
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={themeColors.electricBright} />
        </View>
      </SafeAreaView>
    );
  }

  const profileUser: ProfileDisplayUser = {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    arabicName: profile.arabicName,
    avatar: profile.avatar,
    verified: profile.verified,
    bio: profile.bio,
    country: profile.country,
    followersCount: profile.followersCount,
    followingCount: profile.followingCount,
    postsCount: profile.postsCount,
    rating: profile.rating,
    reviewCount: profile.reviewCount,
  };

  const openConnections = (t: 'followers' | 'following') => {
    router.push({
      pathname: '/profile/connections',
      params: { userId: profile.id, tab: t, username: profile.username },
    } as never);
  };

  const handleShareProfile = () => {
    Share.share({
      message: `تفقّد بروفايل ${profile.arabicName || profile.displayName} في تطبيق سرح 🐪\nhttps://alsfat.com/u/${profile.username}`,
      title: 'سرح — المنصة الوطنية للثروة الحيوانية',
    });
  };

  const handleBlock = async () => {
    if (!profile || !accessToken) {
      Alert.alert('تسجيل الدخول', 'يجب تسجيل الدخول لحظر الحساب');
      return;
    }
    const confirmed = await confirmDestructive(
      'حظر الحساب',
      `لن ترى منشورات وإعلانات ${profile.arabicName || profile.displayName}، ولا يمكنه التواصل معك.`,
      profile.isBlocked ? 'إلغاء الحظر' : 'حظر',
    );
    if (!confirmed) return;

    const result = await setBlockUser(profile.id, !(profile.isBlocked ?? false));
    if (!result) {
      Alert.alert('خطأ', 'تعذّر تحديث الحظر، حاول مجدداً');
      return;
    }
    if (result.blocked) {
      Alert.alert('تم الحظر', 'تم حظر الحساب بنجاح');
      router.back();
      return;
    }
    await loadProfile();
  };

  const handleMenu = async () => {
    const key = await presentActionSheet({
      title: 'خيارات',
      message: profile.arabicName || profile.displayName,
      items: [
        {
          key: 'share',
          label: 'مشاركة الملف',
          icon: 'share-social-outline',
        },
        {
          key: 'block',
          label: profile.isBlocked ? 'إلغاء الحظر' : 'حظر الحساب',
          icon: 'block',
          destructive: true,
        },
        {
          key: 'report',
          label: 'إبلاغ',
          icon: 'flag-outline',
          destructive: true,
        },
        { key: 'cancel', label: 'إلغاء', cancel: true },
      ],
    });
    if (key === 'share') handleShareProfile();
    if (key === 'block') void handleBlock();
    if (key === 'report') promptReport('user', profile.id, !!accessToken);
  };

  return (
    <>
      <ProfileScreenLayout
        mode="visitor"
        user={profileUser}
        refreshing={refreshing}
        onRefresh={onRefresh}
        onBack={() => router.back()}
        onShare={handleShareProfile}
        onMenu={() => void handleMenu()}
        onFollowersPress={() => openConnections('followers')}
        onFollowingPress={() => openConnections('following')}
        onFollow={handleFollow}
        onMessage={handleChat}
        onRatePress={() => {
          if (!accessToken) {
            Alert.alert('تسجيل الدخول', 'يجب تسجيل الدخول لتقييم الحساب');
            return;
          }
          setRatingVisible(true);
        }}
        followLoading={followLoading}
        isFollowing={profile.isFollowing}
        postsContent={renderPosts()}
        adsContent={renderAds()}
      />

      <RatingModal
        visible={ratingVisible}
        onClose={() => setRatingVisible(false)}
        targetName={profile.arabicName || profile.displayName}
        currentRating={profile.rating}
        currentCount={profile.reviewCount}
        myRating={profile.myRating ?? null}
        onSubmit={async (rating) => {
          const result = await rateUser(profile.id, rating);
          if (!result) return false;
          setProfile((prev) =>
            prev
              ? {
                  ...prev,
                  rating: result.rating,
                  reviewCount: result.reviewCount,
                  myRating: result.myRating,
                }
              : prev,
          );
          return true;
        }}
      />
    </>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgDeep },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyTitle: {
      ...typography.body,
      color: colors.textMuted,
    },
  });
}
