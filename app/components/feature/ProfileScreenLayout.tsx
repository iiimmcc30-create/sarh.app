import { AppIcon } from '@/components/ui/FlaticonIcon';
import { Image, uriSource } from '@/components/ui/AppImage';
import { LinearGradient } from '@/components/ui/AppLinearGradient';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ambientShadow, ds } from '@/constants/designSystem';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/hooks/useTheme';
import { getCountryInfo } from '@/services/types';
import { rtlBackIcon, rtlRow, rtlText } from '@/lib/rtl';

export type ProfileTabKey = 'posts' | 'ads';

export type ProfileDisplayUser = {
  id: string;
  username: string;
  displayName: string;
  arabicName: string;
  avatar?: string;
  verified: boolean;
  bio?: string;
  country?: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  rating?: number | null;
  reviewCount?: number;
};

type ProfileScreenLayoutProps = {
  mode: 'own' | 'visitor';
  user: ProfileDisplayUser;
  postsContent: ReactNode;
  adsContent: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  onMenu?: () => void;
  onBack?: () => void;
  onShare?: () => void;
  onEditProfile?: () => void;
  onEditAvatar?: () => void;
  onAvatarPress?: () => void;
  hasStoryRing?: boolean;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  onFollow?: () => void;
  onMessage?: () => void;
  onRatePress?: () => void;
  followLoading?: boolean;
  isFollowing?: boolean;
  initialTab?: ProfileTabKey;
};

function formatStatCount(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}م`;
  }
  if (n >= 10_000) {
    const v = n / 1_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)} ألف`;
  }
  return n.toLocaleString('en-US');
}

function ProfileTabButton({
  label,
  active,
  onPress,
  styles,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1.04 : 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 6,
    }).start();
  }, [active, scale]);

  return (
    <Pressable style={styles.tabItem} onPress={onPress}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
      </Animated.View>
      {active ? <View style={styles.tabIndicator} /> : null}
    </Pressable>
  );
}

export function ProfileScreenLayout({
  mode,
  user,
  postsContent,
  adsContent,
  refreshing = false,
  onRefresh,
  onMenu,
  onBack,
  onShare,
  onEditProfile,
  onEditAvatar,
  onAvatarPress,
  hasStoryRing = false,
  onFollowersPress,
  onFollowingPress,
  onFollow,
  onMessage,
  onRatePress,
  followLoading = false,
  isFollowing = false,
  initialTab = 'posts',
}: ProfileScreenLayoutProps) {
  const insets = useSafeAreaInsets();
  const { colors: themeColors } = useTheme();
  const styles = useThemedStyles(({ colors, scheme }) => createStyles(colors, scheme));
  const [activeTab, setActiveTab] = useState<ProfileTabKey>(initialTab);
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerTranslate = useRef(new Animated.Value(12)).current;
  const tabOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      Animated.spring(headerTranslate, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }),
    ]).start();
  }, [headerOpacity, headerTranslate]);

  useEffect(() => {
    tabOpacity.setValue(0);
    Animated.timing(tabOpacity, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [activeTab, tabOpacity]);

  const displayName = user.arabicName || user.displayName || user.username;
  const country = getCountryInfo(user.country);
  const hasRating = user.rating != null && (user.reviewCount ?? 0) > 0;
  const ratingLabel = hasRating ? user.rating!.toFixed(1) : '—';

  const stats = useMemo(
    () => [
      {
        key: 'followers',
        value: formatStatCount(user.followersCount),
        label: 'المتابعون',
        onPress: onFollowersPress,
      },
      {
        key: 'following',
        value: formatStatCount(user.followingCount),
        label: 'المتابَعون',
        onPress: onFollowingPress,
      },
      {
        key: 'posts',
        value: formatStatCount(user.postsCount),
        label: 'المنشورات',
      },
    ],
    [
      user.followersCount,
      user.followingCount,
      user.postsCount,
      onFollowersPress,
      onFollowingPress,
    ],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={themeColors.electricBright}
            />
          ) : undefined
        }
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom, 12) + ds.tabBar.height + ds.tabBar.fabLift,
        }}
      >
        <View style={styles.headerBlock}>
          <Animated.View
            style={{
              opacity: headerOpacity,
              transform: [{ translateY: headerTranslate }],
            }}
          >
            <View style={[styles.toolbar, rtlRow]}>
              <View style={[styles.toolbarEnd, rtlRow]}>
                {mode === 'own' && onMenu ? (
                  <Pressable onPress={onMenu} hitSlop={10} style={styles.iconBtn}>
                    <AppIcon name="menu" size={22} color={themeColors.textPrimary} />
                  </Pressable>
                ) : null}
                {mode === 'visitor' && onBack ? (
                  <Pressable onPress={onBack} hitSlop={10} style={styles.iconBtn}>
                    <AppIcon name={rtlBackIcon()} size={22} color={themeColors.textPrimary} />
                  </Pressable>
                ) : null}
              </View>

              <View style={[styles.toolbarStart, rtlRow]}>
                {mode === 'own' && onEditProfile ? (
                  <Pressable onPress={onEditProfile} hitSlop={10} style={styles.iconBtn}>
                    <AppIcon name="pencil-outline" size={20} color={themeColors.textPrimary} />
                  </Pressable>
                ) : null}
                {mode === 'visitor' && onMenu ? (
                  <Pressable onPress={onMenu} hitSlop={10} style={styles.iconBtn}>
                    <AppIcon name="menu" size={22} color={themeColors.textPrimary} />
                  </Pressable>
                ) : null}
                {onShare && mode === 'visitor' ? (
                  <Pressable onPress={onShare} hitSlop={10} style={styles.iconBtn}>
                    <AppIcon name="share-social-outline" size={20} color={themeColors.textPrimary} />
                  </Pressable>
                ) : null}
              </View>
            </View>

            <View style={[styles.identityRow, rtlRow]}>
              <View style={styles.infoCol}>
                <View style={styles.nameBlock}>
                  <View style={[styles.nameRow, rtlRow]}>
                    <Text style={styles.displayName} numberOfLines={2}>
                      {displayName}
                    </Text>
                    {user.verified ? <VerificationBadge size={18} /> : null}
                    <Pressable
                      onPress={onRatePress}
                      disabled={!onRatePress}
                      style={({ pressed }) => [
                        styles.ratingChip,
                        pressed && onRatePress && styles.ratingChipPressed,
                      ]}
                    >
                      <AppIcon name="star" size={13} color={themeColors.gold} />
                      <Text style={styles.ratingText}>{ratingLabel}</Text>
                      {(user.reviewCount ?? 0) > 0 ? (
                        <Text style={styles.ratingCount}>({user.reviewCount})</Text>
                      ) : null}
                    </Pressable>
                  </View>
                  <Text style={styles.handleText}>@{user.username}</Text>
                </View>

                <View style={styles.statsCard}>
                  <View style={[styles.statsRow, rtlRow]}>
                    {stats.map((stat, index) => (
                      <View key={stat.key} style={[styles.statGroup, rtlRow]}>
                        {index > 0 ? <View style={styles.statDivider} /> : null}
                        {stat.onPress ? (
                          <Pressable style={styles.statItem} onPress={stat.onPress}>
                            <Text style={styles.statNum}>{stat.value}</Text>
                            <Text style={styles.statLbl}>{stat.label}</Text>
                          </Pressable>
                        ) : (
                          <View style={styles.statItem}>
                            <Text style={styles.statNum}>{stat.value}</Text>
                            <Text style={styles.statLbl}>{stat.label}</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>

                {!!user.bio ? (
                  <Text style={styles.bio} numberOfLines={3}>
                    {user.bio}
                  </Text>
                ) : null}

                <View style={[styles.locationRow, rtlRow]}>
                  <AppIcon name="map-marker-outline" size={14} color={themeColors.textMuted} />
                  <Text style={styles.locationText}>
                    {country.flag} {country.ar}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={onAvatarPress}
                disabled={!onAvatarPress}
                style={styles.avatarCol}
              >
                {hasStoryRing ? (
                  <LinearGradient
                    colors={[themeColors.electricBright, themeColors.cyan, '#34D399']}
                    style={styles.avatarRing}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <View style={styles.avatarClip}>
                      <Image
                        source={uriSource(user.avatar)}
                        style={styles.avatarImg}
                        contentFit="cover"
                      />
                    </View>
                  </LinearGradient>
                ) : (
                  <View style={styles.avatarPlain}>
                    <Image
                      source={uriSource(user.avatar)}
                      style={styles.avatarImg}
                      contentFit="cover"
                    />
                  </View>
                )}
                {mode === 'own' && onEditAvatar ? (
                  <Pressable style={styles.cameraBtn} onPress={onEditAvatar} hitSlop={8}>
                    <AppIcon name="camera-outline" size={14} color="#fff" />
                  </Pressable>
                ) : null}
              </Pressable>
            </View>

            {mode === 'visitor' && (onFollow || onMessage) ? (
              <View style={[styles.actionsRow, rtlRow]}>
                {onMessage ? (
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionBtn,
                      styles.btnMessage,
                      pressed && styles.actionBtnPressed,
                    ]}
                    onPress={onMessage}
                  >
                    <AppIcon name="chatbubble-outline" size={18} color={themeColors.textPrimary} />
                    <Text style={styles.btnMessageText}>مراسلة</Text>
                  </Pressable>
                ) : null}
                {onFollow ? (
                  <Pressable
                    onPress={onFollow}
                    disabled={followLoading}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      styles.btnFollow,
                      isFollowing && styles.btnFollowing,
                      pressed && !followLoading && styles.actionBtnPressed,
                    ]}
                  >
                    {followLoading ? (
                      <ActivityIndicator
                        size="small"
                        color={isFollowing ? themeColors.textPrimary : '#fff'}
                      />
                    ) : (
                      <>
                        <AppIcon
                          name={isFollowing ? 'checkmark-circle-outline' : 'person-add-outline'}
                          size={18}
                          color={isFollowing ? themeColors.textPrimary : '#fff'}
                        />
                        <Text style={[styles.btnFollowText, isFollowing && styles.btnFollowingText]}>
                          {isFollowing ? 'متابَع' : 'متابعة'}
                        </Text>
                      </>
                    )}
                  </Pressable>
                ) : null}
              </View>
            ) : null}
          </Animated.View>
        </View>

        <View style={styles.contentCardTop}>
          <View style={styles.tabsBar}>
            <View style={[styles.tabsRow, rtlRow]}>
              <ProfileTabButton
                label="المنشورات"
                active={activeTab === 'posts'}
                onPress={() => setActiveTab('posts')}
                styles={styles}
              />
              <ProfileTabButton
                label="الإعلانات"
                active={activeTab === 'ads'}
                onPress={() => setActiveTab('ads')}
                styles={styles}
              />
            </View>
          </View>
        </View>

        <Animated.View style={[styles.postsFeed, { opacity: tabOpacity }]}>
          {activeTab === 'posts' ? postsContent : adsContent}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark') {
  const tokens = scheme === 'light' ? ds.light : ds.dark;
  const cardShadow = ambientShadow(scheme, 'card');

  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.bgDeep,
    },
    headerBlock: {
      paddingBottom: spacing.md,
    },
    toolbar: {
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.xs,
      paddingBottom: spacing.sm,
      minHeight: 44,
    },
    toolbarStart: {
      alignItems: 'center',
      gap: 4,
    },
    toolbarEnd: {
      alignItems: 'center',
      gap: 4,
    },
    iconBtn: {
      width: ds.iconBtn.md,
      height: ds.iconBtn.md,
      borderRadius: ds.radius.pill,
      backgroundColor: tokens.glass,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.stroke,
      ...ambientShadow(scheme, 'soft'),
    },
    identityRow: {
      alignItems: 'flex-start',
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    infoCol: {
      flex: 1,
      minWidth: 0,
      gap: 8,
    },
    nameBlock: {
      gap: 2,
    },
    nameRow: {
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    displayName: {
      ...typography.h2,
      fontSize: 22,
      fontWeight: '800',
      color: colors.textPrimary,
      ...rtlText,
      flexShrink: 1,
    },
    ratingChip: {
      ...rtlRow,
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
    },
    ratingChipPressed: {
      opacity: 0.75,
    },
    ratingText: {
      ...typography.caption,
      fontWeight: '800',
      color: colors.textPrimary,
      fontSize: 13,
    },
    ratingCount: {
      ...typography.micro,
      color: colors.textMuted,
      fontSize: 11,
    },
    handleText: {
      ...typography.caption,
      color: colors.textMuted,
      fontWeight: '500',
      fontSize: 13,
      ...rtlText,
    },
    statsCard: {
      marginTop: 6,
      backgroundColor: colors.bgSurface,
      borderRadius: ds.radius.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.stroke,
      ...cardShadow,
    },
    statsRow: {
      alignItems: 'stretch',
      width: '100%',
    },
    statGroup: {
      flex: 1,
      alignItems: 'stretch',
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
      paddingHorizontal: 4,
      gap: 4,
    },
    statDivider: {
      width: StyleSheet.hairlineWidth,
      backgroundColor: colors.borderMid,
      marginVertical: 8,
      alignSelf: 'stretch',
    },
    statNum: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.textPrimary,
      textAlign: 'center',
    },
    statLbl: {
      ...typography.micro,
      color: colors.textMuted,
      fontSize: 11,
      textAlign: 'center',
      ...rtlText,
    },
    bio: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 22,
      ...rtlText,
      marginTop: 2,
    },
    locationRow: {
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    locationText: {
      ...typography.caption,
      color: colors.textMuted,
      fontSize: 12,
      ...rtlText,
    },
    avatarCol: {
      position: 'relative',
      paddingTop: 2,
    },
    avatarRing: {
      width: 92,
      height: 92,
      borderRadius: 46,
      padding: 2.5,
    },
    avatarPlain: {
      width: 88,
      height: 88,
      borderRadius: 44,
      overflow: 'hidden',
      backgroundColor: colors.bgElevated,
    },
    avatarClip: {
      width: '100%',
      height: '100%',
      borderRadius: 44,
      overflow: 'hidden',
      backgroundColor: colors.bgElevated,
    },
    avatarImg: {
      width: '100%',
      height: '100%',
    },
    cameraBtn: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.electric,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.bgDeep,
    },
    actionsRow: {
      alignSelf: 'stretch',
      width: '100%',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      gap: spacing.sm,
    },
    actionBtn: {
      flex: 1,
      minHeight: 44,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      ...rtlRow,
      gap: 6,
      paddingHorizontal: spacing.md,
    },
    actionBtnPressed: {
      opacity: 0.86,
      transform: [{ scale: 0.99 }],
    },
    btnFollow: {
      backgroundColor: colors.electric,
    },
    btnFollowing: {
      backgroundColor: colors.bgSurface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderMid,
    },
    btnFollowText: {
      ...typography.bodyStrong,
      color: '#fff',
      fontWeight: '700',
      fontSize: 14,
    },
    btnFollowingText: {
      color: colors.textPrimary,
    },
    btnMessage: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.borderMid,
      backgroundColor: colors.bgSurface,
    },
    btnMessageText: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      fontWeight: '700',
      fontSize: 14,
    },
    contentCardTop: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      borderRadius: ds.radius.lg,
      backgroundColor: colors.bgSurface,
      overflow: 'hidden',
      ...ambientShadow(scheme, 'soft'),
    },
    postsFeed: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      minHeight: 200,
      gap: spacing.sm,
    },
    tabsBar: {
      backgroundColor: colors.bgSurface,
    },
    tabsRow: {
      paddingHorizontal: spacing.lg,
    },
    tabItem: {
      flex: 1,
      alignItems: 'center',
      paddingTop: 10,
      paddingBottom: 8,
      position: 'relative',
    },
    tabLabel: {
      ...typography.bodyStrong,
      fontSize: 15,
      fontWeight: '700',
      color: colors.textMuted,
      ...rtlText,
    },
    tabLabelActive: {
      color: colors.electric,
    },
    tabIndicator: {
      position: 'absolute',
      bottom: 0,
      left: spacing.lg,
      right: spacing.lg,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.electric,
    },
  });
}
