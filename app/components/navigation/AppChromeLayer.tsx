import { useAppChromeScroll } from '@/hooks/useAppChrome';
import { useRef, useState, type ReactNode } from 'react';
import { Animated, StyleSheet } from 'react-native';

type AppChromeLayerProps = {
  children: ReactNode;
  onHeight?: (height: number) => void;
};

/** Overlay chrome that hides with the shared tab-shell animation. Does not remount children. */
export function AppChromeLayer({ children, onHeight }: AppChromeLayerProps) {
  const { chromeProgress, chromeVisible } = useAppChromeScroll();
  const heightRef = useRef(0);
  const [height, setHeight] = useState(0);
  const translateY = chromeProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-Math.max(height, 1), 0],
  });

  return (
    <Animated.View
      pointerEvents={chromeVisible ? 'box-none' : 'none'}
      onLayout={(event) => {
        const next = Math.round(event.nativeEvent.layout.height);
        if (!next || Math.abs(next - heightRef.current) < 1) return;
        heightRef.current = next;
        setHeight(next);
        onHeight?.(next);
      }}
      style={[
        styles.layer,
        { opacity: chromeProgress, transform: [{ translateY }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    start: 0,
    end: 0,
    zIndex: 2,
  },
});

export default AppChromeLayer;
