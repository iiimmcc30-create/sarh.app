import { ListingCard } from '@/components/feature/ListingCard';
import { radius, space } from '@/design-system';
import { AppText } from '@/design-system/components';
import { Row } from '@/design-system/layout';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/hooks/useLayout';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/constants/theme';
import { HOME_LATEST_LISTINGS_LIMIT } from '@/lib/homeQuickAccess';
import { safePush } from '@/lib/safeNavigate';
import { getBootstrappedListingsPage, searchListingsPage } from '@/services/listings';
import type { Listing } from '@/services/types';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const HOME_LISTINGS_TTL_MS = 60_000;

export function HomeLatestListings() {
  const router = useRouter();
  const { gutter } = useLayout();
  const { accessToken } = useAuth();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const [items, setItems] = useState<Listing[]>([]);
  const inflightRef = useRef(false);
  const lastAt = useRef(0);
  const needsFailureRecoveryRef = useRef(false);
  const itemsLenRef = useRef(0);
  itemsLenRef.current = items.length;
  if (items.length > 0) needsFailureRecoveryRef.current = false;

  const load = useCallback(
    async (force = false) => {
      const now = Date.now();
      if (
        !force &&
        itemsLenRef.current > 0 &&
        now - lastAt.current < HOME_LISTINGS_TTL_MS &&
        lastAt.current > 0
      ) {
        return;
      }
      if (inflightRef.current) return;
      inflightRef.current = true;
      try {
        if (!force) {
          const boot = getBootstrappedListingsPage(accessToken);
          if (boot?.listings.length) {
            setItems(boot.listings.slice(0, HOME_LATEST_LISTINGS_LIMIT));
            lastAt.current = Date.now();
            inflightRef.current = false;
            return;
          }
        }
        const page = await searchListingsPage({}, accessToken);
        setItems(page.listings.slice(0, HOME_LATEST_LISTINGS_LIMIT));
        lastAt.current = Date.now();
        if (page.listings.length === 0) needsFailureRecoveryRef.current = false;
      } catch {
        if (itemsLenRef.current === 0) needsFailureRecoveryRef.current = true;
      } finally {
        inflightRef.current = false;
      }
    },
    [accessToken],
  );

  useFocusEffect(
    useCallback(() => {
      const shouldForce = itemsLenRef.current === 0 && needsFailureRecoveryRef.current;
      void load(shouldForce);
    }, [load]),
  );

  if (items.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <Row
        align="center"
        justify="between"
        style={[styles.sectionHead, { paddingHorizontal: gutter }]}
      >
        <AppText variant="heading2" color="textPrimary" style={styles.sectionTitle} numberOfLines={1}>
          أحدث الإعلانات
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="عرض كل الإعلانات"
          onPress={() => safePush('/(tabs)/market', undefined, router)}
          hitSlop={8}
          style={styles.seeAllBtn}
        >
          <AppText variant="caption" color="primary" numberOfLines={1}>
            عرض الكل
          </AppText>
        </Pressable>
      </Row>
      {items.map((item) => (
        <View key={item.id} style={[styles.cardShell, { marginHorizontal: gutter }]}>
          <ListingCard
            listing={item}
            variant="list"
            listMode="home"
            onPress={() =>
              safePush({ pathname: '/listing/[id]', params: { id: item.id } }, undefined, router)
            }
          />
        </View>
      ))}
    </View>
  );
}

function createStyles(theme: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      paddingBottom: space[8],
    },
    sectionHead: {
      paddingTop: space[8],
      paddingBottom: space[8],
    },
    sectionTitle: {
      flex: 1,
      minWidth: 0,
    },
    seeAllBtn: {
      flexShrink: 0,
      paddingStart: space[8],
    },
    cardShell: {
      borderRadius: radius[16],
      overflow: 'hidden',
      backgroundColor: theme.bgSurface,
      marginBottom: space[12],
    },
  });
}

export default HomeLatestListings;
