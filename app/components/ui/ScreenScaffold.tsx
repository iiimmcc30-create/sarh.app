import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { SarhPatternBackground } from '@/components/ui/SarhPatternBackground';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getRtlDirection } from '@/lib/rtl';

type ScreenScaffoldProps = {
  children: ReactNode;
  edges?: Edge[];
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  /** Show subtle Sarh pattern (dark mode). Default true. */
  pattern?: boolean;
};

/** Unified screen shell — page background + safe area + RTL reading direction. */
export function ScreenScaffold({
  children,
  edges = ['top'],
  style,
  contentStyle,
  pattern = true,
}: ScreenScaffoldProps) {
  const styles = useThemedStyles(({ colors }) =>
    StyleSheet.create({
      root: { flex: 1, backgroundColor: colors.screenRoot, ...getRtlDirection() },
      rootTransparent: { flex: 1, backgroundColor: 'transparent', ...getRtlDirection() },
      inner: { flex: 1, ...getRtlDirection() },
    }),
  );

  const body = (
    <SafeAreaView
      style={[pattern ? styles.rootTransparent : styles.root, style]}
      edges={edges}
    >
      <View style={[styles.inner, contentStyle]}>{children}</View>
    </SafeAreaView>
  );

  if (!pattern) return body;

  return <SarhPatternBackground>{body}</SarhPatternBackground>;
}

export default ScreenScaffold;
