import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { type ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

export type MenuPagerPage = {
  id: string;
  render: () => ReactNode;
};

type Props = {
  pages: MenuPagerPage[];
  activeId: string;
  onActiveId: (id: string) => void;
};

export function ButcherMenuPager({ pages, activeId, onActiveId }: Props) {
  const { width } = useWindowDimensions();
  const styles = useThemedStyles(({ colors }) => createStyles(colors));
  const scroller = useRef<ScrollView>(null);
  const rise = useRef(new Animated.Value(1)).current;
  const index = Math.max(0, pages.findIndex((p) => p.id === activeId));

  useEffect(() => {
    scroller.current?.scrollTo({ x: index * width, animated: true });
  }, [index, width]);

  useEffect(() => {
    rise.setValue(0);
    Animated.timing(rise, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [activeId, rise]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    const page = pages[next];
    if (page && page.id !== activeId) onActiveId(page.id);
  };

  if (!pages.length) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        directionalLockEnabled
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        onScrollEndDrag={onScrollEnd}
        keyboardShouldPersistTaps="handled"
      >
        {pages.map((page) => (
          <View key={page.id} style={{ width }}>
            <Animated.View
              style={{
                opacity: rise,
                transform: [
                  {
                    translateY: rise.interpolate({
                      inputRange: [0, 1],
                      outputRange: [28, 0],
                    }),
                  },
                ],
              }}
            >
              {page.render()}
            </Animated.View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      minHeight: 220,
      backgroundColor: colors.screenRoot,
    },
  });
}

export default ButcherMenuPager;
