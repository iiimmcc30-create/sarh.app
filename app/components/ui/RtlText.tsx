import { StyleSheet, Text, type TextProps, type StyleProp, type TextStyle } from 'react-native';
import { resolveAppFontFace, toNativeFontStyle } from '@/constants/fonts';
import { getRtlBlockTextStyle } from '@/lib/rtl';

export type RtlTextProps = TextProps;

function withIbmPlex(style: StyleProp<TextStyle> | undefined): StyleProp<TextStyle> {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const face = resolveAppFontFace(flat?.fontWeight, flat?.fontFamily);
  if (face.fontFamily === 'monospace') return style;
  return [style, toNativeFontStyle(face)];
}

/**
 * Block Arabic text — `width: '100%'`, `textAlign: 'right'`, `writingDirection: 'rtl'`.
 * Always paints IBM Plex Sans Arabic (same family as listing price).
 * Use inside `RtlTextShell` (or any view that already defines text bounds).
 */
export function RtlText({ style, ...rest }: RtlTextProps) {
  return <Text style={[getRtlBlockTextStyle(), withIbmPlex(style)]} {...rest} />;
}

/** Alias for design-system naming consistency. */
export const AppText = RtlText;

export default RtlText;
