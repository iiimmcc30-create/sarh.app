/**
 * Project-wide official typeface = listing price Bold
 * (`IBMPlexSansArabic_700Bold`).
 */
import { Text, TextInput, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { OFFICIAL_APP_FONT, resolveAppFontFace } from '@/constants/fonts';

type AnyTextProps = {
  style?: StyleProp<TextStyle>;
  [key: string]: unknown;
};

function withAppFont(style: StyleProp<TextStyle> | undefined): StyleProp<TextStyle> {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const face = resolveAppFontFace(flat?.fontWeight, flat?.fontFamily);
  if (face.fontFamily === 'monospace') return style;
  return [style, { fontFamily: face.fontFamily, fontWeight: face.fontWeight }];
}

let applied = false;

function patchHost(
  Component: { render?: (props: AnyTextProps, ref: unknown) => unknown; defaultProps?: AnyTextProps },
  bindTarget: unknown,
) {
  if (typeof Component.render === 'function') {
    const original = Component.render.bind(bindTarget);
    Component.render = (props: AnyTextProps, ref: unknown) =>
      original({ ...props, style: withAppFont(props.style as StyleProp<TextStyle>) }, ref);
    return;
  }
  Component.defaultProps = {
    ...Component.defaultProps,
    style: withAppFont([
      { fontFamily: OFFICIAL_APP_FONT, fontWeight: '700' },
      Component.defaultProps?.style as StyleProp<TextStyle>,
    ]),
  };
}

/** Call once after IBM Plex faces are loaded (safe to call multiple times). */
export function applyAppFonts() {
  if (applied) return;
  applied = true;
  patchHost(Text as unknown as { render?: (props: AnyTextProps, ref: unknown) => unknown; defaultProps?: AnyTextProps }, Text);
  patchHost(
    TextInput as unknown as { render?: (props: AnyTextProps, ref: unknown) => unknown; defaultProps?: AnyTextProps },
    TextInput,
  );
}
