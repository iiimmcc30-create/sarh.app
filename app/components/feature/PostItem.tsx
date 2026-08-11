// SAFAT — Post card with elevated card layout, RTL body, and animated actions.
import { AppIcon } from '@/components/ui/FlaticonIcon';
import { VerificationBadge } from '@/components/ui/VerificationBadge';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Image, uriSource } from '@/components/ui/AppImage';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { ambientShadow, ds } from '@/constants/designSystem';
import { radius, spacing, typography, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlRow, getRtlText } from '@/lib/rtl';
import { formatPostTimestampAr } from '@/lib/formatRelativeTime';
import { Post } from '@/services/types';
import { UserProfileLink } from '@/components/feature/UserProfileLink';
import { PostMediaGallery } from '@/components/feature/PostMediaGallery';

const HASHTAG_BLUE = '#1D9BF0';

interface PostItemProps {
  post: Post;
  variant?: 'feed' | 'detail' | 'profile';
  onPress?: () => void;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onMenu: () => void;
  onBookmark?: () => void;
}

const TEXT_COLLAPSE_LINES = 8;

function formatCount(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}م`;
  }
  if (n >= 1_000) {
    const v = n / 1_000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}ألف`;
  }
  return String(n);
}

function PostBody({ text, style, lines }: { text: string; style: TextStyle; lines?: number }) {
  const parts = useMemo(() => {
    const tokens: { text: string; isTag: boolean }[] = [];
    const re = /(#[\u0600-\u06FF\w]+)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) tokens.push({ text: text.slice(last, m.index), isTag: false });
      tokens.push({ text: m[0], isTag: true });
      last = m.index + m[0].length;
    }
    if (last < text.length) tokens.push({ text: text.slice(last), isTag: false });
    return tokens;
  }, [text]);

  if (parts.length === 1 && !parts[0].isTag) {
    return (
      <Text style={style} numberOfLines={lines}>
        {text}
      </Text>
    );
  }

  return (
    <Text style={style} numberOfLines={lines}>
      {parts.map((p, i) =>
        p.isTag ? (
          <Text key={i} style={[style, { color: HASHTAG_BLUE }]}>
            {p.text}
          </Text>
        ) : (
          <Text key={i}>{p.text}</Text>
        ),
      )}
    </Text>
  );
}

function ActionBtn({
  icon,
  iconColor,
  count,
  label,
  textColor,
  onPress,
  style,
  countStyle,
  size = 20,
}: {
  icon: string;
  iconColor: string;
  count?: number;
  label?: string;
  textColor: string;
  onPress: () => void;
  style: ViewStyle;
  countStyle: TextStyle;
  size?: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const pressIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 0.82, useNativeDriver: true, speed: 40, bounciness: 0 }),
      Animated.timing(opacity, { toValue: 0.5, duration: 80, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  const pressOut = useCallback(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 22, bounciness: 10 }),
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);

  return (
    <Pressable style={style} onPress={onPress} onPressIn={pressIn} onPressOut={pressOut} hitSlop={10}>
      <Animated.View style={[{ transform: [{ scale }], opacity }, getRtlRow(), { alignItems: 'center', gap: 4 }]}>
        <AppIcon name={icon} size={size} color={iconColor} />
        {label ? (
          <Text style={[countStyle, { color: textColor }]}>{label}</Text>
        ) : null}
        {count !== undefined && count > 0 ? (
          <Text style={[countStyle, { color: textColor }]}>{formatCount(count)}</Text>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function PostItemComponent({
  post,
  variant = 'feed',
  onPress,
  onLike,
  onComment,
  onShare,
  onMenu,
  onBookmark,
}: PostItemProps) {
  const { styles, colors, scheme } = useThemedStyles((theme) => ({
    styles: createStyles(theme.colors, theme.scheme, theme.scheme === 'dark' && variant === 'feed'),
    colors: theme.colors,
    scheme: theme.scheme,
  }));

  const [expanded, setExpanded] = useState(variant === 'detail');

  const images = useMemo(() => {
    if (post.images && post.images.length > 0) return post.images;
    if (post.image) return [post.image];
    return [];
  }, [post.images, post.image]);

  const timestamp = useMemo(
    () => (post.createdAt ? formatPostTimestampAr(post.createdAt) : post.postedAt),
    [post.createdAt, post.postedAt],
  );

  const bodyText = post.arabicContent || post.content;
  const authorRating =
    typeof post.author.rating === 'number' ? post.author.rating.toFixed(1) : null;

  return (
    <View style={[styles.card, variant === 'detail' && styles.cardDetail, variant === 'profile' && styles.cardProfile]}>
      <View style={[styles.row, getRtlRow()]}>
        <UserProfileLink userId={post.author.id}>
          <Image source={uriSource(post.author.avatar)} style={styles.avatar} contentFit="cover" />
        </UserProfileLink>

        <View style={styles.main}>
          <View style={[styles.metaLine, getRtlRow()]}>
            <UserProfileLink userId={post.author.id} style={[styles.metaInfo, getRtlRow()]}>
              <Text style={styles.name} numberOfLines={1}>
                {post.author.arabicName}
              </Text>
              {post.author.verified ? <VerificationBadge size={14} /> : null}
              {authorRating ? (
                <View style={styles.ratingMini}>
                  <AppIcon name="star" size={11} color={colors.gold} />
                  <Text style={styles.ratingMiniText}>{authorRating}</Text>
                </View>
              ) : null}
              {post.author.isAI ? (
                <View style={styles.aiBadge}>
                  <Text style={styles.aiBadgeText}>AI</Text>
                </View>
              ) : null}
              <Text style={styles.metaMuted} numberOfLines={1}>
                {'@' + post.author.username}
              </Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaMuted} numberOfLines={1}>
                {timestamp}
              </Text>
            </UserProfileLink>

            <Pressable
              hitSlop={12}
              onPress={onMenu}
              style={({ pressed }) => [styles.menuBtn, pressed && styles.menuBtnPressed]}
            >
              <AppIcon name="ellipsis-horizontal" size={18} color={colors.textSubtle} />
            </Pressable>
          </View>

          <Pressable
            onPress={onPress}
            disabled={!onPress || variant === 'detail'}
            style={({ pressed }) => [pressed && onPress ? styles.bodyPressed : null]}
          >
            {/* LTR shell so textAlign:'right' stays on the visual right under app RTL. */}
            <View style={styles.bodyShell}>
              <PostBody
                text={bodyText}
                style={styles.body}
                lines={expanded ? undefined : TEXT_COLLAPSE_LINES}
              />
            </View>
            {variant === 'feed' &&
            (bodyText.split('\n').length > TEXT_COLLAPSE_LINES || bodyText.length > 400) ? (
              !expanded ? (
                <Pressable onPress={() => (onPress ? onPress() : setExpanded(true))} hitSlop={6}>
                  <Text style={styles.showMore}>عرض المزيد</Text>
                </Pressable>
              ) : (
                <Pressable onPress={() => setExpanded(false)} hitSlop={6}>
                  <Text style={styles.showMore}>عرض أقل</Text>
                </Pressable>
              )
            ) : null}

            {images.length > 0 || post.video ? (
              <View style={styles.mediaWrap}>
                <PostMediaGallery images={images} video={post.video} colors={colors} scheme={scheme} />
              </View>
            ) : null}
          </Pressable>

          <View style={[styles.actions, getRtlRow()]}>
            <ActionBtn
              icon="chatbubble-ellipses-outline"
              iconColor={colors.textSubtle}
              textColor={colors.textSubtle}
              count={post.comments}
              label="تعليق"
              onPress={onComment}
              style={styles.actionSlot}
              countStyle={styles.actionCount}
            />
            <ActionBtn
              icon={post.liked ? 'heart' : 'heart-outline'}
              iconColor={post.liked ? colors.rose : colors.textSubtle}
              textColor={post.liked ? colors.rose : colors.textSubtle}
              count={post.likes}
              label="إعجاب"
              onPress={onLike}
              style={styles.actionSlot}
              countStyle={styles.actionCount}
            />
            <ActionBtn
              icon={post.bookmarked ? 'bookmark' : 'bookmark-outline'}
              iconColor={post.bookmarked ? colors.electric : colors.textSubtle}
              textColor={colors.textSubtle}
              label="حفظ"
              onPress={onBookmark ?? (() => {})}
              style={styles.actionSlot}
              countStyle={styles.actionCount}
            />
            <ActionBtn
              icon="paper-plane-outline"
              iconColor={colors.textSubtle}
              textColor={colors.textSubtle}
              label="مشاركة"
              onPress={onShare}
              style={styles.actionSlot}
              countStyle={styles.actionCount}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

function arePropsEqual(prev: PostItemProps, next: PostItemProps): boolean {
  if (prev.variant !== next.variant) return false;
  const a = prev.post;
  const b = next.post;
  return (
    a.id === b.id &&
    a.likes === b.likes &&
    a.reposts === b.reposts &&
    a.comments === b.comments &&
    a.views === b.views &&
    a.liked === b.liked &&
    a.bookmarked === b.bookmarked &&
    a.arabicContent === b.arabicContent &&
    a.content === b.content &&
    a.image === b.image &&
    a.video === b.video &&
    a.images === b.images &&
    a.postedAt === b.postedAt &&
    a.createdAt === b.createdAt &&
    a.author.id === b.author.id &&
    a.author.avatar === b.author.avatar &&
    a.author.verified === b.author.verified &&
    a.author.arabicName === b.author.arabicName &&
    a.author.username === b.author.username &&
    a.author.rating === b.author.rating
  );
}

export const PostItem = memo(PostItemComponent, arePropsEqual);

function createStyles(colors: ThemeColors, scheme: 'light' | 'dark', feedCard = false) {
  const cardShadow = feedCard
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
        elevation: 2,
      }
    : ambientShadow(scheme, 'soft');

  return StyleSheet.create({
    card: {
      marginHorizontal: feedCard ? spacing.lg : spacing.md,
      marginTop: feedCard ? spacing.md : spacing.sm,
      marginBottom: feedCard ? spacing.xs : 0,
      borderRadius: ds.radius.xl,
      backgroundColor: colors.bgSurface,
      borderWidth: feedCard ? 1 : 0,
      borderColor: feedCard ? colors.borderSoft : 'transparent',
      ...cardShadow,
      overflow: 'hidden',
    },
    cardDetail: {
      marginHorizontal: 0,
      marginTop: 0,
      borderRadius: 0,
      shadowOpacity: 0,
      elevation: 0,
    },
    cardProfile: {
      marginHorizontal: 0,
      marginTop: spacing.md,
      backgroundColor: colors.bgSurface,
      ...cardShadow,
    },
    row: {
      alignItems: 'flex-start',
      padding: feedCard ? spacing.xl : spacing.lg,
      gap: feedCard ? 16 : 14,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 20,
      backgroundColor: colors.bgElevated,
      flexShrink: 0,
    },
    main: {
      flex: 1,
      minWidth: 0,
    },
    metaLine: {
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    metaInfo: {
      alignItems: 'center',
      flex: 1,
      flexWrap: 'nowrap',
      gap: 4,
      minWidth: 0,
      overflow: 'hidden',
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      flexShrink: 1,
      ...getRtlText(),
    },
    ratingMini: {
      ...getRtlRow(),
      alignItems: 'center',
      gap: 2,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
    },
    ratingMiniText: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    metaMuted: {
      fontSize: 13,
      color: colors.textMuted,
      flexShrink: 1,
      ...getRtlText(),
    },
    metaDot: {
      fontSize: 13,
      color: colors.textSubtle,
      flexShrink: 0,
    },
    aiBadge: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
      backgroundColor: colors.electric + '25',
      borderWidth: 1,
      borderColor: colors.electric + '55',
    },
    aiBadgeText: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    menuBtn: {
      width: 30,
      height: 30,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    menuBtnPressed: {
      backgroundColor: colors.bgElevated,
    },
    bodyShell: {
      width: '100%',
      direction: 'ltr',
      marginTop: 8,
    },
    body: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 24,
      color: colors.textPrimary,
      width: '100%',
      textAlign: 'right',
      writingDirection: 'rtl',
      alignSelf: 'stretch',
    },
    bodyPressed: {
      opacity: 0.92,
    },
    showMore: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '600',
      marginTop: 4,
      ...getRtlText(),
    },
    tagText: {
      color: colors.textMuted,
      opacity: 0.85,
    },
    mediaWrap: {
      marginTop: 14,
      marginBottom: 4,
      alignItems: 'center',
      width: '100%',
    },
    actions: {
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 16,
      paddingTop: spacing.sm,
      paddingHorizontal: 2,
      gap: spacing.xs,
    },
    actionSlot: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 40,
      paddingHorizontal: 2,
    },
    actionCount: {
      fontSize: 12,
      fontWeight: '600',
    },
  });
}

export default PostItem;
