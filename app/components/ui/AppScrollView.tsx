import React, { forwardRef } from 'react';
import {
  Platform,
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { getRtlDirection } from '@/lib/rtl';

export type AppScrollViewProps = ScrollViewProps & {
  contentContainerStyle?: StyleProp<ViewStyle>;
};

/**
 * Shared scroll defaults for Sarh — iOS-like momentum / inertia + RTL direction.
 * Callers may override any prop (e.g. carousels using decelerationRate="fast").
 */
export const AppScrollView = forwardRef<ScrollView, AppScrollViewProps>(
  function AppScrollView(
    {
      showsVerticalScrollIndicator = false,
      showsHorizontalScrollIndicator = false,
      keyboardShouldPersistTaps = 'handled',
      scrollEventThrottle = 16,
      decelerationRate = 'normal',
      bounces = true,
      alwaysBounceVertical,
      overScrollMode,
      style,
      contentContainerStyle,
      ...rest
    },
    ref,
  ) {
    const rtl = getRtlDirection();
    return (
      <ScrollView
        ref={ref}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        scrollEventThrottle={scrollEventThrottle}
        decelerationRate={decelerationRate}
        bounces={bounces}
        alwaysBounceVertical={alwaysBounceVertical ?? bounces}
        overScrollMode={overScrollMode ?? (Platform.OS === 'android' ? 'always' : undefined)}
        style={[rtl, style]}
        contentContainerStyle={[rtl, contentContainerStyle]}
        {...rest}
      />
    );
  },
);

export default AppScrollView;
