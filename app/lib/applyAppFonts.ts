/**
 * Apply IBM Plex Sans Arabic as the default typeface for Text / TextInput project-wide.
 * Maps numeric/keyword fontWeight → the matching loaded font file (Expo Google Fonts).
 */
import { Text, TextInput, StyleSheet, type StyleProp, type TextStyle } from 'react-native';
import { appFont } from '@/constants/fonts';

type AnyTextProps = {
  style?: StyleProp<TextStyle>;
  [key: string]: unknown;
};

const APP_FAMILIES = new Set<string>(Object.values(appFont));

function resolveFontFamily(weight: TextStyle['fontWeight'] | undefined, existingFamily?: string): string {
  if (existingFamily && APP_FAMILIES.has(existingFamily)) {
    return existingFamily;
  }
  if (weight == null) return appFont.regular;
  const w = String(weight);
  if (w === '700' || w === '800' || w === '900' || w === 'bold') return appFont.semibold;
  if (w === '600' || w === 'semibold') return appFont.semibold;
  if (w === '500' || w === 'medium') return appFont.medium;
  return appFont.regular;
}

function withAppFont(style: StyleProp<TextStyle> | undefined): StyleProp<TextStyle> {
  const flat = StyleSheet.flatten(style) as TextStyle | undefined;
  const family = resolveFontFamily(flat?.fontWeight, flat?.fontFamily);
  return [{ fontFamily: family }, style];
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
      { fontFamily: appFont.regular },
      Component.defaultProps?.style as StyleProp<TextStyle>,
    ]),
  };
}

/** Call once after IBM Plex Sans Arabic is loaded (safe to call multiple times). */
export function applyAppFonts() {
  if (applied) return;
  applied = true;
  patchHost(Text as unknown as { render?: (props: AnyTextProps, ref: unknown) => unknown; defaultProps?: AnyTextProps }, Text);
  patchHost(
    TextInput as unknown as { render?: (props: AnyTextProps, ref: unknown) => unknown; defaultProps?: AnyTextProps },
    TextInput,
  );
}
