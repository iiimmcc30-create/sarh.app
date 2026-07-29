import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useThemedStyles } from '@/hooks/useThemedStyles';

type ScreenScaffoldProps = {
  children: ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
};

/** Unified screen shell — page background + safe area. UI only. */
export function ScreenScaffold({
  children,
  edges = ['top'],
  style,
  contentStyle,
}: ScreenScaffoldProps) {
  const styles = useThemedStyles(({ colors }) =>
    StyleSheet.create({
      root: { flex: 1, backgroundColor: colors.bgDeep },
      inner: { flex: 1 },
    }),
  );

  return (
    <SafeAreaView style={[styles.root, style]} edges={edges}>
      <View style={[styles.inner, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

export default ScreenScaffold;
